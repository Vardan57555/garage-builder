import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import { UserFriendlyParams } from "@agents/tools/io/IChat";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ CONTEXT-AWARE PARAMETER UPDATE DETECTOR
 * Only detects parameter updates when NOT in choice field mode
 */
export class ParameterUpdateDetector {
    private static instance: ParameterUpdateDetector;

    private constructor() {}

    public static getInstance(): ParameterUpdateDetector {
        if (!ParameterUpdateDetector.instance) {
            ParameterUpdateDetector.instance = new ParameterUpdateDetector();
        }
        return ParameterUpdateDetector.instance;
    }

    /**
     * ✅ CRITICAL: Context-aware detection that respects field mode
     * Returns null immediately if in choice field mode
     */
    public async detectParameterUpdate(
        userInput: string,
        currentField?: keyof UserFriendlyParams
    ): Promise<{
        isUpdate: boolean;
        field?: keyof UserFriendlyParams;
        value?: any;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        logger.info(`[ParameterUpdateDetector] Analyzing: "${userInput}"`);
        logger.info(`[ParameterUpdateDetector] Current field: ${currentField}`);

        const choiceFields = ['roof_type', 'gauge', 'building_type', 'color', 'state_name'];

        if (currentField && choiceFields.includes(currentField)) {
            logger.info(`[ParameterUpdateDetector] ⚠️ IN CHOICE FIELD MODE (${currentField})`);
            logger.info(`[ParameterUpdateDetector] BLOCKING all parameter detection`);
            logger.info(`[ParameterUpdateDetector] Input "${userInput}" is answer to choice field, NOT a parameter update`);

            return {
                isUpdate: false,
                confidence: 'high',
                reasoning: `In choice field mode (${currentField}). Input is answer to choice selection, not a parameter update.`
            };
        }

        try {
            const prompt = this.buildDetectionPrompt(userInput, currentField);
            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const result = this.parseResponse(response);

            if (result) {
                logger.info(`[ParameterUpdateDetector] Detection result:`, result);
                return result;
            }

            return {
                isUpdate: false,
                confidence: 'low',
                reasoning: 'Failed to parse'
            };
        } catch (error) {
            logger.error(`[ParameterUpdateDetector] Error:`, error);
            return {
                isUpdate: false,
                confidence: 'low',
                reasoning: 'Error during detection'
            };
        }
    }

