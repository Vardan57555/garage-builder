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
    async detectParameterUpdate(input) {
        const updatePatterns = [
            { regex: /change|update|correct|fix|actually|wait|let me/i, weight: 1 },
            { regex: /height|length|width|roof|state|gauge/i, weight: 2 }
        ];
        const hasUpdateIntent = updatePatterns.some(p => p.regex.test(input));
        if (!hasUpdateIntent)
            return null;
        try {
            const prompt = `Given this user message: "${input}"
            
Determine if they want to UPDATE/CHANGE a parameter and extract:
1. Which parameter (width, length, height, roof_type, state_name, gauge, building_type)
2. The new value

Respond in JSON format only:
{"isUpdate": true/false, "field": "parameter_name", "value": extracted_value}
or
{"isUpdate": false}`;
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            const response = JSON.parse(aiMessage.content.trim());
            if (response.isUpdate && response.field && response.value) {
                return {
                    field: response.field,
                    value: response.value
                };
            }
        }
        catch (error) {
            logger.warn("[LeadAgent] Update detection failed:", error);
        }
        return null;
    }
    handleParameterUpdate(session, update) {
        const { field, value } = update;
        logger.info(`[LeadAgent] Attempting to update ${field} from ${session.state.userFriendlyParams[field]} to ${value}`);
        if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
            const numValue = parseFloat(String(value));
            if (isNaN(numValue) || numValue <= 0) {
                logger.warn(`[LeadAgent] Invalid ${field} value: ${value}`);
                return {
                    success: false,
                    message: `Invalid ${field}. Please provide a positive number.`
                };
            }
            session.state.userFriendlyParams[field] = numValue;
            logger.info(`[LeadAgent] Successfully updated ${field} to ${numValue} (numeric)`);
        }
        else {
            session.state.userFriendlyParams[field] = value;
            logger.info(`[LeadAgent] Successfully updated ${field} to ${value} (string)`);
        }
        logger.info(`[LeadAgent] Current session params:`, JSON.stringify(session.state.userFriendlyParams));
        return {
            success: true,
            message: `Updated ${field} to ${value}. ✓`,
            updatedField: field
        };
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
            const technicalParams = {
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
            logger.info("[LeadAgent] ====== TECHNICAL PARAMS CONVERSION DEBUG ======");
            logger.info("[LeadAgent] User-friendly params:", JSON.stringify(userParams, null, 2));
            logger.info("[LeadAgent] State name:", userParams.state_name);
            logger.info("[LeadAgent] Roof type:", userParams.roof_type);
            logger.info("[LeadAgent] Building type:", userParams.building_type, "← CRITICAL: This determines pricing!");
            logger.info("[LeadAgent] Gauge:", userParams.gauge ?? 14);
            logger.info("[LeadAgent] ----");
            logger.info("[LeadAgent] Map ID:", map_id, "(resolved from state)");
            logger.info("[LeadAgent] Roof ID:", roof_id, "(resolved from roof type)");
            logger.info("[LeadAgent] Manufacturer ID:", manufacturer_id);
            logger.info("[LeadAgent] Final technical params:", JSON.stringify(technicalParams, null, 2));
            logger.info("[LeadAgent] ====== END DEBUG ======");
            return technicalParams;
        }
        catch (error) {
            logger.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }
    getMissingFields(params) {
        return Constants_1.Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }
    formatDimensionsResponse(extractedParams, currentParams) {
        const dimensions = ["width", "length", "height"]
            .filter((k) => currentParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${currentParams[k]}ft.`)
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
        const paramUpdate = await this.detectParameterUpdate(input);
        if (paramUpdate) {
            if (paramUpdate.field === "state_name") {
                const validationResult = await this.validateState(paramUpdate.value);
                if (!validationResult.isValid) {
                    const errorMessage = `❌ "${paramUpdate.value}" is not a valid state.\n\n${this.getValidStatesMessage()}`;
                    await session.memory.chatHistory.addAIChatMessage(errorMessage);
                    return errorMessage;
                }
                paramUpdate.value = validationResult.normalizedName;
            }
            if (paramUpdate.field === "roof_type") {
                const validationResult = await this.validateRoofType(paramUpdate.value);
                if (!validationResult.isValid) {
                    const errorMessage = `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${this.getValidRoofTypesMessage()}`;
                    await session.memory.chatHistory.addAIChatMessage(errorMessage);
                    return errorMessage;
                }
                paramUpdate.value = validationResult.normalizedType;
            }
            const updateResult = this.handleParameterUpdate(session, paramUpdate);
            if (updateResult.success) {
                const missingFields = this.getMissingFields(session.state.userFriendlyParams);
                if (missingFields.length === 0) {
                    const confirmMessage = `Got it! ${updateResult.updatedField}: ${session.state.userFriendlyParams[updateResult.updatedField]}.\n\n✓ All parameters set! Calculating price...`;
                    await session.memory.chatHistory.addAIChatMessage(confirmMessage);
                    const technicalParams = await this.convertToTechnicalParams(session.state.userFriendlyParams, session);
                    if (technicalParams) {
                        const priceResult = await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance().calculatePriceWithParams(technicalParams);
                        const finalResponse = priceResult + "\n\nNeed another quote? Just describe what you're looking for!";
                        await session.memory.chatHistory.addAIChatMessage(priceResult);
                        this.resetSessionState(session);
                        return finalResponse;
                    }
                }
                else {
                    const nextField = missingFields[0];
                    session.state.currentField = nextField;
                    const updatedValue = session.state.userFriendlyParams[updateResult.updatedField];
                    const fieldSuffix = ["width", "length", "height", "gauge", "utility_length"].includes(updateResult.updatedField) ? "ft." : "";
                    const response = `Got it! ${updateResult.updatedField}: ${updatedValue}${fieldSuffix}\n\n${Constants_1.Constants.FIELD_PROMPTS[nextField]}`;
                    await session.memory.chatHistory.addAIChatMessage(response);
                    return response;
                }
            }
            else {
                await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                return updateResult.message;
            }
        }
        const extractor = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance();
        const rawParams = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Safe extracted user-friendly params:`, extractedParams);
        if (extractedParams.state_name) {
            const validationResult = await this.validateState(extractedParams.state_name);
            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.state_name}" is not a valid state.\n\n${this.getValidStatesMessage()}\n\nPlease specify your state.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.state_name = validationResult.normalizedName;
        }
        if (extractedParams.roof_type) {
            const validationResult = await this.validateRoofType(extractedParams.roof_type);
            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.roof_type}" is not a valid roof type.\n\n${this.getValidRoofTypesMessage()}\n\nPlease specify your roof type.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.roof_type = validationResult.normalizedType;
        }
        const filteredExtractedParams = {};
        for (const [key, value] of Object.entries(extractedParams)) {
            if (value !== undefined && value !== null && !session.state.userFriendlyParams[key]) {
                filteredExtractedParams[key] = value;
            }
        }
        session.state.userFriendlyParams = {
            ...session.state.userFriendlyParams,
            ...filteredExtractedParams
        };
        const missingFields = this.getMissingFields(session.state.userFriendlyParams);
        if (missingFields.length > 0) {
            const nextField = missingFields[0];
            session.state.currentField = nextField;
            const response = this.formatDimensionsResponse(extractedParams, session.state.userFriendlyParams) + Constants_1.Constants.FIELD_PROMPTS[nextField];
            logger.info(`[LeadAgent] Missing field: ${nextField}, prompting user`);
            await session.memory.chatHistory.addAIChatMessage(response);
            return response;
        }
        const technicalParams = await this.convertToTechnicalParams(session.state.userFriendlyParams, session);
        if (!technicalParams) {
            return "Failed to convert user input to technical parameters.";
        }
        const result = await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance().calculatePriceWithParams(technicalParams);
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
    getValidStatesMessage() {
        const validStates = [
            "Texas", "California", "Florida", "New York", "Pennsylvania",
            "Illinois", "Ohio", "Georgia", "North Carolina", "Michigan",
            "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts",
            "Tennessee", "Maryland", "Missouri", "Wisconsin", "Colorado",
            "Minnesota", "South Carolina", "Alabama", "Louisiana", "Kentucky",
            "Oregon", "Oklahoma", "Connecticut", "Iowa", "Nevada",
            "Arkansas", "Mississippi", "Kansas", "Utah", "New Mexico",
            "Nebraska", "Idaho", "Maine", "Montana", "Rhode Island",
            "Delaware", "South Dakota", "North Dakota", "Alaska", "Hawaii",
            "Wyoming", "Vermont", "New Hampshire", "West Virginia"
        ];
        return `Valid states: ${validStates.join(", ")}`;
    }
    normalizeStateName(stateInput) {
        const stateAbbreviationMap = {
            "tx": "Texas", "ca": "California", "fl": "Florida", "ny": "New York",
            "pa": "Pennsylvania", "il": "Illinois", "oh": "Ohio", "ga": "Georgia",
            "nc": "North Carolina", "mi": "Michigan", "nj": "New Jersey", "va": "Virginia",
            "wa": "Washington", "az": "Arizona", "ma": "Massachusetts", "tn": "Tennessee",
            "md": "Maryland", "mo": "Missouri", "wi": "Wisconsin", "co": "Colorado",
            "mn": "Minnesota", "sc": "South Carolina", "al": "Alabama", "la": "Louisiana",
            "ky": "Kentucky", "or": "Oregon", "ok": "Oklahoma", "ct": "Connecticut",
            "ia": "Iowa", "nv": "Nevada", "ar": "Arkansas", "ms": "Mississippi",
            "ks": "Kansas", "ut": "Utah", "nm": "New Mexico", "ne": "Nebraska",
            "id": "Idaho", "me": "Maine", "mt": "Montana", "ri": "Rhode Island",
            "de": "Delaware", "sd": "South Dakota", "nd": "North Dakota", "ak": "Alaska",
            "hi": "Hawaii", "wy": "Wyoming", "vt": "Vermont", "nh": "New Hampshire",
            "wv": "West Virginia",
        };
        const validStates = Object.values(stateAbbreviationMap);
        const normalized = stateInput.trim().toLowerCase();
        const abbreviationMatch = normalized.match(/\b([a-z]{2})\b/);
        const fullNameMatch = validStates.find(state => normalized.includes(state.toLowerCase()));
        logger.info(`[normalizeStateName] Input: "${stateInput}" | Abbr match: ${abbreviationMatch?.[1]} | Full name match: ${fullNameMatch}`);
        if (abbreviationMatch && stateAbbreviationMap[abbreviationMatch[1]]) {
            const result = stateAbbreviationMap[abbreviationMatch[1]];
            logger.info(`[normalizeStateName] ✓ Using abbreviation: ${abbreviationMatch[1]} → ${result}`);
            return result;
        }
        if (fullNameMatch) {
            logger.info(`[normalizeStateName] ✓ Using full name: ${fullNameMatch}`);
            return fullNameMatch;
        }
        const exactMatch = validStates.find(state => state.toLowerCase() === normalized);
        if (exactMatch) {
            logger.info(`[normalizeStateName] ✓ Exact match: ${exactMatch}`);
            return exactMatch;
        }
        logger.warn(`[normalizeStateName] ✗ Invalid state: "${stateInput}"`);
        return null;
    }
    async validateState(stateName) {
        try {
            const normalizedName = this.normalizeStateName(stateName);
            if (!normalizedName) {
                return { isValid: false };
            }
            const mapping = await this.mapStateToDB(normalizedName, this.getOrCreateSession("temp"));
            return {
                isValid: mapping !== null,
                normalizedName: normalizedName
            };
        }
        catch (error) {
            logger.warn("[LeadAgent] State validation failed:", error);
            return { isValid: false };
        }
    }
    normalizeRoofType(roofInput) {
        const roofAliasMap = {
            "regular": "regular",
            "standard": "regular",
            "normal": "regular",
            "simple": "regular",
            "aframe": "a-frame",
            "a-frame": "a-frame",
            "a frame": "a-frame",
            "pitched": "a-frame",
            "gabled": "a-frame",
            "vertical": "vertical",
            "vertical roof": "vertical",
            "sidewall": "vertical",
            "box": "box-style",
            "box-style": "box-style",
            "box style": "box-style",
            "boxstyle": "box-style",
        };
        const normalized = roofInput.trim().toLowerCase();
        const result = roofAliasMap[normalized];
        if (result) {
            logger.info(`[normalizeRoofType] ✓ Normalized "${roofInput}" → "${result}"`);
            return result;
        }
        logger.warn(`[normalizeRoofType] ✗ Invalid roof type: "${roofInput}"`);
        return null;
    }
    async validateRoofType(roofType) {
        try {
            const normalizedType = this.normalizeRoofType(roofType);
            if (!normalizedType) {
                return { isValid: false };
            }
            return {
                isValid: true,
                normalizedType: normalizedType
            };
        }
        catch (error) {
            logger.warn("[LeadAgent] Roof type validation failed:", error);
            return { isValid: false };
        }
    }
    getValidRoofTypesMessage() {
        const roofTypes = [
            "Regular (standard, simple roof)",
            "A-Frame (pitched/gabled roof)",
            "Vertical (sidewall roof)",
            "Box-Style (box style roof)"
        ];
        return `Valid roof types:\n${roofTypes.map(t => `• ${t}`).join('\n')}`;
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map