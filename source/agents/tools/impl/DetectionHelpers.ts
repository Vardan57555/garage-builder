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

export async function extractGarageTypeWithAI(userInput: string): Promise<{ garageType: string; carCount: number } | null> {
    try {
        logger.info(`[AIGarageExtractor] Analyzing: "${userInput}"`);

        const prompt = `Extract the garage car count from this user input.

TASK: Find how many cars the user wants (garage for X cars).
Return ONLY a JSON object with no markdown or explanation:

{
  "carCount": <number or null>,
  "found": <true if car count found, false otherwise>
}

RULES:
- Extract ANY mention of car count (numbers, words like "two", "three", etc.)
- Return null if no car count mentioned
- Look for patterns like: "2 cars", "garage for three cars", "three-car", "3-car garage"

Examples:
- "i want garage for two cars" → {"carCount": 2, "found": true}
- "garage for three cars" → {"carCount": 3, "found": true}
- "2 car garage" → {"carCount": 2, "found": true}
- "i want a garage" → {"carCount": null, "found": false}
- "just a garage" → {"carCount": null, "found": false}

User input: "${userInput}"

Return ONLY JSON:`;

        logger.info(`[AIGarageExtractor] Sending prompt to LLM...`);

        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        logger.debug(`[AIGarageExtractor] LLM response: "${response}"`);

        // Parse JSON response
        const parsed = parseAIResponse(response);

        if (!parsed) {
            logger.warn(`[AIGarageExtractor] Failed to parse LLM response`);
            return null;
        }

        logger.info(`[AIGarageExtractor] Parsed:`, {
            found: parsed.found,
            carCount: parsed.carCount
        });

        // ✅ Validate result
        if (parsed.found && typeof parsed.carCount === 'number' && parsed.carCount > 0 && parsed.carCount <= 20) {
            const garageType = `${parsed.carCount}-car`;
            logger.info(`[AIGarageExtractor] ✅ SUCCESS: garageType = "${garageType}", carCount = ${parsed.carCount}`);

            return {
                garageType,
                carCount: parsed.carCount
            };
        }

        logger.info(`[AIGarageExtractor] ❌ No valid car count found`);
        return null;

    } catch (error) {
        logger.error(`[AIGarageExtractor] Exception:`, error);
        return null;
    }
}

/**
 * ✅ Parse JSON from AI response
 */
