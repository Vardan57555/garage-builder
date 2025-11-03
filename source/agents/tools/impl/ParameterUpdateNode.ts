import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { RoofDataValidator } from "@agents/validators/RoofValidator";
import { StateDataValidator } from "@agents/validators/StateValidator";
import { GenericChoiceManager } from "@agents/tools/impl/ChoiceHandler";
import { DynamicGarageDimensionCalculator } from "@utils/dimensionCalculator/DimensionCalculator";
import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);
const choiceManager = new GenericChoiceManager();

interface UpdateResult {
    success: boolean;
    message: string;
    updatedParams?: Partial<UserFriendlyParams>;
}

async function extractFieldValueWithLLM(
    userInput: string,
    field: keyof UserFriendlyParams,
    currentParams: Partial<UserFriendlyParams>
): Promise<any> {
    try {
        logger.info(`[extractFieldValueWithLLM] Extracting ${field} from: "${userInput}"`);

        // ✅ Check for indecision patterns FIRST
        const indecisionPatterns = [
            /\b(any|whatever|anyways|idk|i don't know|doesn't matter|don't care|idc|no preference|surprise me|you pick|all the same|doesn't matter|whatever's fine)\b/i,
            /^(any|whatever|idk|hmm|um|uh)$/i,
        ];

        const isIndecisive = indecisionPatterns.some(p => p.test(userInput));

        if (isIndecisive) {
            logger.info(`[extractFieldValueWithLLM] ✅ Detected indecision: "${userInput}"`);

            // Return balanced defaults
            const defaults: Record<keyof UserFriendlyParams, any> = {
                roof_type: "regular",      // Most balanced (middle option)
                gauge: 16,                 // Most common gauge
                building_type: "garage",   // Most common building type
                state_name: null,          // Can't default for state - needs user input
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

        // Build locked fields context
        let lockedContext = "Already extracted (do NOT override):";
        if (currentParams.width) lockedContext += `\n  - width: ${currentParams.width}ft`;
        if (currentParams.length) lockedContext += `\n  - length: ${currentParams.length}ft`;
        if (currentParams.height) lockedContext += `\n  - height: ${currentParams.height}ft`;
        if (currentParams.state_name) lockedContext += `\n  - state_name: "${currentParams.state_name}"`;
        if (currentParams.roof_type) lockedContext += `\n  - roof_type: "${currentParams.roof_type}"`;
        if (currentParams.gauge) lockedContext += `\n  - gauge: ${currentParams.gauge}`;
        if (currentParams.garage_type) lockedContext += `\n  - garage_type: "${currentParams.garage_type}"`;

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
        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        let value = response.trim().toLowerCase();

        logger.info(`[extractFieldValueWithLLM] Raw response: "${value}"`);

        // ✅ STRICT VALIDATION - reject if response contains code/markdown indicators
        if (
            value.includes("def ") ||
            value.includes("import ") ||
            value.includes("```") ||
            value.includes("function ") ||
            value.includes("const ") ||
            value.includes("let ") ||
            value.includes("class ") ||
            value.includes(".replace") ||
            value.includes("pattern ") ||
            value.includes("regex") ||
            value.length > 100  // Values should be short
        ) {
            logger.warn(
                `[extractFieldValueWithLLM] Invalid response (looks like code): "${value.substring(0, 50)}..."`
            );
            return null;
        }

        // Parse the response
        if (value === "null" || value === "" || value === "undefined" || value === "none") {
            logger.info(`[extractFieldValueWithLLM] No value extracted for ${field}`);
            return null;
        }

        logger.info(`[extractFieldValueWithLLM] ✅ Extracted ${field}: ${value}`);
        return value;
    } catch (error) {
        logger.error(`[extractFieldValueWithLLM] Error:`, error);
        return null;
    }
}

async function validateParameterValue(
    field: keyof UserFriendlyParams,
    value: any,
    stateMapCache: Map<string, any>
): Promise<string | null> {
    if (field === "roof_type") {
        const validationResult = await RoofDataValidator.validateRoofType(value);
        if (!validationResult.isValid) {
            return `❌ "${value}" is not a valid roof type (vertical, regular, box, a-frame)`;
        }
    }

    if (field === "state_name") {
        const validationResult = await StateDataValidator.validateState(
            value,
            async (name: string) => await LeadAgentHelpers.mapStateToDB(name, stateMapCache)
        );
        if (!validationResult.isValid) {
            return `❌ "${value}" is not a valid state`;
        }
    }

    if (["width", "length", "height", "gauge", "utility_length"].includes(field as string)) {
        let numValue: number;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        } else if (typeof value === "number") {
            numValue = value;
        } else {
            numValue = NaN;
        }

        if (isNaN(numValue) || numValue <= 0) {
            return `❌ Invalid ${field}: must be a positive number`;
        }

        // Gauge validation
        if (field === "gauge" && ![14, 16, 18, 20].includes(numValue)) {
            return `❌ Invalid gauge. Must be 14, 16, 18, or 20`;
        }
    }

    return null;
}

// ✅ FIX: Use 'any' type or Record to avoid TypeScript inference issues
function applyParameterUpdate(
    currentParams: Partial<UserFriendlyParams>,
    field: keyof UserFriendlyParams,
    value: any
): UpdateResult {
    logger.info(`[applyParameterUpdate] Updating ${field} = ${value}`);

    // ✅ Create NEW object - Use Record to avoid type inference issues
    const updatedParams: Record<keyof UserFriendlyParams, any> = {
        ...currentParams
    } as Record<keyof UserFriendlyParams, any>;

    if (field === "garage_type") {
        const carCountMatch = String(value).match(/(\d+)/);
        const numCars = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        if (numCars && numCars > 0) {
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${numCars} cars`
            );

            if (calculation.width && calculation.length) {
                updatedParams.width = calculation.width;
                updatedParams.length = calculation.length;
                updatedParams.height = calculation.height;
                updatedParams.garage_type = calculation.garageType;

                logger.info(`[applyParameterUpdate] Updated garage_type:`, updatedParams);

                return {
                    success: true,
                    message: `✓ Updated to ${calculation.numCars}-car garage`,
                    updatedParams: updatedParams as Partial<UserFriendlyParams>,
                };
            }
        }

        return {
            success: false,
            message: `❌ Could not process ${value}`,
        };
    }

    // Numeric fields
    if (["width", "length", "height", "gauge", "utility_length"].includes(field as string)) {
        let numValue: number;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        } else {
            numValue = value as number;
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
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)} to ${numValue}`,
            updatedParams: updatedParams as Partial<UserFriendlyParams>,
        };
    }

    // String fields
    updatedParams[field] = String(value).trim();

    logger.info(`[applyParameterUpdate] Set ${field} = ${String(value).trim()}`);

    return {
        success: true,
        message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)}`,
        updatedParams: updatedParams as Partial<UserFriendlyParams>,
    };
}

export const handleParameterUpdateNode = async (state: LeadAgentStateType) => {
    logger.info(`[UpdateNode] Pending updates: ${state.pendingUpdates.length}`);

    if (state.pendingUpdates && state.pendingUpdates.length > 0) {
        let updatedParams: Record<keyof UserFriendlyParams, any> = {
            ...state.userFriendlyParams
        } as Record<keyof UserFriendlyParams, any>;

        const updateMessages: string[] = [];

        // ✅ Get current user input
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        for (const update of state.pendingUpdates) {
            logger.info(`[UpdateNode] Processing: ${update.field} = ${update.value}`);

            // ✅ NEW: Use LLM to extract field-specific value
            // This prevents "Vertical" from being interpreted as state_name
            const extractedValue = await extractFieldValueWithLLM(
                userInput,
                update.field,
                updatedParams as Partial<UserFriendlyParams>
            );

            if (extractedValue === null) {
                logger.warn(`[UpdateNode] Could not extract ${update.field} from input`);
                continue;
            }

            // Use extracted value instead of detection value
            update.value = extractedValue;

            // Validate
            const validationError = await validateParameterValue(
                update.field,
                update.value,
                state.stateMapCache
            );

            if (validationError) {
                logger.warn(`[UpdateNode] Validation failed: ${validationError}`);
                return {
                    response: validationError,
                    userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }

            // Handle roof choice
            if (update.field === "roof_type") {
                const isExplicit = /^(vertical|regular|box|a-frame)$/i.test(String(update.value));
                if (!isExplicit) {
                    const choice = await choiceManager.handleChoice("roof_type", String(update.value));
                    update.value = choice.selected;
                }
            }

            // Apply update
            const result = applyParameterUpdate(
                updatedParams as Partial<UserFriendlyParams>,
                update.field,
                update.value
            );

            if (!result.success) {
                logger.warn(`[UpdateNode] Update failed: ${result.message}`);
                return {
                    response: result.message,
                    userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }

            updateMessages.push(result.message);
            if (result.updatedParams) {
                updatedParams = { ...result.updatedParams } as Record<keyof UserFriendlyParams, any>;
            }
        }

        logger.info(`[UpdateNode] All updates applied, checking missing fields`);

        // Check what's missing now
        const missingFields = LeadAgentHelpers.getMissingFields(updatedParams as Partial<UserFriendlyParams>);

        if (missingFields.length === 0) {
            logger.info(`[UpdateNode] ✅ All fields complete, moving to price calc`);
            return {
                response: updateMessages.join(" | "),
                userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
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
            userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
            currentField: nextField,
            nextStep: "ask_for_field",
            pendingUpdates: [],
        };
    }

    // No pending updates, check if we should calculate price
    const missingFields = LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
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
