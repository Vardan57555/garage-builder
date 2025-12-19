import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ IMPROVED: AI-Powered Color Change Handler with Better Approximate Matching
 * Intelligently extracts color intent and matches to available colors with suggestions
 */
export class ColorChangeHandler
{
    private static instance: ColorChangeHandler;

    private constructor() {}

    public static getInstance(): ColorChangeHandler
    {
        if (!ColorChangeHandler.instance)
        {
            ColorChangeHandler.instance = new ColorChangeHandler();
        }
        return ColorChangeHandler.instance;
    }

    /**
     * ✅ CORE: Extract color intent from user input using AI
     * Handles: "make it blue", "change to red", "blue please", "i want navy", etc.
     */
    public async extractColorIntent(userInput: string): Promise<{ colorName: string | null; confidence: "high" | "medium" | "low"; isColorChangeRequest: boolean; }>
    {
        try
        {
            logger.info(`[ColorChangeHandler] Extracting color intent from: "${userInput}"`);

            const prompt = `Analyze this user input and extract if they're requesting a color change for their garage.

User input: "${userInput}"

Return ONLY JSON (no markdown, no explanation):
{
  "isColorChangeRequest": <true if user is requesting a color change, false otherwise>,
  "colorName": <extracted color name or null>,
  "confidence": <"high" if clear color intent, "medium" if somewhat clear, "low" if unclear>,
  "reasoning": <brief explanation>
}

Examples:
- "make it blue" → {"isColorChangeRequest": true, "colorName": "blue", "confidence": "high", "reasoning": "Direct color change request"}
- "change to red" → {"isColorChangeRequest": true, "colorName": "red", "confidence": "high", "reasoning": "Explicit change request"}
- "i want it navy" → {"isColorChangeRequest": true, "colorName": "navy", "confidence": "high", "reasoning": "Clear preference stated"}
- "make color green" → {"isColorChangeRequest": true, "colorName": "green", "confidence": "high", "reasoning": "Color update request"}
- "what's the price?" → {"isColorChangeRequest": false, "colorName": null, "confidence": "high", "reasoning": "Not a color request"}
- "barn red or maybe burgundy" → {"isColorChangeRequest": true, "colorName": "barn red", "confidence": "medium", "reasoning": "Multiple options, chose primary"}
- "that looks good" → {"isColorChangeRequest": false, "colorName": null, "confidence": "high", "reasoning": "Approval, not change"}

ONLY valid JSON:`;

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
            logger.debug(`[ColorChangeHandler] AI response: "${response}"`);

            const parsed = this.parseAIResponse(response);

            if (!parsed)
            {
                logger.warn(`[ColorChangeHandler] Failed to parse AI response`);
                return {
                    colorName: null,
                    confidence: "low",
                    isColorChangeRequest: false,
                };
            }

            logger.info(`[ColorChangeHandler] Extracted: colorName=${parsed.colorName}, confidence=${parsed.confidence}, isChangeRequest=${parsed.isColorChangeRequest}`);

            return {
                colorName: parsed.colorName,
                confidence: parsed.confidence || "low",
                isColorChangeRequest: parsed.isColorChangeRequest || false,
            };
        }
        catch (error)
        {
            logger.error(`[ColorChangeHandler] Error extracting color intent:`, error);
            return {
                colorName: null,
                confidence: "low",
                isColorChangeRequest: false,
            };
        }
    }

