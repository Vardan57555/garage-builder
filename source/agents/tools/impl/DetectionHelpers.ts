import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);


const RESET_PATTERNS = [
    /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
    /\b(quit|exit|done with this)\b/i,
];

export class IntentDetector
{
    static detectReset(input: string): boolean {
        const isReset: boolean = RESET_PATTERNS.some((p) => p.test(input));
        if (isReset) {
            logger.info("[IntentDetector] Reset intent detected");
        }
        return isReset;
    }
}


export async function extractGarageTypeWithAI(userInput: string): Promise<{ garageType: string; carCount: number } | null>
{
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

        const parsed = parseAIResponse(response);

        if (!parsed)
        {
            logger.warn(`[AIGarageExtractor] Failed to parse LLM response`);
            return null;
        }

        logger.info(`[AIGarageExtractor] Parsed:`, {found: parsed.found, carCount: parsed.carCount});

        if (parsed.found && typeof parsed.carCount === 'number' && parsed.carCount > 0 && parsed.carCount <= 20)
        {
            const garageType = `${parsed.carCount}-car`;
            logger.info(`[AIGarageExtractor] ✅ SUCCESS: garageType = "${garageType}", carCount = ${parsed.carCount}`);

            return {
                garageType,
                carCount: parsed.carCount
            };
        }

        logger.info(`[AIGarageExtractor] ❌ No valid car count found`);
        return null;

    }
    catch (error)
    {
        logger.error(`[AIGarageExtractor] Exception:`, error);
        return null;
    }
}

/**
 * ✅ Parse JSON from AI response
 */
