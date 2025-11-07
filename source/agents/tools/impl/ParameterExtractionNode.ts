import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import { StateDataValidator } from "@agents/validators/StateValidator";
import { RoofDataValidator } from "@agents/validators/RoofValidator";
import { DynamicGarageDimensionCalculator } from "@utils/dimensionCalculator/DimensionCalculator";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";

const logger: pino.Logger = createLogger(module);

/**
 * UNIFIED PROMPT - Now with field context and current parameters
 */
async function extractParametersWithUnifiedPrompt(
    context: string,
    currentField?: string,
    currentParams?: any
): Promise<any> {
    try {
        logger.info(`[extractParametersWithUnifiedPrompt] Processing context (${context.length} chars)`);
        logger.info(`[extractParametersWithUnifiedPrompt] Current field: ${currentField}`);

        const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(context);

        let dimensionExplanation: string = `
DIMENSION CALCULATION (Dynamic Formula):
- Width formula: (number_of_cars × 6) + 8 feet clearance
- Length formula: 15 (car length) + 5 feet clearance = 20 feet
- Height: 10 feet (standard) or 12 feet (truck/RV)`;

        if (calculation.numCars) {
            dimensionExplanation += `

Example for ${calculation.numCars} car(s):
- Width: (${calculation.numCars} × 6) + 8 = ${calculation.width} ft
- Length: 15 + 5 = ${calculation.length} ft
- Height: ${calculation.height} ft`;
        }

        let fieldContext = "";
        if (currentField) {
            fieldContext = `

⚠️ CRITICAL: User is ONLY being asked for: "${currentField}"

SPECIAL HANDLING FOR INDECISIVE RESPONSES:
If user says ANY of these: "any", "whatever", "i don't know", "idk", "doesn't matter", "anything", "surprise me", "you pick", "no preference", "doesn't care", "pick one", "whatever works"
→ Select a BALANCED/DEFAULT option for that field:
  - For roof_type: Select "regular" (most balanced option - middle choice)
  - For gauge: Select "16" (most common gauge in industry)
  - For building_type: Select "garage" (most common type)

RULES:
- Extract ONLY ${currentField} from their response
- DO NOT extract other fields
- If answer is indecisive/vague, return the default instead of asking again
${currentField === "gauge" ? `- Valid gauge values ONLY: 14, 16, 18, 20. If user says "any/idk/whatever", return: 16` : ""}
${currentField === "roof_type" ? `- Valid roof types ONLY: vertical, regular, box, a-frame. If user says "any/idk/whatever", return: regular` : ""}
${currentField === "building_type" ? `- Valid types: garage, shed, barn. If user says "any/idk/whatever", return: garage` : ""}`;
        }

        let paramsContext = "";
        if (currentParams && Object.keys(currentParams).length > 0) {
            paramsContext = `

🔒 LOCKED FIELDS (DO NOT INCLUDE IN OUTPUT):`;

            const lockedFields: string[] = [];
            if (currentParams.garage_type) lockedFields.push(`garage_type`);
            if (currentParams.width) lockedFields.push(`width`);
            if (currentParams.length) lockedFields.push(`length`);
            if (currentParams.height) lockedFields.push(`height`);
            if (currentParams.state_name) lockedFields.push(`state_name`);
            if (currentParams.roof_type) lockedFields.push(`roof_type`);
            if (currentParams.gauge) lockedFields.push(`gauge`);
            if (currentParams.building_type) lockedFields.push(`building_type`);

            if (lockedFields.length > 0) {
                paramsContext += `\n- ${lockedFields.join(", ")}`;
                paramsContext += `\n\nONLY extract the current field, OMIT locked fields entirely`;
            }
        }

        const prompt = `You are a building parameter extraction system.

CRITICAL: Return ONLY valid JSON. NO explanations, NO code.

RULES:
1. Extract value user provides for current field
2. If user expresses indecision (any, whatever, idk, etc), return BALANCED DEFAULT
3. Return ONLY JSON with extracted values
4. Omit fields you're not extracting (not even "null")
5. Fix typos in input
${fieldContext}
${paramsContext}

EXTRACTION RULES:
1. Car count: "2 cars" → {"garage_type": "2-car"}
2. Roof types: ONLY "vertical", "regular", "box", "a-frame"
   - If user says "any"/"whatever"/etc → {"roof_type": "regular"} (balanced default)
3. Gauge: ONLY 14, 16, 18, 20
   - If user says "any"/"whatever"/etc → {"gauge": 16} (most common)
4. States: "Texas", "California", etc.
5. Building type: "garage", "shed", "barn"

EXAMPLES OF INDECISION HANDLING:
- User says "any" for roof → {"roof_type": "regular"}
- User says "whatever" for gauge → {"gauge": 16}
- User says "idk" for gauge → {"gauge": 16}
- User says "doesn't matter" for gauge → {"gauge": 16}
- User says "idk" for building type → {"building_type": "garage"}
- User says "surprise me" for roof → {"roof_type": "regular"}
- User says "don't care" for gauge → {"gauge": 16}
- User says "pick one" for roof → {"roof_type": "regular"}

NORMAL EXAMPLES:
- Input: "5 car garage" → Output: {"garage_type": "5-car", "width": 38, "length": 20, "height": 10}
- Input: "vertical roof" → Output: {"roof_type": "vertical"}
- Input: "Texas" with current field "state_name" → Output: {"state_name": "Texas"}
- Input: "14GA" with current field "gauge" → Output: {"gauge": 14}

OUTPUT: ONLY valid JSON, nothing else

User input: "${context}"`;

        logger.info(`[extractParametersWithUnifiedPrompt] Calling LLM with enhanced prompt`);
        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        logger.info(`[extractParametersWithUnifiedPrompt] LLM response received (first 100 chars): ${response.substring(0, 100)}...`);

        if (
            response.includes("def ") ||
            response.includes("import ") ||
            response.includes("function ") ||
            response.includes("const ") ||
            response.includes("pattern ") ||
            response.includes("regex")
        ) {
            logger.warn(
                `[extractParametersWithUnifiedPrompt] LLM returned code instead of JSON`
            );
            return "{}";
        }

        return response;
    } catch (error) {
        logger.error(`[extractParametersWithUnifiedPrompt] Error:`, error);
        throw error;
    }
}

