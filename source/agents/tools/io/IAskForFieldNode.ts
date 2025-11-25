import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface IAskForFieldNode
{
    execute(state: LeadAgentStateType): Promise<Record<string, any>>;
}
