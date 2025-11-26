/**
 * Domain types
 */
export interface ComfyUIWorkflow
{
    [key: string]: {
        class_type: string;
        inputs: Record<string, any>;
    };
}

export interface ComfyUIResponse
{
    prompt_id: string;
}

export interface GenerationResult
{
    success: boolean;
    imageUrl?: string;
    imageData?: Buffer;
    error?: string;
    base64?: string;
}

export interface HealthCheckResult
{
    healthy: boolean;
    message: string;
}

export interface QuoteBreakdown
{
    basePrice: number;
    laborCost: number;
    foundationCost: number;
    deliveryCost: number;
    contingency: number;
    addonTotal: number;
    finalTotal: number;
}

export interface VisualizationResponse
{
    response: string;
    finalPrice: number;
    generatedImageUrl?: string | null;
    generatedImageBase64?: string | null;
    nextStep: string;
}

/**
 * Configuration for ComfyUI workflow
 */
export interface WorkflowConfig
{
    model: string;
    steps: number;
    cfg: number;
    sampler: string;
    scheduler: string;
    width: number;
    height: number;
    negativePrompt: string;
}
