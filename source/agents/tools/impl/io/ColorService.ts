import {ColorDisplayEntry, ColorNodeResponse, ColorOption} from "@agents/tools/io/IColorChoice";
import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface ColorService
{
    get(): Promise<ColorOption[]>;

    clear(): void;

    execute(state: LeadAgentStateType): Promise<ColorNodeResponse>;

    match(): ColorOption | null;

    createErrorResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse

    detect(userInput: string, colorOptions: ColorOption[]): ColorOption | null

    fetch(): Promise<ColorOption[]>

    group(colors: ColorOption[], limitPerCategory:number): Map<string, ColorOption[]>

    match(): ColorOption | null

    createSelectionResponse(currentParams: string, colorMenu: string, instructions: string, displayColors: ColorOption[]): ColorNodeResponse

    createSkipResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse

    buildColorMenu(groupedColors: Map<string, ColorOption[]>): { menu: string; displayEntries: ColorDisplayEntry[]; }

    buildInstructions(): string

    buildPrompt(currentParams: string, colorMenu: string, instructions: string): string

    transformRow(row: any): ColorOption

    transformRows(rows: any[]): ColorOption[]

    isValid(color: ColorOption): boolean

    execute(state: LeadAgentStateType): Promise<ColorNodeResponse>
}
