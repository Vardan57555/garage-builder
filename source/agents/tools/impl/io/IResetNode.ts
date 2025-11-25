import {ResetState} from "@agents/tools/io/IReset";
import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface IStateReset
{
    /**
     * Executes the reset process and returns a fresh ResetState.
     */
    execute(): ResetState;
}


export interface IResetNodeHandler
{
    /**
     * Handles a reset request:
     * - validates state
     * - checks if reset is appropriate
     * - executes reset
     */
    handle(state: LeadAgentStateType): Promise<ResetState>;
}
