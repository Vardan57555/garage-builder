"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithStableDiffusionWebUI = generateWithStableDiffusionWebUI;
exports.generateWithHuggingFace = generateWithHuggingFace;
exports.generateWithTogetherAI = generateWithTogetherAI;
exports.generateWithSegmind = generateWithSegmind;
exports.generateWithDeepInfra = generateWithDeepInfra;
exports.generateWithPollinations = generateWithPollinations;
exports.generateWithFalAI = generateWithFalAI;
exports.generateGarageImageBest = generateGarageImageBest;
exports.testAllImageMethods = testAllImageMethods;
exports.printSetupGuide = printSetupGuide;
const axios_1 = __importDefault(require("axios"));
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
function buildPhotorealisticPrompt(params) {
    const width = params.width || 20;
    const length = params.length || 20;
    const height = params.height || 10;
    const roofType = params.roof_type || "regular";
    const doorCount = Math.max(1, Math.ceil(width / 10));
    const roofDescriptions = {
        vertical: "modern vertical ribbed metal roof panels with clean lines",
        regular: "horizontal corrugated metal roof with subtle texture",
        box: "contemporary flat metal roof design",
        "a-frame": "elegant peaked A-frame gabled roof structure"
    };
    const roofDesc = roofDescriptions[roofType] || roofDescriptions.regular;
    return `professional architectural photography, modern metal garage building,
photorealistic 8k render, ultra high detail, sharp focus,
${width} feet wide by ${length} feet long by ${height} feet tall,
${roofDesc},
${doorCount} modern roll-up garage door${doorCount > 1 ? 's' : ''} with windows,
dark charcoal gray or burgundy red metal siding,
light gray trim and accents,
corrugated metal wall panels with realistic texture,
3/4 angle perspective from front corner,
smooth concrete foundation slab,
manicured green lawn, 
suburban residential setting,
golden hour lighting, soft shadows,
clear blue sky with few white clouds,
professional real estate photography style,
architectural visualization quality,
depth of field, natural lighting,
8k resolution, photographic quality,
no people, no text, no watermarks`;
}
function buildNegativePrompt() {
    return `blurry, low quality, low resolution, distorted, ugly, deformed,
cartoon, anime, illustration, drawing, painting, sketch,
oversaturated, unrealistic colors, bad proportions, multiple buildings,
people, humans, cars inside, vehicles, text, watermark, signature,
dark, gloomy, night, poor lighting, grainy, noisy`;
}
async function generateWithStableDiffusionWebUI(params) {
    try {
        const sdUrl = process.env.SD_WEBUI_URL || "http://127.0.0.1:7860";
        const prompt = buildPhotorealisticPrompt(params);
        const negativePrompt = buildNegativePrompt();
        logger.info("[SD WebUI] Starting generation...");
        try {
            await axios_1.default.get(`${sdUrl}/sdapi/v1/sd-models`, { timeout: 5000 });
        }
        catch (error) {
            logger.error("[SD WebUI] Not running. Start with: ./webui.sh --api");
            return null;
        }
        const response = await axios_1.default.post(`${sdUrl}/sdapi/v1/txt2img`, {
            prompt,
            negative_prompt: negativePrompt,
            steps: 40,
            width: 1024,
            height: 768,
            cfg_scale: 7.5,
            sampler_name: "DPM++ 2M Karras",
            enable_hr: true,
            hr_scale: 1.5,
            denoising_strength: 0.7
        }, { timeout: 180000 });
        if (response.data.images?.[0]) {
            logger.info("[SD WebUI] ✅ Success");
            return `data:image/png;base64,${response.data.images[0]}`;
        }
        return null;
    }
    catch (error) {
        logger.error("[SD WebUI] Error:", error.message);
        return null;
    }
}
async function generateWithHuggingFace(params) {
    try {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
            logger.warn("[HuggingFace] No API key. Get free key at: https://huggingface.co/settings/tokens");
            return null;
        }
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[HuggingFace] Starting generation...");
        const response = await axios_1.default.post('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
            inputs: prompt,
            parameters: {
                negative_prompt: buildNegativePrompt(),
                num_inference_steps: 40,
                guidance_scale: 7.5,
                width: 1024,
                height: 768
            }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 120000
        });
        const base64 = Buffer.from(response.data).toString('base64');
        logger.info("[HuggingFace] ✅ Success");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        if (error.response?.status === 503) {
            logger.warn("[HuggingFace] Model loading, retry in 20s...");
        }
        else {
            logger.error("[HuggingFace] Error:", error.message);
        }
        return null;
    }
}
async function generateWithTogetherAI(params) {
    try {
        const apiKey = process.env.TOGETHER_API_KEY;
        if (!apiKey) {
            logger.warn("[Together AI] No API key. Get $25 free at: https://api.together.xyz");
            return null;
        }
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[Together AI] Starting generation...");
        const response = await axios_1.default.post('https://api.together.xyz/v1/images/generations', {
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            prompt: prompt,
            negative_prompt: buildNegativePrompt(),
            steps: 40,
            width: 1024,
            height: 768
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000
        });
        const imageUrl = response.data.data[0].url;
        const imageResponse = await axios_1.default.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        const base64 = Buffer.from(imageResponse.data).toString('base64');
        logger.info("[Together AI] ✅ Success");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.error("[Together AI] Error:", error.message);
        return null;
    }
}
async function generateWithSegmind(params) {
    try {
        const apiKey = process.env.SEGMIND_API_KEY;
        if (!apiKey) {
            logger.warn("[Segmind] No API key. Get 100 free at: https://www.segmind.com");
            return null;
        }
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[Segmind] Starting generation...");
        const response = await axios_1.default.post('https://api.segmind.com/v1/sdxl1.0-txt2img', {
            prompt: prompt,
            negative_prompt: buildNegativePrompt(),
            steps: 40,
            width: 1024,
            height: 768,
            guidance_scale: 7.5,
            sampler: "DPM++ 2M Karras",
            scheduler: "karras"
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 120000
        });
        const base64 = Buffer.from(response.data).toString('base64');
        logger.info("[Segmind] ✅ Success");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.error("[Segmind] Error:", error.message);
        return null;
    }
}
async function generateWithDeepInfra(params) {
    try {
        const apiKey = process.env.DEEPINFRA_API_KEY;
        if (!apiKey) {
            logger.warn("[DeepInfra] No API key. Get free credits at: https://deepinfra.com");
            return null;
        }
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[DeepInfra] Starting generation...");
        const response = await axios_1.default.post('https://api.deepinfra.com/v1/inference/stabilityai/stable-diffusion-xl-base-1.0', {
            prompt: prompt,
            negative_prompt: buildNegativePrompt(),
            width: 1024,
            height: 768,
            num_inference_steps: 40,
            guidance_scale: 7.5
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000
        });
        const imageUrl = response.data.images[0];
        const imageResponse = await axios_1.default.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        const base64 = Buffer.from(imageResponse.data).toString('base64');
        logger.info("[DeepInfra] ✅ Success");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.error("[DeepInfra] Error:", error.message);
        return null;
    }
}
async function generateWithPollinations(params) {
    try {
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[Pollinations] Starting generation (100% free)...");
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&model=flux&enhance=true&nologo=true`;
        const response = await axios_1.default.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const base64 = Buffer.from(response.data).toString('base64');
        logger.info("[Pollinations] ✅ Success (completely free!)");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.error("[Pollinations] Error:", error.message);
        return null;
    }
}
async function generateWithFalAI(params) {
    try {
        const apiKey = process.env.FAL_API_KEY;
        if (!apiKey) {
            logger.warn("[Fal.ai] No API key. Get free tier at: https://fal.ai");
            return null;
        }
        const prompt = buildPhotorealisticPrompt(params);
        logger.info("[Fal.ai] Starting generation...");
        const response = await axios_1.default.post('https://fal.run/fal-ai/flux-pro', {
            prompt: prompt,
            image_size: "landscape_16_9",
            num_inference_steps: 40,
            guidance_scale: 7.5
        }, {
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000
        });
        const imageUrl = response.data.images[0].url;
        const imageResponse = await axios_1.default.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        const base64 = Buffer.from(imageResponse.data).toString('base64');
        logger.info("[Fal.ai] ✅ Success");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.error("[Fal.ai] Error:", error.message);
        return null;
    }
}
async function generateGarageImageBest(params) {
    logger.info("[ImageGen] Starting with FREE alternatives...");
    try {
        logger.info("[ImageGen] Trying Pollinations.ai (free, no API key)...");
        const result = await generateWithPollinations(params);
        if (result) {
            return { imageUrl: result, method: "Pollinations.ai (Free)" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] Pollinations failed");
    }
    try {
        logger.info("[ImageGen] Trying local SD WebUI...");
        const result = await generateWithStableDiffusionWebUI(params);
        if (result) {
            return { imageUrl: result, method: "SD WebUI (Local)" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] SD WebUI not available");
    }
    try {
        logger.info("[ImageGen] Trying Hugging Face...");
        const result = await generateWithHuggingFace(params);
        if (result) {
            return { imageUrl: result, method: "Hugging Face (Free Tier)" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] Hugging Face failed");
    }
    try {
        logger.info("[ImageGen] Trying Together AI...");
        const result = await generateWithTogetherAI(params);
        if (result) {
            return { imageUrl: result, method: "Together AI (Free Credits)" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] Together AI failed");
    }
    try {
        logger.info("[ImageGen] Trying Segmind...");
        const result = await generateWithSegmind(params);
        if (result) {
            return { imageUrl: result, method: "Segmind (100 free/month)" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] Segmind failed");
    }
    try {
        logger.info("[ImageGen] Trying DeepInfra...");
        const result = await generateWithDeepInfra(params);
        if (result) {
            return { imageUrl: result, method: "DeepInfra" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] DeepInfra failed");
    }
    try {
        logger.info("[ImageGen] Trying Fal.ai...");
        const result = await generateWithFalAI(params);
        if (result) {
            return { imageUrl: result, method: "Fal.ai" };
        }
    }
    catch (error) {
        logger.warn("[ImageGen] Fal.ai failed");
    }
    logger.error("[ImageGen] ❌ All methods failed");
    return { imageUrl: null, method: "none" };
}
async function testAllImageMethods() {
    const testParams = {
        width: 24,
        length: 20,
        height: 10,
        roof_type: "vertical",
        building_type: "garage"
    };
    logger.info("=== TESTING FREE AI IMAGE GENERATION ===\n");
    const methods = [
        { name: "Pollinations (FREE, NO KEY)", fn: generateWithPollinations },
        { name: "SD WebUI (LOCAL)", fn: generateWithStableDiffusionWebUI },
        { name: "Hugging Face (FREE TIER)", fn: generateWithHuggingFace },
        { name: "Together AI ($25 FREE)", fn: generateWithTogetherAI },
        { name: "Segmind (100 FREE/MONTH)", fn: generateWithSegmind },
        { name: "DeepInfra", fn: generateWithDeepInfra },
        { name: "Fal.ai", fn: generateWithFalAI }
    ];
    for (const method of methods) {
        logger.info(`Testing ${method.name}...`);
        try {
            const result = await method.fn(testParams);
            if (result) {
                logger.info(`✅ ${method.name} WORKS!\n`);
            }
            else {
                logger.warn(`❌ ${method.name} not configured\n`);
            }
        }
        catch (error) {
            logger.warn(`❌ ${method.name} error\n`);
        }
    }
    logger.info("=== TEST COMPLETE ===");
}
function printSetupGuide() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  FREE AI IMAGE GENERATION - QUICK START GUIDE                ║
╚══════════════════════════════════════════════════════════════╝

🚀 EASIEST (NO SETUP):
   Pollinations.ai - 100% FREE, NO API KEY NEEDED
   ✅ Already working! No action needed.

💻 BEST QUALITY (LOCAL):
   AUTOMATIC1111 Stable Diffusion
   1. git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
   2. ./webui.sh --api --listen
   3. export SD_WEBUI_URL=http://127.0.0.1:7860

☁️  FREE CLOUD OPTIONS:

   1. Hugging Face (FREE TIER)
      → https://huggingface.co/settings/tokens
      → export HUGGINGFACE_API_KEY=hf_xxxxx

   2. Together AI ($25 FREE CREDITS)
      → https://api.together.xyz
      → export TOGETHER_API_KEY=xxxxx

   3. Segmind (100 FREE/MONTH)
      → https://www.segmind.com
      → export SEGMIND_API_KEY=xxxxx

   4. DeepInfra (FREE CREDITS)
      → https://deepinfra.com
      → export DEEPINFRA_API_KEY=xxxxx

💡 TIP: The code tries Pollinations first (always free),
   then falls back to other options automatically!

Test all methods: await testAllImageMethods();
`);
}
//# sourceMappingURL=OllamaImageGenerator.js.map