import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ CONTEXT-AWARE DIMENSION DETECTOR
 * Uses AI to distinguish between choice field inputs and actual dimensions
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
     * ✅ Context-aware detection using AI reasoning
     * Understands what field is expected and avoids false positives
     */
    public async detectDimensionAwareOfContext(userInput: string, expectedField: keyof UserFriendlyParams | null): Promise<{ isDimension: boolean; field?: keyof UserFriendlyParams; value?: number; confidence: 'high' | 'medium' | 'low'; reasoning: string; }>
    {
        logger.info(`[AIDimensionDetector] Context-aware check - Expected field: ${expectedField}`);
        logger.info(`[AIDimensionDetector] User input: "${userInput}"`);

        try {
            const prompt = this.buildContextAwarePrompt(userInput, expectedField);
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
     * ✅ Build a context-aware prompt that understands field expectations
     */
    private buildContextAwarePrompt(userInput: string, expectedField: keyof UserFriendlyParams | null): string {
        const fieldContext = this.getFieldContext(expectedField);

        return `You are a DIMENSION DETECTION AI with CONTEXT AWARENESS.

Your job: Determine if the user input is expressing a BUILDING DIMENSION or something else.

⚠️ CRITICAL: CONTEXT MATTERS!
If we're asking for a CHOICE FIELD, the input is probably answering that choice, NOT a dimension.

CURRENT CONTEXT:
- Expected Field: ${expectedField || 'unknown (initial flow)'}
- Field Type: ${fieldContext.type}
- Field Description: ${fieldContext.description}
- Expected Values: ${fieldContext.expectedValues.join(', ')}

USER INPUT: "${userInput}"

============================================================================
ANALYSIS RULES:
============================================================================

1️⃣ IF ASKING FOR CHOICE FIELD (roof_type, gauge, building_type, color, state_name):
   ⚠️ INPUT IS LIKELY A CHOICE ANSWER, NOT A DIMENSION
   
   Examples:
   - Asking for "roof_type" → user says "vert" → THIS IS "Vertical" CHOICE, NOT height
   - Asking for "gauge" → user says "14" → THIS IS gauge choice, NOT height
   - Asking for "color" → user says "gren" → THIS IS "green" COLOR, NOT a dimension
   - Asking for "state_name" → user says "texas" → THIS IS state name, NOT dimension
   
   ✅ Return: isDimension: false

2️⃣ IF ASKING FOR DIMENSION FIELD (width, length, height, utility_length):
   ✅ INPUT COULD BE A DIMENSION
   
   Look for:
   - Number + unit: "20 feet", "20ft", "20"
   - Dimension keyword: "width 20", "w: 20", "length 30"
   - Abbreviation: "w 20", "l 30", "h 15"
   - Even with typos: "widt 20", "lengt 30", "heigt 15"
   
   ✅ Confidence levels:
   - HIGH: Clear dimension keywords + number (e.g., "width 20", "heigt 15")
   - MEDIUM: Just a number (e.g., "20") or obvious dimension word
   - LOW: Ambiguous or might be something else

3️⃣ IF NOT ASKING FOR ANYTHING (initial flow):
   ⚠️ ONLY detect if input has EXPLICIT dimension indicators
   
   Examples:
   - "20x30x15" → HIGH confidence (all three with x)
   - "width 20 length 30 height 15" → HIGH confidence
   - "just 20" → LOW confidence (could be garage intent: "20 cars")
   - "texas" → NOT a dimension
   - "vertical" → NOT a dimension, this is roof type
   - "green" → NOT a dimension, this is color

============================================================================
DIMENSION KEYWORD DETECTION:
============================================================================

WIDTH INDICATORS:
  Keywords: "width", "w", "wide", "wide"
  Typos: "widt", "widht", "wid", "wdth"
  NOT: "vert" (this is vertical), "reg" (regular), "gren" (green)

LENGTH INDICATORS:
  Keywords: "length", "l", "long"
  Typos: "lengt", "leng", "lenth"
  NOT: "vert", "reg", "gren"

HEIGHT INDICATORS:
  Keywords: "height", "h", "tall", "deep", "depth"
  Typos: "heigt", "hieght", "hight", "heght", "heipt"
  NOT: "vert" (this is vertical for roof_type)

⚠️ CRITICAL DISTINCTIONS:
  ❌ "vert" is NOT height - it's "Vertical" (roof_type choice)
  ❌ "gren" is NOT a dimension - it's "green" (color choice)
  ❌ "reg" is NOT a dimension - it's "regular" (roof_type choice)
  ❌ "14" alone might NOT be height - it could be "14 Gauge" (gauge choice)
  ✅ "heigt 12" = HEIGHT dimension with value
  ✅ "widt 20" = WIDTH dimension with value
  ✅ "lengt 30" = LENGTH dimension with value

============================================================================
DECISION LOGIC:
============================================================================

IF expectedField is a CHOICE FIELD:
  → Return { isDimension: false, confidence: 'high', reasoning: 'Input is for choice selection, not dimension' }

IF expectedField is a DIMENSION FIELD:
  → Check if input has dimension keywords
  → If YES → Extract value and return dimension
  → If NO → Return { isDimension: false }

IF expectedField is null/unknown:
  → Only detect if input has EXPLICIT dimension keywords
  → Ignore ambiguous inputs like bare numbers or choice keywords

============================================================================
RESPONSE FORMAT:
============================================================================

Return ONLY JSON (no markdown):

{
  "isDimension": <true or false>,
  "field": "width" | "length" | "height" | "utility_length" | null,
  "value": <number or null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "detailed explanation of the decision"
}

============================================================================
EXAMPLES:
============================================================================

Example 1: Asking for roof_type, user says "vert"
  Context: expectedField = "roof_type" (CHOICE FIELD)
  Input: "vert"
  Reasoning: User is answering the choice question (Vertical), not giving a dimension
  Output: {
    "isDimension": false,
    "confidence": "high",
    "reasoning": "Asking for roof_type choice. 'vert' is the choice answer (Vertical), not a dimension"
  }

Example 2: Asking for width, user says "widt 20"
  Context: expectedField = "width" (DIMENSION FIELD)
  Input: "widt 20"
  Reasoning: Clear width keyword with value
  Output: {
    "isDimension": true,
    "field": "width",
    "value": 20,
    "confidence": "high",
    "reasoning": "Width keyword 'widt' (typo) with value 20"
  }

Example 3: Asking for gauge, user says "14"
  Context: expectedField = "gauge" (CHOICE FIELD)
  Input: "14"
  Reasoning: User is selecting gauge option (14 Gauge), not giving height dimension
  Output: {
    "isDimension": false,
    "confidence": "high",
    "reasoning": "Asking for gauge choice. '14' is the choice answer, not a dimension"
  }

Example 4: Asking for height, user says "12"
  Context: expectedField = "height" (DIMENSION FIELD)
  Input: "12"
  Reasoning: Clear number in dimension context
  Output: {
    "isDimension": true,
    "field": "height",
    "value": 12,
    "confidence": "medium",
    "reasoning": "Number in height field context"
  }

Example 5: Initial flow, user says "texas"
  Context: expectedField = null (INITIAL FLOW)
  Input: "texas"
  Reasoning: Not a dimension keyword, probably state name
  Output: {
    "isDimension": false,
    "confidence": "high",
    "reasoning": "State name, no dimension indicators"
  }

Example 6: Asking for color, user says "gren"
  Context: expectedField = "color" (CHOICE FIELD)
  Input: "gren"
  Reasoning: User is answering color choice (green), not dimension
  Output: {
    "isDimension": false,
    "confidence": "high",
    "reasoning": "Asking for color choice. 'gren' is the choice answer (green), not a dimension"
  }

============================================================================
ANALYZE THIS:
============================================================================

Expected Field: ${expectedField}
User Input: "${userInput}"

Be very careful:
- ${expectedField && ['roof_type', 'gauge', 'building_type', 'color', 'state_name'].includes(expectedField) ? '✅ This is a CHOICE FIELD, so input is likely a choice answer' : ''}
- Don't confuse choice keywords with dimensions
- Don't confuse choice numbers with dimensions

ONLY JSON:`;
    }

    /**
     * Get context information about a field
     */
    private getFieldContext(fieldName: keyof UserFriendlyParams | null): { type: string; description: string; expectedValues: string[]; }
    {
        const contexts: Record<string, any> = {
            roof_type: {
                type: 'CHOICE FIELD',
                description: 'User is selecting a roof style',
                expectedValues: ['Vertical', 'Regular', 'Box']
            },
            gauge: {
                type: 'CHOICE FIELD',
                description: 'User is selecting metal gauge thickness',
                expectedValues: ['14 Gauge', '16 Gauge', '18 Gauge']
            },
            building_type: {
                type: 'CHOICE FIELD',
                description: 'User is selecting building type',
                expectedValues: ['Garage', 'Shed', 'Barn', 'Workshop']
            },
            color: {
                type: 'CHOICE FIELD',
                description: 'User is selecting building color',
                expectedValues: ['White', 'Red', 'Blue', 'Green', 'etc.']
            },
            state_name: {
                type: 'CHOICE FIELD',
                description: 'User is entering their state',
                expectedValues: ['Texas', 'California', 'Florida', 'etc.']
            },
            width: {
                type: 'DIMENSION FIELD',
                description: 'User is entering building width in feet',
                expectedValues: ['20', '30', '40', 'etc.']
            },
            length: {
                type: 'DIMENSION FIELD',
                description: 'User is entering building length in feet',
                expectedValues: ['20', '30', '40', 'etc.']
            },
            height: {
                type: 'DIMENSION FIELD',
                description: 'User is entering building height in feet',
                expectedValues: ['12', '14', '16', 'etc.']
            },
            utility_length: {
                type: 'DIMENSION FIELD',
                description: 'User is entering utility area length in feet',
                expectedValues: ['4', '6', '8', 'etc.']
            }
        };

        return contexts[fieldName || 'unknown'] || {
            type: 'UNKNOWN',
            description: 'Initial flow, field not yet determined',
            expectedValues: ['Any value']
        };
    }

    /**
     * ✅ CRITICAL FIX: Batch detection for "XxYxZ" format
     * Properly extracts width, length, height from formats like "20x20x10" or "garage 20x20x10"
     */
    public async detectMultipleDimensions(userInput: string): Promise<Array<{ field: 'width' | 'length' | 'height'; value: number; confidence: 'high' | 'medium' | 'low'; }> | null>
    {
        if (!userInput?.trim()) {
            return null;
        }

        logger.info(`[AIDimensionDetector] Batch extraction from: "${userInput}"`);

        try {
            const prompt = `Extract ALL building dimensions from user input. 

⚠️ CRITICAL PARSING RULES:
1. Look for keywords: width, length, height (and typos like: widt, lengt, heigt)
2. Extract the NUMBER that comes after each keyword
3. Return ONLY dimensions that have BOTH keyword AND number

⚠️ FORMAT EXAMPLES:
✅ "width 10 length 10 height 10" → extract all 3
✅ "w 10 l 10 h 10" → extract all 3
✅ "widt 10 lengt 10 heigt 10" → extract all 3 (typos are OK)
✅ "garage width 10 length 10 height 10" → extract all 3 (ignore "garage")
✅ "20x20x10" → width:20, length:20, height:10 (X format)

❌ DO NOT extract:
- "10" alone (no dimension keyword)
- "texas" (state name, not dimension)
- Choice keywords like: "vert", "gren", "14", "reg"

⚠️ CRITICAL RULE FOR XxYxZ FORMAT:
If you see "20x20x10":
- ALWAYS: width=20, length=20, height=10
- NEVER: assign them all to one field!

Return ONLY JSON array (no markdown):
[
  {"field": "width", "value": 10, "confidence": "high"},
  {"field": "length", "value": 10, "confidence": "high"},
  {"field": "height", "value": 10, "confidence": "high"}
]

User input: "${userInput}"

ONLY JSON ARRAY, nothing else:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const parsed = this.parseArrayResponse(response);

            if (!Array.isArray(parsed) || parsed.length === 0) {
                logger.info(`[AIDimensionDetector] No dimensions detected`);
                return null;
            }

            logger.info(`[AIDimensionDetector] ✅ Batch detected ${parsed.length} dimensions:`);
            parsed.forEach((dim, index) => {
                logger.info(`  [${index}] ${dim.field}: ${dim.value}ft (confidence: ${dim.confidence})`);
            });

            // ✅ VALIDATION: Ensure we have proper structure
            const isValid = parsed.every(dim =>
                ['width', 'length', 'height'].includes(dim.field) &&
                typeof dim.value === 'number' &&
                dim.value > 0 &&
                dim.value <= 500
            );

            if (!isValid) {
                logger.error(`[AIDimensionDetector] ❌ Invalid dimension data`);
                return null;
            }

            // ✅ Check for duplicates
            const fieldCounts: Record<string, number> = {};
            parsed.forEach(dim => {
                fieldCounts[dim.field] = (fieldCounts[dim.field] || 0) + 1;
            });

            const hasDuplicates = Object.values(fieldCounts).some(count => count > 1);
            if (hasDuplicates) {
                logger.error(`[AIDimensionDetector] ❌ Duplicate fields detected:`, fieldCounts);
                return null;
            }

            return parsed;
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

            // ✅ Find JSON array
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                logger.warn(`[AIDimensionDetector] No JSON array found in response`);
                logger.warn(`Response was: "${cleaned.substring(0, 200)}"`);
                return [];
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!Array.isArray(parsed)) {
                logger.error(`[AIDimensionDetector] Parsed result is not an array`);
                return [];
            }

            logger.info(`[AIDimensionDetector] Successfully parsed ${parsed.length} dimensions from AI`);
            return parsed;
        } catch (error) {
            logger.error(`[AIDimensionDetector] Parse error:`, error);
            return [];
        }
    }
}

export const aiDimensionDetector = AIDimensionDetector.getInstance();
