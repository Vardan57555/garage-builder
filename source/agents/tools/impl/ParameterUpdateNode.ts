import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {ParameterUpdateService} from "@agents/tools/impl/io/ParameterUpdateService";
import {ParameterUpdateServiceImpl} from "@agents/tools/impl/ParameterUpdateServiceImpl";
const logger: pino.Logger = createLogger(module);

class ParameterUpdateHandler
{
    private parameterUpdateServiceImpl: ParameterUpdateService;

    constructor()
    {
        this.parameterUpdateServiceImpl =  ParameterUpdateServiceImpl.getInstance();
    }

    public async handle(state: LeadAgentStateType): Promise<Partial<LeadAgentStateType>>
    {
        logger.info(`[ParameterUpdateHandler] Pending updates: ${state.pendingUpdates.length}`);

        if (!state.pendingUpdates || state.pendingUpdates.length === 0)
        {
            return this.handleNoUpdates(state);
        }

        return this.handlePendingUpdates(state);
    }

    private handleNoUpdates(state: LeadAgentStateType): Partial<LeadAgentStateType>
    {
        const missingFields: string[] = LeadAgentHelpers.getMissingFields(state.userFriendlyParams);

        if (missingFields.length === 0)
        {
            return {
                userFriendlyParams: state.userFriendlyParams,
                nextStep: "calculate_price",
                pendingUpdates: [],
            };
        }

        return {
            userFriendlyParams: state.userFriendlyParams,
            currentField: missingFields[0] as keyof UserFriendlyParams,
            nextStep: "ask_for_field",
            pendingUpdates: [],
        };
    }

    private async handlePendingUpdates(state: LeadAgentStateType): Promise<Partial<LeadAgentStateType>>
    {
        let updatedParams = { ...state.userFriendlyParams };
        const updateMessages: string[] = [];
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        for (const update of state.pendingUpdates)
        {
            logger.info(`[ParameterUpdateHandler] Processing: ${update.field} = ${update.value}`);

            const processResult = await this.parameterUpdateServiceImpl.process(
                update,
                userInput,
                updatedParams,
                state.stateMapCache
            );

            if ("error" in processResult)
            {
                return processResult.error;
            }

            const { result } = processResult;

            if (!result.success)
            {
                continue;
            }

            updateMessages.push(result.message);

            if (result.updatedParams)
            {
                updatedParams = { ...result.updatedParams };
            }
        }

        logger.info(`[ParameterUpdateHandler] All updates applied, checking missing fields`);

        const missingFields = LeadAgentHelpers.getMissingFields(updatedParams);

        if (missingFields.length === 0)
        {
            logger.info(`[ParameterUpdateHandler] All fields complete, moving to price calc`);
            return {
                response: updateMessages.join(" | "),
                userFriendlyParams: updatedParams,
                priceCalculated: false,
                currentField: null,
                nextStep: "calculate_price",
                pendingUpdates: [],
            };
        }

        const nextField = missingFields[0] as keyof UserFriendlyParams;
        logger.info(`[ParameterUpdateHandler] Next missing field: ${nextField}`);

        return {
            response: updateMessages.join(" | "),
            userFriendlyParams: updatedParams,
            currentField: nextField,
            nextStep: "ask_for_field",
            pendingUpdates: [],
        };
    }
}

const handler = new ParameterUpdateHandler();

export const handleParameterUpdateNode = async (state: LeadAgentStateType): Promise<Partial<LeadAgentStateType>> =>
{
    return handler.handle(state);
};
