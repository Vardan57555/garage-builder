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
const logger = (0, Log_1.createLogger)(module);
class LeadAgent {
    static instance;
    sessions = new Map();
    SESSION_TIMEOUT = 30 * 60 * 1000;
    cleanupInterval = null;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }
        this.startSessionCleanup();
    }
    static async getInstance() {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }
    getOrCreateSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            const session = this.sessions.get(sessionId);
            session.lastActivity = Date.now();
            return session;
        }
        const newSession = {
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
            lastActivity: Date.now(),
        };
        this.sessions.set(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
        return newSession;
    }
    startSessionCleanup() {
        if (this.cleanupInterval) {
            return;
        }
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            for (const [sessionId, session] of this.sessions.entries()) {
                if (now - session.lastActivity > this.SESSION_TIMEOUT) {
                    this.sessions.delete(sessionId);
                    cleanedCount++;
                    logger.info(`[LeadAgent] Session expired and cleaned: ${sessionId}`);
                }
            }
            if (cleanedCount > 0) {
                logger.info(`[LeadAgent] Cleaned up ${cleanedCount} expired sessions. Active sessions: ${this.sessions.size}`);
            }
        }, 5 * 60 * 1000);
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
        if (session.stateMapCache.has(cacheKey)) {
            return session.stateMapCache.get(cacheKey) ?? null;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([stateName], "getMapIdByStateName(?)", "getMapIdByStateName");
            if (result?.length > 0) {
                const preferredMapping = result.find((item) => item.building_id === preferredBuildingId);
                const mapping = preferredMapping || result[0];
                const output = { map_id: mapping.map_id, manufacturer_id: mapping.manufacturer_id };
                session.stateMapCache.set(cacheKey, output);
                return output;
            }
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
        if (session.roofMapCache.has(cacheKey)) {
            return session.roofMapCache.get(cacheKey);
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
        session.roofMapCache.set(cacheKey, fallbackId);
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
        console.log(sessionId);
        logger.info(`[LeadAgent] Session ${sessionId} - User input:`, input);
        const session = this.getOrCreateSession(sessionId);
        await session.memory.chatHistory.addUserMessage(input);
        if (!session.state.hasGarageIntent) {
            const hasIntent = await this.detectGarageIntentWithAI(input);
            if (!hasIntent) {
                const response = "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
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
            return "⚠️ Failed to convert user input to technical parameters.";
        }
        const result = await extractor.calculatePriceWithParams(technicalParams);
        await session.memory.chatHistory.addAIChatMessage(result);
        this.resetSessionState(session);
        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
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
        if (this.sessions.has(sessionId)) {
            this.sessions.delete(sessionId);
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
    }
    getActiveSessionCount() {
        return this.sessions.size;
    }
    async reset() {
        this.sessions.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map