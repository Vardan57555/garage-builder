import {LeadAgentStateType} from "@agents/LeadAgentState";
import {AddonMenuItem, ShowAddonsResponse} from "@agents/tools/io/IShowAddons";

export interface IAddonMenuFormatter
{
    formatMenu(addons: AddonMenuItem[]): string;

    buildPromptMessage(currentParams: string, addonDisplay: string,): string;

    buildFallbackMessage(): string;

    buildErrorMessage(): string;
}


export interface IAddonDataProvider
{
    getAddonsMenu(): Promise<AddonMenuItem[]>;
}

export interface IShowAddonsOrchestrator
{
    execute(state: LeadAgentStateType): Promise<ShowAddonsResponse>;
}
