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
const StateValidator_1 = require("./validators/StateValidator");
const RoofValidator_1 = require("./validators/RoofValidator");
const DimensionCalculator_1 = require("../utils/dimensionCalculator/DimensionCalculator");
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
        const lowerInput = input.toLowerCase();
        const carCountMatch = input.match(/(\d+)\s*cars?/i);
        if (carCountMatch) {
            const newCarCount = parseInt(carCountMatch[1], 10);
            const sessionData = this.sessionManager.getSession(this.currentSessionId);
            const currentParams = sessionData?.state?.userFriendlyParams;
            const currentGarageType = currentParams?.garage_type;
            const currentCarCountMatch = currentGarageType?.match(/(\d+)-car/);
            const currentCarCount = currentCarCountMatch ? parseInt(currentCarCountMatch[1], 10) : null;
            logger.info(`[LeadAgent] Car count check - Current: ${currentCarCount}, New: ${newCarCount}`);
            if (currentCarCount !== null && currentCarCount !== newCarCount) {
                logger.info(`[LeadAgent] Car count CHANGED from ${currentCarCount} to ${newCarCount} - triggering update`);
                return {
                    field: 'garage_type',
                    value: `${newCarCount}-car`
                };
            }
            if (currentCarCount === null && newCarCount) {
                logger.info(`[LeadAgent] Initial car count set to ${newCarCount}`);
                return {
                    field: 'garage_type',
                    value: `${newCarCount}-car`
                };
            }
        }
        const multiParamResult = this.extractMultipleParametersByRegex(lowerInput);
        if (multiParamResult && multiParamResult.length > 0) {
            logger.info(`[LeadAgent] Regex extracted ${multiParamResult.length} parameters`);
            for (const param of multiParamResult) {
                const validationError = await this.validateParameterValue(param.field, param.value);
                if (validationError) {
                    logger.warn(`[LeadAgent] Validation failed for ${param.field}: ${validationError}`);
                    this.validationError = validationError;
                    return null;
                }
            }
            this.pendingUpdates = multiParamResult;
            return multiParamResult[0];
        }
        const regexResult = this.extractParameterByRegex(lowerInput);
        if (regexResult) {
            logger.info(`[LeadAgent] Regex extracted update: ${regexResult.field} = ${regexResult.value}`);
            const validationError = await this.validateParameterValue(regexResult.field, regexResult.value);
            if (validationError) {
                logger.warn(`[LeadAgent] Validation failed for ${regexResult.field}: ${validationError}`);
                this.validationError = validationError;
                return null;
            }
            return regexResult;
        }
        const updatePatterns = [
            { regex: /\b(change|update|correct|fix|actually|wait|let me|make|set)\b/i, weight: 1 },
            { regex: /\b(width|length|height|roof|state|gauge)\b/i, weight: 2 }
        ];
        const hasUpdateIntent = updatePatterns.some(p => p.regex.test(input));
        if (!hasUpdateIntent)
            return null;
        try {
            const prompt = `Given this user message: "${input}"

        Extract the parameter update:
        1. Which parameter? (width, length, height, roof_type, state_name, gauge, building_type)
        2. What is the NEW value?
        
        Respond ONLY with JSON - no markdown, no explanation:
        {"isUpdate": true, "field": "width", "value": 25}
        or
        {"isUpdate": false}`;
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            const responseText = aiMessage.content.trim();
            logger.info(`[LeadAgent] AI update detection response: ${responseText}`);
            const cleanedResponse = responseText
                .replace(/^```json\s*/g, '')
                .replace(/^```\s*/g, '')
                .replace(/\s*```$/g, '')
                .trim();
            const response = JSON.parse(cleanedResponse);
            if (response.isUpdate && response.field && response.value !== undefined && response.value !== null) {
                logger.info(`[LeadAgent] AI detected update: ${response.field} = ${response.value}`);
                const validationError = await this.validateParameterValue(response.field, response.value);
                if (validationError) {
                    logger.warn(`[LeadAgent] Validation failed for ${response.field}: ${validationError}`);
                    this.validationError = validationError;
                    return null;
                }
                return {
                    field: response.field,
                    value: response.value
                };
            }
        }
        catch (error) {
            logger.warn("[LeadAgent] AI update detection failed:", error);
        }
        return null;
    }
    async validateParameterValue(field, value) {
        if (field === "roof_type") {
            const validationResult = await RoofValidator_1.RoofDataValidator.validateRoofType(value);
            if (!validationResult.isValid) {
                return `❌ "${value}" is not a valid roof type.\n\n${RoofValidator_1.RoofDataValidator.getValidRoofTypesMessage()}`;
            }
        }
        if (field === "state_name") {
            const sessionData = this.sessionManager.getSession(this.currentSessionId);
            const validationResult = await StateValidator_1.StateDataValidator.validateState(value, async (name) => await this.mapStateToDB(name, sessionData));
            if (!validationResult.isValid) {
                return `❌ "${value}" is not a valid state.\n\n${StateValidator_1.StateDataValidator.getValidStatesMessage()}`;
            }
        }
        if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
            let numValue;
            if (typeof value === 'string') {
                numValue = parseFloat(value.replace(/[^\d.]/g, ''));
            }
            else if (typeof value === 'number') {
                numValue = value;
            }
            else {
                numValue = NaN;
            }
            if (isNaN(numValue) || numValue <= 0) {
                return `❌ Invalid ${field}. Please provide a positive number (e.g., "make ${field} 25").`;
            }
        }
        return null;
    }
    extractMultipleParametersByRegex(input) {
        const updates = [];
        const lowerInput = input.toLowerCase().trim();
        logger.info(`[extractMultipleParametersByRegex] Processing input: "${input}"`);
        logger.info(`[extractMultipleParametersByRegex] Lowercase input: "${lowerInput}"`);
        const widthMatch = lowerInput.match(/\bwidth\s+(\d+(?:\.\d+)?)\b/);
        const lengthMatch = lowerInput.match(/\blength\s+(\d+(?:\.\d+)?)\b/);
        const heightMatch = lowerInput.match(/\bheight\s+(\d+(?:\.\d+)?)\b/);
        const gaugeMatch = lowerInput.match(/\bgauge\s+(\d+(?:\.\d+)?)\b/);
        logger.info(`[extractMultipleParametersByRegex] Raw matches - width: ${widthMatch?.[1]}, length: ${lengthMatch?.[1]}, height: ${heightMatch?.[1]}, gauge: ${gaugeMatch?.[1]}`);
        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'width', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added width: ${value}`);
            }
        }
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'length', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added length: ${value}`);
            }
        }
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'height', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added height: ${value}`);
            }
        }
        if (gaugeMatch) {
            const value = parseFloat(gaugeMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'gauge', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added gauge: ${value}`);
            }
        }
        if (updates.length === 0) {
            const dimensionMatch = lowerInput.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
            if (dimensionMatch) {
                updates.push({ field: 'width', value: parseFloat(dimensionMatch[1]) }, { field: 'length', value: parseFloat(dimensionMatch[2]) }, { field: 'height', value: parseFloat(dimensionMatch[3]) });
                logger.info(`[extractMultipleParametersByRegex] Matched dimensions format: ${dimensionMatch[1]}x${dimensionMatch[2]}x${dimensionMatch[3]}`);
            }
        }
        logger.info(`[extractMultipleParametersByRegex] Total updates found: ${updates.length}`);
        logger.info(`[extractMultipleParametersByRegex] Final updates:`, JSON.stringify(updates));
        return updates.length > 0 ? updates : null;
    }
    extractParameterByRegex(input) {
        const patterns = [
            {
                regex: /^\s*(vert(?:ical)?|a-?frame|aframe|box|box-?style|regular|standard|normal|pitched|gabled|sidewall)\s*$/i,
                parse: (match) => {
                    let value = match[1].toLowerCase();
                    if (value === 'vert')
                        value = 'vertical';
                    if (value === 'verti')
                        value = 'vertical';
                    return {
                        field: 'roof_type',
                        value: value
                    };
                }
            },
            {
                regex: /(?:want|in|make|set|change|update|roof|style|to)\s+(?:to\s+)?(vert(?:ical)?|a-?frame|aframe|box|box-?style|regular|standard|normal|pitched|gabled|sidewall)/i,
                parse: (match) => {
                    let value = match[1].toLowerCase();
                    if (value === 'vert')
                        value = 'vertical';
                    if (value === 'verti')
                        value = 'vertical';
                    return {
                        field: 'roof_type',
                        value: value
                    };
                }
            },
            {
                regex: /(?:make|set|change|update)?\s*(?:the\s+)?(width|length|height)\s+(?:to\s+)?(\d+)/i,
                parse: (match) => ({
                    field: match[1].toLowerCase(),
                    value: parseFloat(match[2])
                })
            },
            {
                regex: /(?:make|set|change|update)?\s*gauge\s+(?:to\s+)?(\d+)/i,
                parse: (match) => ({
                    field: 'gauge',
                    value: parseFloat(match[1])
                })
            },
            {
                regex: /\b(?:state|location|in)\s+([a-z\s]+?)(?:\s*(?:\.|$|,|and))/i,
                parse: (match) => ({
                    field: 'state_name',
                    value: match[1].trim()
                })
            },
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern.regex);
            if (match) {
                try {
                    const result = pattern.parse(match);
                    if (result && result.value !== null && result.value !== undefined) {
                        logger.info(`[extractParameterByRegex] Matched ${result.field} = ${result.value}`);
                        return result;
                    }
                }
                catch (e) {
                    logger.warn(`[extractParameterByRegex] Parse error:`, e);
                }
            }
        }
        return null;
    }
    handleParameterUpdate(session, update) {
        const { field, value } = update;
        logger.info(`[LeadAgent] Attempting to update ${field} from ${session.state.userFriendlyParams[field]} to ${value}`);
        if (field === 'garage_type') {
            const carCountMatch = String(value).match(/(\d+)/);
            const numCars = carCountMatch ? parseInt(carCountMatch[1], 10) : null;
            logger.info(`[LeadAgent] Processing garage_type: ${value}, extracted numCars: ${numCars}`);
            if (numCars && numCars > 0) {
                const calculation = DimensionCalculator_1.DynamicGarageDimensionCalculator.calculateDimensionsFromInput(`${numCars} cars`);
                logger.info(`[LeadAgent] Calculation result:`, JSON.stringify(calculation));
                if (calculation.width && calculation.length) {
                    session.state.userFriendlyParams.width = undefined;
                    session.state.userFriendlyParams.length = undefined;
                    session.state.userFriendlyParams.height = undefined;
                    session.state.userFriendlyParams.garage_type = calculation.garageType;
                    session.state.userFriendlyParams.width = calculation.width;
                    session.state.userFriendlyParams.length = calculation.length;
                    session.state.userFriendlyParams.height = calculation.height;
                    logger.info(`[LeadAgent] Recalculated dimensions for ${calculation.garageType}:`, `${calculation.width}×${calculation.length}×${calculation.height}`);
                    logger.info(`[LeadAgent] Session params after update:`, JSON.stringify(session.state.userFriendlyParams));
                    return {
                        success: true,
                        message: `✓ Updated to ${calculation.numCars}-car garage (${calculation.width}ft × ${calculation.length}ft × ${calculation.height}ft)`,
                        updatedField: field
                    };
                }
            }
            logger.warn(`[LeadAgent] Failed to calculate dimensions for garage_type: ${value}`);
            return {
                success: false,
                message: `❌ Could not calculate dimensions for ${value}`
            };
        }
        if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
            let numValue;
            if (typeof value === 'string') {
                numValue = parseFloat(value.replace(/[^\d.]/g, ''));
            }
            else if (typeof value === 'number') {
                numValue = value;
            }
            else {
                numValue = NaN;
            }
            if (isNaN(numValue) || numValue <= 0) {
                logger.warn(`[LeadAgent] Invalid ${field} value: ${value}`);
                return {
                    success: false,
                    message: `❌ Invalid ${field}. Please provide a positive number (e.g., "make ${field} 25").`
                };
            }
            session.state.userFriendlyParams[field] = numValue;
            logger.info(`[LeadAgent] Successfully updated ${field} to ${numValue} (numeric)`);
        }
        else {
            session.state.userFriendlyParams[field] = String(value).trim();
            logger.info(`[LeadAgent] Successfully updated ${field} to ${value} (string)`);
        }
        logger.info(`[LeadAgent] Current session params after update:`, JSON.stringify(session.state.userFriendlyParams));
        const updatedValue = session.state.userFriendlyParams[field];
        const displayField = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
        const fieldSuffix = ["width", "length", "height", "gauge", "utility_length"].includes(field) ? "ft." : "";
        return {
            success: true,
            message: `✓ Updated ${displayField} to ${updatedValue}${fieldSuffix ? ' ' + fieldSuffix : ''}`,
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
    formatDimensionsResponse(currentParams) {
        const dimensions = ["width", "length", "height"]
            .filter((k) => currentParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${currentParams[k]}ft.`)
            .join(" ");
        return dimensions ? `Got it! ${dimensions}\n\n` : "";
    }
    async run(sessionId, input) {
        this.currentSessionId = sessionId;
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
        if (paramUpdate === null) {
            const validationError = this.validationError;
            if (validationError) {
                logger.warn(`[LeadAgent] Validation error detected: ${validationError}`);
                await session.memory.chatHistory.addAIChatMessage(validationError);
                this.validationError = null;
                return validationError;
            }
        }
        if (paramUpdate) {
            const pendingUpdates = this.pendingUpdates || [];
            let allUpdateResults = [];
            if (pendingUpdates.length > 0) {
                logger.info(`[LeadAgent] Processing ${pendingUpdates.length} pending updates`, JSON.stringify(pendingUpdates));
                for (const update of pendingUpdates) {
                    logger.info(`[LeadAgent] Validating update: ${update.field} = ${update.value}`);
                    if (update.field === "state_name") {
                        const validationResult = await StateValidator_1.StateDataValidator.validateState(update.value, async (name) => await this.mapStateToDB(name, this.getOrCreateSession("temp")));
                        if (!validationResult.isValid) {
                            const errorMessage = `❌ "${update.value}" is not a valid state.\n\n${StateValidator_1.StateDataValidator.getValidStatesMessage()}`;
                            await session.memory.chatHistory.addAIChatMessage(errorMessage);
                            return errorMessage;
                        }
                        update.value = validationResult.normalizedName;
                    }
                    if (update.field === "roof_type") {
                        const validationResult = await RoofValidator_1.RoofDataValidator.validateRoofType(update.value);
                        if (!validationResult.isValid) {
                            const errorMessage = `❌ "${update.value}" is not a valid roof type.\n\n${RoofValidator_1.RoofDataValidator.getValidRoofTypesMessage()}`;
                            await session.memory.chatHistory.addAIChatMessage(errorMessage);
                            return errorMessage;
                        }
                        update.value = validationResult.normalizedType;
                    }
                    const updateResult = await this.handleParameterUpdate(session, update);
                    allUpdateResults.push(updateResult);
                    logger.info(`[LeadAgent] Update result for ${update.field}:`, updateResult);
                    if (!updateResult.success) {
                        await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                        return updateResult.message;
                    }
                }
                this.pendingUpdates = [];
                logger.info(`[LeadAgent] Final session params after all updates:`, JSON.stringify(session.state.userFriendlyParams));
                const allUpdatesMessage = allUpdateResults
                    .map((result, idx) => {
                    const update = pendingUpdates[idx];
                    const val = session.state.userFriendlyParams[update.field];
                    const suffix = ["width", "length", "height", "gauge"].includes(update.field) ? "ft." : "";
                    return `${update.field}: ${val}${suffix ? ' ' + suffix : ''}`;
                })
                    .join(" | ");
                const response1 = `✓ Updated: ${allUpdatesMessage}`;
                await session.memory.chatHistory.addAIChatMessage(response1);
                logger.info(`[LeadAgent] Multi-param update response: ${response1}`);
            }
            else {
                if (paramUpdate.field === "state_name") {
                    const validationResult = await StateValidator_1.StateDataValidator.validateState(paramUpdate.value, async (name) => await this.mapStateToDB(name, this.getOrCreateSession("temp")));
                    if (!validationResult.isValid) {
                        const errorMessage = `❌ "${paramUpdate.value}" is not a valid state.\n\n${StateValidator_1.StateDataValidator.getValidStatesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    paramUpdate.value = validationResult.normalizedName;
                }
                if (paramUpdate.field === "roof_type") {
                    const validationResult = await RoofValidator_1.RoofDataValidator.validateRoofType(paramUpdate.value);
                    if (!validationResult.isValid) {
                        const errorMessage = `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${RoofValidator_1.RoofDataValidator.getValidRoofTypesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    paramUpdate.value = validationResult.normalizedType;
                }
                const updateResult = await this.handleParameterUpdate(session, paramUpdate);
                allUpdateResults.push(updateResult);
                if (!updateResult.success) {
                    await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                    return updateResult.message;
                }
                logger.info(`[LeadAgent] Single parameter updated:`, JSON.stringify(session.state.userFriendlyParams));
            }
            const missingFields = this.getMissingFields(session.state.userFriendlyParams);
            if (missingFields.length === 0) {
                const confirmMessage = `✓ All parameters set! Calculating price...`;
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
                const currentParams = this.formatCurrentParams(session.state.userFriendlyParams);
                const response = `${currentParams}\n\n${Constants_1.Constants.FIELD_PROMPTS[nextField]}`;
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
        }
        const extractor = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance();
        const rawParams = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Safe extracted user-friendly params:`, extractedParams);
        if (extractedParams.state_name) {
            const validationResult = await StateValidator_1.StateDataValidator.validateState(extractedParams.state_name, async (name) => await this.mapStateToDB(name, this.getOrCreateSession("temp")));
            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.state_name}" is not a valid state.\n\n${StateValidator_1.StateDataValidator.getValidStatesMessage()}\n\nPlease specify your state.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.state_name = validationResult.normalizedName;
        }
        if (extractedParams.roof_type) {
            const validationResult = await RoofValidator_1.RoofDataValidator.validateRoofType(extractedParams.roof_type);
            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.roof_type}" is not a valid roof type.\n\n${RoofValidator_1.RoofDataValidator.getValidRoofTypesMessage()}\n\nPlease specify your roof type.`;
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
            const response = this.formatDimensionsResponse(session.state.userFriendlyParams) + Constants_1.Constants.FIELD_PROMPTS[nextField];
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
    formatCurrentParams(params) {
        const parts = [];
        if (params.width)
            parts.push(`Width: ${params.width}ft`);
        if (params.length)
            parts.push(`Length: ${params.length}ft`);
        if (params.height)
            parts.push(`Height: ${params.height}ft`);
        if (params.roof_type)
            parts.push(`Roof: ${params.roof_type}`);
        if (params.state_name)
            parts.push(`State: ${params.state_name}`);
        if (params.gauge)
            parts.push(`Gauge: ${params.gauge}`);
        return parts.length > 0 ? `📋 Current parameters: ${parts.join(" | ")}` : "";
    }
    async reset() {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map