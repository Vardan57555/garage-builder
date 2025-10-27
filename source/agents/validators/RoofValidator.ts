import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class RoofDataValidator
{
    /**
     * Async method to normalize and validate a state string.
     *
     * @param roofType - The roof type to validate.
     * @returns The normalized state name if valid, null otherwise.
     */

    public static async validateRoofType(roofType: string): Promise<{isValid: boolean, normalizedType?: string}>
    {
        try
        {
            const normalizedType = this.normalizeRoofType(roofType);

            if (!normalizedType)
            {
                return { isValid: false };
            }

            return {
                isValid: true,
                normalizedType: normalizedType
            };
        }
        catch (error)
        {
            logger.warn("[LeadAgent] Roof type validation failed:", error);
            return { isValid: false };
        }
    }

    /**
     * Normalizes roof type input (handles variations)
     * @param roofInput - User input for roof type
     * @returns {string | null} Normalized roof type or null if invalid
     */

    private static normalizeRoofType(roofInput: string): string | null
    {
        const roofAliasMap: Record<string, string> = {
            "regular": "regular",
            "standard": "regular",
            "normal": "regular",
            "simple": "regular",

            "aframe": "a-frame",
            "a-frame": "a-frame",
            "a frame": "a-frame",
            "pitched": "a-frame",
            "gabled": "a-frame",

            "vertical": "vertical",
            "vertical roof": "vertical",
            "sidewall": "vertical",

            "box": "box-style",
            "box-style": "box-style",
            "box style": "box-style",
            "boxstyle": "box-style",
        };

        const normalized = roofInput.trim().toLowerCase();
        const result = roofAliasMap[normalized];

        if (result)
        {
            logger.info(`[normalizeRoofType] ✓ Normalized "${roofInput}" → "${result}"`);
            return result;
        }

        logger.warn(`[normalizeRoofType] ✗ Invalid roof type: "${roofInput}"`);
        return null;
    }

    /**
     * Gets valid roof types message for user display
     * @returns {string} Formatted string of valid roof types
     */
    public static getValidRoofTypesMessage(): string
    {
        const roofTypes = [
            "Regular (standard, simple roof)",
            "A-Frame (pitched/gabled roof)",
            "Vertical (sidewall roof)",
            "Box-Style (box style roof)"
        ];

        return `Valid roof types:\n${roofTypes.map(t => `• ${t}`).join('\n')}`;
    }
}
