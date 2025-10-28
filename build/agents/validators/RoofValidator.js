"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoofDataValidator = void 0;
const Log_1 = require("../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class RoofDataValidator {
    static async validateRoofType(roofType) {
        try {
            const normalizedType = this.normalizeRoofType(roofType);
            if (!normalizedType) {
                return { isValid: false };
            }
            return {
                isValid: true,
                normalizedType: normalizedType
            };
        }
        catch (error) {
            logger.warn("[LeadAgent] Roof type validation failed:", error);
            return { isValid: false };
        }
    }
    static normalizeRoofType(roofInput) {
        const roofAliasMap = {
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
        if (result) {
            logger.info(`[normalizeRoofType] ✓ Normalized "${roofInput}" → "${result}"`);
            return result;
        }
        logger.warn(`[normalizeRoofType] ✗ Invalid roof type: "${roofInput}"`);
        return null;
    }
    static getValidRoofTypesMessage() {
        const roofTypes = [
            "Regular (standard, simple roof)",
            "A-Frame (pitched/gabled roof)",
            "Vertical (sidewall roof)",
            "Box-Style (box style roof)"
        ];
        return `Valid roof types:\n${roofTypes.map(t => `• ${t}`).join('\n')}`;
    }
}
exports.RoofDataValidator = RoofDataValidator;
//# sourceMappingURL=RoofValidator.js.map