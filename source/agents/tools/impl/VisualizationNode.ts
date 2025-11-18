import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import axios, { AxiosInstance } from "axios";
import { UserFriendlyParams } from "@agents/tools/io/IChat";

const logger: pino.Logger = createLogger(module);

interface ComfyUIWorkflow {
    [key: string]: {
        class_type: string;
        inputs: Record<string, any>;
    };
}

interface ComfyUIResponse {
    prompt_id: string;
}

interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    imageData?: Buffer;
    error?: string;
    base64?: string;
}

/**
 * ComfyUI Image Generator
 * Handles communication with ComfyUI API for professional garage visualizations
 */
class ComfyUIGenerator {
    private axios: AxiosInstance;
    private pollInterval: number = 3000;
    private maxRetries: number = 3;

    constructor(comfyuiUrl: string = "http://comfyui:8188") {
        logger.info(`[ComfyUI] Initializing with URL: ${comfyuiUrl}`);
        this.axios = axios.create({
            baseURL: comfyuiUrl,
            timeout: 120000,
        });
    }

    /**
     * Build ComfyUI workflow for garage visualization
     */
    private buildGarageWorkflow(
        prompt: string,
        width: number = 1024,
        height: number = 768,
        seed: number = -1
    ): ComfyUIWorkflow {
        return {
            "1": {
                class_type: "CheckpointLoaderSimple",
                inputs: {
                    ckpt_name: "sd_xl_base_1.0.safetensors",
                },
            },
            "2": {
                class_type: "CLIPTextEncode",
                inputs: {
                    text: prompt,
                    clip: ["1", 1],
                },
            },
            "3": {
                class_type: "CLIPTextEncode",
                inputs: {
                    text: "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, signature, cartoon, sketch",
                    clip: ["1", 1],
                },
            },
            "4": {
                class_type: "EmptyLatentImage",
                inputs: {
                    width: width,
                    height: height,
                    batch_size: 1,
                },
            },
            "5": {
                class_type: "KSampler",
                inputs: {
                    seed: seed,
                    steps: 20,
                    cfg: 7.5,
                    sampler_name: "euler",
                    scheduler: "normal",
                    denoise: 1.0,
                    model: ["1", 0],
                    positive: ["2", 0],
                    negative: ["3", 0],
                    latent_image: ["4", 0],
                },
            },
            "6": {
                class_type: "VAEDecode",
                inputs: {
                    samples: ["5", 0],
                    vae: ["1", 2],
                },
            },
            "7": {
                class_type: "SaveImage",
                inputs: {
                    filename_prefix: "garage_gen",
                    images: ["6", 0],
                },
            },
        };
    }

    /**
     * Build detailed garage prompt from parameters
     */
    /**
     * Build detailed garage prompt from parameters
     * ✅ NOW INCLUDES COLOR IN THE PROMPT
     */
    private buildGaragePrompt(params: UserFriendlyParams): string {
        const width = params.width || 20;
        const length = params.length || 20;
        const height = params.height || 10;
        const roofType = params.roof_type || "gable";

        const color = params.color || "gray";

        const colorDescriptions: Record<string, string> = {
            "Barn Red": "barn red, deep red metal panels",
            "Burgundy": "burgundy, dark red wine color",
            "Royal Blue": "royal blue, bright blue",
            "Evergreen": "evergreen, dark forest green",
            "Pewter Gray": "pewter gray, medium gray metallic",
            "White": "white, clean white",
            "Black": "black, matte black",
            "Clay": "clay brown, tan earth tone",
            "Pebble Beige": "pebble beige, light tan",
            "Earth Brown": "earth brown, rich brown"
        };

        const colorDescription = colorDescriptions[color] || color.toLowerCase();

        return `Professional photorealistic exterior architectural visualization of a metal garage building.

Dimensions: ${width} feet wide by ${length} feet long by ${height} feet tall.
Roof style: ${roofType} roof with clean modern lines.

COLOR: ${colorDescription} metal siding and roof panels - this is the PRIMARY color of the entire building.

Features:
- Metal roll-up garage doors with windows and modern handles
- Professional ${colorDescription} corrugated metal panels covering entire building
- ${colorDescription} metal siding on all walls
- ${colorDescription} metal roof panels
- Concrete foundation pad
- Suburban residential setting with landscaping
- Green lawn and trees in background

Lighting: Golden hour lighting, warm and professional, clear blue sky with subtle clouds.
Perspective: 3/4 front corner architectural view showing the ${colorDescription} metal exterior
Quality: Professional real estate photography, 8k, sharp focus, detailed textures, accurate ${colorDescription} color rendering
Realistic materials, accurate proportions, professional rendering.

IMPORTANT: The building must be ${colorDescription} - make this color prominent and realistic.

Exclude: people, text, watermarks, signs, vehicles`;
    }

