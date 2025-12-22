import {InstantiationError} from "@errors/InstantiationError";
import { ComfyUIClient } from "./ComfyUIClientNode";
import { WorkflowBuilder } from "./WorkflowBuilderNode";
import { PromptBuilder } from "./PromptBuilderNode";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {IComfyUIClient, IGarageImageGenerator, IPromptBuilder, IWorkflowBuilder} from "./io/IVisualizationNode";
import {ComfyUIWorkflow, GenerationResult, HealthCheckResult} from "@agents/tools/io/IVisualization";
import process from "node:process";
const logger: pino.Logger = createLogger(module);

/**
 * Manages garage image generation with retry logic
 */
export class GarageImageGenerator implements IGarageImageGenerator
{
    private readonly client: IComfyUIClient;
    private readonly workflowBuilder: IWorkflowBuilder;
    private readonly promptBuilder: IPromptBuilder;
    private readonly maxRetries: number = 3;
    private static instance: IGarageImageGenerator;

    constructor(enforce: () => void, comfyuiUrl: string = process.env.COMFYUI_URL || "http://localhost:8188")
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use GarageImageGenerator.getInstance() instead of new.");
        }
        this.client = ComfyUIClient.getInstance(comfyuiUrl);
        this.workflowBuilder = WorkflowBuilder.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
    }

    public static getInstance(comfyuiUrl: string = process.env.COMFYUI_URL ||  "http://localhost:8188"): IGarageImageGenerator
    {
        if(!GarageImageGenerator.instance)
        {
            GarageImageGenerator.instance = new GarageImageGenerator(Enforce, comfyuiUrl);
        }

        return GarageImageGenerator.instance;
    }

    private validateParams(params: UserFriendlyParams): { valid: boolean; error?: string } {
        const required: string[] = ['width', 'length', 'height', 'color'];
        const missing: string[] = required.filter(field => !params[field as keyof UserFriendlyParams]);

        if (missing.length > 0)
        {
            return {
                valid: false,
                error: `Missing parameters: ${missing.join(', ')}`
            };
        }

        return { valid: true };
    }

    public async generate(params: UserFriendlyParams, selectedAddons: any[] = [], retries: number = this.maxRetries): Promise<GenerationResult>
    {
        const validation = this.validateParams(params);
        if (!validation.valid)
        {
            logger.error(`[GarageImageGenerator] Validation failed: ${validation.error}`);
            return {
                success: false,
                error: validation.error
            };
        }

        logger.info(`[GarageImageGenerator] Generating with exact specs:`, {
            width: params.width,
            length: params.length,
            height: params.height,
            roof_type: params.roof_type,
            color: params.color,
            gauge: params.gauge,
            addonsCount: selectedAddons.length,
            addons: selectedAddons.map(a => a.label)
        });

        for (let attempt = 1; attempt <= retries; attempt++)
        {
            try {
                logger.info(`[GarageImageGenerator] Attempt ${attempt}/${retries}...`);

                const prompt: string = this.promptBuilder.buildGaragePrompt(params, selectedAddons);

                logger.debug(`[GarageImageGenerator] Generated prompt length: ${prompt.length} chars`);
                logger.info(`[GarageImageGenerator] Prompt includes:`);
                logger.info(`  - Dimensions: ${params.width}×${params.length}×${params.height}`);
                logger.info(`  - Roof: ${params.roof_type}`);
                logger.info(`  - Color: ${params.color}`);
                logger.info(`  - Gauge: ${params.gauge}`);
                logger.info(`  - Addons: ${selectedAddons.map(a => a.label).join(', ') || 'None'}`);

                const seed: number = Math.floor(Math.random() * (2 ** 32 - 1));
                const workflow: ComfyUIWorkflow = this.workflowBuilder.buildGarageWorkflow(
                    prompt,
                    params.width,
                    params.length,
                    seed
                );

                const promptId: string = await this.client.queuePrompt(workflow);
                const filename: string = await this.client.pollForCompletion(promptId);
                const imageBuffer: Buffer = await this.client.getImage(filename);
                const base64: string = imageBuffer.toString("base64");

                logger.info(`[GarageImageGenerator] ✅ Success on attempt ${attempt}`);

                return {
                    success: true,
                    imageData: imageBuffer,
                    base64: `data:image/png;base64,${base64}`,
                    imageUrl: `/generated/${filename}`,
                };
            }
            catch (error)
            {
                const errorMsg: string = error instanceof Error ? error.message : String(error);
                logger.warn(`[GarageImageGenerator] Attempt ${attempt} failed: ${errorMsg}`);

                if (attempt < retries)
                {
                    const delay: number = 1000 * Math.pow(2, attempt - 1);
                    logger.info(`[GarageImageGenerator] Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        return { success: false, error: `Generation failed after ${retries} attempts` };
    }

    public async checkHealth(): Promise<HealthCheckResult>
    {
        return this.client.checkHealth();
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
