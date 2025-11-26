import {LeadAgentStateType} from "@agents/LeadAgentState";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {UpdateResult} from "@agents/tools/io/IParameterUpdate";
import {DimensionResult, ExtractionContext, ExtractionResult} from "@agents/tools/io/IParameterExtraction";

export interface IDimensionManager
{
    calculateDimensions(input: string): DimensionResult;

    isGarageTypeChanged(newGarageType?: string, oldGarageType?: string): boolean;

    clearDimensions(params: Record<string, any>): void;

    applyDimensions(params: Record<string, any>, dimensions: DimensionResult): boolean;

    preserveExistingDimensions(merged: Record<string, any>, current: Record<string, any>, extracted: Record<string, any>): void;

    handleGarageTypeUpdate(value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult
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



