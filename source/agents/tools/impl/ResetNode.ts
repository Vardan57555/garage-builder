import { LeadAgentStateType } from "@agents/LeadAgentState";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { ResetMessageConfig, ResetState } from "../io/IReset";
import {IResetNodeHandler, IStateReset} from "@agents/tools/impl/io/IResetNode";
import {InstantiationError} from "@errors/InstantiationError";
import { ResetValidator } from "../validators/ResetValidator";
import {StateReset} from "@agents/tools/impl/StateReset";
const logger: pino.Logger = createLogger(module);

/**
 * Orchestrates the reset operation with validation and logging
 */
class ResetNodeHandler implements IResetNodeHandler
{
    private static instance: IResetNodeHandler;
    private readonly stateReset: IStateReset;

    constructor(enforce: () => void,validator?: ResetValidator, stateReset?: StateReset)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ResetNodeHandler.getInstance() instead of new.");
        }

        this.stateReset = stateReset || StateReset.getInstance();
    }

    /**
     * Gets the singleton instance of ResetValidator.
     *
     * @returns The singleton instance of ResetValidator.
     */

    public static getInstance(): IResetNodeHandler
    {
        if(!ResetNodeHandler.instance)
        {
            ResetNodeHandler.instance = new ResetNodeHandler(Enforce);
        }

        return ResetNodeHandler.instance;
    }

    /**
     * Handle reset request with validation and error handling
     */
    public async handle(state: LeadAgentStateType): Promise<ResetState>
    {
        logger.info(`[ResetNodeHandler] User requested reset - Session: ${state.sessionId}`);

        try
        {
            if (!ResetValidator.validateState(state))
            {
                logger.error(`[ResetNodeHandler] State validation failed`);
                throw new Error("Invalid state provided to reset handler");
            }

            if (!ResetValidator.shouldReset(state))
            {
                logger.debug(`[ResetNodeHandler] Reset check passed but no data to reset`);
            }

            const resetState = this.stateReset.execute();

            logger.info(`[ResetNodeHandler] Reset completed successfully - Session: ${state.sessionId}`);

            return resetState;
        }
        catch (error)
        {
            logger.error(`[ResetNodeHandler] Error during reset operation:`,
                {
                    sessionId: state.sessionId,
                    error: error instanceof Error ? error.message : String(error),
                }
            );

            throw error;
        }
    }
}

/**
 * NODE: Handle user reset request
 */
export const handleResetNode = async (state: LeadAgentStateType): Promise<ResetState> =>
{
    const handler: IResetNodeHandler =  ResetNodeHandler.getInstance();
    return handler.handle(state);
};

/**
 * Export classes for testing and custom configurations
 */
export { ResetNodeHandler, StateReset, ResetState, ResetMessageConfig };

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
