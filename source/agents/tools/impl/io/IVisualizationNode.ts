import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {
    ComfyUIWorkflow,
    GenerationResult,
    HealthCheckResult,
} from "@agents/tools/io/IVisualization";

export interface IWorkflowBuilder
{
    buildGarageWorkflow(prompt: string, width?: number, height?: number, seed?: number): ComfyUIWorkflow;
}


export interface IPromptBuilder
{
    buildGaragePrompt(params: UserFriendlyParams, selectedAddons?: any[]): string;

    buildUnifiedPrompt(): string
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
    generate(
        params: UserFriendlyParams,
        selectedAddons?: any[],
        retries?: number
    ): Promise<GenerationResult>

    checkHealth(): Promise<HealthCheckResult>;
}

