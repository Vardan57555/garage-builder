import {
    ComfyUIWorkflow,
    GenerationResult,
    HealthCheckResult,
    QuoteBreakdown, VisualizationResponse
} from "@agents/tools/impl/io/IVisualization";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {DimensionResult, ExtractionContext} from "@agents/tools/impl/io/IParameterExtraction";

export interface IWorkflowBuilder
{
    buildGarageWorkflow(prompt: string, width?: number, height?: number, seed?: number): ComfyUIWorkflow;
}


export interface IPromptBuilder
{
    buildGaragePrompt(params: UserFriendlyParams): string;

    buildUnifiedPrompt(context: ExtractionContext, calculation: DimensionResult): string
}


export interface IComfyUIClient
{
    queuePrompt(workflow: ComfyUIWorkflow): Promise<string>;

    pollForCompletion(promptId: string): Promise<string>;

    getImage(filename: string): Promise<Buffer>;

    checkHealth(): Promise<HealthCheckResult>;
}


export interface IGarageImageGenerator
{
    generate(params: UserFriendlyParams, retries?: number): Promise<GenerationResult>;

    checkHealth(): Promise<HealthCheckResult>;
}

export interface IQuoteResponseFormatter
{
    formatFinalQuote(params: UserFriendlyParams, breakdown: QuoteBreakdown, selectedAddons?: any[], imageBase64?: string | null): string;
}

export interface IVisualizationOrchestrator
{
    generateVisualization(state: any): Promise<VisualizationResponse>;
}

