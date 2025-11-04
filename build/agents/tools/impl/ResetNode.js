"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResetNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const handleResetNode = async (state) => {
    logger.info(`[ResetNode] User requested reset`);
    const response = "Got it! Let's start fresh.\n" +
        "Tell me about your new building - dimensions or building type?";
    return {
        userFriendlyParams: {},
        hasGarageIntent: false,
        priceCalculated: false,
        currentField: null,
        response,
        nextStep: "__end__",
    };
};
exports.handleResetNode = handleResetNode;
//# sourceMappingURL=ResetNode.js.map