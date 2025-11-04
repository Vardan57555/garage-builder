"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGarageImageWithOllama = generateGarageImageWithOllama;
exports.generateGarageImageWithStableDiffusion = generateGarageImageWithStableDiffusion;
exports.generateGarageImageWithOllamaPrompting = generateGarageImageWithOllamaPrompting;
exports.generateGarageImageBestAvailable = generateGarageImageBestAvailable;
const axios_1 = __importDefault(require("axios"));
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
async function generateGarageImageWithOllama(params) {
    try {
        logger.info(`[generateGarageImageWithOllama] Starting image generation`);
        logger.info(`[generateGarageImageWithOllama] Dimensions: ${params.width}x${params.length}x${params.height}`);
        const prompt = `Generate a realistic 3D architectural image of a metal garage building:
- Width: ${params.width} feet
- Length: ${params.length} feet
- Height: ${params.height} feet
- Roof type: ${params.roof_type || "regular"}
- Number of garage doors: ${Math.ceil((params.width || 20) / 10)}
- Color: Metallic red/brown with gray trim
- Background: Green grass, clear blue sky
- Lighting: Bright daylight with slight shadows
- Angle: 3/4 front-right perspective
- Style: Photorealistic, professional architectural rendering
- Quality: High detail, sharp focus`;
        logger.info(`[generateGarageImageWithOllama] Sending to Ollama...`);
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const response = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
            model: process.env.OLLAMA_IMAGE_MODEL || "stable-diffusion",
            prompt,
            stream: false,
            parameters: {
                height: 512,
                width: 768,
                steps: 30,
                guidance_scale: 7.5,
                negative_prompt: "blurry, low quality, distorted"
            }
        }, {
            timeout: 120000
        });
        if (response.data.response) {
            logger.info(`[generateGarageImageWithOllama] ✅ Image generated successfully`);
            const imageData = response.data.response;
            const base64Image = `data:image/png;base64,${imageData}`;
            return base64Image;
        }
        logger.warn(`[generateGarageImageWithOllama] No image data in response`);
        return null;
    }
    catch (error) {
        logger.error(`[generateGarageImageWithOllama] Error:`, error);
        return null;
    }
}
async function generateGarageImageWithStableDiffusion(params) {
    try {
        logger.info(`[generateGarageImageWithStableDiffusion] Starting image generation`);
        const prompt = `A photorealistic architectural rendering of a metal garage building, 
${params.width}' wide x ${params.length}' deep x ${params.height}' tall, 
${params.roof_type || "regular"} roof, metallic red exterior, 
${Math.ceil((params.width || 20) / 10)} garage doors, 
sunny day, professional photography style, high quality, sharp focus, 
in a suburban setting with green lawn, 3/4 angle view`;
        const negativePrompt = `blurry, distorted, low quality, ugly, bad proportions, 
text, watermark, cartoon, anime, drawing`;
        logger.info(`[generateGarageImageWithStableDiffusion] Sending to SD WebUI...`);
        const sdUrl = process.env.SD_WEBUI_URL || "http://localhost:7860";
        const response = await axios_1.default.post(`${sdUrl}/api/txt2img`, {
            prompt,
            negative_prompt: negativePrompt,
            steps: 25,
            width: 768,
            height: 512,
            cfg_scale: 7,
            sampler_name: "DPM++ 2M Karras",
            scheduler: "karras",
            seed: -1,
            batch_size: 1,
            n_iter: 1
        }, {
            timeout: 120000
        });
        if (response.data.images && response.data.images.length > 0) {
            logger.info(`[generateGarageImageWithStableDiffusion] ✅ Image generated`);
            const base64Image = `data:image/png;base64,${response.data.images[0]}`;
            return base64Image;
        }
        return null;
    }
    catch (error) {
        logger.error(`[generateGarageImageWithStableDiffusion] Error:`, error);
        return null;
    }
}
async function generateGarageImageWithOllamaPrompting(params) {
    try {
        logger.info(`[generateGarageImageWithOllamaPrompting] Stage 1: Generate enhanced prompt`);
        const basicPrompt = `You are an expert architectural prompt engineer. 
Create a detailed, photorealistic image prompt for generating an image of a metal garage building with these specifications:
- Width: ${params.width} feet
- Length: ${params.length} feet
- Height: ${params.height} feet
- Roof Type: ${params.roof_type || "regular"}
- Building Color: Metallic red/burgundy
- Doors: ${Math.ceil((params.width || 20) / 10)} standard garage doors
- Setting: Suburban residential area

Create a detailed prompt (max 150 words) that would generate a professional, photorealistic image.
Start with: "Create a photorealistic architectural rendering of..."`;
        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const promptResponse = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
            model: "neural-chat",
            prompt: basicPrompt,
            stream: false
        }, { timeout: 30000 });
        if (!promptResponse.data.response) {
            logger.warn(`[generateGarageImageWithOllamaPrompting] Failed to generate enhanced prompt`);
            return null;
        }
        const enhancedPrompt = promptResponse.data.response;
        logger.info(`[generateGarageImageWithOllamaPrompting] ✅ Enhanced prompt created`);
        logger.info(`Prompt: ${enhancedPrompt.substring(0, 100)}...`);
        logger.info(`[generateGarageImageWithOllamaPrompting] Stage 2: Generate image`);
        const imageResponse = await axios_1.default.post(`${ollamaUrl}/api/generate`, {
            model: "stable-diffusion",
            prompt: enhancedPrompt,
            stream: false,
            parameters: {
                height: 512,
                width: 768,
                steps: 30,
                guidance_scale: 7.5
            }
        }, { timeout: 120000 });
        if (imageResponse.data.response) {
            logger.info(`[generateGarageImageWithOllamaPrompting] ✅ Image generated`);
            return `data:image/png;base64,${imageResponse.data.response}`;
        }
        return null;
    }
    catch (error) {
        logger.error(`[generateGarageImageWithOllamaPrompting] Error:`, error);
        return null;
    }
}
async function generateGarageImageBestAvailable(params) {
    logger.info(`[generateGarageImageBestAvailable] Trying image generation methods...`);
    const methods = [
        { name: "Stable Diffusion WebUI", fn: generateGarageImageWithStableDiffusion },
        { name: "Ollama with Prompting", fn: generateGarageImageWithOllamaPrompting },
        { name: "Ollama Direct", fn: generateGarageImageWithOllama },
    ];
    for (const method of methods) {
        try {
            logger.info(`[generateGarageImageBestAvailable] Trying: ${method.name}`);
            const result = await method.fn(params);
            if (result) {
                logger.info(`[generateGarageImageBestAvailable] ✅ Success with: ${method.name}`);
                return result;
            }
        }
        catch (error) {
            logger.warn(`[generateGarageImageBestAvailable] ${method.name} failed:`, error);
            continue;
        }
    }
    logger.warn(`[generateGarageImageBestAvailable] All methods failed`);
    return null;
}
//# sourceMappingURL=OllamaImageGenerator.js.map