export const extractParametersNode = async (state: LeadAgentStateType) => {
    logger.info(`[ExtractNode] Session ${state.sessionId} - Extracting parameters`);
    logger.info(`[ExtractNode] Current state params:`, state.userFriendlyParams);
    logger.info(`[ExtractNode] Current field:`, state.currentField);

    try {
        const currentParams = { ...state.userFriendlyParams };
        logger.info(`[ExtractNode] Starting with current params:`, currentParams);

        const lastMessage = state.messages[state.messages.length - 1];
        let context = "";

        if (lastMessage) {
            if (typeof lastMessage.content === "string") {
                context = lastMessage.content;
            } else if (Array.isArray(lastMessage.content)) {
                context = lastMessage.content
                    .map((c) => (typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)))
                    .join(" ");
            }
        }

        logger.info(`[ExtractNode] Current user input: "${context}"`);

        const rawParams = await extractParametersWithUnifiedPrompt(
            context,
            state.currentField,
            currentParams
        );

        const extractor = PriceParamsExtractorTool.getInstance();
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);

        logger.info(`[ExtractNode] Extracted params from LLM:`, extractedParams);

        let mergedParams = {
            ...currentParams,
            ...extractedParams,
        };

        logger.info(`[ExtractNode] Merged params (before dimension preservation):`, mergedParams);

        const garageTypeChanged = extractedParams.garage_type &&
            extractedParams.garage_type !== currentParams.garage_type;

        if (garageTypeChanged) {
            logger.info(`[ExtractNode] 🔄 GARAGE_TYPE CHANGED from "${currentParams.garage_type}" to "${extractedParams.garage_type}"`);
            logger.info(`[ExtractNode] OLD dimensions: ${currentParams.width}×${currentParams.length}×${currentParams.height}`);

            delete mergedParams.width;
            delete mergedParams.length;
            delete mergedParams.height;
            logger.info(`[ExtractNode] ✅ Deleted old dimensions`);

            const calc = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                extractedParams.garage_type
            );

            logger.info(`[ExtractNode] Calculator result for "${extractedParams.garage_type}":`, {
                numCars: calc.numCars,
                width: calc.width,
                length: calc.length,
                height: calc.height,
            });

            if (calc.width && calc.length && calc.height) {
                logger.info(`[ExtractNode] ✅ Setting FRESH dimensions from calculator`);
                mergedParams.width = calc.width;
                mergedParams.length = calc.length;
                mergedParams.height = calc.height;
            } else {
                logger.warn(`[ExtractNode] ❌ Calculator did not return complete dimensions`);
            }
        } else {
            if (currentParams.width && !extractedParams.width) {
                mergedParams.width = currentParams.width;
                logger.info(`[ExtractNode] ✅ Preserved width from current params: ${currentParams.width}`);
            }
            if (currentParams.length && !extractedParams.length) {
                mergedParams.length = currentParams.length;
                logger.info(`[ExtractNode] ✅ Preserved length from current params: ${currentParams.length}`);
            }
            if (currentParams.height && !extractedParams.height) {
                mergedParams.height = currentParams.height;
                logger.info(`[ExtractNode] ✅ Preserved height from current params: ${currentParams.height}`);
            }
        }

        if (mergedParams.garage_type && !mergedParams.width) {
            logger.info(`[ExtractNode] Calculating dimensions for garage_type: ${mergedParams.garage_type}`);

            const calc = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                mergedParams.garage_type
            );

            logger.info(`[ExtractNode] Calculator result:`, {
                numCars: calc.numCars,
                width: calc.width,
                length: calc.length,
                height: calc.height,
            });

            if (calc.width && calc.length && calc.height) {
                logger.info(`[ExtractNode] ✅ Setting dimensions from calculator`);
                mergedParams.width = calc.width;
                mergedParams.length = calc.length;
                mergedParams.height = calc.height;
            } else {
                logger.warn(`[ExtractNode] ❌ Calculator did not return complete dimensions`);
            }
        }

        if (currentParams.garage_type && !extractedParams.garage_type) {
            mergedParams.garage_type = currentParams.garage_type;
            logger.info(`[ExtractNode] ✅ Preserved garage_type from current params: ${currentParams.garage_type}`);
        }

        logger.info(`[ExtractNode] Final dimensions AFTER calculation:`, {
            width: mergedParams.width,
            length: mergedParams.length,
            height: mergedParams.height,
            garage_type: mergedParams.garage_type,
        });

        if (!mergedParams.width) {
            logger.error(`[ExtractNode] ⚠️  WARNING: Width is still null/undefined after calculation!`);
            logger.error(`[ExtractNode] mergedParams:`, JSON.stringify(mergedParams));
        }

        if (mergedParams.state_name) {
            logger.info(`[ExtractNode] Validating state: ${mergedParams.state_name}`);

            const validationResult = await StateDataValidator.validateState(
                mergedParams.state_name,
                async (name) => await LeadAgentHelpers.mapStateToDB(name, state.stateMapCache)
            );

            if (!validationResult.isValid) {
                logger.warn(`[ExtractNode] Invalid state: ${mergedParams.state_name}`);
                return {
                    validationError: `"${mergedParams.state_name}" is not valid`,
                    response: `❌ "${mergedParams.state_name}" is not a valid state.\n\nPlease specify your state.`,
                    nextStep: "ask_for_field",
                    currentField: "state_name",
                    userFriendlyParams: mergedParams,
                };
            }
            mergedParams.state_name = validationResult.normalizedName;
            logger.info(`[ExtractNode] State validated: ${mergedParams.state_name}`);
        }

        if (mergedParams.roof_type) {
            logger.info(`[ExtractNode] Validating roof type: ${mergedParams.roof_type}`);

            const validationResult = await RoofDataValidator.validateRoofType(mergedParams.roof_type);
            if (!validationResult.isValid) {
                logger.warn(`[ExtractNode] Invalid roof type: ${mergedParams.roof_type}`);
                return {
                    validationError: `"${mergedParams.roof_type}" is not valid`,
                    response: `❌ "${mergedParams.roof_type}" is not a valid roof type.\n\nPlease specify your roof type.`,
                    nextStep: "ask_for_field",
                    currentField: "roof_type",
                    userFriendlyParams: mergedParams,
                };
            }
            mergedParams.roof_type = validationResult.normalizedType;
            logger.info(`[ExtractNode] Roof type validated: ${mergedParams.roof_type}`);
        }

        logger.info(`[ExtractNode] All validations passed ✅`);
        logger.info(`[ExtractNode] Final extracted params:`, mergedParams);

        logger.info(`[ExtractNode] RETURNING to state:`, {
            width: mergedParams.width,
            length: mergedParams.length,
            height: mergedParams.height,
            garage_type: mergedParams.garage_type,
            state_name: mergedParams.state_name,
            roof_type: mergedParams.roof_type,
            gauge: mergedParams.gauge,
        });

        return {
            userFriendlyParams: mergedParams,
            nextStep: "check_missing_fields",
        };
    } catch (error) {
        logger.error(`[ExtractNode] LLM extraction failed, falling back to pattern matching:`, error);

        const context = state.messages
            .map((msg) => {
                if (typeof msg.content === "string") return msg.content;
                if (Array.isArray(msg.content)) {
                    return msg.content
                        .map((c) => (typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)))
                        .join(" ");
                }
                return "";
            })
            .join("\n");

        const fallbackParams = { ...state.userFriendlyParams };

        const carCountMatch = context.match(/(\d+)\s*cars?/i);
        if (carCountMatch) {
            const numCars = parseInt(carCountMatch[1], 10);
            fallbackParams.garage_type = `${numCars}-car`;

            const calc = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${numCars}-car`
            );

            if (calc.width && calc.length && calc.height) {
                fallbackParams.width = calc.width;
                fallbackParams.length = calc.length;
                fallbackParams.height = calc.height;
                fallbackParams.building_type = "garage";

                logger.info(`[ExtractNode] ✅ Fallback extracted: ${numCars}-car garage (${calc.width}×${calc.length}×${calc.height})`);

                return {
                    userFriendlyParams: fallbackParams,
                    nextStep: "check_missing_fields",
                };
            }
        }

        logger.warn(`[ExtractNode] Fallback pattern matching also failed`);
        return {
            response: "I couldn't understand your request. Could you please provide your building dimensions? (e.g., '20x20x10' for width x length x height in feet)",
            nextStep: "ask_for_field",
            currentField: "width",
            userFriendlyParams: state.userFriendlyParams,
        };
    }
};
