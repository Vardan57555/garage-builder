import { ColorOption } from "@agents/tools/io/IColorChoice";
import {ColorValidator} from "@agents/tools/validators/ColorValidator";
import {ColorMatcher} from "@agents/tools/impl/ColorMatcher";

/**
 * ColorDetector: High-level API for color detection from user input
 * Implements intelligent fallback strategy with validation
 */

class ColorDetector
{
    /**
     * Detects color from user input using multi-strategy matching
     * Returns null if no match found
     */

    static detect(userInput: string, colorOptions: ColorOption[]): ColorOption | null
    {
        if (!ColorValidator.validateInput(userInput))
        {
            return null;
        }

        if (!ColorValidator.validateOptions(colorOptions))
        {
            return null;
        }

        const matcher = new ColorMatcher(userInput, colorOptions);
        return matcher.match();
    }
}

/**
 * Detects a color option from user input string
 * @param userInput - Raw user input (e.g., "1", "red", "barn red", "any")
 * @param colorOptions - Available color options to match against
 * @returns Matched ColorOption or null if no match found
 */
export function detectColorFromInput(userInput: string, colorOptions: ColorOption[]): ColorOption | null
{
    return ColorDetector.detect(userInput, colorOptions);
}
