import {LeadAgentStateType} from "@agents/LeadAgentState";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * Validates the reset operation can proceed
 */
export class ResetValidator
{
    /**
     * Validate state object exists and has required properties
     */
    static validateState(state: LeadAgentStateType): boolean
    {
        if (!state)
        {
            logger.warn(`[ResetValidator] Invalid state: state is null or undefined`);
            return false;
        }

        if (!state.sessionId)
        {
            logger.warn(`[ResetValidator] Invalid state: missing sessionId`);
            return false;
        }

        return true;
    }

    /**
     * Check if reset is appropriate (e.g., state contains data to reset)
     */
    static shouldReset(state: LeadAgentStateType): boolean
    {
        const hasExistingData: boolean =
            Object.keys(state.userFriendlyParams || {}).length > 0 ||
            state.priceCalculated ||
            state.currentField !== null;

        if (!hasExistingData)
        {
            logger.debug(`[ResetValidator] No existing data to reset`);
        }

        return true;
    }
}