function parseAIResponse(response: string): any {
    try {
        // Remove markdown formatting
        let cleaned = response
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        logger.debug(`[AIGarageExtractor] Cleaned response: "${cleaned}"`);

        // Extract JSON object
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.warn(`[AIGarageExtractor] No JSON found in response`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        logger.info(`[AIGarageExtractor] Parsed JSON:`, parsed);

        return parsed;
    } catch (error) {
        logger.error(`[AIGarageExtractor] JSON parse error:`, error);
        return null;
    }
}

export async function detectMultipleParametersWithAI(
    userInput: string
): Promise<Array<{ field: keyof UserFriendlyParams; value: any }> | null> {
    try {
        logger.info(`[AIMultiParamExtractor] Analyzing: "${userInput}"`);

        const prompt = `Extract ALL parameter updates from this user input.

TASK: Find ALL dimension and parameter updates (width, length, height, garage type, etc).
Return ONLY a JSON array with no markdown or explanation:

[
  {
    "field": <"width"|"length"|"height"|"garage_type">,
    "value": <number for dimensions, string for garage_type>,
    "found": <true if extracted, false otherwise>
  }
]

RULES:
- Extract ALL mentions of dimensions or parameters
- Look for patterns like: "width X", "length Y", "height Z", "X cars", "X-car"
- Return array even if only 1 parameter found
- If NO parameters found, return empty array []
- Dimensions must be numbers between 1-500
- Garage type must match car count pattern

Examples:
- "make width 30 length 30" → [{"field":"width","value":30,"found":true},{"field":"length","value":30,"found":true}]
- "width 20 height 15" → [{"field":"width","value":20,"found":true},{"field":"height","value":15,"found":true}]
- "for 4 cars" → [{"field":"garage_type","value":"4-car","found":true}]
- "garage for two cars width 30" → [{"field":"garage_type","value":"2-car","found":true},{"field":"width","value":30,"found":true}]
- "just hello" → []

User input: "${userInput}"

Return ONLY JSON array:`;

        logger.info(`[AIMultiParamExtractor] Sending prompt to LLM...`);

        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        logger.debug(`[AIMultiParamExtractor] LLM response: "${response}"`);

        // Parse JSON response
        const parsed = parseMultiParamResponse(response);

        if (!parsed || !Array.isArray(parsed)) {
            logger.warn(`[AIMultiParamExtractor] Failed to parse response or not an array`);
            return null;
        }

        logger.info(`[AIMultiParamExtractor] Parsed ${parsed.length} parameters:`, parsed);

        // ✅ Filter and type-cast valid parameters
        const validParams: Array<{ field: keyof UserFriendlyParams; value: any }> = [];

        for (const param of parsed) {
            if (!param.found) continue;

            // Validate based on field type
            if (param.field === 'garage_type') {
                if (typeof param.value === 'string' && /^\d+-car$/.test(param.value)) {
                    validParams.push({
                        field: 'garage_type' as keyof UserFriendlyParams,
                        value: param.value
                    });
                    logger.info(`[AIMultiParamExtractor] ✅ Valid garage_type: ${param.value}`);
                }
            } else if (['width', 'length', 'height'].includes(param.field)) {
                const numValue = Number(param.value);
                if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
                    validParams.push({
                        field: param.field as keyof UserFriendlyParams,
                        value: numValue
                    });
                    logger.info(`[AIMultiParamExtractor] ✅ Valid ${param.field}: ${numValue}`);
                }
            }
        }

        if (validParams.length > 0) {
            logger.info(`[AIMultiParamExtractor] ✅ SUCCESS: ${validParams.length} parameters found`);
            return validParams;
        }

        logger.info(`[AIMultiParamExtractor] ❌ No valid parameters found`);
        return null;

    } catch (error) {
        logger.error(`[AIMultiParamExtractor] Exception:`, error);
        return null;
    }
}

/**
 * ✅ Parse JSON array from AI response
 */
