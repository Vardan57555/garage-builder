import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ FUZZY CHOICE MATCHER
 * Uses AI to match user input to choices (colors, roof types, gauges, etc.)
 * Handles typos, abbreviations, and casual language
 */
export class FuzzyChoiceMatcher {
    private static instance: FuzzyChoiceMatcher;

    private constructor() {}

    public static getInstance(): FuzzyChoiceMatcher {
        if (!FuzzyChoiceMatcher.instance) {
            FuzzyChoiceMatcher.instance = new FuzzyChoiceMatcher();
        }
        return FuzzyChoiceMatcher.instance;
    }

    /**
     * ✅ Match user input to a choice with EXTREME typo tolerance
     * "gren" → "Evergreen", "vert" → "Vertical", "burgun" → "Burgundy"
     */
    public async matchChoice(
        userInput: string,
        choices: string[] | Array<{ name: string; label?: string; id?: string }>,
        displayOrder?: string[] // NEW: Explicit display order
    ): Promise<{
        matched: boolean;
        choice: string | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        if (!userInput?.trim() || !choices || choices.length === 0) {
            logger.warn(`[FuzzyChoiceMatcher] Invalid input or no choices`);
            return {
                matched: false,
                choice: null,
                confidence: 'low',
                reasoning: 'Invalid input or empty choices'
            };
        }

        try {
            const choiceList = choices.map(c =>
                typeof c === 'string' ? c : c.name || c.label || ''
            ).filter(c => c.length > 0);

            // ✅ NEW: Use displayOrder if provided, otherwise use choiceList
            const orderedList = displayOrder || choiceList;

            logger.info(`[FuzzyChoiceMatcher] Matching "${userInput}" against ${orderedList.length} choices`);

            // ✅ CRITICAL: Log the EXACT order being used for matching
            logger.info(`[FuzzyChoiceMatcher] Display order for number matching:`);
            orderedList.forEach((c, i) => {
                logger.info(`  [${i}] → Display #${i + 1}: "${c}"`);
            });

            // ✅ NEW: Check if input is a number FIRST
            const trimmed = userInput.trim();
            const isNumber = /^\d+$/.test(trimmed);

            if (isNumber) {
                const index = parseInt(trimmed, 10) - 1;

                if (index >= 0 && index < orderedList.length) {
                    const selectedChoice = orderedList[index];
                    logger.info(`[FuzzyChoiceMatcher] ✅ NUMBER MATCH: "${trimmed}" → index ${index} → "${selectedChoice}"`);

                    return {
                        matched: true,
                        choice: selectedChoice,
                        confidence: 'high',
                        reasoning: `User selected option ${trimmed} (${selectedChoice})`
                    };
                } else {
                    logger.warn(`[FuzzyChoiceMatcher] Number ${trimmed} out of range (1-${orderedList.length})`);
                }
            }

            // ✅ Continue with AI matching if not a valid number
            const prompt = `Match user input to one of these choices with EXTREME typo tolerance.

AVAILABLE CHOICES (IN ORDER):
${orderedList.map((c, i) => `${i + 1}. ${c}`).join('\n')}

USER INPUT: "${userInput}"

⚠️ MATCHING RULES:

1. TYPO TOLERANCE - Accept ANY of these:
   - Missing letters: "gren" = "Evergreen", "vert" = "Vertical", "burgun" = "Burgundy"
   - Wrong letters: "virt" = "Vertical", "grean" = "Evergreen"
   - Keyboard spam: "gggggreen" = "Evergreen", "vvvert" = "Vertical"
   - Abbreviations: "reg" = "Regular", "box" = "Box", "vert" = "Vertical"
   - Single/double letters: "v" = "Vertical", "r" = "Regular", "b" = "Barn Red"

2. FUZZY MATCHING:
   - "14" → if "14" gauge exists, match it
   - "barn" → match any choice starting with "barn" (e.g., "Barn Red")
   - "red" → match any choice with "red" in it
   - "barn red" → exact match if exists

3. CONFIDENCE LEVELS:
   - HIGH: Clear match (typo corrected, exact substring, number match)
   - MEDIUM: Probable match (partial match, likely abbreviation)
   - LOW: Uncertain (multiple partial matches, ambiguous)

4. DECISION ALGORITHM:
   a) Check for exact match (case-insensitive)
   b) Check for substring match (first choice containing input)
   c) Check for abbreviation (first letters match)
   d) Check for letter similarity (Levenshtein-like)
   e) If multiple matches, pick most likely one
   f) If no good match, return null

Return ONLY JSON (no markdown):
{
  "matched": <true if found good match, false otherwise>,
  "choice": "exact_choice_name" | null,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of how matched"
}

EXAMPLES (CRITICAL):

Choices: ["Vertical", "Regular", "Box"]
Input: "vert"
Output: {"matched": true, "choice": "Vertical", "confidence": "high", "reasoning": "Typo 'vert' corrected to Vertical"}

Choices: ["Evergreen", "Burgundy", "Barn Red", "White"]
Input: "gren"
Output: {"matched": true, "choice": "Evergreen", "confidence": "high", "reasoning": "Typo 'gren' corrected to Evergreen"}

Choices: ["Evergreen", "Burgundy", "Barn Red", "White"]
Input: "barn"
Output: {"matched": true, "choice": "Barn Red", "confidence": "high", "reasoning": "Substring match - 'barn' found in 'Barn Red'"}

Choices: ["Evergreen", "Burgundy", "Barn Red", "White"]
Input: "burgun"
Output: {"matched": true, "choice": "Burgundy", "confidence": "high", "reasoning": "Typo 'burgun' corrected to Burgundy"}

Choices: ["14 Gauge", "16 Gauge", "18 Gauge"]
Input: "14"
Output: {"matched": true, "choice": "14 Gauge", "confidence": "high", "reasoning": "Exact number match"}

Choices: ["Vertical", "Regular", "Box"]
Input: "v"
Output: {"matched": true, "choice": "Vertical", "confidence": "medium", "reasoning": "Single letter 'v' matches Vertical"}

Choices: ["Vertical", "Regular", "Box"]
Input: "box"
Output: {"matched": true, "choice": "Box", "confidence": "high", "reasoning": "Exact match (case-insensitive)"}

Choices: ["Evergreen", "Burgundy"]
Input: "red"
Output: {"matched": false, "choice": null, "confidence": "low", "reasoning": "Ambiguous - 'red' appears in both Burgundy and could mean Barn Red"}

USER INPUT TO MATCH: "${userInput}"
AVAILABLE CHOICES: ${orderedList.join(', ')}

STRICT: Only return true if you're reasonably confident (high or medium).
Return false if uncertain.

ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const result = this.parseResponse(response, orderedList);

            if (result) {
                logger.info(`[FuzzyChoiceMatcher] Match result:`, result);
                return result;
            }

            return {
                matched: false,
                choice: null,
                confidence: 'low',
                reasoning: 'Failed to parse response'
            };
        } catch (error) {
            logger.error(`[FuzzyChoiceMatcher] Error:`, error);
            return {
                matched: false,
                choice: null,
                confidence: 'low',
                reasoning: 'Error during matching'
            };
        }
    }

    /**
     * ✅ Match color with AI
     * "gren" → "Evergreen", "burgun" → "Burgundy", "wht" → "White"
     *
     * ✅ CRITICAL: displayOrder MUST match the order shown to the user
     */
    public async matchColor(
        userInput: string,
        colors: Array<{ name: string; cost?: number; hex_value?: string }>,
        displayOrder?: string[] // NEW: Order as shown in UI
    ): Promise<{
        matched: boolean;
        color: { name: string; cost?: number } | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        if (!userInput?.trim() || !colors || colors.length === 0) {
            return {
                matched: false,
                color: null,
                confidence: 'low',
                reasoning: 'Invalid input or no colors'
            };
        }

        try {
            const colorNames = colors.map(c => c.name);

            // ✅ NEW: Use displayOrder if provided
            const result = await this.matchChoice(userInput, colorNames, displayOrder);

            if (result.matched && result.choice) {
                const matchedColor = colors.find(c => c.name === result.choice);
                return {
                    matched: true,
                    color: matchedColor || null,
                    confidence: result.confidence,
                    reasoning: result.reasoning
                };
            }

            return {
                matched: false,
                color: null,
                confidence: result.confidence,
                reasoning: result.reasoning
            };
        } catch (error) {
            logger.error(`[FuzzyChoiceMatcher] Color match error:`, error);
            return {
                matched: false,
                color: null,
                confidence: 'low',
                reasoning: 'Error during color matching'
            };
        }
    }

    /**
     * ✅ Match roof type: "vert" → "Vertical", "reg" → "Regular", "box" → "Box"
     */
    public async matchRoofType(userInput: string): Promise<{
        matched: boolean;
        roofType: string | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        const roofTypes = ['Vertical', 'Regular', 'Box'];
        const result = await this.matchChoice(userInput, roofTypes);

        return {
            matched: result.matched,
            roofType: result.choice,
            confidence: result.confidence,
            reasoning: result.reasoning
        };
    }

    /**
     * ✅ Match gauge: "14" → "14 Gauge", "16" → "16 Gauge", etc.
     */
    public async matchGauge(userInput: string): Promise<{
        matched: boolean;
        gauge: string | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        const gauges = ['14 Gauge', '16 Gauge', '18 Gauge'];
        const result = await this.matchChoice(userInput, gauges);

        return {
            matched: result.matched,
            gauge: result.choice,
            confidence: result.confidence,
            reasoning: result.reasoning
        };
    }

    /**
     * ✅ Match building type: "garage" → "Garage", "shed" → "Shed", etc.
     */
    public async matchBuildingType(userInput: string): Promise<{
        matched: boolean;
        buildingType: string | null;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        const buildingTypes = ['Garage', 'Shed', 'Barn'];
        const result = await this.matchChoice(userInput, buildingTypes);

        return {
            matched: result.matched,
            buildingType: result.choice,
            confidence: result.confidence,
            reasoning: result.reasoning
        };
    }

    private parseResponse(response: string, choiceList: string[]): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[FuzzyChoiceMatcher] No JSON found`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (typeof parsed.matched !== 'boolean') {
                logger.warn(`[FuzzyChoiceMatcher] Invalid matched:`, parsed);
                return null;
            }

            if (parsed.choice && !choiceList.includes(parsed.choice)) {
                logger.warn(`[FuzzyChoiceMatcher] Choice not in list:`, parsed.choice);
                parsed.choice = null;
                parsed.matched = false;
            }

            const validConfidences = ['high', 'medium', 'low'];
            if (!validConfidences.includes(parsed.confidence)) {
                parsed.confidence = 'low';
            }

            return {
                matched: parsed.matched,
                choice: parsed.choice || null,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning || 'No explanation'
            };
        } catch (error) {
            logger.error(`[FuzzyChoiceMatcher] Parse error:`, error);
            return null;
        }
    }
}

export const fuzzyChoiceMatcher = FuzzyChoiceMatcher.getInstance();
