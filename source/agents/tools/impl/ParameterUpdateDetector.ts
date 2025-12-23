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
export class ParameterUpdateDetector
{
    private static instance: ParameterUpdateDetector;

    private constructor() {}

    public static getInstance(): ParameterUpdateDetector
    {
        if (!ParameterUpdateDetector.instance)
        {
            ParameterUpdateDetector.instance = new ParameterUpdateDetector();
        }
        return ParameterUpdateDetector.instance;
    }

    /**
     * ✅ CRITICAL: Context-aware detection that respects field mode
     * Returns null immediately if in choice field mode
     */
    public async detectParameterUpdate(userInput: string, currentField?: keyof UserFriendlyParams): Promise<{
        isUpdate: boolean;
        field?: keyof UserFriendlyParams;
        value?: any;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string; }>
    {
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
1. Detect parameter updates for ANY field, even if we're currently asking for a different field
2. Look for explicit field keywords: "state", "width", "height", "length", "color", "roof", "gauge"
3. Parameter updates are things like: "state Texas", "change width to 20", "I want regular roof"
4. Be LESS conservative - if input clearly mentions a field name, detect it

CURRENT CONTEXT:
- Currently asking for: ${currentField || 'not asking for anything'}
- Field type: ${fieldContext.type}

USER INPUT: "${userInput}"

============================================================================
ANALYSIS RULES:
============================================================================

1️⃣ STATE UPDATES - ALWAYS DETECT:
   ✅ If input contains "state" keyword + location name → ALWAYS detect as state_name update
   
   Examples:
   - "state California" → isUpdate: true, field: "state_name", value: "California"
   - "change state to Texas" → isUpdate: true, field: "state_name", value: "Texas"
   - "my state is New York" → isUpdate: true, field: "state_name", value: "New York"
   - "Texas" (while asking for roof_type) → isUpdate: true, field: "state_name", value: "Texas"
   - "California" (while asking for gauge) → isUpdate: true, field: "state_name", value: "California"

2️⃣ DIMENSION UPDATES - DETECT WITH KEYWORDS:
   ✅ If input contains dimension keywords (width, length, height) + number
   
   Examples:
   - "width 20" → isUpdate: true, field: "width", value: 20
   - "change height to 12" → isUpdate: true, field: "height", value: 12
   - "make it 30 feet wide" → isUpdate: true, field: "width", value: 30

3️⃣ OTHER CHOICE FIELDS - DETECT WITH KEYWORDS:
   ✅ If input contains explicit field keywords
   
   Examples:
   - "vertical roof" → isUpdate: true, field: "roof_type", value: "Vertical"
   - "14 gauge" → isUpdate: true, field: "gauge", value: "14 Gauge"
   - "blue color" → isUpdate: true, field: "color", value: "blue"

4️⃣ AMBIGUOUS SINGLE WORDS - DO NOT DETECT:
   ⚠️ Single words without context are NOT updates (could be answering current question)
   
   Examples:
   - "vert" → isUpdate: false (ambiguous)
   - "14" → isUpdate: false (could be answering gauge question)
   - "20" → isUpdate: false (could be answering dimension question)

============================================================================
PARAMETER KEYWORDS:
============================================================================

DIMENSION UPDATE KEYWORDS:
- width, w, widt, wid, wide
- length, l, lengt, long
- height, h, heigt, tall, deep
- "make it X", "change to X", "set it to X"
- "I want", "give me", "need"

CHOICE UPDATE KEYWORDS:
- state_name: "state", "Texas", "California", "New York", etc. (ANY US state name)
- roof_type: "vertical", "regular", "box", "roof"
- gauge: "14 gauge", "16 gauge", "gauge"
- building_type: "garage", "shed", "barn"
- color: "white", "red", "blue", "color", etc.

⚠️ CRITICAL DETECTION RULES:
- STATE: If input contains "state" keyword OR a US state name → ALWAYS detect as state_name update
- DIMENSIONS: If input contains dimension keyword (width/length/height) + number → detect as update
- OTHER FIELDS: If input contains explicit field keyword + value → detect as update
- AMBIGUOUS: Single words without context (e.g., "vert", "14", "20") → DO NOT detect

============================================================================
RESPONSE FORMAT:
============================================================================

Return ONLY JSON:

{
  "isUpdate": <true or false>,
  "field": "width" | "length" | "height" | "roof_type" | "gauge" | "building_type" | "color" | "state_name" | null,
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

    private getFieldContext(fieldName?: keyof UserFriendlyParams): { type: string; description: string; }
    {
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
        }
        catch (error)
        {
            logger.error(`[ParameterUpdateDetector] Parse error:`, error);
            return null;
        }
    }
}
