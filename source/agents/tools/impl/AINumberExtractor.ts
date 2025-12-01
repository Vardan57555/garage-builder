import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ FIXED: AI-powered number extractor with proper error handling
 * Handles text-based numbers like "two", "three", "a couple", etc.
 */
export class AINumberExtractor {
    private static instance: AINumberExtractor;
    private readonly cache: Map<string, number | null> = new Map();
    private readonly maxCacheSize = 1000;

    // ✅ NEW: Word-to-number mapping for common cases (fast path)
    private readonly WORD_TO_NUMBER: Record<string, number> = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
        'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
        'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
        'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
        'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
        'eighty': 80, 'ninety': 90, 'hundred': 100,
        'a couple': 2, 'couple': 2, 'a few': 3, 'few': 3,
        'several': 5, 'dozen': 12, 'half dozen': 6,
    };

    private constructor() {}

    public static getInstance(): AINumberExtractor {
        if (!AINumberExtractor.instance) {
            AINumberExtractor.instance = new AINumberExtractor();
        }
        return AINumberExtractor.instance;
    }

    /**
     * ✅ IMPROVED: Extract number with multiple fallback strategies
     */
    public async extractNumber(text: string, context: string = "generic"): Promise<number | null> {
        if (!text || typeof text !== 'string') {
            return null;
        }

        const trimmed = text.trim().toLowerCase();

        // ✅ FAST PATH 1: Direct digit match
        const digitMatch = trimmed.match(/^\d+(\.\d+)?$/);
        if (digitMatch) {
            const value = parseFloat(digitMatch[0]);
            logger.debug(`[AINumberExtractor] Direct digit match: "${text}" → ${value}`);
            return value;
        }

        // ✅ FAST PATH 2: Word-to-number dictionary lookup
        const directWordMatch = this.tryDirectWordMatch(trimmed);
        if (directWordMatch !== null) {
            logger.debug(`[AINumberExtractor] Direct word match: "${text}" → ${directWordMatch}`);
            return directWordMatch;
        }

        // ✅ FAST PATH 3: Extract digit from text (e.g., "2 cars", "width 20")
        const extractedDigit = this.tryExtractDigitFromText(trimmed);
        if (extractedDigit !== null) {
            logger.debug(`[AINumberExtractor] Extracted digit: "${text}" → ${extractedDigit}`);
            return extractedDigit;
        }

        // ✅ CHECK CACHE before AI
        const cacheKey = `${trimmed}:${context}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            logger.debug(`[AINumberExtractor] Cache hit: "${text}" → ${cached}`);
            return cached;
        }

        // ✅ SLOW PATH: AI extraction (only if fast paths failed)
        try {
            logger.info(`[AINumberExtractor] Using AI for: "${text}" (context: ${context})`);

            const prompt = this.buildExtractionPrompt(text, context);
            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            const result = this.parseAIResponse(response);

            // Cache result
            this.cacheResult(cacheKey, result);

            logger.info(`[AINumberExtractor] ✅ AI extracted: "${text}" → ${result}`);
            return result;

        } catch (error) {
            logger.error(`[AINumberExtractor] AI extraction failed for "${text}":`, error);

            // ✅ FINAL FALLBACK: Try one more pattern match
            const fallbackResult = this.tryFallbackExtraction(trimmed);
            if (fallbackResult !== null) {
                logger.info(`[AINumberExtractor] ✅ Fallback extraction: "${text}" → ${fallbackResult}`);
                return fallbackResult;
            }

            logger.warn(`[AINumberExtractor] ❌ All extraction methods failed for: "${text}"`);
            return null;
        }
    }

    /**
     * ✅ NEW: Try direct word-to-number mapping
     */
    private tryDirectWordMatch(text: string): number | null {
        // Exact match
        if (this.WORD_TO_NUMBER[text] !== undefined) {
            return this.WORD_TO_NUMBER[text];
        }

        // Try compound numbers (e.g., "twenty three" → 23)
        const words = text.split(/\s+/);
        if (words.length === 2) {
            const first = this.WORD_TO_NUMBER[words[0]];
            const second = this.WORD_TO_NUMBER[words[1]];

            if (first !== undefined && second !== undefined && first >= 20 && second < 10) {
                return first + second; // e.g., twenty (20) + three (3) = 23
            }
        }

        return null;
    }

    /**
     * ✅ NEW: Extract digit from text patterns
     */
    private tryExtractDigitFromText(text: string): number | null {
        // Pattern: "2 cars", "width 20", "twenty feet", etc.
        const patterns = [
            /(\d+(?:\.\d+)?)\s*(?:car|cars|window|windows|door|doors|ft|feet|foot)?/,
            /(?:width|length|height|gauge)[\s:=]*(\d+(?:\.\d+)?)/,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const value = parseFloat(match[1]);
                if (!isNaN(value) && value > 0 && value <= 1000) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * ✅ NEW: Final fallback extraction using aggressive pattern matching
     */
    private tryFallbackExtraction(text: string): number | null {
        // Look for ANY digit in the text
        const digitMatch = text.match(/\d+(?:\.\d+)?/);
        if (digitMatch) {
            const value = parseFloat(digitMatch[0]);
            if (!isNaN(value) && value > 0 && value <= 1000) {
                logger.info(`[AINumberExtractor] Fallback found digit: ${value}`);
                return value;
            }
        }

        // Try word combinations more aggressively
        const wordMatches = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/);
        if (wordMatches) {
            return this.WORD_TO_NUMBER[wordMatches[1]];
        }

        return null;
    }

    /**
     * Build AI prompt for number extraction
     */
    private buildExtractionPrompt(text: string, context: string): string {
        return `Extract a numeric value from user input. Be flexible and handle ANY way users might express numbers.

Context: Extracting ${context}

RULES:
1. Convert ANY text-based number to a digit
2. Handle words: "two" → 2, "twenty-three" → 23, "a hundred" → 100
3. Handle slang: "a couple" → 2, "several" → 5, "a few" → 3, "dozen" → 12
4. Handle approximations: "about five" → 5, "around 10" → 10
5. Handle fractions/decimals: "two and a half" → 2.5, "ten point five" → 10.5
6. Handle compound: "twenty-three" → 23, "thirty five" → 35
7. Handle digits directly: "2" → 2, "10" → 10
8. Handle mixed: "2 or 3" → 2 (use first), "10-15" → 10 (use lower bound)
9. If multiple numbers, extract the FIRST one
10. If no number found, return null

RETURN ONLY JSON (NO MARKDOWN, NO EXPLANATION):
{
  "number": <numeric value or null>,
  "confidence": "high" | "medium" | "low",
  "interpretation": "brief explanation"
}

Examples:
- "two cars" → {"number": 2, "confidence": "high", "interpretation": "word 'two' converted"}
- "a couple of windows" → {"number": 2, "confidence": "high", "interpretation": "couple means 2"}
- "about fifteen" → {"number": 15, "confidence": "high", "interpretation": "word fifteen"}
- "10x20" → {"number": 10, "confidence": "high", "interpretation": "first dimension"}
- "several doors" → {"number": 5, "confidence": "medium", "interpretation": "several typically 5"}
- "many" → {"number": null, "confidence": "low", "interpretation": "too vague"}

User input: "${text}"

ONLY JSON:`;
    }

    /**
     * Parse AI response to extract number
     */
    private parseAIResponse(response: string): number | null {
        try {
            // Clean response
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            // Extract JSON
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[AINumberExtractor] No JSON in response`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate response structure
            if (typeof parsed.number !== 'number' && parsed.number !== null) {
                logger.warn(`[AINumberExtractor] Invalid number type:`, parsed);
                return null;
            }

            // Log confidence for monitoring
            if (parsed.confidence === 'low') {
                logger.warn(`[AINumberExtractor] Low confidence extraction: ${parsed.interpretation}`);
            }

            return parsed.number;

        } catch (error) {
            logger.error(`[AINumberExtractor] Failed to parse AI response:`, error);
            return null;
        }
    }

    /**
     * Cache result with LRU eviction
     */
    private cacheResult(key: string, value: number | null): void {
        // Simple LRU: if cache too large, clear it
        if (this.cache.size >= this.maxCacheSize) {
            logger.info(`[AINumberExtractor] Cache full, clearing`);
            this.cache.clear();
        }

        this.cache.set(key, value);
    }

    /**
     * Clear cache (useful for testing)
     */
    public clearCache(): void {
        this.cache.clear();
        logger.info(`[AINumberExtractor] Cache cleared`);
    }
}
