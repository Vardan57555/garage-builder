"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComfyUIGenerator = exports.generateGarageVisualizationNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const axios_1 = __importDefault(require("axios"));
const logger = (0, Log_1.createLogger)(module);
class ComfyUIGenerator {
    axios;
    pollInterval = 2000;
    maxRetries = 3;
    constructor(comfyuiUrl = "http://localhost:8188") {
        logger.info(`[ComfyUI] Initializing with URL: ${comfyuiUrl}`);
        this.axios = axios_1.default.create({
            baseURL: comfyuiUrl,
            timeout: 120000,
        });
    }
    buildGarageWorkflow(prompt, width = 1024, height = 768, seed = -1) {
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
    buildGaragePrompt(params) {
        const width = params.width || 20;
        const length = params.length || 20;
        const height = params.height || 10;
        const roofType = params.roof_type || "gable";
        return `Professional photorealistic exterior architectural visualization of a metal garage building.

Dimensions: ${width} feet wide by ${length} feet long by ${height} feet tall.
Roof style: ${roofType} roof with clean modern lines.

Features:
- Metal roll-up garage doors with windows and modern handles
- Professional metal siding with corrugated panels
- Concrete foundation pad
- Suburban residential setting with landscaping
- Green lawn and trees in background

Lighting: Golden hour lighting, warm and professional, clear blue sky with subtle clouds.
Perspective: 3/4 front corner architectural view
Quality: Professional real estate photography, 8k, sharp focus, detailed textures
Realistic materials, accurate proportions, professional rendering.

Exclude: people, text, watermarks, signs, vehicles`;
    }
    async queuePrompt(workflow) {
        try {
            logger.info("[ComfyUI] Queueing prompt...");
            const requestBody = {
                prompt: workflow,
                client_id: `client_${Date.now()}_${Math.random()}`,
            };
            logger.info("[ComfyUI] Request body:", JSON.stringify(requestBody, null, 2));
            const response = await this.axios.post("/prompt", requestBody);
            if (response.status !== 200) {
                throw new Error(`ComfyUI queue failed with status ${response.status}`);
            }
            const promptId = response.data.prompt_id;
            logger.info(`[ComfyUI] Prompt queued: ${promptId}`);
            return promptId;
        }
        catch (error) {
            logger.error("[ComfyUI] Queue error:", error.message);
            if (error.response?.data) {
                logger.error("[ComfyUI] Response status:", error.response.status);
                logger.error("[ComfyUI] Response data:", JSON.stringify(error.response.data));
            }
            throw error;
        }
    }
    async pollForCompletion(promptId, timeout = 120000) {
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
                            const nodeOutput = output;
                            if (nodeOutput.images && nodeOutput.images.length > 0) {
                                const image = nodeOutput.images[0];
                                logger.info(`[ComfyUI] Generation complete. Image: ${image.filename}`);
                                return image.filename;
                            }
                        }
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
            }
            catch (error) {
                if (error instanceof Error && error.message.includes("Generation error")) {
                    throw error;
                }
                logger.warn("[ComfyUI] Poll error:", error);
            }
        }
        throw new Error(`Generation timeout after ${timeout}ms`);
    }
    async getImage(filename) {
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
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            logger.info("[ComfyUI] Image retrieved successfully");
            return Buffer.from(response.data);
        }
        catch (error) {
            logger.error("[ComfyUI] Image fetch error:", error);
            throw error;
        }
    }
    async generateGarageImage(params, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger.info(`[ComfyUI] Generation attempt ${attempt}/${retries}...`);
                const prompt = this.buildGaragePrompt(params);
                logger.debug("[ComfyUI] Prompt:", prompt);
                const seed = Math.floor(Math.random() * (2 ** 32 - 1));
                const workflow = this.buildGarageWorkflow(prompt, 1024, 768, seed);
                const promptId = await this.queuePrompt(workflow);
                const filename = await this.pollForCompletion(promptId);
                const imageBuffer = await this.getImage(filename);
                const base64 = imageBuffer.toString("base64");
                logger.info(`[ComfyUI] ✅ Success on attempt ${attempt}`);
                return {
                    success: true,
                    imageData: imageBuffer,
                    base64: `data:image/png;base64,${base64}`,
                    imageUrl: `/generated/${filename}`,
                };
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.warn(`[ComfyUI] Attempt ${attempt} failed: ${errorMsg}`);
                if (attempt < retries) {
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    logger.info(`[ComfyUI] Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        return {
            success: false,
            error: `Generation failed after ${retries} attempts`,
        };
    }
    async checkHealth() {
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
        }
        catch (error) {
            logger.error("[ComfyUI] Health check failed:", error instanceof Error ? error.message : error);
            return {
                healthy: false,
                message: `ComfyUI is unreachable: ${error}`,
            };
        }
    }
}
exports.ComfyUIGenerator = ComfyUIGenerator;
const generateGarageVisualizationNode = async (state) => {
    logger.info(`[VisualizationNode] Session ${state.sessionId} - Generating ComfyUI visualization`);
    try {
        const params = state.userFriendlyParams;
        const selectedAddons = state.selectedAddons || [];
        const basePrice = state.basePrice || 0;
        const finalTotal = state.finalPrice || basePrice;
        if (!params.width || !params.length || !params.height) {
            logger.error("[VisualizationNode] Missing required dimensions");
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
            logger.warn(`[VisualizationNode] ComfyUI not available: ${health.message}`);
        }
        let imageUrl = null;
        let base64Image = null;
        logger.info("[VisualizationNode] Starting ComfyUI image generation...");
        try {
            const result = await generator.generateGarageImage(params, 3);
            if (result.success && result.base64) {
                logger.info("[VisualizationNode] ✅ ComfyUI image generated");
                base64Image = result.base64;
                imageUrl = result.imageUrl;
            }
            else {
                logger.warn(`[VisualizationNode] Generation failed: ${result.error}`);
            }
        }
        catch (error) {
            logger.error("[VisualizationNode] ComfyUI generation error:", error);
        }
        const sqft = params.width * params.length;
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const contingency = (basePrice +
            laborCost +
            foundationCost +
            deliveryCost +
            addonTotal) *
            0.05;
        const response = formatFinalQuoteWithComfyUIImage(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, base64Image);
        return {
            response,
            finalPrice: finalTotal,
            generatedImageUrl: imageUrl,
            generatedImageBase64: base64Image,
            nextStep: "__end__",
        };
    }
    catch (error) {
        logger.error("[VisualizationNode] Error:", error);
        return {
            response: `FINAL QUOTE\n\nFinal Price: $${(state.finalPrice || state.basePrice || 0).toFixed(2)}`,
            finalPrice: state.finalPrice || state.basePrice || 0,
            nextStep: "__end__",
        };
    }
};
exports.generateGarageVisualizationNode = generateGarageVisualizationNode;
function formatFinalQuoteWithComfyUIImage(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, imageBase64) {
    const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
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
    }
    else {
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
        selectedAddons.forEach((a) => {
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
//# sourceMappingURL=VisualizationNode.js.map