    /**
     * ✅ IMPROVED: Match extracted color to database colors using AI
     * NOW: Handles unavailable colors by finding best approximation AND suggesting alternatives
     */
    public async matchColorToDatabase(extractedColor: string, availableColors: Array<{ name: string; cost: number }>): Promise<{
        match: { name: string; cost: number } | null;
        isAvailable: boolean;
        isApproximate: boolean;
        alternatives: Array<{ name: string; cost: number }>;
        message: string;
    }>
    {
        if (!extractedColor || availableColors.length === 0)
        {
            logger.warn(`[ColorChangeHandler] Missing extracted color or available colors`);
            return {
                match: null,
                isAvailable: false,
                isApproximate: false,
                alternatives: [],
                message: "Unable to process color request",
            };
        }

        try {
            logger.info(`[ColorChangeHandler] Matching "${extractedColor}" to database colors`);

            const extractedLower: string = extractedColor.toLowerCase().trim();
            const exactMatch = availableColors.find(c =>
                c.name.toLowerCase() === extractedLower ||
                c.name.toLowerCase().includes(extractedLower) ||
                extractedLower.includes(c.name.toLowerCase())
            );

            if (exactMatch)
            {
                logger.info(`[ColorChangeHandler] ✅ EXACT MATCH via string matching: "${extractedColor}" → "${exactMatch.name}"`);
                return {
                    match: exactMatch,
                    isAvailable: true,
                    isApproximate: false,
                    alternatives: [],
                    message: `✅ Changed color to ${exactMatch.name}`,
                };
            }

            const colorList: string = availableColors.map((c) => `"${c.name}"`).join(", ");

            const prompt = `Match the user's color preference to the closest available colors, even if not exact.

User preference: "${extractedColor}"

Available colors: ${colorList}

Return ONLY JSON (no markdown, no explanation):
{
  "bestMatch": <exact color name from available list that's closest to user preference, or null if completely different>,
  "isExactMatch": <true if exact match, false if approximation>,
  "confidence": <"high" if good match, "medium" if approximate, "low" if poor match>,
  "alternativeMatches": [<list of 2-3 other close colors from available list>],
  "reasoning": <brief explanation>
}

IMPORTANT RULES:
1. ALWAYS try to find the best approximation, even if not perfect
2. If user asks for "green" but only "White, Black, Barn Red" available → suggest "Black" as darkest, or "Barn Red" as warm
3. If user asks for "navy" and "Navy Blue" exists → match exactly
4. Return alternatives that are close in tone/style to the user preference
5. Be helpful - don't return null unless truly impossible
6. When suggesting alternatives, pick colors that are semantically close

Examples:
- User: "green" | Available: "White, Black, Barn Red, Royal Blue, Evergreen" → {"bestMatch": "Evergreen", "isExactMatch": true, "confidence": "high", "alternativeMatches": ["Black", "Royal Blue"], "reasoning": "Exact match found"}
- User: "green" | Available: "Black, White, Barn Red" → {"bestMatch": "Black", "isExactMatch": false, "confidence": "medium", "alternativeMatches": ["Barn Red"], "reasoning": "Green not available; Black is darkest option"}
- User: "navy" | Available: "Navy Blue, Red, White" → {"bestMatch": "Navy Blue", "isExactMatch": true, "confidence": "high", "alternativeMatches": [], "reasoning": "Exact match"}
- User: "dark" | Available: "Black, White, Red" → {"bestMatch": "Black", "isExactMatch": false, "confidence": "high", "alternativeMatches": ["Red"], "reasoning": "Black is the darkest option"}
- User: "light color" | Available: "White, Cream, Light Gray, Black" → {"bestMatch": "White", "isExactMatch": false, "confidence": "high", "alternativeMatches": ["Cream", "Light Gray"], "reasoning": "White is lightest"}
- User: "warm tone" | Available: "Barn Red, Burgundy, White" → {"bestMatch": "Barn Red", "isExactMatch": false, "confidence": "high", "alternativeMatches": ["Burgundy"], "reasoning": "Barn Red and Burgundy are warm tones"}

ONLY valid JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            logger.debug(`[ColorChangeHandler] Match response: "${response}"`);

            const parsed = this.parseAIResponse(response);

            if (!parsed) {
                logger.warn(`[ColorChangeHandler] Failed to parse match response`);
                return {
                    match: null,
                    isAvailable: false,
                    isApproximate: false,
                    alternatives: [],
                    message: "Could not process color matching",
                };
            }

            logger.info(`[ColorChangeHandler] AI parsed response:`, {
                bestMatch: parsed.bestMatch,
                isExactMatch: parsed.isExactMatch,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning
            });

            if (parsed.bestMatch && parsed.isExactMatch) {
                const matched = availableColors.find(
                    (c) => c.name.toLowerCase() === parsed.bestMatch.toLowerCase()
                );

                if (matched) {
                    logger.info(
                        `[ColorChangeHandler] ✅ EXACT MATCH: "${extractedColor}" → "${matched.name}"`
                    );

                    const alternatives = (parsed.alternativeMatches || [])
                        .slice(0, 2)
                        .map((altName: string) =>
                            availableColors.find(
                                (c) => c.name.toLowerCase() === altName.toLowerCase()
                            )
                        )
                        .filter(Boolean);

                    return {
                        match: matched,
                        isAvailable: true,
                        isApproximate: false,
                        alternatives: alternatives,
                        message: `✅ Changed color to ${matched.name}`,
                    };
                }
            }

            if (parsed.bestMatch) {
                const matched = availableColors.find(
                    (c) => c.name.toLowerCase() === parsed.bestMatch.toLowerCase()
                );

                if (matched) {
                    const message =
                        parsed.confidence === "high"
                            ? `✅ Changed color to ${matched.name} (closest to "${extractedColor}")`
                            : `✅ Changed color to ${matched.name}`;

                    logger.info(
                        `[ColorChangeHandler] ✅ APPROXIMATION MATCH: "${extractedColor}" → "${matched.name}" (confidence: ${parsed.confidence})`
                    );

                    const alternatives = (parsed.alternativeMatches || [])
                        .slice(0, 2)
                        .map((altName: string) =>
                            availableColors.find(
                                (c) => c.name.toLowerCase() === altName.toLowerCase()
                            )
                        )
                        .filter(Boolean);

                    return {
                        match: matched,
                        isAvailable: true,
                        isApproximate: true,
                        alternatives: alternatives,
                        message: message,
                    };
                }
            }

            logger.warn(`[ColorChangeHandler] No color match found for "${extractedColor}"`);

            const suggestions = availableColors.slice(0, 5);
            const suggestionText = suggestions
                .map((c, i) => `${i + 1}. ${c.name}`)
                .join(", ");

            return {
                match: null,
                isAvailable: false,
                isApproximate: false,
                alternatives: suggestions,
                message: `"${extractedColor}" is not available. Try: ${suggestionText}...`,
            };
        } catch (error) {
            logger.error(`[ColorChangeHandler] Error matching color:`, error);
            return {
                match: null,
                isAvailable: false,
                isApproximate: false,
                alternatives: [],
                message: "Error processing color match",
            };
        }
    }

    /**
     * ✅ COMPREHENSIVE: Improved color change handler
     * 1. Detects if user wants to change color
     * 2. Extracts color preference
     * 3. Intelligently matches to available colors (exact or approximation)
     * 4. Returns matched color with alternatives
     */
    public async handleColorChange(
        userInput: string,
        availableColors: Array<{ name: string; cost: number }>
    ): Promise<{
        success: boolean;
        color: { name: string; cost: number } | null;
        message: string;
        shouldRecalculatePrice: boolean;
        alternatives?: Array<{ name: string; cost: number }>;
    }> {
        logger.info(`[ColorChangeHandler] Handling color change request: "${userInput}"`);

        try {
            const intent = await this.extractColorIntent(userInput);

            if (!intent.isColorChangeRequest) {
                logger.info(`[ColorChangeHandler] Not a color change request`);
                return {
                    success: false,
                    color: null,
                    message: "Not a color change request",
                    shouldRecalculatePrice: false,
                };
            }

            if (!intent.colorName) {
                logger.warn(`[ColorChangeHandler] Color intent detected but no color name extracted`);
                return {
                    success: false,
                    color: null,
                    message: "Could not determine which color you want. Please specify a color.",
                    shouldRecalculatePrice: false,
                };
            }

            const matchResult = await this.matchColorToDatabase(intent.colorName, availableColors);

            if (!matchResult.match) {
                logger.warn(`[ColorChangeHandler] No color match found`);

                let suggestionsText = "";
                if (matchResult.alternatives && matchResult.alternatives.length > 0) {
                    suggestionsText = "\n\nAvailable colors:\n" +
                        matchResult.alternatives
                            .slice(0, 5)
                            .map((c, i) => `${i + 1}. ${c.name}`)
                            .join("\n");
                }

                return {
                    success: false,
                    color: null,
                    message: matchResult.message + suggestionsText,
                    shouldRecalculatePrice: false,
                    alternatives: matchResult.alternatives,
                };
            }

            logger.info(
                `[ColorChangeHandler] ✅ Color change successful: ${matchResult.match.name}`
            );

            let successMessage = matchResult.message;

            if (matchResult.alternatives && matchResult.alternatives.length > 0) {
                const alternativesList = matchResult.alternatives
                    .map(c => c.name)
                    .join(", ");
                successMessage += `\n\nOther similar colors: ${alternativesList}`;
            }

            return {
                success: true,
                color: matchResult.match,
                message: successMessage,
                shouldRecalculatePrice: true,
                alternatives: matchResult.alternatives,
            };
        } catch (error) {
            logger.error(`[ColorChangeHandler] Error in handleColorChange:`, error);
            return {
                success: false,
                color: null,
                message: "Error processing color change. Please try again.",
                shouldRecalculatePrice: false,
            };
        }
    }

    private parseAIResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[parseAIResponse] No JSON found in: "${response}"`);
                return null;
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error(`[parseAIResponse] Failed to parse:`, error);
            return null;
        }
    }
}
