import { UserFriendlyParams } from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

/**
 * Detection result with field and value
 */
interface DetectionResult {
    field: keyof UserFriendlyParams;
    value: any;
}

/**
 * RESET_PATTERNS: Keywords indicating conversation reset
 */
const RESET_PATTERNS = [
    /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
    /\b(quit|exit|done with this)\b/i,
];


/**
 * IntentDetector: Identifies high-level user intentions
 */
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
     * Main AI-powered extraction - handles EVERYTHING
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

    /**
     * ✅ SMART PROMPT: Context-aware extraction with garage dimension knowledge
     */
    private static buildSmartExtractionPrompt(
        userInput: string,
        currentField?: string,
        currentParams?: Partial<UserFriendlyParams>
    ): string {
        const contextInfo = currentField
            ? `\n⚠️ CRITICAL CONTEXT: User is being asked for: "${currentField}"\n- Extract ONLY this field unless user explicitly mentions something else`
            : '';

        const existingParams = currentParams && Object.keys(currentParams).length > 0
            ? `\n📊 Already collected:\n${JSON.stringify(currentParams, null, 2)}`
            : '';

        return `You are a garage construction parameter extraction AI. Extract building specifications from user input.

${contextInfo}${existingParams}

🎯 YOUR TASK: Analyze the user input and extract the MOST RELEVANT parameter.

CRITICAL RULES:
1. **GARAGE TYPE vs DIMENSIONS**:
   - "two cars", "2 car garage", "three cars" → garage_type: "2-car", "3-car" (NOT width/length!)
   - "width 20", "20 feet wide", "20ft" → width: 20 (ONLY if clearly about width)
   - "20x30x10" → Extract all three dimensions

2. **CONTEXT AWARENESS**:
   - If currentField is "width" and user says "20" → width: 20
   - If currentField is "length" and user says "30" → length: 30
   - If NO currentField and user says "two cars" → garage_type: "2-car"

3. **NUMBER CONVERSION**:
   - Convert ALL word numbers: "two" → 2, "twenty" → 20, "a couple" → 2
   - Handle slang: "a few" → 3, "several" → 5, "dozen" → 12

4. **FIELD DETECTION**:
   - garage_type: "2 cars", "three car garage", "truck garage", "RV"
   - width: "width 20", "20 feet wide", "20ft width"
   - length: "length 30", "30 feet long"
   - height: "height 10", "10 feet tall"
   - roof_type: "vertical", "regular", "box", "a-frame"
   - gauge: "14ga", "16 gauge", "20GA"
   - state_name: "Texas", "California", "in Florida"
   - color: "red", "barn red", "white"

5. **PRIORITY**:
   - If currentField is set, try to extract that field FIRST
   - If user mentions a different field explicitly, extract that instead
   - For ambiguous input, use context to decide

6. **GARAGE DIMENSIONS KNOWLEDGE**:
   - 1-car garage: typically 12ft × 20ft × 10ft
   - 2-car garage: typically 20ft × 20ft × 10ft
   - 3-car garage: typically 30ft × 20ft × 10ft
   - DO NOT auto-fill dimensions - only extract what user explicitly provides

RETURN ONLY JSON (NO MARKDOWN, NO EXPLANATION):
{
  "field": "<parameter_name>",
  "value": <extracted_value>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of what was detected"
}

EXAMPLES:

Input: "i want a garage for two cars" (no currentField)
Output: {"field": "garage_type", "value": "2-car", "confidence": "high", "reasoning": "User wants a 2-car garage"}

Input: "20" (currentField: "width")
Output: {"field": "width", "value": 20, "confidence": "high", "reasoning": "User provided width value"}

Input: "two" (currentField: "width")
Output: {"field": "width", "value": 2, "confidence": "medium", "reasoning": "User said 'two' in context of width field"}

Input: "width twenty length thirty height ten" (no currentField)
Output: {"field": "width", "value": 20, "confidence": "high", "reasoning": "Extracted first dimension from batch input"}

Input: "vertical roof" (no currentField)
Output: {"field": "roof_type", "value": "vertical", "confidence": "high", "reasoning": "User specified vertical roof type"}

Input: "Texas" (currentField: "state_name")
Output: {"field": "state_name", "value": "Texas", "confidence": "high", "reasoning": "User provided state name"}

Input: "three" (currentField: "garage_type")
Output: {"field": "garage_type", "value": "3-car", "confidence": "high", "reasoning": "User wants 3-car garage"}

⚠️ CRITICAL: Distinguish between:
- "two CARS" → garage_type: "2-car" (asking for a 2-car garage)
- "width TWO" → width: 2 (setting width to 2 feet, which is unusual)

User input: "${userInput}"

ONLY JSON:`;
    }

    /**
     * Parse AI response and validate
     */
    private static parseAIResponse(response: string): DetectionResult | null {
        try {
            // Clean response
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            // Extract JSON
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[AIExtractor] No JSON in response`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate structure
            if (!parsed.field || parsed.value === undefined || parsed.value === null) {
                logger.warn(`[AIExtractor] Invalid response structure:`, parsed);
                return null;
            }

            // Validate field is a known parameter
            const validFields: Array<keyof UserFriendlyParams> = [
                'width', 'length', 'height', 'garage_type', 'building_type',
                'roof_type', 'gauge', 'state_name', 'color', 'utility_length'
            ];

            if (!validFields.includes(parsed.field)) {
                logger.warn(`[AIExtractor] Unknown field: ${parsed.field}`);
                return null;
            }

            // Log confidence
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

    /**
     * ✅ BATCH EXTRACTION: Extract all dimensions at once using AI
     */
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

EXAMPLES:
- "20x30x10" → {"found": true, "width": 20, "length": 30, "height": 10}
- "width twenty length thirty height ten" → {"found": true, "width": 20, "length": 30, "height": 10}
- "width 20" → {"found": false, "width": null, "length": null, "height": null}

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

/**
 * Main export function
 */
export async function detectParameterUpdateFromInput(
    input: string,
    currentField?: string,
    currentParams?: Partial<UserFriendlyParams>
): Promise<DetectionResult | null> {
    return FullyAIDrivenExtractor.extractWithAI(input, currentField, currentParams);
}
