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
        logger.info(`[extractParametersWithUnifiedPrompt] Current params:`, currentParams);

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

        // ✅ ADD FIELD CONTEXT
        let fieldContext = "";
        if (currentField) {
            fieldContext = `

⚠️ IMPORTANT: The user is currently being asked for: "${currentField}"
- If they provide a number, it's likely the answer to "${currentField}", NOT necessarily a car count
- Only extract car count if they explicitly mention "cars" or "car garage"

${currentField === "gauge" ? `- Valid gauge values are ONLY: 14, 16, 18, 20` : ""}
${currentField === "width" ? `- They are providing WIDTH in feet` : ""}
${currentField === "length" ? `- They are providing LENGTH in feet` : ""}
${currentField === "height" ? `- They are providing HEIGHT in feet` : ""}`;
        }

        // ✅ ADD CURRENT PARAMETERS CONTEXT
        let paramsContext = "";
        if (currentParams && Object.keys(currentParams).length > 0) {
            paramsContext = `

🔒 ALREADY EXTRACTED - DO NOT OVERRIDE THESE:`;
            if (currentParams.garage_type) paramsContext += `\n  - garage_type: "${currentParams.garage_type}"`;
            if (currentParams.width) paramsContext += `\n  - width: ${currentParams.width}ft`;
            if (currentParams.length) paramsContext += `\n  - length: ${currentParams.length}ft`;
            if (currentParams.height) paramsContext += `\n  - height: ${currentParams.height}ft`;
            if (currentParams.state_name) paramsContext += `\n  - state_name: "${currentParams.state_name}"`;
            if (currentParams.roof_type) paramsContext += `\n  - roof_type: "${currentParams.roof_type}"`;
            if (currentParams.gauge) paramsContext += `\n  - gauge: ${currentParams.gauge}`;
            if (currentParams.building_type) paramsContext += `\n  - building_type: "${currentParams.building_type}"`;
        }

        const prompt = `You are a garage/building specification extraction system.

CRITICAL INSTRUCTIONS:
1. Fix ALL typos and spelling mistakes in the input
2. Extract building parameters
3. Return ONLY valid JSON - no explanation, no markdown
4. ⚠️ DO NOT override existing parameters - only add NEW ones
5. If unsure about a field, return null instead of guessing

EXTRACTION RULES:
1. Extract car count if user specifies (e.g., "2 cars", "5 car garage")
   - The system will calculate dimensions dynamically from car count
   - Just extract: "garage_type": "X-car" (e.g., "2-car", "5-car", etc.)

2. If explicit dimensions given (e.g., "20x30x10"), extract those exact numbers
   - In this case, ignore car count

3. Special garage types: Truck garage, RV garage

4. Roof type handling:
   - ONLY extract roof_type if user EXPLICITLY mentions it
   - Valid values: "vertical", "regular", "box", "a-frame"
   - If not mentioned, return null

5. State: Extract if mentioned (e.g., "in Texas" → "Texas")

6. Building type: Extract if mentioned (garage, shed, barn)

7. Gauge: ONLY if explicitly mentioned or user provides a valid gauge number
   - Valid ONLY: 14, 16, 18, 20
   - If number doesn't match valid gauges, it's probably not gauge, return null
${fieldContext}

TYPO CORRECTIONS:
- garge, garag, gaige → garage
- carsas, carr → cars
- widh, wid → width
- lenght, lenth → length
- hieght, hgt → height
- tx → texas, ca → california, etc.

EXAMPLES:
- Input: "5 car garage"
  → Output: {"garage_type": "5-car", "building_type": "garage"}
  (System will calculate: width=38, length=20, height=10)

- Input: "I want in Texas" (when already have dimensions)
  → Output: {"state_name": "Texas"}
  (Keep existing width, length, height!)

- Input: "14" (when asking for gauge)
  → Output: {"gauge": 14}
  (NOT 14-car garage!)

- Input: "20 feet" (when asking for width)
  → Output: {"width": 20}
  (NOT 20-car garage!)

- Input: "any" (when asking for roof)
  → Output: {"roof_type": "regular"}
  (Select middle option as balanced choice)
${paramsContext}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "garage_type": "X-car or truck or rv or null",
  "width": number or null,
  "length": number or null,
  "height": number or null,
  "state_name": "state name or null",
  "roof_type": null or "vertical"|"regular"|"box"|"a-frame",
  "manufacturer_name": null,
  "utility_length": number or null,
  "building_type": "garage"|"shed"|"barn" or null,
  "gauge": number or null,
  "is_barn": null
}

User input: "${context}"`;

        logger.info(`[extractParametersWithUnifiedPrompt] Calling LLM with enhanced prompt`);
        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        logger.info(`[extractParametersWithUnifiedPrompt] LLM response received: ${response.substring(0, 150)}...`);
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
        // ✅ FIX 1: Preserve current parameters as baseline
        const currentParams = { ...state.userFriendlyParams };
        logger.info(`[ExtractNode] Starting with current params:`, currentParams);

        // ✅ CRITICAL FIX: Use ONLY the last user message, not full history
        // This prevents re-extracting old values from previous messages
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

        // Step 1: Call unified prompt to get raw JSON
        // ✅ FIX 2: Pass current field and parameters to LLM for context
        const rawParams = await extractParametersWithUnifiedPrompt(
            context,
            state.currentField,  // ← Pass field context
            currentParams         // ← Pass current params
        );

        // Step 2: Parse the response using extractor
        const extractor = PriceParamsExtractorTool.getInstance();
        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);

        logger.info(`[ExtractNode] Extracted params from LLM:`, extractedParams);

        // ✅ FIX 3: MERGE instead of replace
        // Start with what we have, add what we just extracted
        let mergedParams = {
            ...currentParams,        // Start with current params
            ...extractedParams,      // Override with extracted
        };

        logger.info(`[ExtractNode] Merged params (before dimension preservation):`, mergedParams);

        // ✅ FIX 4: Never lose dimensions (they are sacred!)
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
        if (currentParams.garage_type && !extractedParams.garage_type) {
            mergedParams.garage_type = currentParams.garage_type;
            logger.info(`[ExtractNode] ✅ Preserved garage_type from current params: ${currentParams.garage_type}`);
        }

        logger.info(`[ExtractNode] Merged params (after preservation):`, mergedParams);

        // ============================================================
        // ✅ DIMENSION CALCULATION SECTION
        // ============================================================
        // Step 3: If we have garage_type but no dimensions, CALCULATE them
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
        // ============================================================
        // END OF DIMENSION CALCULATION SECTION
        // ============================================================

        logger.info(`[ExtractNode] Final dimensions AFTER calculation:`, {
            width: mergedParams.width,
            length: mergedParams.length,
            height: mergedParams.height,
            garage_type: mergedParams.garage_type,
        });

        // DEBUG: Check if width is actually set
        if (!mergedParams.width) {
            logger.error(`[ExtractNode] ⚠️  WARNING: Width is still null/undefined after calculation!`);
            logger.error(`[ExtractNode] mergedParams:`, JSON.stringify(mergedParams));
        }

        // Step 4: Validate state if present
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

        // Step 5: Validate roof_type if present
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

        // ✅ DEBUG: Log what we're returning
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

        // ✅ FALLBACK: Use pattern matching when LLM fails
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

        // Start with current params
        const fallbackParams = { ...state.userFriendlyParams };

        // Try to extract car count
        const carCountMatch = context.match(/(\d+)\s*cars?/i);
        if (carCountMatch) {
            const numCars = parseInt(carCountMatch[1], 10);
            fallbackParams.garage_type = `${numCars}-car`;

            // Calculate dimensions from car count
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

        // If fallback also fails, ask for input
        logger.warn(`[ExtractNode] Fallback pattern matching also failed`);
        return {
            response: "I couldn't understand your request. Could you please provide your building dimensions? (e.g., '20x20x10' for width x length x height in feet)",
            nextStep: "ask_for_field",
            currentField: "width",
            userFriendlyParams: state.userFriendlyParams,
        };
    }
};
