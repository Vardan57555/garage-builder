import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ CONTEXT-AWARE DIMENSION DETECTOR
 * Respects current field context - doesn't detect dimensions when asking for choices
 */
export class AIDimensionDetector {
    private static instance: AIDimensionDetector;

    private constructor() {}

    public static getInstance(): AIDimensionDetector {
        if (!AIDimensionDetector.instance) {
            AIDimensionDetector.instance = new AIDimensionDetector();
        }
        return AIDimensionDetector.instance;
    }

    /**
     * ✅ Context-aware detection with FIELD AWARENESS
     * Does NOT detect dimensions when asking for specific choice fields
     */
    public async detectDimensionAwareOfContext(
        userInput: string,
        expectedField: keyof UserFriendlyParams | null
    ): Promise<{
        isDimension: boolean;
        field?: keyof UserFriendlyParams;
        value?: number;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        logger.info(`[AIDimensionDetector] Context-aware check - Expected field: ${expectedField}`);

        // ⚠️ CRITICAL: If asking for CHOICE fields, DON'T detect dimensions AT ALL
        // These fields have short abbreviations that WILL conflict with dimension keywords
        // Examples: "vert" (choice) vs "height" (dimension), "gren" (choice) vs dimension
        const choiceFields = ['roof_type', 'gauge', 'building_type', 'color', 'state_name'];

        if (expectedField && choiceFields.includes(expectedField)) {
            logger.info(`[AIDimensionDetector] ⚠️ CHOICE FIELD MODE - BLOCKING ALL DIMENSION DETECTION`);
            logger.info(`[AIDimensionDetector] Field: ${expectedField}, Input: "${userInput}"`);
            logger.info(`[AIDimensionDetector] This is choice field selection, NOT a dimension`);

            // ✅ HARD BLOCK: Return false immediately, don't even try AI
            return {
                isDimension: false,
                confidence: 'high',
                reasoning: `Currently asking for ${expectedField} (choice field). Input is for choice selection, not dimensions.`
            };
        }

        // Only detect dimensions if NOT in a choice field context
        try {
            const prompt = `CRITICAL: Detect DIMENSION keywords with PERFECT accuracy.

USER INPUT: "${userInput}"
CURRENT CONTEXT: Asking for "${expectedField}"

⚠️ ABSOLUTE KEYWORD RULES (NON-NEGOTIABLE):

WIDTH KEYWORDS ONLY:
  Root: "w", "width"
  Typos: "widt", "widht", "wid", "wdth", "widh", "wd"
  Variations: "wide", "wider", "widen"
  Keyboard spam: "wwwidt", "wwidth", "wwidt"
  
LENGTH KEYWORDS ONLY:
  Root: "l", "length"
  Typos: "lengt", "leng", "lenth", "lengh", "leth"
  Variations: "long", "longer", "lengthy"
  Keyboard spam: "lllengt", "llength", "llleng"
  
HEIGHT KEYWORDS ONLY:
  Root: "h", "height"
  Typos: "heigt", "higt", "hieght", "hieht", "hight", "heght", "heipt"
  Variations: "tall", "taller", "h" (single letter)
  Other names: "deep", "depth"
  Keyboard spam: "hhheigt", "hhhheight", "heeeight"

CRITICAL DISTINCTIONS:
  ❌ "vert" is NOT height - it's vertical for roof_type
  ❌ "gren" is NOT a dimension - it's green for color
  ❌ "reg" is NOT a dimension - it's regular for roof_type
  ❌ "14" alone is NOT height - it's a choice number for gauge
  ✅ "heigt" = HEIGHT (h-e-i-g-t has height letters), NOT width
  ✅ "heigt 12" = HEIGHT dimension with value
  ✅ "lengt" = LENGTH (missing one h)
  ✅ "widt" = WIDTH (all width letters)

MATCHING ALGORITHM:
1. Check if input contains dimension keyword
2. If keyword present AND different from choice abbreviations, check which category
3. If ambiguous, use letter matching
4. Extract first number (1-500)
5. Return result

Return ONLY JSON (no markdown):
{
  "isDimension": <true if dimension, false otherwise>,
  "field": "width" | "length" | "height" | null,
  "value": <number or null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "keyword matched and reasoning"
}

EXAMPLES (CRITICAL):

Input: "heipt 12"
  Letters: h-e-i-p-t → contains height letters
  Output: {"isDimension": true, "field": "height", "value": 12, "confidence": "high", "reasoning": "Keyword 'heipt' (height typo with p) + value 12"}

Input: "vert" (asking for roof_type)
  Context: This is roof_type choice (vertical, regular, box)
  Output: {"isDimension": false, "confidence": "high", "reasoning": "Choice field input (roof_type), not dimension"}

Input: "gren" (asking for color)
  Context: This is color choice (Evergreen, Burgundy, etc)
  Output: {"isDimension": false, "confidence": "high", "reasoning": "Choice field input (color), not dimension"}

Input: "reg" (asking for roof_type)
  Context: This is roof_type choice (vertical, regular, box)
  Output: {"isDimension": false, "confidence": "high", "reasoning": "Choice field input (roof_type), not dimension"}

Input: "14" (asking for gauge)
  Context: This is gauge choice (14 Gauge, 16 Gauge, etc)
  Output: {"isDimension": false, "confidence": "high", "reasoning": "Choice field input (gauge), not dimension"}

Input: "lengt 20"
  Letters: l-e-n-g-t → exactly like length minus one h
  Output: {"isDimension": true, "field": "length", "value": 20, "confidence": "high", "reasoning": "Keyword 'lengt' (length missing one h) + value 20"}

Input: "widt 10"
  Letters: w-i-d-t → exactly like width minus one h
  Output: {"isDimension": true, "field": "width", "value": 10, "confidence": "high", "reasoning": "Keyword 'widt' (width missing one h) + value 10"}

Input: "len 10"
  Letters: l-e-n → subset of length
  Output: {"isDimension": true, "field": "length", "value": 10, "confidence": "high", "reasoning": "Keyword 'len' (length abbreviation) + value 10"}

Input: "Texas" (asking for state)
  No dimension keywords
  Output: {"isDimension": false, "field": null, "value": null, "confidence": "high", "reasoning": "State name, no dimension keyword"}

INPUT TO ANALYZE: "${userInput}"

BE EXTREMELY CAREFUL:
- "vert" is NOT height - it's vertical (choice field)
- "gren" is NOT dimension - it's green (choice field)
- "reg" is NOT dimension - it's regular (choice field)
- Only detect TRUE dimension keywords
ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const result = this.parseResponse(response);

            if (result) {
                logger.info(`[AIDimensionDetector] Detection result:`, result);
                return result;
            }

            return {
                isDimension: false,
                confidence: 'low',
                reasoning: 'Failed to parse'
            };
        } catch (error) {
            logger.error(`[AIDimensionDetector] Error:`, error);
            return {
                isDimension: false,
                confidence: 'low',
                reasoning: 'Error during detection'
            };
        }
    }

    /**
     * ✅ Batch detection: Extract multiple dimensions from single input
     */
    public async detectMultipleDimensions(
        userInput: string
    ): Promise<Array<{
        field: 'width' | 'length' | 'height';
        value: number;
        confidence: 'high' | 'medium' | 'low';
    }> | null> {
        if (!userInput?.trim()) {
            return null;
        }

        logger.info(`[AIDimensionDetector] Batch extraction from: "${userInput}"`);

        try {
            const prompt = `Extract ALL building dimensions with PERFECT keyword matching.

⚠️ ABSOLUTE KEYWORD RULES:
WIDTH: w, width, widt, widht, wid, wdth, wide
LENGTH: l, length, lengt, leng, lenth, long
HEIGHT: h, height, heigt, heipt, hight, hieght, tall, deep

CRITICAL: 
  "heipt" and "heigt" patterns are HEIGHT (NOT width)
  "lengt" and "leng" patterns are LENGTH (NOT width)
  "widt" and "wid" patterns are WIDTH
  "vert", "gren", "reg" are NOT dimensions (they are choice fields)

Return ONLY JSON array:
[
  {"field": "width" | "length" | "height", "value": <number>, "confidence": "high" | "medium" | "low"}
]

Examples:
- "heipt 12 widt 20" → [{"field": "height", "value": 12}, {"field": "width", "value": 20}]
- "widt 20 lengt 30 heipt 15" → [{"field": "width", "value": 20}, {"field": "length", "value": 30}, {"field": "height", "value": 15}]
- "20x30x15" → [{"field": "width", "value": 20}, {"field": "length", "value": 30}, {"field": "height", "value": 15}]
- "just 20" → []
- "vert" → [] (not dimension)
- "gren" → [] (not dimension)

User input: "${userInput}"

ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const parsed = this.parseArrayResponse(response);

            if (Array.isArray(parsed) && parsed.length > 0) {
                logger.info(`[AIDimensionDetector] ✅ Batch detected ${parsed.length} dimensions:`, parsed);
                return parsed;
            }

            logger.info(`[AIDimensionDetector] No batch dimensions detected`);
            return null;
        } catch (error) {
            logger.error(`[AIDimensionDetector] Batch detection error:`, error);
            return null;
        }
    }

    private parseResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[AIDimensionDetector] No JSON found`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (typeof parsed.isDimension !== 'boolean') {
                logger.warn(`[AIDimensionDetector] Invalid isDimension:`, parsed);
                return null;
            }

            const validConfidences = ['high', 'medium', 'low'];
            if (!validConfidences.includes(parsed.confidence)) {
                parsed.confidence = 'low';
            }

            return {
                isDimension: parsed.isDimension,
                field: parsed.field || null,
                value: parsed.value || null,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning || 'No explanation'
            };
        } catch (error) {
            logger.error(`[AIDimensionDetector] Parse error:`, error);
            return null;
        }
    }

    private parseArrayResponse(response: string): any[] {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                logger.warn(`[AIDimensionDetector] No JSON array found`);
                return [];
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error(`[AIDimensionDetector] Array parse error:`, error);
            return [];
        }
    }
}

export const aiDimensionDetector = AIDimensionDetector.getInstance();
