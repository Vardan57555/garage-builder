import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

interface DetectionResult {
    field: keyof UserFriendlyParams;
    value: any;
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
    ): Promise<DetectionResult | null> {

        if (!userInput?.trim()) {
            logger.warn("[AIExtractor] Empty input");
            return null;
        }

        // ✅ CRITICAL: If in dimension field mode, return null
        // This forces the extraction to happen in ParameterExtractor instead
        if (currentField && ['width', 'length', 'height', 'utility_length'].includes(currentField)) {
            logger.info(`[AIExtractor] ⚠️ In dimension field mode (${currentField}) - SKIP AI extraction here`);
            logger.info(`[AIExtractor] Let ParameterExtractor.handleDimensionField() handle this`);
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
                return result;
            }

            logger.warn(`[AIExtractor] ❌ No parameter detected`);
            return null;

        } catch (error) {
            logger.error(`[AIExtractor] AI extraction failed:`, error);
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
   - ✅ "can you quote me a 2-car" → garage_type: "2-car"
   - ❌ "20" → DO NOT extract as garage_type (this is likely a dimension)
   - ❌ "2" → DO NOT extract as garage_type (ambiguous - could be option number)
   - ❌ Single numbers → NEVER assume it's a car count
   - Only extract garage_type if the input contains the words "car" or "cars" explicitly

2. **CONTEXT AWARENESS**:
   - If currentField is "roof_type" and user says "3" → {"field": "roof_type", "value": "box"} (option 3)
   - If currentField is "gauge" and user says "2" → {"field": "gauge", "value": "16"} (option 2)
   - If currentField is "building_type" and user says "1" → {"field": "building_type", "value": "garage"} (option 1)

3. **DIMENSION FIELDS - ONLY when NO currentField**:
   - "width 20" → width: 20 (only if currentField is NOT set)
   - "20x30x10" → extract all (only if currentField is NOT set)
   - If currentField is set to "width", "length", or "height", RETURN NULL (let ParameterExtractor handle it)

4. **NUMBER INTERPRETATION PRIORITY**:
   - Single number "20" → width: 20 (NOT garage_type)
   - "20x30x10" → width, length, height (NOT garage_type)
   - "20 feet" → width: 20 (NOT garage_type)
   - ONLY "2 cars" or "3 car garage" → garage_type (must have "car" or "cars" word)

5. **NUMBER CONVERSION**:
   - Convert ALL word numbers: "two" → 2, "twenty" → 20, "a couple" → 2
   - Handle slang: "a few" → 3, "several" → 5, "dozen" → 12

6. **FIELD DETECTION (only when NO currentField)**:
   - garage_type: "2 cars", "three car garage", "truck garage", "RV" (MUST contain "car/cars")
   - width: "width 20", "20 feet wide", "20ft width", "20" (single number)
   - length: "length 30", "30 feet long"
   - height: "height 10", "10 feet tall"
   - roof_type: "vertical", "regular", "box", "a-frame"
   - gauge: "14ga", "16 gauge", "20GA"
   - state_name: "Texas", "California", "in Florida"
   - color: "red", "barn red", "white"

OUTPUT FORMAT — return ONLY valid JSON (no markdown, no commentary):

{
  "field": "<parameter_name>",
  "value": <extracted_value>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of what was detected"
}

EXAMPLES - CRITICAL:

Input: "20" (NO currentField)
Output: {"field": "width", "value": 20, "confidence": "high", "reasoning": "Single number likely width dimension, NOT garage type"}

Input: "2" (NO currentField)
Output: {"field": "width", "value": 2, "confidence": "medium", "reasoning": "Ambiguous number - could be width or dimension, treating as width"}

Input: "2 cars" (NO currentField)
Output: {"field": "garage_type", "value": "2-car", "confidence": "high", "reasoning": "Explicit car count - 2-car garage"}

Input: "3 car garage" (NO currentField)
Output: {"field": "garage_type", "value": "3-car", "confidence": "high", "reasoning": "User explicitly said 3 car garage"}

Input: "20x30x10" (NO currentField)
Output: {"field": "width", "value": 20, "confidence": "high", "reasoning": "Full dimensions provided - extracting width (first value)"}

Input: "i want a building in Texas" (NO currentField)
Output: {"field": "state_name", "value": "Texas", "confidence": "high", "reasoning": "User specified Texas"}

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

            // ✅ Validate structure
            if (!parsed.field || parsed.value === undefined || parsed.value === null) {
                logger.warn(`[AIExtractor] Invalid response structure:`, parsed);
                return null;
            }

            // ✅ Validate field is a known parameter
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
            const prompt = `Extract ALL building dimensions from user input. Handle any format.

RULES:
1. Extract width, length, and height in feet
2. Convert word numbers: "twenty" → 20, "thirty" → 30, "ten" → 10
3. Handle ANY format:
   - "20x30x10" → width:20, length:30, height:10
   - "width 20 length 30 height 10" → same
   - "width twenty length thirty height ten" → same
   - "20, 30, 10" → same
4. ALL THREE dimensions must be present
5. If any dimension is missing, return found: false

RETURN ONLY JSON:
{
  "found": <true if all 3 dimensions present, false otherwise>,
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
): Promise<DetectionResult | null> {
    // ✅ CRITICAL: Don't extract dimension fields here when in field mode
    if (currentField && ['width', 'length', 'height', 'utility_length'].includes(currentField)) {
        logger.info(`[detectParameterUpdateFromInput] ⚠️ In dimension field mode - return null`);
        return null;
    }
    return FullyAIDrivenExtractor.extractWithAI(input, currentField, currentParams);
}