    /**
     * Queue image generation with ComfyUI
     */
    private async queuePrompt(
        workflow: ComfyUIWorkflow
    ): Promise<string> {
        try {
            logger.info("[ComfyUI] Queueing prompt...");
            const requestBody = {
                prompt: workflow,
                client_id: `client_${Date.now()}_${Math.random()}`,
            };
            logger.info("[ComfyUI] Request body:", JSON.stringify(requestBody, null, 2));

            const response = await this.axios.post<ComfyUIResponse>(
                "/prompt",
                requestBody
            );

            if (response.status !== 200) {
                throw new Error(
                    `ComfyUI queue failed with status ${response.status}`
                );
            }

            const promptId = response.data.prompt_id;
            logger.info(`[ComfyUI] Prompt queued: ${promptId}`);

            return promptId;
        } catch (error: any) {
            logger.error("[ComfyUI] Queue error:", error.message);
            if (error.response?.data) {
                logger.error("[ComfyUI] Response status:", error.response.status);
                logger.error("[ComfyUI] Response data:", JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    /**
     * Poll for generation completion
     */
    private async pollForCompletion(
        promptId: string,
        timeout: number = 120000
    ): Promise<string> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const response = await this.axios.get(`/history/${promptId}`);

                if (response.status === 200 && response.data[promptId]) {
                    const history = response.data[promptId];

                    if (history.status?.status_str === "error") {
                        const errorMsg = history.status?.messages || "Unknown error";
                        throw new Error(`Generation error: ${errorMsg}`);
                    }

                    if (history.outputs) {
                        for (const output of Object.values(history.outputs)) {
                            const nodeOutput = output as any;
                            if (nodeOutput.images && nodeOutput.images.length > 0) {
                                const image = nodeOutput.images[0];
                                logger.info(
                                    `[ComfyUI] Generation complete. Image: ${image.filename}`
                                );
                                return image.filename;
                            }
                        }
                    }
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, this.pollInterval)
                );
            } catch (error) {
                if (error instanceof Error && error.message.includes("Generation error")) {
                    throw error;
                }
                logger.warn("[ComfyUI] Poll error:", error);
            }
        }

        throw new Error(`Generation timeout after ${timeout}ms`);
    }

    /**
     * Retrieve generated image
     */
    private async getImage(filename: string): Promise<Buffer> {
        try {
            logger.info(`[ComfyUI] Fetching image: ${filename}`);

            const response = await this.axios.get("/view", {
                params: {
                    filename: filename,
                    type: "output",
                },
                responseType: "arraybuffer",
            });

            if (response.status !== 200) {
                throw new Error(
                    `Failed to fetch image: ${response.status}`
                );
            }

            logger.info("[ComfyUI] Image retrieved successfully");
            return Buffer.from(response.data);
        } catch (error) {
            logger.error("[ComfyUI] Image fetch error:", error);
            throw error;
        }
    }

    /**
     * Generate garage image with retry logic
     */
    async generateGarageImage(
        params: UserFriendlyParams,
        retries: number = this.maxRetries
    ): Promise<GenerationResult> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger.info(
                    `[ComfyUI] Generation attempt ${attempt}/${retries}...`
                );

                const prompt = this.buildGaragePrompt(params);
                logger.debug("[ComfyUI] Prompt:", prompt);

                const seed = Math.floor(Math.random() * (2 ** 32 - 1));
                const workflow = this.buildGarageWorkflow(prompt, 1024, 768, seed);

                const promptId = await this.queuePrompt(workflow);
                const filename = await this.pollForCompletion(promptId);
                const imageBuffer = await this.getImage(filename);

                const base64 = imageBuffer.toString("base64");

                logger.info(
                    `[ComfyUI] ✅ Success on attempt ${attempt}`
                );

                return {
                    success: true,
                    imageData: imageBuffer,
                    base64: `data:image/png;base64,${base64}`,
                    imageUrl: `/generated/${filename}`,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.warn(
                    `[ComfyUI] Attempt ${attempt} failed: ${errorMsg}`
                );

                if (attempt < retries) {
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    logger.info(
                        `[ComfyUI] Waiting ${delay}ms before retry...`
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, delay)
                    );
                }
            }
        }

        return {
            success: false,
            error: `Generation failed after ${retries} attempts`,
        };
    }

    /**
     * Check ComfyUI health
     */
    async checkHealth(): Promise<{
        healthy: boolean;
        message: string;
    }> {
        try {
            logger.info("[ComfyUI] Checking health...");
            const response = await this.axios.get("/system_stats", {
                timeout: 5000,
            });

            if (response.status === 200) {
                logger.info("[ComfyUI] ✅ Health check passed");
                return {
                    healthy: true,
                    message: "ComfyUI is running and healthy",
                };
            }

            logger.warn(`[ComfyUI] Health check failed with status ${response.status}`);
            return {
                healthy: false,
                message: `ComfyUI returned status ${response.status}`,
            };
        } catch (error) {
            logger.error("[ComfyUI] Health check failed:", error instanceof Error ? error.message : error);
            return {
                healthy: false,
                message: `ComfyUI is unreachable: ${error}`,
            };
        }
    }
}

