import {DimensionResult, ExtractionContext, ExtractionResult} from "@agents/tools/impl/io/IParameterExtraction";
import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface IDimensionManager
{
    calculateDimensions(input: string): DimensionResult;

    isGarageTypeChanged(newGarageType?: string, oldGarageType?: string): boolean;

    clearDimensions(params: Record<string, any>): void;

    applyDimensions(params: Record<string, any>, dimensions: DimensionResult): boolean;

    preserveExistingDimensions(merged: Record<string, any>, current: Record<string, any>, extracted: Record<string, any>): void;
}


export interface IFallbackExtractor
{
    extract(context: string, baseParams: Record<string, any>): ExtractionResult | null;
}

export interface IParameterExtractor
{
    extract(state: LeadAgentStateType): Promise<ExtractionResult>;

    extractWithUnifiedPrompt(context: ExtractionContext): Promise<string>;
}

export interface ILLMResponseHandler
{
    extractLLMResponse(userInput: string, prompt: string): Promise<string>;
}

export interface IPromptBuilder
{
    buildUnifiedPrompt(context: ExtractionContext, calculation: DimensionResult): string;
}



