import {ResetState} from "@agents/tools/io/IReset";
import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface IStateReset
{
    execute(): ResetState;
}


export interface IResetNodeHandler
{
    handle(state: LeadAgentStateType): Promise<ResetState>;
}
