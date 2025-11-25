import {IStateReset} from "@agents/tools/impl/io/IResetNode";
import {ResetMessageConfig, ResetState} from "@agents/tools/io/IReset";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {InstantiationError} from "@errors/InstantiationError";
const logger: pino.Logger = createLogger(module);

/**
 * Manages application state reset operations
 */
export class StateReset implements IStateReset
{
    private static instance: StateReset;

    private readonly messageConfig: ResetMessageConfig;

    constructor(enforce: () => void, config?: ResetMessageConfig)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateReset.getInstance() instead of new.");
        }

        this.messageConfig = config || this.getDefaultMessageConfig();
    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IStateReset
    {
        if(!StateReset.instance)
        {
            StateReset.instance = new StateReset(Enforce);
        }

        return StateReset.instance;
    }

    /**
     * Execute the reset operation
     */
    public execute(): ResetState
    {
        logger.info(`[StateReset] Initiating state reset`);

        const cleanState: Omit<ResetState, "response"> = this.createCleanState();
        const response: string = this.buildResponseMessage();

        logger.debug(`[StateReset] Generated response: "${response}"`);
        logger.debug(`[StateReset] Clean state created with nextStep: ${cleanState.nextStep}`);

        return {...cleanState, response,};
    }

    /**
     * Get default message configuration
     */
    private getDefaultMessageConfig(): ResetMessageConfig
    {
        return {
            greeting: "Got it! Let's start fresh.",
            prompt: "Tell me about your new building - dimensions or building type?",
        };
    }

    /**
     * Create the reset response message
     */
    private buildResponseMessage(): string
    {
        return `${this.messageConfig.greeting}\n${this.messageConfig.prompt}`;
    }

    /**
     * Generate a clean initial state
     */
    private createCleanState(): Omit<ResetState, "response">
    {
        return {
            userFriendlyParams: {},
            hasGarageIntent: false,
            priceCalculated: false,
            currentField: null,
            nextStep: "__end__",
        };
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
