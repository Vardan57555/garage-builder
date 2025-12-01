import { AddonFromDB } from "@agents/tools/io/IAddonDatabase";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import {Addon, ProcessingResult, SelectedAddon} from "@agents/tools/io/IProcessAddon";
import {AddonMenuItem, ShowAddonsResponse} from "@agents/tools/io/IShowAddons";

export interface AddonService
{
    fetchFromDatabase(): Promise<AddonFromDB[]>;

    getAddonsWithCache(): Promise<AddonFromDB[]>;

    getLimitedAddonsByType(addons: AddonFromDB[], limitPerType?: number): AddonFromDB[];

    clearCache(): void;

    process(state: LeadAgentStateType): Promise<ProcessingResult>

    parse(userInput: string, addonsMenu: Addon[]): Promise<SelectedAddon[]>

    execute(state: LeadAgentStateType): Promise<ShowAddonsResponse>

    getAddonsMenu(): Promise<AddonMenuItem[]>

    buildPromptMessage(currentParams: string, addonDisplay: string): string

    buildFallbackMessage(): string

    buildErrorMessage(): string

    formatMenu(addons: AddonMenuItem[]): string
}
