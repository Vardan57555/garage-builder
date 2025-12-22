import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {FuzzyMatchResult} from "@agents/tools/io/IFuzzyIntentMatcher";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ AI-POWERED FUZZY INTENT MATCHER
 * Handles typos, variations, and casual language without hardcoding
 */

export class FuzzyIntentMatcher
{
    private static instance: FuzzyIntentMatcher;

    private constructor() {}

    public static getInstance(): FuzzyIntentMatcher
    {
        if (!FuzzyIntentMatcher.instance)
        {
            FuzzyIntentMatcher.instance = new FuzzyIntentMatcher();
        }
        return FuzzyIntentMatcher.instance;
    }

    /**
     * ✅ MAIN: Detect user intent with AI fuzzy matching
     * Handles typos like: "widt", "lengt", "heigt", "skipppp", etc.
     */

    public async matchIntent(userInput: string, context?: string): Promise<FuzzyMatchResult>
    {
        if (!userInput?.trim())
        {
            logger.warn(`[FuzzyIntentMatcher] Empty input`);
            return { intent: 'unknown', confidence: 'low', reasoning: 'Empty input' };
        }

        logger.info(`[FuzzyIntentMatcher] Matching intent for: "${userInput}" (context: ${context || 'none'})`);

        try {
            const prompt: string = this.buildMatchingPrompt(userInput, context);
            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[FuzzyIntentMatcher] AI response: "${response}"`);

            const result: FuzzyMatchResult = this.parseResponse(response);

            if (result)
            {
                logger.info(`[FuzzyIntentMatcher] ✅ Matched: ${result.intent} (confidence: ${result.confidence})`);
                return result;
            }

            return { intent: 'unknown', confidence: 'low', reasoning: 'Could not parse response' };
        }
        catch (error)
        {
            logger.error(`[FuzzyIntentMatcher] Error:`, error);
            return { intent: 'unknown', confidence: 'low', reasoning: 'Error during matching' };
        }
    }

    /**
     * ✅ OVERRIDE: Check for skip intent with AI
     * Handles: "skip", "skipppp", "nope", "no thanks", "don't need", etc.
     */

    public async isSkipIntent(userInput: string): Promise<{ isSkip: boolean; confidence: 'high' | 'medium' | 'low' }>
    {
        const result: FuzzyMatchResult = await this.matchIntent(userInput);

        return {
            isSkip: result.intent === 'skip',
            confidence: result.intent === 'skip' ? result.confidence : 'low'
        };
    }

    /**
     * ✅ NEW: Extract dimension value with AI understanding
     * "widt 15" → { field: 'width', value: 15 }
     * "i want the length to be 20" → { field: 'length', value: 20 }
     * "make it 30 feet tall" → { field: 'height', value: 30 }
     */

    public async extractDimensionWithValue(userInput: string, expectedField?: 'width' | 'length' | 'height'): Promise<{
        field: 'width' | 'length' | 'height' | null;
        value: number | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string; }>
    {
        if (!userInput?.trim())
        {
            return { field: null, value: null, confidence: 'low', reasoning: 'Empty input' };
        }

        try {
            logger.info(`[FuzzyIntentMatcher] Extracting dimension from: "${userInput}" (expected: ${expectedField})`);

            const simpleMatch: RegExpMatchArray = userInput.match(/(\d+(?:\.\d+)?)/);
            if (simpleMatch && expectedField)
            {
                const value: number = parseFloat(simpleMatch[1]);
                if (value > 0 && value <= 500)
                {
                    logger.info(`[FuzzyIntentMatcher] ✅ FAST PATH: Extracted ${value} for ${expectedField}`);
                    return {
                        field: expectedField,
                        value: value,
                        confidence: 'high',
                        reasoning: 'Direct number extraction'
                    };
                }
            }

            const prompt = `Extract a building dimension from user input with EXTREME typo tolerance.

CRITICAL RULES:
1. User may have EXTREME typos: 
   - "widt", "wiDT", "widht", "wwwidt" = width
   - "lengt", "leng", "legnth", "llllengt" = length  
   - "heigt", "hieght", "higt", "hhhheigt" = height
2. User may have keyboard spam: "wwwwwwidt", "llllennngt", "hhhheigt"
3. User may misspell badly: "widtg", "lenggh", "heigttt"
4. Extract the FIRST valid number (1-500)
5. Expected field: ${expectedField || 'unknown'}
6. If a number exists, ALWAYS extract it
7. Handle ALL variations - be VERY forgiving
8. Accept partial words: "w", "wid", "wi", "width" ALL = width

TYPO PATTERNS TO RECOGNIZE:
- Missing letters: "widt", "lengt", "heigt"
- Extra letters: "widttt", "lengthh", "heighttt"
- Wrong letters: "widg", "lengh", "heigh"
- Repeated letters: "wwwidt", "llleng", "hhhheig"
- Letter swaps: "wiDt", "legnth", "hieght"

Return ONLY JSON:
{
  "field": "width" | "length" | "height" | null,
  "value": <number or null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation including if typo was corrected"
}

Examples:
- "widt 19" → {"field": "width", "value": 19, "confidence": "high", "reasoning": "Typo 'widt' corrected to width"}
- "lengt 10" → {"field": "length", "value": 10, "confidence": "high", "reasoning": "Typo 'lengt' corrected to length"}
- "wwwwwidt 19" → {"field": "width", "value": 19, "confidence": "high", "reasoning": "Spam + typo 'wwwwwidt' corrected to width"}
- "heigt 12" → {"field": "height", "value": 12, "confidence": "high", "reasoning": "Typo 'heigt' corrected to height"}
- "widttt 25" → {"field": "width", "value": 25, "confidence": "high", "reasoning": "Typo 'widttt' corrected to width"}
- "19" → {"field": "${expectedField || 'width'}", "value": 19, "confidence": "high", "reasoning": "Number only, assumed ${expectedField || 'width'}"}
- "xyz" → {"field": null, "value": null, "confidence": "low", "reasoning": "No number found"}

User input: "${userInput}"

BE EXTREMELY FORGIVING WITH TYPOS. If there's ANY reasonable way to interpret this as a dimension, do it.

ONLY JSON:`;

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[FuzzyIntentMatcher] AI response:`, response);

            const parsed = this.parseJSONResponse(response);

            if (parsed && typeof parsed.value === 'number' && parsed.value > 0 && parsed.value <= 500) {
                if (expectedField && !parsed.field)
                {
                    parsed.field = expectedField;
                }

                logger.info(`[FuzzyIntentMatcher] ✅ AI extracted: ${parsed.field} = ${parsed.value} (confidence: ${parsed.confidence})`);
                logger.info(`[FuzzyIntentMatcher] Reasoning: ${parsed.reasoning}`);
                return parsed;
            }

            logger.warn(`[FuzzyIntentMatcher] AI failed to extract dimension:`, parsed);
            return {
                field: null,
                value: null,
                confidence: 'low',
                reasoning: parsed?.reasoning || 'Could not extract dimension'
            };

        }
        catch (error)
        {
            logger.error(`[FuzzyIntentMatcher] Exception:`, error);
            return {
                field: null,
                value: null,
                confidence: 'low',
                reasoning: 'Error during extraction'
            };
        }
    }

    private buildMatchingPrompt(userInput: string, context?: string): string {
        return `Analyze user input and determine their intent.

${context ? `CONTEXT: ${context}` : ''}

INTENT CATEGORIES:
- width: User wants to update/provide WIDTH (may have typos: "widt", "w", "wide", etc.)
- length: User wants to update/provide LENGTH (may have typos: "lengt", "l", "long", etc.)
- height: User wants to update/provide HEIGHT (may have typos: "heigt", "h", "tall", etc.)
- skip: User wants to SKIP/DECLINE addons (may say: "skip", "skipppp", "no thanks", "don't need", "nope", etc.)
- state: User providing STATE name
- roof_type: User selecting ROOF TYPE
- gauge: User selecting GAUGE
- building_type: User selecting BUILDING TYPE (garage/shed/barn)
- color: User selecting COLOR
- unknown: Input doesn't match above

CRITICAL: Be SMART about typos and variations!
- "widt" = width
- "skipppp" = skip
- "nah" = skip
- "whatever" = skip
- "what" ≠ width (context matters!)

Return ONLY JSON (no markdown):
{
  "intent": "width" | "length" | "height" | "skip" | "state" | "roof_type" | "gauge" | "building_type" | "color" | "unknown",
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation",
  "extractedValue": <any> (optional)
}

User input: "${userInput}"

ONLY JSON:`;
    }

    private parseResponse(response: string): FuzzyMatchResult | null
    {
        try
        {
            const parsed = this.parseJSONResponse(response);

            if (!parsed || !parsed.intent)
            {
                return null;
            }

            const validIntents: string[] = ['width', 'length', 'height', 'skip', 'state', 'roof_type', 'gauge', 'building_type', 'color', 'unknown'];

            if (!validIntents.includes(parsed.intent))
            {
                logger.warn(`[FuzzyIntentMatcher] Invalid intent: ${parsed.intent}`);
                return null;
            }

            return {
                intent: parsed.intent,
                confidence: parsed.confidence || 'low',
                reasoning: parsed.reasoning || 'No explanation',
                extractedValue: parsed.extractedValue
            };
        }
        catch (error)
        {
            logger.error(`[FuzzyIntentMatcher] Parse error:`, error);
            return null;
        }
    }

    private parseJSONResponse(response: string): any
    {
        try
        {
            let cleaned: string = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch: RegExpMatchArray = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
            {
                logger.warn(`[FuzzyIntentMatcher] No JSON found in response`);
                return null;
            }

            return JSON.parse(jsonMatch[0]);
        }
        catch (error)
        {
            logger.error(`[FuzzyIntentMatcher] JSON parse error:`, error);
            return null;
        }
    }
}

export const fuzzyMatcher = FuzzyIntentMatcher.getInstance();
