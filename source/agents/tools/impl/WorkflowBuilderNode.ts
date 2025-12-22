import {InstantiationError} from "@errors/InstantiationError";
import {IWorkflowBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import {ComfyUIWorkflow, WorkflowConfig} from "@agents/tools/io/IVisualization";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * Builds and manages ComfyUI workflows
 * ✅ FIXED: Enhanced negative prompts for closed door exteriors
 */
export class WorkflowBuilder implements IWorkflowBuilder
{
    private readonly config: WorkflowConfig;

    private static instance: IWorkflowBuilder;

    constructor(enforce: () => void, config?: Partial<WorkflowConfig>)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use WorkflowBuilder.getInstance() instead of new.");
        }

        this.config = {
            model: "sd_xl_base_1.0.safetensors",
            steps: 40,
            cfg: 9.5,
            sampler: "dpmpp_2m",
            scheduler: "karras",
            width: 1280,
            height: 960,
            negativePrompt: "residential house, home, dwelling, luxury home, mansion, residential building, flat front-only view, straight-on frontal shot, no side wall visible, single-plane composition, flat elevation view, no depth, no three-dimensional form, open doors, ajar doors, partially open doors, door ajar, open garage door, lifted garage door, interior visible, interior view, dark interior, inside view, looking through doorway, people inside, vehicles inside, transparent doors, glass doors, windows in doors, bright interior lighting, interior space visible, gaping entrance, open access point, looking into building, wrong aspect ratio, distorted proportions, stretched dimensions, undersized, oversized, blurry, low quality, poorly rendered, asymmetrical doors, crooked structure, people in scene, vehicles visible, cars visible, trucks visible, wrong color, incorrect color",
            ...config,
        };
    }

    public static getInstance(): IWorkflowBuilder
    {
        if(!WorkflowBuilder.instance)
        {
            WorkflowBuilder.instance = new WorkflowBuilder(Enforce);
        }

        return WorkflowBuilder.instance;
    }

    /**
     * ✅ Calculate pixel dimensions that match building aspect ratio
     */
    private calculateOptimalDimensions(
        buildingWidth: number,
        buildingLength: number,
        basePixelSize: number = 1024
    ): { width: number; height: number } {

        const aspectRatio = buildingWidth / buildingLength;

        logger.info(`[WorkflowBuilder] Aspect ratio calculation:`, {
            buildingWidth,
            buildingLength,
            aspectRatio: aspectRatio.toFixed(3),
            basePixelSize,
        });

        let pixelWidth: number;
        let pixelHeight: number;

        if (aspectRatio > 1.1) {
            pixelWidth = basePixelSize;
            pixelHeight = Math.round(basePixelSize / aspectRatio);
        } else if (aspectRatio < 0.9) {
            pixelHeight = basePixelSize;
            pixelWidth = Math.round(basePixelSize * aspectRatio);
        } else {
            pixelWidth = basePixelSize;
            pixelHeight = basePixelSize;
        }

        pixelWidth = Math.round(pixelWidth / 64) * 64;
        pixelHeight = Math.round(pixelHeight / 64) * 64;

        pixelWidth = Math.max(512, Math.min(1536, pixelWidth));
        pixelHeight = Math.max(512, Math.min(1536, pixelHeight));

        const resultAspectRatio = (pixelWidth / pixelHeight).toFixed(3);
        const buildingAspectRatio = aspectRatio.toFixed(3);

        logger.info(`[WorkflowBuilder] Calculated pixel dimensions:`, {
            pixelWidth,
            pixelHeight,
            resultAspectRatio,
            buildingAspectRatio,
            aspectRatioMatch: Math.abs(aspectRatio - (pixelWidth / pixelHeight)) < 0.1,
            orientation: pixelWidth > pixelHeight ? 'landscape' : pixelWidth < pixelHeight ? 'portrait' : 'square'
        });

        return { width: pixelWidth, height: pixelHeight };
    }

    /**
     * ✅ Build workflow with proper dimensions and negative prompts
     */
    public buildGarageWorkflow(
        prompt: string,
        widthOrBuildingWidth: number = this.config.width,
        heightOrBuildingLength: number = this.config.height,
        seedOrWidth?: number,
    ): ComfyUIWorkflow {

        let pixelWidth: number;
        let pixelHeight: number;
        let seed: number = -1;

        if (widthOrBuildingWidth < 512 && heightOrBuildingLength < 512) {
            logger.info(`[WorkflowBuilder] Using NEW signature with building dimensions`);

            const buildingWidth = widthOrBuildingWidth;
            const buildingLength = heightOrBuildingLength;
            seed = (seedOrWidth !== undefined) ? seedOrWidth : -1;

            const dims = this.calculateOptimalDimensions(buildingWidth, buildingLength);
            pixelWidth = dims.width;
            pixelHeight = dims.height;

            logger.info(`[WorkflowBuilder] Building ${buildingWidth}×${buildingLength}ft → Pixels ${pixelWidth}×${pixelHeight}px`);
        } else {
            logger.info(`[WorkflowBuilder] Using legacy pixel dimensions`);

            pixelWidth = widthOrBuildingWidth;
            pixelHeight = heightOrBuildingLength;
            seed = (seedOrWidth !== undefined) ? seedOrWidth : -1;

            logger.info(`[WorkflowBuilder] Using pixel dimensions: ${pixelWidth}×${pixelHeight}px`);
        }

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
                inputs: {
                    width: pixelWidth,
                    height: pixelHeight,
                    batch_size: 1
                },
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