function parseAIResponse(response: string): any
{
    try
    {
        let cleaned: string = response
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        logger.debug(`[AIGarageExtractor] Cleaned response: "${cleaned}"`);

        const jsonMatch: RegExpMatchArray = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
        {
            logger.warn(`[AIGarageExtractor] No JSON found in response`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        logger.info(`[AIGarageExtractor] Parsed JSON:`, parsed);

        return parsed;
    }
    catch (error)
    {
        logger.error(`[AIGarageExtractor] JSON parse error:`, error);
        return null;
    }
}

/**
 * ✅ FIXED: Detect ALL dimension updates from input (e.g., "make height 20 width 10")
 * Returns the FIRST update and stores the REST in global.__pendingMultiDimensions
 */

export async function detectParameterUpdateFromInput(input: string, currentField?: string): Promise<{ field: keyof UserFriendlyParams; value: any } | null>
{
    logger.info(`[AIExtractor] Analyzing: "${input}" (context: ${currentField})`);

    try
    {
        const multiDimensionResult = await detectMultipleDimensionUpdates(input);

        if (multiDimensionResult && multiDimensionResult.length > 0) {
            logger.info(`[AIExtractor] ✅ Multiple dimensions detected (${multiDimensionResult.length}):`, multiDimensionResult);

            const first = multiDimensionResult[0];
            logger.info(`[AIExtractor] Returning first: ${first.field} = ${first.value}`);

            if (multiDimensionResult.length > 1)
            {
                (global as any).__pendingMultiDimensions = multiDimensionResult.slice(1);
                logger.info(`[AIExtractor] Stored ${multiDimensionResult.length - 1} pending updates:`,
                    (global as any).__pendingMultiDimensions);
            }

            return first;
        }

        logger.info(`[AIExtractor] Checking for garage type with AI...`);
        const garageResult = await extractGarageTypeWithAI(input);

        if (garageResult)
        {
            logger.info(`[AIExtractor] ✅ AI detected garage_type: ${garageResult.garageType}`);
            return {
                field: 'garage_type' as keyof UserFriendlyParams,
                value: garageResult.garageType
            };
        }

        logger.info(`[AIExtractor] Checking for dimension updates (with typo tolerance)...`);

        const typoResult = await extractDimensionWithTypoTolerance(input);
        if (typoResult)
        {
            logger.info(`[AIExtractor] ✅ Typo-tolerant detection: ${typoResult.field} = ${typoResult.value}`);
            return typoResult;
        }

        const dimensionPatterns: Array<{ regex: RegExp; field: keyof UserFriendlyParams }> = [
            { regex: /width\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'width' as keyof UserFriendlyParams },
            { regex: /length\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'length' as keyof UserFriendlyParams },
            { regex: /height\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
            { regex: /tall\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
            { regex: /deep\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
        ];

        for (const pattern of dimensionPatterns)
        {
            const match: RegExpMatchArray = input.match(pattern.regex);
            if (match)
            {
                const value: number = parseFloat(match[1]);
                if (value > 0 && value <= 500)
                {
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

    }
    catch (error)
    {
        logger.error(`[AIExtractor] Exception:`, error);
        return null;
    }
}

export async function extractDimensionWithTypoTolerance(userInput: string): Promise<{ field: keyof UserFriendlyParams; value: number } | null>
{
    if (!userInput?.trim())
    {
        return null;
    }

    try {
        logger.info(`[extractDimensionWithTypoTolerance] Analyzing: "${userInput}"`);

        const patterns = [
            { regex: /\b(?:widt?h?|w)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'width' as keyof UserFriendlyParams },
            { regex: /\b(?:lengt?h?|l)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'length' as keyof UserFriendlyParams },
            { regex: /\b(?:heigt?h?|h|tall|deep)\s*[:=]?\s*(\d+(?:\.\d+)?)/i, field: 'height' as keyof UserFriendlyParams },
        ];

        for (const pattern of patterns)
        {
            const match: RegExpMatchArray = userInput.match(pattern.regex);
            if (match) {
                const value: number = parseFloat(match[1]);
                if (value > 0 && value <= 500)
                {
                    logger.info(`[extractDimensionWithTypoTolerance] ✅ Pattern match: ${pattern.field} = ${value}`);
                    return { field: pattern.field, value };
                }
            }
        }

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

        const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

        const cleaned: string = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch: RegExpMatchArray = cleaned.match(/\{[\s\S]*\}/);

        if (!jsonMatch)
        {
            logger.info(`[extractDimensionWithTypoTolerance] No JSON in AI response`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.found && parsed.field && typeof parsed.value === 'number' && parsed.value > 0 && parsed.value <= 500)
        {
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

async function detectMultipleDimensionUpdates(input: string): Promise<Array<{ field: keyof UserFriendlyParams; value: any }> | null>
{
    try
    {
        logger.info(`[detectMultipleDimensionUpdates] Analyzing: "${input}"`);

        const hasDimensionKeywords: boolean = /(?:width|length|height|w\s+|l\s+|h\s+).*(?:width|length|height|w\s+|l\s+|h\s+)/i.test(input);

        if (!hasDimensionKeywords)
        {
            logger.debug(`[detectMultipleDimensionUpdates] No multiple dimension keywords detected`);
            return null;
        }

        const results: Array<{ field: keyof UserFriendlyParams; value: number }> = [];

        const patterns = [
            { regex: /width\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'width' as keyof UserFriendlyParams },
            { regex: /length\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'length' as keyof UserFriendlyParams },
            { regex: /height\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'height' as keyof UserFriendlyParams },
            { regex: /\bw\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'width' as keyof UserFriendlyParams },
            { regex: /\bl\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'length' as keyof UserFriendlyParams },
            { regex: /\bh\s*[:=]?\s*(\d+(?:\.\d+)?)/gi, field: 'height' as keyof UserFriendlyParams },
        ];

        const foundFields = new Set<string>();

        for (const pattern of patterns)
        {
            pattern.regex.lastIndex = 0;

            const match: RegExpExecArray = pattern.regex.exec(input);

            if (match && !foundFields.has(pattern.field)) {
                const value: number = parseFloat(match[1]);

                if (value > 0 && value <= 500)
                {
                    results.push({ field: pattern.field, value });
                    foundFields.add(pattern.field);
                    logger.info(`[detectMultipleDimensionUpdates] ✅ Extracted ${pattern.field} = ${value}`);
                }
            }
        }

        if (results.length >= 2)
        {
            logger.info(`[detectMultipleDimensionUpdates] ✅ Found ${results.length} dimensions:`, results);
            return results;
        }

        logger.debug(`[detectMultipleDimensionUpdates] Only found ${results.length} dimension(s), need 2+`);
        return null;

    }
    catch (error)
    {
        logger.error(`[detectMultipleDimensionUpdates] Exception:`, error);
        return null;
    }
}
