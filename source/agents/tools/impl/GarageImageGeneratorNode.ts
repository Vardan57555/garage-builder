import {InstantiationError} from "@errors/InstantiationError";
import { ComfyUIClient } from "./ComfyUIClientNode";
import { WorkflowBuilder } from "./WorkflowBuilderNode";
import { PromptBuilder } from "./PromptBuilderNode";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {IComfyUIClient, IGarageImageGenerator, IPromptBuilder, IWorkflowBuilder} from "./io/IVisualizationNode";
import {ComfyUIWorkflow, GenerationResult, HealthCheckResult} from "@agents/tools/io/IVisualization";
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

    constructor(enforce: () => void, comfyuiUrl: string = "http://localhost:8188")
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use GarageImageGenerator.getInstance() instead of new.");
        }
        this.client = ComfyUIClient.getInstance(comfyuiUrl);
        this.workflowBuilder = WorkflowBuilder.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(comfyuiUrl: string = "http://localhost:8188"): IGarageImageGenerator
    {
        if(!GarageImageGenerator.instance)
        {
            GarageImageGenerator.instance = new GarageImageGenerator(Enforce, comfyuiUrl);
        }

        return GarageImageGenerator.instance;
    }

    /**
     * Generate garage image with retry logic
     */
    public async generate(params: UserFriendlyParams, retries: number = this.maxRetries): Promise<GenerationResult>
    {
        for (let attempt = 1; attempt <= retries; attempt++)
        {
            try
            {
                logger.info(`[GarageImageGenerator] Attempt ${attempt}/${retries}...`);

                const prompt: string = this.promptBuilder.buildGaragePrompt(params);
                const seed: number = Math.floor(Math.random() * (2 ** 32 - 1));
                const workflow: ComfyUIWorkflow = this.workflowBuilder.buildGarageWorkflow(prompt, 1024, 768, seed);

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

    /**
     * Check ComfyUI health
     */
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
