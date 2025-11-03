import {LeadAgentStateType} from "@agents/LeadAgentState";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export const handleResetNode = async (state: LeadAgentStateType) => {
    logger.info(`[ResetNode] User requested reset`);

    const response =
        "Got it! Let's start fresh.\n" +
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
