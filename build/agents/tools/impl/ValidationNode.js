"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMissingFieldsNode = void 0;
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const checkMissingFieldsNode = async (state) => {
    logger.info(`[ValidationNode] Checking missing fields`);
    if (state.pendingUpdates && state.pendingUpdates.length > 0) {
        logger.info(`[ValidationNode] Pending updates found, routing to handle_update`);
        return {
            userFriendlyParams: state.userFriendlyParams,
            nextStep: "handle_update",
        };
    }
    const missingFields = LeadAgentHelpers_1.LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
    logger.info(`[ValidationNode] Missing: ${missingFields.join(", ") || "none"}`);
    if (missingFields.length === 0) {
        logger.info(`[ValidationNode] All fields complete → calculate_price`);
        return {
            userFriendlyParams: state.userFriendlyParams,
            currentField: null,
            nextStep: "calculate_price",
        };
    }
    const currentField = missingFields[0];
    logger.info(`[ValidationNode] Asking for: ${currentField}`);
    return {
        userFriendlyParams: state.userFriendlyParams,
        currentField,
        nextStep: "ask_for_field",
    };
};
exports.checkMissingFieldsNode = checkMissingFieldsNode;
//# sourceMappingURL=ValidationNode.js.map