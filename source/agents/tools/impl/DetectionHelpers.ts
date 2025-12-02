import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";

const logger: pino.Logger = createLogger(module);

interface DetectionResult {
    field: keyof UserFriendlyParams;
    value: any;
}

interface DetectionResultWithDimensions extends DetectionResult {
    calculatedDimensions?: {
        width: number;
        length: number;
        height: number;
    };
}

const RESET_PATTERNS = [
    /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
    /\b(quit|exit|done with this)\b/i,
];

export class IntentDetector {
    static detectReset(input: string): boolean {
        const isReset: boolean = RESET_PATTERNS.some((p) => p.test(input));
        if (isReset) {
            logger.info("[IntentDetector] Reset intent detected");
        }
        return isReset;
    }
}

export class FullyAIDrivenExtractor {

    /**
     * ✅ CRITICAL FIX: If in field mode asking for a dimension, DON'T use this method
     * Dimension fields should be handled by ParameterExtractor.handleDimensionField()
     */
    static async extractWithAI(
        userInput: string,
        currentField?: string,
        currentParams?: Partial<UserFriendlyParams>
    ): Promise<DetectionResultWithDimensions | null> {

        if (!userInput?.trim()) {
            logger.warn("[AIExtractor] Empty input");
            return null;
        }

        // ✅ CRITICAL: If in dimension field mode, return null
        if (currentField && ['width', 'length', 'height', 'utility_length'].includes(currentField)) {
            logger.info(`[AIExtractor] ⚠️ In dimension field mode (${currentField}) - SKIP AI extraction here`);
            return null;
        }

        logger.info(`[AIExtractor] Analyzing: "${userInput}" (context: ${currentField || 'none'})`);

        try {
            const prompt = this.buildSmartExtractionPrompt(userInput, currentField, currentParams);
            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[AIExtractor] AI response: "${response}"`);

            const result = this.parseAIResponse(response);

            if (result) {
                logger.info(`[AIExtractor] ✅ Extracted: ${result.field} = ${result.value}`);

                // ✅ NEW: If garage_type was detected, calculate dimensions
                if (result.field === 'garage_type') {
                    logger.info(`[AIExtractor] 🚗 Garage type detected: ${result.value} - calculating dimensions...`);

                    const dimensions = this.calculateDimensionsFromGarageType(result.value, userInput);

                    if (dimensions) {
                        logger.info(`[AIExtractor] ✅ Calculated dimensions: ${dimensions.width}x${dimensions.length}x${dimensions.height}`);
                        return {
                            ...result,
                            calculatedDimensions: dimensions
                        };
                    }
                }

                return result;
            }

            logger.warn(`[AIExtractor] ❌ No parameter detected`);
            return null;

        } catch (error) {
            logger.error(`[AIExtractor] AI extraction failed:`, error);
            return null;
        }
    }

    /**
     * ✅ NEW: Calculate dimensions from garage_type (e.g., "2-car" → width, length, height)
     */
    private static calculateDimensionsFromGarageType(
        garageType: string,
        userInput: string
    ): { width: number; length: number; height: number } | null {
        try {
            logger.info(`[AIExtractor] Calculating dimensions for garage_type: ${garageType}`);

            // Extract car count from garage_type (e.g., "2-car" → 2)
            const carMatch = String(garageType).match(/(\d+)/);
            const numCars = carMatch ? parseInt(carMatch[1], 10) : null;

            if (!numCars || numCars <= 0) {
                logger.warn(`[AIExtractor] Could not extract car count from: ${garageType}`);
                return null;
            }

            logger.info(`[AIExtractor] Extracted car count: ${numCars}`);

            // ✅ Use DimensionManager to calculate dimensions
            const dimensionManager = DimensionManager.getInstance();
            const calculation = dimensionManager.calculateDimensions(userInput);

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(`[AIExtractor] ✅ DimensionManager calculated: ${calculation.width}x${calculation.length}x${calculation.height}`);
                return {
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height
                };
            }

            // ✅ Fallback: Use standard garage dimension formula
            logger.info(`[AIExtractor] DimensionManager failed, using fallback formula`);
            const width = (numCars * 6) + 8;  // e.g., 2 cars = (2 * 6) + 8 = 20
            const length = 20;
            const height = 10;

            logger.info(`[AIExtractor] ✅ Fallback dimensions: ${width}x${length}x${height}`);
            return { width, length, height };

        } catch (error) {
            logger.error(`[AIExtractor] Error calculating dimensions:`, error);
            return null;
        }
    }

    private static buildSmartExtractionPrompt(
        userInput: string,
        currentField?: string,
        currentParams?: Partial<UserFriendlyParams>
    ): string {
        const contextInfo = currentField
            ? `\n⚠️ CRITICAL CONTEXT: User is being asked for: "${currentField}"
- Extract ONLY this field unless user explicitly mentions something else
- If input is a NUMBER and currentField is a CHOICE field (roof_type, gauge, building_type):
  → The number is an OPTION NUMBER for that field (e.g., "3" for roof_type = option 3 = "box")
  → DO NOT interpret as garage_type or car count`
            : '';

        const existingParams = currentParams && Object.keys(currentParams).length > 0
            ? `\n📊 Already collected:\n${JSON.stringify(currentParams, null, 2)}`
            : '';

        return `You are a garage/building specification extraction system.

${contextInfo}${existingParams}

🎯 YOUR TASK: Analyze the user input and extract the MOST RELEVANT parameter.

⚠️ CRITICAL RULES:

1. **STRICT GARAGE_TYPE RULE - ONLY extract if explicitly stated**:
   - ✅ "2 car garage" → garage_type: "2-car"
   - ✅ "I want a 3 car garage" → garage_type: "3-car"
   - ✅ "I want a garage for 2 cars" → garage_type: "2-car"
   - ✅ "can you quote me a 2-car" → garage_type: "2-car"
   - ❌ "20" → DO NOT extract as garage_type (this is a dimension)
   - ❌ "2" → DO NOT extract as garage_type (ambiguous)
   - ❌ Single numbers → NEVER assume it's a car count
   - Only extract garage_type if the input contains "car" or "cars" explicitly

2. **CONTEXT AWARENESS**:
   - If currentField is "roof_type" and user says "3" → {"field": "roof_type", "value": "box"} (option 3)
   - If currentField is "gauge" and user says "2" → {"field": "gauge", "value": "16"} (option 2)

3. **DIMENSION FIELDS - ONLY when NO currentField**:
   - If currentField is set, RETURN NULL (let ParameterExtractor handle it)
   - "20x30x10" → extract all (only if currentField is NOT set)

4. **NUMBER INTERPRETATION PRIORITY**:
   - Single number "20" → width: 20 (NOT garage_type)
   - "20x30x10" → width, length, height
   - ONLY "2 cars", "2-car", "3 car garage" → garage_type (must have "car" or "cars")

5. **NUMBER CONVERSION**:
   - Convert ALL word numbers: "two" → 2, "twenty" → 20
   - Handle slang: "a couple" → 2, "a few" → 3, "several" → 5

OUTPUT FORMAT — return ONLY valid JSON (no markdown):

{
  "field": "<parameter_name>",
  "value": <extracted_value>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}

EXAMPLES:

Input: "I want a garage for 2 cars" (NO currentField)
Output: {"field": "garage_type", "value": "2-car", "confidence": "high", "reasoning": "User explicitly wants 2-car garage"}

Input: "20" (NO currentField)
Output: {"field": "width", "value": 20, "confidence": "high", "reasoning": "Single number interpreted as width"}

Input: "2 cars" (NO currentField)
Output: {"field": "garage_type", "value": "2-car", "confidence": "high", "reasoning": "Explicit car count"}

User input: "${userInput}"

ONLY JSON:`;
    }

    private static parseAIResponse(response: string): DetectionResult | null {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[AIExtractor] No JSON in response`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!parsed.field || parsed.value === undefined || parsed.value === null) {
                logger.warn(`[AIExtractor] Invalid response structure:`, parsed);
                return null;
            }

            const validFields: Array<keyof UserFriendlyParams> = [
                'width', 'length', 'height', 'garage_type', 'building_type',
                'roof_type', 'gauge', 'state_name', 'color', 'utility_length'
            ];

            if (!validFields.includes(parsed.field)) {
                logger.warn(`[AIExtractor] Unknown field: ${parsed.field}`);
                return null;
            }

            if (parsed.confidence === 'low') {
                logger.warn(`[AIExtractor] Low confidence: ${parsed.reasoning}`);
            }

            return {
                field: parsed.field as keyof UserFriendlyParams,
                value: parsed.value
            };

        } catch (error) {
            logger.error(`[AIExtractor] Failed to parse response:`, error);
            return null;
        }
    }

    static async extractBatchDimensions(userInput: string): Promise<{
        width: number | null;
        length: number | null;
        height: number | null;
    } | null> {

        logger.info(`[AIExtractor] Batch dimension extraction from: "${userInput}"`);

        try {
            const prompt = `Extract ALL building dimensions from user input.

RULES:
1. Extract width, length, and height in feet
2. Convert word numbers: "twenty" → 20, "thirty" → 30
3. Handle ANY format:
   - "20x30x10" → width:20, length:30, height:10
   - "width 20 length 30 height 10" → same
   - "20, 30, 10" → same
4. ALL THREE dimensions must be present
5. If any dimension is missing, return found: false

RETURN ONLY JSON:
{
  "found": <true if all 3 present, false otherwise>,
  "width": <number or null>,
  "length": <number or null>,
  "height": <number or null>,
  "reasoning": "brief explanation"
}

User input: "${userInput}"

ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.found === true && parsed.width && parsed.length && parsed.height) {
                logger.info(`[AIExtractor] ✅ Batch extraction: ${parsed.width}x${parsed.length}x${parsed.height}`);
                return {
                    width: parsed.width,
                    length: parsed.length,
                    height: parsed.height
                };
            }

            logger.debug(`[AIExtractor] Batch extraction not complete:`, parsed.reasoning);
            return null;

        } catch (error) {
            logger.error(`[AIExtractor] Batch extraction error:`, error);
            return null;
        }
    }
}

export async function detectParameterUpdateFromInput(
    input: string,
    currentField?: string,
    currentParams?: Partial<UserFriendlyParams>
): Promise<DetectionResultWithDimensions | null> {
    // ✅ Don't extract dimension fields here when in field mode
    if (currentField && ['width', 'length', 'height', 'utility_length'].includes(currentField)) {
        logger.info(`[detectParameterUpdateFromInput] ⚠️ In dimension field mode - return null`);
        return null;
    }
    return FullyAIDrivenExtractor.extractWithAI(input, currentField, currentParams);
}
