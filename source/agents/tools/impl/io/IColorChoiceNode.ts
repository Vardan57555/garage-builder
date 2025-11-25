import {LeadAgentStateType} from "@agents/LeadAgentState";
import {ColorNodeResponse} from "@agents/tools/io/IColorChoice";

export interface IColorNodeManagerFull
{
    /**
     * Executes color selection node workflow
     */
    execute(state: LeadAgentStateType): Promise<ColorNodeResponse>;
}
