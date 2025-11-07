"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGarageVisualizationNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const logger = (0, Log_1.createLogger)(module);
async function generateWithPollinations(params) {
    try {
        const width = params.width || 20;
        const length = params.length || 20;
        const height = params.height || 10;
        const roofType = params.roof_type || "regular";
        const prompt = `professional photorealistic garage building exterior, 
${width} feet wide by ${length} feet long by ${height} feet tall, 
${roofType} roof style metal building, 
modern roll-up garage door with windows, 
dark gray or burgundy metal siding with light trim,
corrugated metal panels, 
suburban residential setting,
golden hour lighting, 
clear blue sky,
concrete pad foundation,
green lawn,
3/4 front corner view,
architectural visualization,
professional real estate photography,
8k quality, sharp focus,
no people, no text, no watermarks`;
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&model=flux-pro&seed=${Date.now()}`;
        logger.info("[generateWithPollinations] Calling API...");
        const axios = await Promise.resolve().then(() => __importStar(require("axios"))).then(m => m.default);
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const base64 = Buffer.from(response.data).toString('base64');
        logger.info("[generateWithPollinations] ✅ Success!");
        return `data:image/png;base64,${base64}`;
    }
    catch (error) {
        logger.warn(`[generateWithPollinations] Failed: ${error}`);
        return null;
    }
}
async function generateGarageImageWithRetry(params, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        logger.info(`[generateGarageImageWithRetry] Attempt ${attempt}/${maxRetries}...`);
        try {
            const result = await Promise.race([
                generateWithPollinations(params),
                new Promise((resolve) => setTimeout(() => resolve(null), 90000))
            ]);
            if (result) {
                logger.info(`[generateGarageImageWithRetry] ✅ Success on attempt ${attempt}`);
                return result;
            }
            logger.warn(`[generateGarageImageWithRetry] Attempt ${attempt} returned null`);
        }
        catch (error) {
            logger.warn(`[generateGarageImageWithRetry] Attempt ${attempt} error: ${error}`);
        }
        if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1);
            logger.info(`[generateGarageImageWithRetry] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    logger.error("[generateGarageImageWithRetry] All retries exhausted");
    return null;
}
function generateSVGFallback(spec) {
    const scale = 20;
    const svgWidth = spec.length * scale + 100;
    const svgHeight = spec.height * scale + 150;
    const roofHeight = spec.height * scale * 0.3;
    const x = 50;
    const y = 80;
    const w = spec.length * scale;
    const h = spec.height * scale;
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); border: 2px solid #333; border-radius: 8px;">`;
    svg += `<defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#A9A9A9;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#696969;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#505050;stop-opacity:1" />
    </linearGradient>
</defs>`;
    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="url(#skyGrad)"/>`;
    if (spec.roofType === "vertical") {
        const roofPoints = `${x},${y} ${x + w / 2},${y - roofHeight} ${x + w},${y}`;
        svg += `<polygon points="${roofPoints}" fill="#8B4513" stroke="#333" stroke-width="2"/>`;
    }
    else if (spec.roofType === "box") {
        svg += `<rect x="${x}" y="${y - roofHeight / 2}" width="${w}" height="${roofHeight / 2}" fill="#505050" stroke="#333" stroke-width="2"/>`;
    }
    else if (spec.roofType === "a-frame") {
        const roofPoints = `${x},${y} ${x + w / 2},${y - roofHeight * 1.2} ${x + w},${y}`;
        svg += `<polygon points="${roofPoints}" fill="#A52A2A" stroke="#333" stroke-width="2"/>`;
    }
    else {
        svg += `<path d="M ${x} ${y} L ${x + w / 2} ${y - roofHeight * 0.5} L ${x + w} ${y}" fill="#696969" stroke="#333" stroke-width="2"/>`;
    }
    svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#metalGrad)" stroke="#333" stroke-width="2"/>`;
    for (let i = 0; i < w; i += 40) {
        svg += `<line x1="${x + i}" y1="${y}" x2="${x + i}" y2="${y + h}" stroke="#555" stroke-width="1" opacity="0.6"/>`;
    }
    const doorX = x + w * 0.15;
    const doorY = y + h * 0.1;
    const doorW = w * 0.7;
    const doorH = h * 0.75;
    svg += `<rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#D4A574" stroke="#333" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) {
        const panelY = doorY + (i * doorH / 4);
        svg += `<line x1="${doorX}" y1="${panelY}" x2="${doorX + doorW}" y2="${panelY}" stroke="#333" stroke-width="1"/>`;
    }
    for (let i = 0; i < 3; i++) {
        const panelX = doorX + ((i + 1) * doorW / 3);
        svg += `<line x1="${panelX}" y1="${doorY}" x2="${panelX}" y2="${doorY + doorH}" stroke="#333" stroke-width="1"/>`;
    }
    svg += `<rect x="${doorX + doorW * 0.15}" y="${doorY + doorH * 0.1}" width="${doorW * 0.7}" height="${doorH * 0.15}" fill="#87CEEB" stroke="#333" stroke-width="1" opacity="0.7"/>`;
    svg += `<rect x="${x - 10}" y="${y + h}" width="${w + 20}" height="20" fill="#8B7355" stroke="#333" stroke-width="2"/>`;
    const labelY = y + h + 50;
    svg += `<text x="${x + w / 2}" y="${labelY}" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">
${spec.length}' Long
</text>`;
    svg += `<text x="${x - 35}" y="${y + h / 2}" text-anchor="end" font-size="16" font-weight="bold" fill="#333" transform="rotate(-90 ${x - 35} ${y + h / 2})">
${spec.height}' Tall
</text>`;
    svg += `<text x="${x + w + 35}" y="${y + h / 2 + 10}" font-size="16" font-weight="bold" fill="#333">
${spec.width}'
</text>`;
    svg += `<text x="${svgWidth / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">
${spec.roofType.toUpperCase()} ROOF GARAGE
</text>`;
    svg += `</svg>`;
    return svg;
}
function formatFinalQuoteWithImage(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, imageUrl, svgFallback) {
    const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(params);
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
    const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    let response = `✅ YOUR FINAL GARAGE QUOTE

${currentParams}

${line}
🎨 BUILDING VISUALIZATION:
${line}

`;
    if (imageUrl && imageUrl.startsWith('data:image')) {
        response += `![Garage Rendering](${imageUrl})

✨ **AI-Generated photorealistic rendering** 
Professional architectural visualization quality
`;
    }
    else if (svgFallback) {
        response += `${svgFallback}

📐 **Building Diagram** (${params.width}' × ${params.length}' × ${params.height}')
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
        selectedAddons.forEach(a => {
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

📞 Ready to Order?
Contact us to discuss:
• Custom modifications
• Financing options
• Installation timeline (2-4 weeks)
• Warranty details

🔧 Want to modify anything?
Say "change width to 30" or "start over" for a new quote.`;
    return response;
}
const generateGarageVisualizationNode = async (state) => {
    logger.info(`[VisualizationNode] Session ${state.sessionId} - Generating visualization`);
    try {
        const params = state.userFriendlyParams;
        const selectedAddons = state.selectedAddons || [];
        const basePrice = state.basePrice || 0;
        const finalTotal = state.finalPrice || basePrice;
        if (!params.width || !params.length || !params.height) {
            logger.error(`[VisualizationNode] Missing required dimensions`);
            return {
                response: "Error: Missing building dimensions",
                nextStep: "__end__",
            };
        }
        let imageUrl = null;
        let svgFallback = null;
        logger.info("[VisualizationNode] Attempting AI image generation with retries...");
        try {
            imageUrl = await generateGarageImageWithRetry(params, 3);
            if (imageUrl) {
                logger.info(`[VisualizationNode] ✅ AI image generated successfully`);
            }
            else {
                logger.warn("[VisualizationNode] AI generation exhausted retries, using SVG fallback");
            }
        }
        catch (error) {
            logger.warn(`[VisualizationNode] AI generation failed: ${error}`);
        }
        logger.info("[VisualizationNode] Generating SVG fallback...");
        svgFallback = generateSVGFallback({
            width: params.width,
            length: params.length,
            height: params.height,
            roofType: params.roof_type || "regular"
        });
        const sqft = params.width * params.length;
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const contingency = (basePrice + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;
        const response = formatFinalQuoteWithImage(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, imageUrl, svgFallback);
        logger.info(`[VisualizationNode] ✅ Visualization complete (${imageUrl ? 'AI' : 'SVG'})`);
        return {
            response,
            finalPrice: finalTotal,
            generatedImageUrl: imageUrl,
            nextStep: "__end__",
        };
    }
    catch (error) {
        logger.error(`[VisualizationNode] Error:`, error);
        const finalTotal = state.finalPrice || state.basePrice || 0;
        const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
        return {
            response: `FINAL QUOTE\n\n${currentParams}\n\nFinal Price: $${finalTotal.toFixed(2)}`,
            finalPrice: finalTotal,
            nextStep: "__end__",
        };
    }
};
exports.generateGarageVisualizationNode = generateGarageVisualizationNode;
//# sourceMappingURL=OllamaImageGenerator.js.map