    /**
     * Build detection prompt
     */
    private buildDetectionPrompt(userInput: string, currentField?: keyof UserFriendlyParams): string {
        const fieldContext = this.getFieldContext(currentField);

        return `You are a PARAMETER UPDATE DETECTOR. Determine if user input contains a parameter update (changing an existing or missing dimension/choice parameter).

IMPORTANT RULES:
1. Only detect ACTUAL parameter updates, not choice field answers
2. Be conservative - if ambiguous, return isUpdate: false
3. Parameter updates are things like: "make it 20 feet wide", "change height to 12", "I want regular roof"
4. NOT parameter updates: answering a choice question, providing state name, etc.

CURRENT CONTEXT:
- Currently asking for: ${currentField || 'unknown'}
- Field type: ${fieldContext.type}

USER INPUT: "${userInput}"

============================================================================
ANALYSIS RULES:
============================================================================

1️⃣ IF CURRENTLY ASKING FOR A CHOICE FIELD (roof_type, gauge, building_type, color, state_name):
   ⚠️ DO NOT detect as parameter update
   
   Examples:
   - Asking for roof_type → user says "vert" → This is choice answer, NOT parameter update
   - Asking for gauge → user says "14" → This is choice answer, NOT parameter update  
   - Asking for state → user says "texas" → This is state answer, NOT parameter update
   - Asking for color → user says "gren" → This is color answer, NOT parameter update

   ✅ Always return: isUpdate: false

2️⃣ IF CURRENTLY ASKING FOR A DIMENSION FIELD (width, length, height):
   ✅ Could be a parameter update if input contains other dimension keywords
   
   Examples:
   - Asking for width, user says "I also need height 15" → Could be update: height = 15
   - Asking for height, user says "make it 12 feet tall" → Could be update: height = 12
   
   But:
   - Asking for height, user says "12" → Not an update, just answering the question
   - Asking for height, user says "give me 12 feet" → Not an update, just answering

3️⃣ IF NOT ASKING FOR ANYTHING (null/undefined):
   ✅ Could be parameter update if input has EXPLICIT dimension/choice keywords
   
   Examples:
   - "width 20 length 30" → Updates: width=20, length=30
   - "regular roof and 14 gauge" → Updates: roof_type=regular, gauge=14
   - "just 20" → Not an update (ambiguous)
   - "vert" → Not an update (ambiguous abbreviation)

============================================================================
PARAMETER KEYWORDS:
============================================================================

DIMENSION UPDATE KEYWORDS:
- width, w, widt, wid, wide
- length, l, lengt, long
- height, h, heigt, tall, deep
- "make it X", "change to X", "set it to X"
- "I want", "give me", "need"

CHOICE UPDATE KEYWORDS (only if explicitly clear):
- roof_type: "vertical", "regular", "box"
- gauge: "14 gauge", "16 gauge"
- building_type: "garage", "shed", "barn"
- color: "white", "red", "blue", etc.

⚠️ CRITICAL: Only detect as UPDATE if:
- User explicitly says "change", "update", "make", "set"
- Or dimension keyword + number in clear pattern
- NOT just an abbreviation or single word

============================================================================
RESPONSE FORMAT:
============================================================================

Return ONLY JSON:

{
  "isUpdate": <true or false>,
  "field": "width" | "length" | "height" | "roof_type" | "gauge" | "building_type" | "color" | null,
  "value": <any value or null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "detailed explanation"
}

============================================================================
EXAMPLES:
============================================================================

Example 1: Asking for roof_type, user says "vert"
  Context: currentField = "roof_type" (CHOICE FIELD)
  Input: "vert"
  Output: {
    "isUpdate": false,
    "confidence": "high",
    "reasoning": "In choice field mode. 'vert' is answer to roof_type choice, not a parameter update"
  }

Example 2: Asking for height, user says "12"
  Context: currentField = "height" (DIMENSION FIELD)
  Input: "12"
  Output: {
    "isUpdate": false,
    "confidence": "high",
    "reasoning": "Just answering the height question, not updating another parameter"
  }

Example 3: Asking for nothing, user says "width 20 height 12"
  Context: currentField = null (INITIAL FLOW)
  Input: "width 20 height 12"
  Output: {
    "isUpdate": true,
    "field": "width",
    "value": 20,
    "confidence": "high",
    "reasoning": "Explicit dimension keywords with values"
  }

Example 4: Asking for height, user says "also need width 30"
  Context: currentField = "height" (DIMENSION FIELD)
  Input: "also need width 30"
  Output: {
    "isUpdate": true,
    "field": "width",
    "value": 30,
    "confidence": "high",
    "reasoning": "Explicit update to different dimension during height question"
  }

Example 5: Asking for gauge, user says "14"
  Context: currentField = "gauge" (CHOICE FIELD)
  Input: "14"
  Output: {
    "isUpdate": false,
    "confidence": "high",
    "reasoning": "In choice field mode. '14' is gauge choice answer, not a parameter update"
  }

============================================================================
ANALYZE THIS:
============================================================================

Current Field: ${currentField || 'null'}
Field Type: ${fieldContext.type}
User Input: "${userInput}"

Remember:
- ${currentField && ['roof_type', 'gauge', 'building_type', 'color', 'state_name'].includes(currentField) ? '✅ CHOICE FIELD MODE - user input is answer, not update' : ''}
- Be conservative - only detect clear updates
- Single words without keywords are usually NOT updates

ONLY JSON:`;
    }

    private getFieldContext(fieldName?: keyof UserFriendlyParams): {
        type: string;
        description: string;
    } {
        const contexts: Record<string, any> = {
            roof_type: {
                type: 'CHOICE FIELD',
                description: 'Selecting roof style (Vertical, Regular, Box)'
            },
            gauge: {
                type: 'CHOICE FIELD',
                description: 'Selecting metal gauge (14, 16, 18, 20)'
            },
            building_type: {
                type: 'CHOICE FIELD',
                description: 'Selecting building type (Garage, Shed, Barn, Workshop)'
            },
            color: {
                type: 'CHOICE FIELD',
                description: 'Selecting building color'
            },
            state_name: {
                type: 'CHOICE FIELD',
                description: 'Entering state name'
            },
            width: {
                type: 'DIMENSION FIELD',
                description: 'Building width in feet'
            },
            length: {
                type: 'DIMENSION FIELD',
                description: 'Building length in feet'
            },
            height: {
                type: 'DIMENSION FIELD',
                description: 'Building height in feet'
            },
            utility_length: {
                type: 'DIMENSION FIELD',
                description: 'Utility area length in feet'
            }
        };

        return contexts[fieldName || 'unknown'] || {
            type: 'UNKNOWN',
            description: 'Not currently asking for anything'
        };
    }

    private parseResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[ParameterUpdateDetector] No JSON found`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (typeof parsed.isUpdate !== 'boolean') {
                logger.warn(`[ParameterUpdateDetector] Invalid isUpdate:`, parsed);
                return null;
            }

            const validConfidences = ['high', 'medium', 'low'];
            if (!validConfidences.includes(parsed.confidence)) {
                parsed.confidence = 'low';
            }

            return {
                isUpdate: parsed.isUpdate,
                field: parsed.field || null,
                value: parsed.value || null,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning || 'No explanation'
            };
        } catch (error) {
            logger.error(`[ParameterUpdateDetector] Parse error:`, error);
            return null;
        }
    }
}