/**
 * Generate visualization node for garage quotes
 */
export const generateGarageVisualizationNode = async (state: any) => {
    logger.info(
        `[VisualizationNode] Session ${state.sessionId} - Generating ComfyUI visualization`
    );

    try {
        const params = state.userFriendlyParams as UserFriendlyParams;
        const selectedAddons = state.selectedAddons || [];
        const basePrice = state.basePrice || 0;
        const finalTotal = state.finalPrice || basePrice;

        if (!params.width || !params.length || !params.height) {
            logger.error(
                "[VisualizationNode] Missing required dimensions"
            );
            return {
                response: "Error: Missing building dimensions",
                nextStep: "__end__",
            };
        }

        const comfyuiUrl = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
        logger.info(`[VisualizationNode] Using ComfyUI URL: ${comfyuiUrl}`);
        const generator = new ComfyUIGenerator(comfyuiUrl);

        const health = await generator.checkHealth();
        if (!health.healthy) {
            logger.warn(
                `[VisualizationNode] ComfyUI not available: ${health.message}`
            );
        }

        let imageUrl: string | null = null;
        let base64Image: string | null = null;

        logger.info(
            "[VisualizationNode] Starting ComfyUI image generation..."
        );

        try {
            const result = await generator.generateGarageImage(params, 3);

            if (result.success && result.base64) {
                logger.info("[VisualizationNode] ✅ ComfyUI image generated");
                base64Image = result.base64;
                imageUrl = result.imageUrl;
            } else {
                logger.warn(
                    `[VisualizationNode] Generation failed: ${result.error}`
                );
            }
        } catch (error) {
            logger.error(
                "[VisualizationNode] ComfyUI generation error:",
                error
            );
        }

        const sqft = params.width * params.length;
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce(
            (sum: number, addon: any) => sum + (addon.cost || 0),
            0
        );
        const contingency =
            (basePrice +
                laborCost +
                foundationCost +
                deliveryCost +
                addonTotal) *
            0.05;

        const response = formatFinalQuoteWithComfyUIImage(
            params,
            basePrice,
            selectedAddons,
            finalTotal,
            laborCost,
            foundationCost,
            deliveryCost,
            contingency,
            sqft,
            base64Image
        );

        return {
            response,
            finalPrice: finalTotal,
            generatedImageUrl: imageUrl,
            generatedImageBase64: base64Image,
            nextStep: "__end__",
        };
    } catch (error) {
        logger.error("[VisualizationNode] Error:", error);

        return {
            response: `FINAL QUOTE\n\nFinal Price: $${(
                state.finalPrice || state.basePrice || 0
            ).toFixed(2)}`,
            finalPrice: state.finalPrice || state.basePrice || 0,
            nextStep: "__end__",
        };
    }
};

/**
 * Format final quote with ComfyUI-generated image
 */
function formatFinalQuoteWithComfyUIImage(
    params: UserFriendlyParams,
    basePrice: number,
    selectedAddons: any[],
    finalTotal: number,
    laborCost: number,
    foundationCost: number,
    deliveryCost: number,
    contingency: number,
    sqft: number,
    imageBase64: string | null
): string {
    const line =
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    const addonTotal = selectedAddons.reduce(
        (sum: number, addon: any) => sum + (addon.cost || 0),
        0
    );

    let response = `✅ YOUR FINAL GARAGE QUOTE

📐 Building Specifications:
• Width: ${params.width}' | Length: ${params.length}' | Height: ${params.height}'
• Roof Type: ${params.roof_type || "Standard"}

${line}
🎨 BUILDING VISUALIZATION:
${line}

`;

    if (imageBase64) {
        response += `![Garage Rendering](${imageBase64})

✨ **Professional ComfyUI-generated photorealistic rendering**
High-quality architectural visualization
Stable Diffusion XL rendering with professional post-processing
`;
    } else {
        response += `📐 **Visualization unavailable** - Contact support for rendering

`;
    }

    response += `
${line}
📊 DETAILED PRICE BREAKDOWN:
${line}

**Building Kit & Materials:**
• Base Building Package: $${basePrice.toFixed(2)}

**Installation & Construction:**
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}`;

    if (selectedAddons.length > 0) {
        response += `\n\n**Selected Add-ons:**`;
        selectedAddons.forEach((a: any) => {
            response += `\n• ${a.label}: $${(a.cost || 0).toFixed(2)}`;
        });
        response += `\n• Add-ons Total: +$${addonTotal.toFixed(2)}`;
    }

    response += `

${line}
💰 FINAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}
${line}

✅ What's Included:
• Building kit and all materials
• Professional installation labor
• Foundation slab preparation
• Delivery and site setup
${selectedAddons.length > 0 ? `• ${selectedAddons.length} add-on(s)` : ""}
• 5% contingency buffer
• Professional visualization

📞 Ready to Order?
Contact us to discuss:
• Custom modifications
• Financing options
• Installation timeline (2-4 weeks)
• Warranty details`;

    return response;
}

export { ComfyUIGenerator };
