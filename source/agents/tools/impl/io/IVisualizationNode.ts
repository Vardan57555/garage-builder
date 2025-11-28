import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {
    ComfyUIWorkflow,
    GenerationResult,
    HealthCheckResult,
} from "@agents/tools/io/IVisualization";
import {DimensionResult, ExtractionContext} from "@agents/tools/io/IParameterExtraction";

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

