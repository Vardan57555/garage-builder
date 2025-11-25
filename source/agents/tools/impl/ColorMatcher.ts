import { ColorOption } from "../io/IColorChoice";
import { IColorMatcher } from "./io/IColorDetectionHelper";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * ColorMatcher: Implements multi-strategy color matching with priority fallback
 * Strategies (in order): indifference → number → exact → keyword → word
 */
export class ColorMatcher implements IColorMatcher
{
    private static readonly INDIFFERENCE_PATTERNS: RegExp = /^(any|whatever|don't care|idc|idk|no preference|none)$/i;
    private static readonly DEFAULT_COLOR_NAME:string = "white";

    private readonly colorOptions: ColorOption[];
    private readonly lowerInput: string;

    constructor(userInput: string, colorOptions: ColorOption[])
    {
        this.colorOptions = colorOptions;
        this.lowerInput = userInput.toLowerCase().trim();
    }

    /**
     * Executes a matching strategy chain
     */

    public match(): ColorOption | null
    {
        logger.info(`[ColorMatcher] Input: "${this.lowerInput}" | Available: ${this.colorOptions.length} colors`);

        if (this.colorOptions.length === 0)
        {
            logger.error("[ColorMatcher] No color options provided");
            return null;
        }

        return (
            this.tryIndifferenceMatch() ??
            this.tryNumberMatch() ??
            this.tryExactMatch() ??
            this.tryKeywordMatch() ??
            this.tryWordMatch() ??
            this.logNoMatch()
        );
    }

    /**
     * Strategy 1: User expressed indifference (any, whatever, don't care, etc.)
     */

    private tryIndifferenceMatch(): ColorOption | null
    {
        if (!ColorMatcher.INDIFFERENCE_PATTERNS.test(this.lowerInput))
        {
            return null;
        }

        const defaultColor: ColorOption = this.colorOptions.find(c => c.name.toLowerCase() === ColorMatcher.DEFAULT_COLOR_NAME) || this.colorOptions[0];

        logger.info(`[ColorMatcher] Indifference detected, selecting: "${defaultColor.name}"`);
        return defaultColor;
    }

    /**
     * Strategy 2: User entered a number (1, 2, 3, etc.)
     */

    private tryNumberMatch(): ColorOption | null
    {
        const numberMatch: RegExpMatchArray = this.lowerInput.match(/^(\d+)$/);
        if (!numberMatch)
        {
            return null;
        }

        const index: number = parseInt(numberMatch[1]) - 1;

        if (index < 0 || index >= this.colorOptions.length)
        {
            logger.warn(`[ColorMatcher] Number ${numberMatch[1]} out of range (max: ${this.colorOptions.length})`);
            return null;
        }

        const selected: ColorOption = this.colorOptions[index];
        logger.info(`[ColorMatcher] Number match: #${numberMatch[1]} = "${selected.name}" ($${selected.cost})`);
        return selected;
    }

    /**
     * Strategy 3: Exact case-insensitive color name match
     */

    private tryExactMatch(): ColorOption | null
    {
        const exactMatch: ColorOption = this.colorOptions.find(c => c.name.toLowerCase() === this.lowerInput);

        if (exactMatch)
        {
            logger.info(`[ColorMatcher] Exact match: "${exactMatch.name}"`);
            return exactMatch;
        }

        return null;
    }

    /**
     * Strategy 4: User input is a substring of color name
     */

    private tryKeywordMatch(): ColorOption | null
    {
        const keywordMatch: ColorOption = this.colorOptions.find(c => c.name.toLowerCase().includes(this.lowerInput));

        if (keywordMatch)
        {
            logger.info(`[ColorMatcher] Keyword match: "${keywordMatch.name}" contains "${this.lowerInput}"`);
            return keywordMatch;
        }

        return null;
    }

    /**
     * Strategy 5: User input matches individual word in color name
     */

    private tryWordMatch(): ColorOption | null
    {
        const wordMatch: ColorOption = this.colorOptions.find(c =>
        {
            const colorWords: string[] = c.name.toLowerCase().split(/[\s.-]+/);
            return colorWords.some(word => word === this.lowerInput);
        });

        if (wordMatch)
        {
            logger.info(`[ColorMatcher] Word match: "${wordMatch.name}"`);
            return wordMatch;
        }

        return null;
    }

    /**
     * No match found - return null and log
     */

    private logNoMatch(): null
    {
        logger.warn(`[ColorMatcher] No match found for: "${this.lowerInput}"`);
        return null;
    }
}
