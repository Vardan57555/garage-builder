"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgent = void 0;
const memory_1 = require("langchain/memory");
const InstantiationError_1 = require("../errors/InstantiationError");
const PriceParamsExtractorTool_1 = require("./tools/impl/PriceParamsExtractorTool");
const SharedLLM_1 = require("../llm/SharedLLM");
const messages_1 = require("@langchain/core/messages");
const ProcedureExecutor_1 = require("../utils/procedure/ProcedureExecutor");
const Constants_1 = require("../common/io/Constants");
const Log_1 = require("../utils/logger/Log");
const RedisCacheUtils_1 = require("../utils/cache/RedisCacheUtils");
const SessionManager_1 = require("../utils/session/SessionManager");
const logger = (0, Log_1.createLogger)(module);
class LeadAgent {
    static instance;
    sessionManager;
    cacheUtils;
    constructor(enforce, cacheUtils) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }
        this.cacheUtils = cacheUtils;
        this.sessionManager = SessionManager_1.SessionManager.getInstance({
            SESSION_TIMEOUT: 30 * 60 * 1000,
            CLEANUP_INTERVAL: 5 * 60 * 1000,
            WARNING_THRESHOLD: 5 * 60 * 1000,
        });
    }
    static async getInstance() {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce, RedisCacheUtils_1.RedisCacheUtils.getInstance());
        }
        return LeadAgent.instance;
    }
    getOrCreateSession(sessionId) {
        const existingSession = this.sessionManager.getSession(sessionId);
        if (existingSession && this.sessionManager.isSessionValid(sessionId)) {
            this.sessionManager.updateLastActivity(sessionId);
            return existingSession;
        }
        const newSession = {
            sessionId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
            memory: new memory_1.BufferMemory({
                memoryKey: "chat_history",
                returnMessages: true,
                chatHistory: new memory_1.ChatMessageHistory(),
            }),
            state: {
                userFriendlyParams: {},
                hasGarageIntent: false,
            },
            stateMapCache: new Map(),
            roofMapCache: new Map(),
        };
        this.sessionManager.createSession(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
        return newSession;
    }
    getMessageString(content) {
        if (typeof content === "string") {
            return content;
        }
        if (Array.isArray(content)) {
            return content
                .map((c) => ("text" in c ? c.text : JSON.stringify(c)))
                .join(" ");
        }
        return String(content);
    }
    async detectGarageIntentWithAI(input) {
        try {
            const prompt = Constants_1.Constants.INTENT_PROMPT.replace("{input}", input);
            logger.info("[LeadAgent] Intent detection prompt:", prompt);
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            const response = aiMessage.content.trim().toUpperCase();
            logger.info("[LeadAgent] Intent detection response:", response);
            return response.includes("YES");
        }
        catch (error) {
            logger.warn("[LeadAgent] AI intent detection failed, using fallback:", error);
            return this.detectGarageIntentFallback(input);
        }
    }
    detectGarageIntentFallback(input) {
        const lowerInput = input.toLowerCase();
        return Array.from(Constants_1.Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }
    async mapStateToDB(stateName, session, preferredBuildingId = 1) {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        const cachedState = session.stateMapCache.get(cacheKey);
        if (cachedState !== undefined) {
            return cachedState;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([stateName], "getMapIdByStateName(?)", "getMapIdByStateName");
            if (result?.length > 0) {
                const preferredMapping = result.find((item) => item.building_id === preferredBuildingId);
                const mapping = preferredMapping || result[0];
                const output = { map_id: mapping.map_id, manufacturer_id: mapping.manufacturer_id };
                await this.cacheUtils.put(cacheKey, output);
                session.stateMapCache.set(cacheKey, output);
                return output;
            }
            await this.cacheUtils.put(cacheKey, null);
            session.stateMapCache.set(cacheKey, null);
            return null;
        }
        catch (error) {
            logger.error("[LeadAgent] State mapping failed:", error);
            session.stateMapCache.set(cacheKey, null);
            return null;
        }
    }
    async mapRoofTypeToDB(roofType, mapId, session) {
        const normalizedRoofType = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;
        const cachedRoofId = await this.cacheUtils.get(cacheKey);
        if (cachedRoofId) {
            return cachedRoofId;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapId, roofType], "getRoofIdByType(?, ?)", "roof_mapping");
            if (result?.length > 0) {
                session.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        }
        catch (error) {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }
        const fallbackId = Constants_1.Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ?? (normalizedRoofType.includes("vertical") ? 1 : normalizedRoofType.includes("box") ? 3 : 2);
        await this.cacheUtils.put(cacheKey, fallbackId);
        return fallbackId;
    }
    async convertToTechnicalParams(userParams, session) {
        try {
            let map_id = 1;
            let manufacturer_id = 1;
            if (userParams.state_name) {
                const mapping = await this.mapStateToDB(userParams.state_name, session);
                if (mapping) {
                    map_id = mapping.map_id;
                    manufacturer_id = mapping.manufacturer_id;
                }
                else {
                    logger.warn(`[LeadAgent] State "${userParams.state_name}" not found, using defaults.`);
                }
            }
            const roof_id = userParams.roof_type ? await this.mapRoofTypeToDB(userParams.roof_type, map_id, session) : 2;
            return {
                width: userParams.width ?? 0,
                length: userParams.length ?? 0,
                height: userParams.height ?? 0,
                map_id,
                roof_id,
                manufacturer_id,
                utility_length: userParams.utility_length,
                building_type: userParams.building_type,
                gauge: userParams.gauge ?? 14,
                is_barn: userParams.is_barn,
            };
        }
        catch (error) {
            logger.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }
    getMissingFields(params) {
        return Constants_1.Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }
    formatDimensionsResponse(extractedParams) {
        const dimensions = ["width", "length", "height"]
            .filter((k) => extractedParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${extractedParams[k]}ft.`)
            .join(" ");
        return dimensions ? `Got it! ${dimensions}\n\n` : "";
    }
    async run(sessionId, input) {
        logger.info(`[LeadAgent] Session ${sessionId} - User input:`, input);
        const session = this.getOrCreateSession(sessionId);
        await session.memory.chatHistory.addUserMessage(input);
        if (!session.state.hasGarageIntent) {
            const hasIntent = await this.detectGarageIntentWithAI(input);
            if (!hasIntent) {
                const response = "Hello! I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            session.state.hasGarageIntent = true;
        }
        const extractor = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance();
        const rawParams = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Safe extracted user-friendly params:`, extractedParams);
        session.state.userFriendlyParams = {
            ...session.state.userFriendlyParams,
            ...extractedParams
        };
        const missingFields = this.getMissingFields(session.state.userFriendlyParams);
        if (missingFields.length > 0) {
            const nextField = missingFields[0];
            session.state.currentField = nextField;
            const response = this.formatDimensionsResponse(extractedParams) +
                Constants_1.Constants.FIELD_PROMPTS[nextField];
            await session.memory.chatHistory.addAIChatMessage(response);
            return response;
        }
        const technicalParams = await this.convertToTechnicalParams(session.state.userFriendlyParams, session);
        if (!technicalParams) {
            return "Failed to convert user input to technical parameters.";
        }
        const result = await extractor.calculatePriceWithParams(technicalParams);
        await session.memory.chatHistory.addAIChatMessage(result);
        this.resetSessionState(session);
        return result + "\n\nNeed another quote? Just describe what you're looking for!";
    }
    async getConversationContext(session) {
        const history = await session.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }
    resetSessionState(session) {
        session.state.userFriendlyParams = {};
        session.state.hasGarageIntent = false;
        session.state.currentField = undefined;
    }
    async endSession(sessionId) {
        if (this.sessionManager.endSession(sessionId)) {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
        else {
            logger.warn(`[LeadAgent] Attempted to end non-existent session: ${sessionId}`);
        }
    }
    async reset() {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map