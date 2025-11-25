import {IWorkflowBuilder} from "@agents/tools/io/IVisualizationNode";
import {ComfyUIWorkflow, WorkflowConfig} from "@agents/tools/impl/io/IVisualization";
import {InstantiationError} from "@errors/InstantiationError";

/**
 * Builds and manages ComfyUI workflows
 */
export class WorkflowBuilder implements IWorkflowBuilder
{
    private readonly config: WorkflowConfig;

    private static instance: IWorkflowBuilder;

    constructor(enforce: () => void, config?: Partial<WorkflowConfig>)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonDataProvider.getInstance() instead of new.");
        }

        this.config = {
            model: "sd_xl_base_1.0.safetensors",
            steps: 20,
            cfg: 7.5,
            sampler: "euler",
            scheduler: "normal",
            width: 1024,
            height: 768,
            negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature, cartoon, sketch",
            ...config,
        };
    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IWorkflowBuilder
    {
        if(!WorkflowBuilder.instance)
        {
            WorkflowBuilder.instance = new WorkflowBuilder(Enforce);
        }

        return WorkflowBuilder.instance;
    }

    /**
     * Build ComfyUI workflow for garage visualization
     */
    public buildGarageWorkflow(prompt: string, width: number = this.config.width, height: number = this.config.height, seed: number = -1): ComfyUIWorkflow
    {
        return {
            "1": {
                class_type: "CheckpointLoaderSimple",
                inputs: { ckpt_name: this.config.model },
            },
            "2": {
                class_type: "CLIPTextEncode",
                inputs: { text: prompt, clip: ["1", 1] },
            },
            "3": {
                class_type: "CLIPTextEncode",
                inputs: { text: this.config.negativePrompt, clip: ["1", 1] },
            },
            "4": {
                class_type: "EmptyLatentImage",
                inputs: { width, height, batch_size: 1 },
            },
            "5": {
                class_type: "KSampler",
                inputs: {
                    seed,
                    steps: this.config.steps,
                    cfg: this.config.cfg,
                    sampler_name: this.config.sampler,
                    scheduler: this.config.scheduler,
                    denoise: 1.0,
                    model: ["1", 0],
                    positive: ["2", 0],
                    negative: ["3", 0],
                    latent_image: ["4", 0],
                },
            },
            "6": {
                class_type: "VAEDecode",
                inputs: { samples: ["5", 0], vae: ["1", 2] },
            },
            "7": {
                class_type: "SaveImage",
                inputs: { filename_prefix: "garage_gen", images: ["6", 0] },
            },
        };
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
