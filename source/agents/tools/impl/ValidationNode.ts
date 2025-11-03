import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export const checkMissingFieldsNode = async (state: LeadAgentStateType) => {
    logger.info(`[ValidationNode] Checking missing fields`);

    if (state.pendingUpdates && state.pendingUpdates.length > 0) {
        logger.info(`[ValidationNode] Pending updates found, routing to handle_update`);
        return {
            userFriendlyParams: state.userFriendlyParams,
            nextStep: "handle_update",
        };
    }

    const missingFields = LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
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
