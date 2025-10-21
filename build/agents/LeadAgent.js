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
    memory;
    state;
    stateMapCache = new Map();
    roofMapCache = new Map();
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }
        this.memory = new memory_1.BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new memory_1.ChatMessageHistory(),
        });
        this.state = {
            userFriendlyParams: {},
            hasGarageIntent: false,
        };
    }
    static async getInstance() {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
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
    async mapStateToDB(stateName, preferredBuildingId = 1) {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        if (this.stateMapCache.has(cacheKey)) {
            return this.stateMapCache.get(cacheKey) ?? null;
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([stateName], "getMapIdByStateName(?)", "getMapIdByStateName");
            if (result?.length > 0) {
                const preferredMapping = result.find((item) => item.building_id === preferredBuildingId);
                const mapping = preferredMapping || result[0];
                const output = { map_id: mapping.map_id, manufacturer_id: mapping.manufacturer_id };
                this.stateMapCache.set(cacheKey, output);
                return output;
            }
            this.stateMapCache.set(cacheKey, null);
            return null;
        }
        catch (error) {
            logger.error("[LeadAgent] State mapping failed:", error);
            this.stateMapCache.set(cacheKey, null);
            return null;
        }
    }
    async mapRoofTypeToDB(roofType, mapId) {
        const normalizedRoofType = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;
        if (this.roofMapCache.has(cacheKey)) {
            return this.roofMapCache.get(cacheKey);
        }
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapId, roofType], "getRoofIdByType(?, ?)", "roof_mapping");
            if (result?.length > 0) {
                this.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        }
        catch (error) {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }
        const fallbackId = Constants_1.Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ?? (normalizedRoofType.includes("vertical") ? 1 : normalizedRoofType.includes("box") ? 3 : 2);
        this.roofMapCache.set(cacheKey, fallbackId);
        return fallbackId;
    }
    async convertToTechnicalParams(userParams) {
        try {
            let map_id = 1;
            let manufacturer_id = 1;
            if (userParams.state_name) {
                const mapping = await this.mapStateToDB(userParams.state_name);
                if (mapping) {
                    map_id = mapping.map_id;
                    manufacturer_id = mapping.manufacturer_id;
                }
                else {
                    logger.warn(`[LeadAgent] State "${userParams.state_name}" not found, using defaults.`);
                }
            }
            const roof_id = userParams.roof_type ? await this.mapRoofTypeToDB(userParams.roof_type, map_id) : 2;
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
    async run(input) {
        logger.info("[LeadAgent] User input:", input);
        await this.memory.chatHistory.addUserMessage(input);
        if (!this.state.hasGarageIntent) {
            const hasIntent = await this.detectGarageIntentWithAI(input);
            if (!hasIntent) {
                const response = "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await this.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            this.state.hasGarageIntent = true;
        }
        const extractor = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance();
        const rawParams = await extractor._call(await this.getConversationContext());
        logger.info("[LeadAgent] Raw params from extractor:", rawParams);
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info("[LeadAgent] Safe extracted user-friendly params:", extractedParams);
        this.state.userFriendlyParams = {
            ...this.state.userFriendlyParams,
            ...extractedParams
        };
        const missingFields = this.getMissingFields(this.state.userFriendlyParams);
        if (missingFields.length > 0) {
            const nextField = missingFields[0];
            this.state.currentField = nextField;
            const response = this.formatDimensionsResponse(extractedParams) +
                Constants_1.Constants.FIELD_PROMPTS[nextField];
            await this.memory.chatHistory.addAIChatMessage(response);
            return response;
        }
        const technicalParams = await this.convertToTechnicalParams(this.state.userFriendlyParams);
        if (!technicalParams) {
            return "⚠️ Failed to convert user input to technical parameters.";
        }
        const result = await extractor.calculatePriceWithParams(technicalParams);
        await this.memory.chatHistory.addAIChatMessage(result);
        this.resetState();
        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
    }
    async getConversationContext() {
        const history = await this.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }
    resetState() {
        this.state.userFriendlyParams = {};
        this.state.hasGarageIntent = false;
        this.state.currentField = undefined;
    }
    async reset() {
        this.resetState();
        this.stateMapCache.clear();
        this.roofMapCache.clear();
        this.memory = new memory_1.BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new memory_1.ChatMessageHistory(),
        });
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map