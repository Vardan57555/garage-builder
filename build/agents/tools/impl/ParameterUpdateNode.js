"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleParameterUpdateNode = void 0;
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const RoofValidator_1 = require("../../validators/RoofValidator");
const StateValidator_1 = require("../../validators/StateValidator");
const ChoiceHandler_1 = require("../../tools/impl/ChoiceHandler");
const DimensionCalculator_1 = require("../../../utils/dimensionCalculator/DimensionCalculator");
const messages_1 = require("@langchain/core/messages");
const SharedLLM_1 = require("../../../llm/SharedLLM");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const choiceManager = new ChoiceHandler_1.GenericChoiceManager();
async function extractFieldValueWithLLM(userInput, field, currentParams) {
    try {
        logger.info(`[extractFieldValueWithLLM] Extracting ${field} from: "${userInput}"`);
        const indecisionPatterns = [
            /\b(any|whatever|anyways|idk|i don't know|doesn't matter|don't care|idc|no preference|surprise me|you pick|all the same|doesn't matter|whatever's fine)\b/i,
            /^(any|whatever|idk|hmm|um|uh)$/i,
        ];
        const isIndecisive = indecisionPatterns.some(p => p.test(userInput));
        if (isIndecisive) {
            logger.info(`[extractFieldValueWithLLM] ✅ Detected indecision: "${userInput}"`);
            const defaults = {
                roof_type: "regular",
                gauge: 16,
                building_type: "garage",
                state_name: null,
                width: null,
                length: null,
                height: null,
                garage_type: null,
                manufacturer_name: null,
                utility_length: null,
                is_barn: null,
            };
            const defaultValue = defaults[field];
            if (defaultValue === null) {
                logger.warn(`[extractFieldValueWithLLM] No default for field: ${field}, returning null`);
                return null;
            }
            logger.info(`[extractFieldValueWithLLM] ✅ Returning default for ${field}: ${defaultValue}`);
            return defaultValue;
        }
        let lockedContext = "Already extracted (do NOT override):";
        if (currentParams.width)
            lockedContext += `\n  - width: ${currentParams.width}ft`;
        if (currentParams.length)
            lockedContext += `\n  - length: ${currentParams.length}ft`;
        if (currentParams.height)
            lockedContext += `\n  - height: ${currentParams.height}ft`;
        if (currentParams.state_name)
            lockedContext += `\n  - state_name: "${currentParams.state_name}"`;
        if (currentParams.roof_type)
            lockedContext += `\n  - roof_type: "${currentParams.roof_type}"`;
        if (currentParams.gauge)
            lockedContext += `\n  - gauge: ${currentParams.gauge}`;
        if (currentParams.garage_type)
            lockedContext += `\n  - garage_type: "${currentParams.garage_type}"`;
        let fieldInstructions = "";
        let exampleOutput = "";
        switch (field) {
            case "width":
                fieldInstructions = `Extract WIDTH in feet as a number. Valid range: 1-100.`;
                exampleOutput = `USER: "change width to 20" → OUTPUT: 20\nUSER: "make it 30 feet" → OUTPUT: 30`;
                break;
            case "length":
                fieldInstructions = `Extract LENGTH in feet as a number. Valid range: 1-200.`;
                exampleOutput = `USER: "30 feet long" → OUTPUT: 30\nUSER: "length 40" → OUTPUT: 40`;
                break;
            case "height":
                fieldInstructions = `Extract HEIGHT in feet as a number. Valid range: 1-30.`;
                exampleOutput = `USER: "12 feet tall" → OUTPUT: 12\nUSER: "height 10" → OUTPUT: 10`;
                break;
            case "gauge":
                fieldInstructions = `Extract GAUGE as a number. VALID ONLY: 14, 16, 18, 20. If user says "any"/"idk"/etc, return 16 (default).`;
                exampleOutput = `USER: "14GA" → OUTPUT: 14\nUSER: "gauge 18" → OUTPUT: 18\nUSER: "any" → OUTPUT: 16`;
                break;
            case "state_name":
                fieldInstructions = `Extract STATE NAME as text. Examples: Texas, California, New York`;
                exampleOutput = `USER: "I'm in Texas" → OUTPUT: Texas\nUSER: "California" → OUTPUT: California`;
                break;
            case "roof_type":
                fieldInstructions = `Extract ROOF TYPE. VALID ONLY: vertical, regular, box, a-frame. If user says "any"/"idk"/etc, return "regular" (default).`;
                exampleOutput = `USER: "I want vertical" → OUTPUT: vertical\nUSER: "box roof" → OUTPUT: box\nUSER: "any" → OUTPUT: regular`;
                break;
            case "building_type":
                fieldInstructions = `Extract BUILDING TYPE. Valid: garage, shed, barn. If user says "any"/"idk"/etc, return "garage" (default).`;
                exampleOutput = `USER: "make it 3 car" → OUTPUT: 3-car\nUSER: "any" → OUTPUT: garage`;
                break;
            default:
                fieldInstructions = `Extract ${field}`;
                exampleOutput = `OUTPUT: value`;
        }
        const prompt = `CRITICAL: You are ONLY extracting a single value. NO EXPLANATIONS. NO CODE.

FIELD: ${field}
INSTRUCTION: ${fieldInstructions}

${lockedContext}

⚠️ STRICT RULES:
1. Return ONLY the value - nothing else
2. NO explanations, NO code, NO comments
3. NO markdown, NO JSON structure
4. If user expresses indecision ("any", "idk", "whatever", etc), return the DEFAULT for this field
5. If user mentions different field, return: null
6. If cannot extract, return: null

EXAMPLES:
${exampleOutput}

USER INPUT: "${userInput}"

RETURN ONLY THE VALUE:`;
        logger.info(`[extractFieldValueWithLLM] Calling LLM for field extraction`);
        const response = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
        let value = response.trim().toLowerCase();
        logger.info(`[extractFieldValueWithLLM] Raw response: "${value}"`);
        if (value.includes("def ") ||
            value.includes("import ") ||
            value.includes("```") ||
            value.includes("function ") ||
            value.includes("const ") ||
            value.includes("let ") ||
            value.includes("class ") ||
            value.includes(".replace") ||
            value.includes("pattern ") ||
            value.includes("regex") ||
            value.length > 100) {
            logger.warn(`[extractFieldValueWithLLM] Invalid response (looks like code): "${value.substring(0, 50)}..."`);
            return null;
        }
        if (value === "null" || value === "" || value === "undefined" || value === "none") {
            logger.info(`[extractFieldValueWithLLM] No value extracted for ${field}`);
            return null;
        }
        logger.info(`[extractFieldValueWithLLM] ✅ Extracted ${field}: ${value}`);
        return value;
    }
    catch (error) {
        logger.error(`[extractFieldValueWithLLM] Error:`, error);
        return null;
    }
}
async function validateParameterValue(field, value, stateMapCache) {
    if (field === "roof_type") {
        const validationResult = await RoofValidator_1.RoofDataValidator.validateRoofType(value);
        if (!validationResult.isValid) {
            return `❌ "${value}" is not a valid roof type (vertical, regular, box, a-frame)`;
        }
    }
    if (field === "state_name") {
        const validationResult = await StateValidator_1.StateDataValidator.validateState(value, async (name) => await LeadAgentHelpers_1.LeadAgentHelpers.mapStateToDB(name, stateMapCache));
        if (!validationResult.isValid) {
            return `❌ "${value}" is not a valid state`;
        }
    }
    if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
        let numValue;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        }
        else if (typeof value === "number") {
            numValue = value;
        }
        else {
            numValue = NaN;
        }
        if (isNaN(numValue) || numValue <= 0) {
            return `❌ Invalid ${field}: must be a positive number`;
        }
        if (field === "gauge" && ![14, 16, 18, 20].includes(numValue)) {
            return `❌ Invalid gauge. Must be 14, 16, 18, or 20`;
        }
    }
    return null;
}
function applyParameterUpdate(currentParams, field, value) {
    logger.info(`[applyParameterUpdate] Updating ${field} = ${value}`);
    const updatedParams = {
        ...currentParams
    };
    if (field === "garage_type") {
        const carCountMatch = String(value).match(/(\d+)/);
        const numCars = carCountMatch ? parseInt(carCountMatch[1], 10) : null;
        if (numCars && numCars > 0) {
            const calculation = DimensionCalculator_1.DynamicGarageDimensionCalculator.calculateDimensionsFromInput(`${numCars} cars`);
            if (calculation.width && calculation.length) {
                updatedParams.width = calculation.width;
                updatedParams.length = calculation.length;
                updatedParams.height = calculation.height;
                updatedParams.garage_type = calculation.garageType;
                logger.info(`[applyParameterUpdate] Updated garage_type:`, updatedParams);
                return {
                    success: true,
                    message: `✓ Updated to ${calculation.numCars}-car garage`,
                    updatedParams: updatedParams,
                };
            }
        }
        return {
            success: false,
            message: `❌ Could not process ${value}`,
        };
    }
    if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
        let numValue;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        }
        else {
            numValue = value;
        }
        if (isNaN(numValue) || numValue <= 0) {
            return {
                success: false,
                message: `❌ Invalid ${field}`,
            };
        }
        updatedParams[field] = numValue;
        logger.info(`[applyParameterUpdate] Set ${field} = ${numValue}`);
        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers_1.LeadAgentHelpers.formatFieldName(field)} to ${numValue}`,
            updatedParams: updatedParams,
        };
    }
    updatedParams[field] = String(value).trim();
    logger.info(`[applyParameterUpdate] Set ${field} = ${String(value).trim()}`);
    return {
        success: true,
        message: `✓ Updated ${LeadAgentHelpers_1.LeadAgentHelpers.formatFieldName(field)}`,
        updatedParams: updatedParams,
    };
}
const handleParameterUpdateNode = async (state) => {
    logger.info(`[UpdateNode] Pending updates: ${state.pendingUpdates.length}`);
    if (state.pendingUpdates && state.pendingUpdates.length > 0) {
        let updatedParams = {
            ...state.userFriendlyParams
        };
        const updateMessages = [];
        const userInput = state.messages[state.messages.length - 1]?.content;
        for (const update of state.pendingUpdates) {
            logger.info(`[UpdateNode] Processing: ${update.field} = ${update.value}`);
            const extractedValue = await extractFieldValueWithLLM(userInput, update.field, updatedParams);
            if (extractedValue === null) {
                logger.warn(`[UpdateNode] Could not extract ${update.field} from input`);
                continue;
            }
            update.value = extractedValue;
            const validationError = await validateParameterValue(update.field, update.value, state.stateMapCache);
            if (validationError) {
                logger.warn(`[UpdateNode] Validation failed: ${validationError}`);
                return {
                    response: validationError,
                    userFriendlyParams: updatedParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }
            if (update.field === "roof_type") {
                const isExplicit = /^(vertical|regular|box|a-frame)$/i.test(String(update.value));
                if (!isExplicit) {
                    const choice = await choiceManager.handleChoice("roof_type", String(update.value));
                    update.value = choice.selected;
                }
            }
            const result = applyParameterUpdate(updatedParams, update.field, update.value);
            if (!result.success) {
                logger.warn(`[UpdateNode] Update failed: ${result.message}`);
                return {
                    response: result.message,
                    userFriendlyParams: updatedParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }
            updateMessages.push(result.message);
            if (result.updatedParams) {
                updatedParams = { ...result.updatedParams };
            }
        }
        logger.info(`[UpdateNode] All updates applied, checking missing fields`);
        const missingFields = LeadAgentHelpers_1.LeadAgentHelpers.getMissingFields(updatedParams);
        if (missingFields.length === 0) {
            logger.info(`[UpdateNode] ✅ All fields complete, moving to price calc`);
            return {
                response: updateMessages.join(" | "),
                userFriendlyParams: updatedParams,
                priceCalculated: false,
                currentField: null,
                nextStep: "calculate_price",
                pendingUpdates: [],
            };
        }
        const nextField = missingFields[0];
        logger.info(`[UpdateNode] Next missing field: ${nextField}`);
        return {
            response: updateMessages.join(" | "),
            userFriendlyParams: updatedParams,
            currentField: nextField,
            nextStep: "ask_for_field",
            pendingUpdates: [],
        };
    }
    const missingFields = LeadAgentHelpers_1.LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
    if (missingFields.length === 0) {
        return {
            userFriendlyParams: state.userFriendlyParams,
            nextStep: "calculate_price",
            pendingUpdates: [],
        };
    }
    return {
        userFriendlyParams: state.userFriendlyParams,
        currentField: missingFields[0],
        nextStep: "ask_for_field",
        pendingUpdates: [],
    };
};
exports.handleParameterUpdateNode = handleParameterUpdateNode;
//# sourceMappingURL=ParameterUpdateNode.js.map