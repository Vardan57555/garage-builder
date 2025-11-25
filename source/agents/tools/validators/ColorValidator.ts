import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {ColorOption} from "@agents/tools/io/IColorChoice";

const logger: pino.Logger = createLogger(module);

/**
 * ColorValidator: Validates color options and user input
 */
export class ColorValidator
{
    /**
     * Validates color options array
     */

    static validateOptions(colorOptions: ColorOption[]): boolean
    {
        if (!colorOptions || colorOptions.length === 0)
        {
            logger.error("[ColorValidator] Invalid or empty color options");
            return false;
        }

        const allValid: boolean = colorOptions.every(
            c =>
                c.name &&
                c.hex_value &&
                c.cost !== undefined &&
                typeof c.cost === "number"
        );

        if (!allValid)
        {
            logger.error("[ColorValidator] Color options contain invalid entries");
            return false;
        }

        return true;
    }

    /**
     * Validates user input string
     */

    static validateInput(userInput: string): boolean
    {
        if (!userInput || typeof userInput !== "string")
        {
            logger.error("[ColorValidator] Invalid user input");
            return false;
        }

        return true;
    }
}
