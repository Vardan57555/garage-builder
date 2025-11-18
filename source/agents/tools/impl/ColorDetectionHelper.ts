import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { ColorOption } from "@agents/tools/impl/ColorDatabaseService";

const logger: pino.Logger = createLogger(module);

export function detectColorFromInput(
    userInput: string,
    colorOptions: ColorOption[]
): ColorOption | null {
    const lowerInput = userInput.toLowerCase().trim();

    logger.info(`[detectColorFromInput] 🎨 Parsing user input: "${userInput}"`);
    logger.info(`[detectColorFromInput] Available colors: ${colorOptions.length}`);

    if (!colorOptions || colorOptions.length === 0) {
        logger.error(`[detectColorFromInput] ❌ No color options provided!`);
        return null;
    }

    if (/^(any|whatever|don't care|idc|idk|no preference|none)$/i.test(lowerInput)) {
        const white = colorOptions.find(c => c.name.toLowerCase() === "white");
        if (white) {
            logger.info(`[detectColorFromInput] ✅ User indecisive, using DEFAULT: White`);
            return white;
        }
        return colorOptions[0];
    }

    const numberMatch = userInput.match(/^(\d+)$/);
    if (numberMatch) {
        const index = parseInt(numberMatch[1]) - 1;

        if (index >= 0 && index < colorOptions.length) {
            const selected = colorOptions[index];
            logger.info(`[detectColorFromInput] ✅ NUMBER MATCH: Option #${numberMatch[1]} = "${selected.name}" (cost: $${selected.cost})`);
            return selected;
        } else {
            logger.warn(`[detectColorFromInput] ❌ Number ${numberMatch[1]} out of range`);
            return null;
        }
    }

    const exactMatch = colorOptions.find(
        color => color.name.toLowerCase() === lowerInput
    );
    if (exactMatch) {
        logger.info(`[detectColorFromInput] ✅ EXACT MATCH: "${exactMatch.name}"`);
        return exactMatch;
    }

    const multiWordMatch = colorOptions.find(color => {
        const colorNameLower = color.name.toLowerCase();

        if (colorNameLower === lowerInput) {
            logger.info(`[detectColorFromInput] ✅ MULTI-WORD EXACT: "${color.name}"`);
            return true;
        }

        return false;
    });

    if (multiWordMatch) {
        return multiWordMatch;
    }

    const keywordMatch = colorOptions.find(color => {
        const colorNameLower = color.name.toLowerCase();

        if (colorNameLower.includes(lowerInput)) {
            logger.info(`[detectColorFromInput] ✅ KEYWORD MATCH: "${color.name}" contains "${userInput}"`);
            return true;
        }

        return false;
    });

    if (keywordMatch) {
        return keywordMatch;
    }

    const wordMatch = colorOptions.find(color => {
        const colorNameLower = color.name.toLowerCase();
        const words = colorNameLower.split(/[\s.-]+/);

        if (words.some(word => word === lowerInput)) {
            logger.info(`[detectColorFromInput] ✅ WORD MATCH: "${color.name}"`);
            return true;
        }

        return false;
    });

    if (wordMatch) {
        return wordMatch;
    }

    logger.warn(`[detectColorFromInput] ❌ NO MATCH for: "${userInput}"`);
    return null;
}