function parseMultiParamResponse(response: string): any {
    try {
        // Remove markdown formatting
        let cleaned = response
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        logger.debug(`[AIMultiParamExtractor] Cleaned response: "${cleaned}"`);

        // Extract JSON array
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            logger.warn(`[AIMultiParamExtractor] No JSON array found in response`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        logger.info(`[AIMultiParamExtractor] Parsed JSON:`, parsed);

        return parsed;
    } catch (error) {
        logger.error(`[AIMultiParamExtractor] JSON parse error:`, error);
        return null;
    }
}

/**
 * ✅ Calculate dimensions from car count
 */
export function calculateDimensionsFromCarCount(carCount: number): { width: number; length: number; height: number } | null {
    if (!carCount || carCount <= 0 || carCount > 20) {
        logger.error(`[calculateDimensionsFromCarCount] Invalid car count: ${carCount}`);
        return null;
    }

    const width = (carCount * 6) + 8;   // 6ft per car + 8ft buffer
    const length = 20;
    const height = 10;

    logger.info(`[calculateDimensionsFromCarCount] ✅ Calculated for ${carCount} cars: ${width}×${length}×${height}`);

    return { width, length, height };
}

/**
 * ✅ FIXED: Detect ALL dimension updates from input (e.g., "make height 20 width 10")
 * Returns the FIRST update and stores the REST in global.__pendingMultiDimensions
 */
export async function detectParameterUpdateFromInput(
    input: string,
    currentField?: string
): Promise<{ field: keyof UserFriendlyParams; value: any } | null> {
    logger.info(`[AIExtractor] Analyzing: "${input}" (context: ${currentField})`);

    try {
        // ✅ PRIORITY 1: Check for MULTIPLE dimension updates FIRST
        const multiDimensionResult = await detectMultipleDimensionUpdates(input);

        if (multiDimensionResult && multiDimensionResult.length > 0) {
            logger.info(`[AIExtractor] ✅ Multiple dimensions detected (${multiDimensionResult.length}):`, multiDimensionResult);

            // Return the first one
            const first = multiDimensionResult[0];
            logger.info(`[AIExtractor] Returning first: ${first.field} = ${first.value}`);

            // Store the rest in global for later processing
            if (multiDimensionResult.length > 1) {
                (global as any).__pendingMultiDimensions = multiDimensionResult.slice(1);
                logger.info(`[AIExtractor] Stored ${multiDimensionResult.length - 1} pending updates:`,
                    (global as any).__pendingMultiDimensions);
            }

            return first;
        }

        // ✅ PRIORITY 2: Check for garage/car count update (using AI)
        logger.info(`[AIExtractor] Checking for garage type with AI...`);
        const garageResult = await extractGarageTypeWithAI(input);

        if (garageResult) {
            logger.info(`[AIExtractor] ✅ AI detected garage_type: ${garageResult.garageType}`);
            return {
                field: 'garage_type' as keyof UserFriendlyParams,
                value: garageResult.garageType
            };
        }

        logger.info(`[AIExtractor] Checking for dimension updates (with typo tolerance)...`);

// Try the new typo-tolerant extractor
        const typoResult = await extractDimensionWithTypoTolerance(input);
        if (typoResult) {
            logger.info(`[AIExtractor] ✅ Typo-tolerant detection: ${typoResult.field} = ${typoResult.value}`);
            return typoResult;
        }

// Fallback to original patterns
        const dimensionPatterns: Array<{ regex: RegExp; field: keyof UserFriendlyParams }> = [
            { regex: /width\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'width' as keyof UserFriendlyParams },
            { regex: /length\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'length' as keyof UserFriendlyParams },
            { regex: /height\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
            { regex: /tall\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
            { regex: /deep\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
        ];

        for (const pattern of dimensionPatterns) {
            const match = input.match(pattern.regex);
            if (match) {
                const value = parseFloat(match[1]);
                if (value > 0 && value <= 500) {
                    logger.info(`[AIExtractor] ✅ Detected single dimension: ${pattern.field} = ${value}`);
                    return {
                        field: pattern.field,
                        value
                    };
                }
            }
        }

        logger.warn(`[AIExtractor] ❌ No parameter detected`);
        return null;

    } catch (error) {
        logger.error(`[AIExtractor] Exception:`, error);
        return null;
    }
}

export async function extractDimensionWithTypoTolerance(
    userInput: string
): Promise<{ field: keyof UserFriendlyParams; value: number } | null> {
    if (!userInput?.trim()) {
        return null;
    }

    try {
        logger.info(`[extractDimensionWithTypoTolerance] Analyzing: "${userInput}"`);

        // ✅ Try pattern matching FIRST (fast path)
        const patterns = [
            { regex: /\b(?:widt?h?|w)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'width' as keyof UserFriendlyParams },
            { regex: /\b(?:lengt?h?|l)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'length' as keyof UserFriendlyParams },
            { regex: /\b(?:heigt?h?|h|tall|deep)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
        ];

        for (const pattern of patterns) {
            const match = userInput.match(pattern.regex);
            if (match) {
                const value = parseFloat(match[1]);
                if (value > 0 && value <= 500) {
                    logger.info(`[extractDimensionWithTypoTolerance] ✅ Pattern match: ${pattern.field} = ${value}`);
                    return { field: pattern.field, value };
                }
            }
        }

        // ✅ AI fallback for EXTREME typos
        const prompt = `Extract a building dimension from user input with EXTREME typo tolerance.

CRITICAL: User may have severe typos:
- "widt", "wiDT", "widht", "wwwidt" = width
- "lengt", "leng", "legnth" = length
- "heigt", "hieght", "higt" = height

If you find a dimension keyword (even with typos) and a number, extract them.

Return ONLY JSON:
{
  "field": "width" | "length" | "height" | null,
  "value": <number or null>,
  "found": <true if found, false otherwise>
}

Examples:
- "widt 10" → {"field": "width", "value": 10, "found": true}
- "i want lengt 20" → {"field": "length", "value": 20, "found": true}
- "heigt 12 for garage" → {"field": "height", "value": 12, "found": true}
- "hello" → {"field": null, "value": null, "found": false}

User input: "${userInput}"

ONLY JSON:`;

        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

        const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            logger.info(`[extractDimensionWithTypoTolerance] No JSON in AI response`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.found && parsed.field && typeof parsed.value === 'number' && parsed.value > 0 && parsed.value <= 500) {
            logger.info(`[extractDimensionWithTypoTolerance] ✅ AI extracted: ${parsed.field} = ${parsed.value}`);
            return {
                field: parsed.field as keyof UserFriendlyParams,
                value: parsed.value
            };
        }

        logger.info(`[extractDimensionWithTypoTolerance] No dimension found`);
        return null;

    } catch (error) {
        logger.error(`[extractDimensionWithTypoTolerance] Error:`, error);
        return null;
    }
}

/**
 * ✅ NEW: Extract ALL dimension updates from input
 * Handles: "make width 10 length 10", "height 20 width 10", etc.
 */
async function detectMultipleDimensionUpdates(
    input: string
): Promise<Array<{ field: keyof UserFriendlyParams; value: any }> | null> {
    try {
        logger.info(`[detectMultipleDimensionUpdates] Analyzing: "${input}"`);

        // ✅ Pattern to match multiple dimension keywords
        const hasDimensionKeywords = /(?:width|length|height|w\s+|l\s+|h\s+).*(?:width|length|height|w\s+|l\s+|h\s+)/i.test(input);

        if (!hasDimensionKeywords) {
            logger.debug(`[detectMultipleDimensionUpdates] No multiple dimension keywords detected`);
            return null;
        }

        const results: Array<{ field: keyof UserFriendlyParams; value: number }> = [];

        // ✅ Extract ALL dimensions from input
        const patterns = [
            { regex: /width\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'width' as keyof UserFriendlyParams },
            { regex: /length\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'length' as keyof UserFriendlyParams },
            { regex: /height\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'height' as keyof UserFriendlyParams },
            { regex: /\bw\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'width' as keyof UserFriendlyParams },
            { regex: /\bl\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'length' as keyof UserFriendlyParams },
            { regex: /\bh\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'height' as keyof UserFriendlyParams },
        ];

        const foundFields = new Set<string>();

        for (const pattern of patterns) {
            // Reset regex lastIndex
            pattern.regex.lastIndex = 0;

            const match = pattern.regex.exec(input);

            if (match && !foundFields.has(pattern.field)) {
                const value = parseFloat(match[1]);

                if (value > 0 && value <= 500) {
                    results.push({ field: pattern.field, value });
                    foundFields.add(pattern.field);
                    logger.info(`[detectMultipleDimensionUpdates] ✅ Extracted ${pattern.field} = ${value}`);
                }
            }
        }

        if (results.length >= 2) {
            logger.info(`[detectMultipleDimensionUpdates] ✅ Found ${results.length} dimensions:`, results);
            return results;
        }

        logger.debug(`[detectMultipleDimensionUpdates] Only found ${results.length} dimension(s), need 2+`);
        return null;

    } catch (error) {
        logger.error(`[detectMultipleDimensionUpdates] Exception:`, error);
        return null;
    }
}
