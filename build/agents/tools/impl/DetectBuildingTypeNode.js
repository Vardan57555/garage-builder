"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBuildingTypeNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const detectBuildingTypeNode = async (state) => {
    logger.info(`[BuildingTypeNode] Detecting building type from initial input`);
    if (state.userFriendlyParams.building_type) {
        logger.info(`[BuildingTypeNode] Building type already set`);
        return { nextStep: "extract_parameters" };
    }
    try {
        const userInput = state.messages[state.messages.length - 1]?.content;
        if (!userInput) {
            return { nextStep: "extract_parameters" };
        }
        const lowerInput = userInput.toLowerCase();
        const buildingPatterns = [
            { pattern: /\bgarage\b/i, type: "garage" },
            { pattern: /\bshed\b/i, type: "shed" },
            { pattern: /\bbarn\b/i, type: "barn" },
            { pattern: /\bmetallic? building\b/i, type: "garage" },
            { pattern: /\bstructure\b/i, type: "garage" },
        ];
        for (const { pattern, type } of buildingPatterns) {
            if (pattern.test(lowerInput)) {
                logger.info(`[BuildingTypeNode] Detected building type: ${type}`);
                return {
                    userFriendlyParams: { building_type: type },
                    response: `✓ Got it - you're looking for a ${type}!`,
                    nextStep: "extract_parameters",
                };
            }
        }
        return { nextStep: "extract_parameters" };
    }
    catch (error) {
        logger.error(`[BuildingTypeNode] Error:`, error);
        return { nextStep: "extract_parameters" };
    }
};
exports.detectBuildingTypeNode = detectBuildingTypeNode;
//# sourceMappingURL=DetectBuildingTypeNode.js.map