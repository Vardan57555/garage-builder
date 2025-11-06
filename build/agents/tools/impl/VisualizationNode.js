"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGarageVisualizationNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const OllamaImageGenerator_1 = require("../../tools/impl/OllamaImageGenerator");
const logger = (0, Log_1.createLogger)(module);
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
📐 ${params.width}' × ${params.length}' × ${params.height}' garage

`;
    }
    else if (svgFallback) {
        response += `${svgFallback}

📐 **Building diagram** (${params.width}' × ${params.length}' × ${params.height}')

`;
    }
    else {
        response += `📐 **Building Specifications:**
• Dimensions: ${params.width}' × ${params.length}' × ${params.height}'
• Roof: ${params.roof_type || 'regular'}
• Area: ${sqft} sq ft

`;
    }
    response += `${line}
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
function generateSimpleSVGFallback(spec) {
    const { width, length, height } = spec;
    const scale = 3.5;
    const svgWidth = length * scale + 120;
    const svgHeight = height * scale + 200;
    return `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#f0f0f0;border:1px solid #ddd;border-radius:4px"><rect x="60" y="100" width="${length * scale}" height="${height * scale}" fill="#C0504D" stroke="#333" stroke-width="2"/><text x="${60 + length * scale / 2}" y="${100 + height * scale + 30}" text-anchor="middle" font-size="14" font-weight="bold">${length}' Long</text><text x="20" y="${100 + height * scale / 2}" text-anchor="middle" font-size="14" font-weight="bold" transform="rotate(-90 20 ${100 + height * scale / 2})">${height}'</text><text x="${60 + length * scale + 30}" y="${100 + height * scale / 2}" font-size="14" font-weight="bold">${width}'</text></svg>`;
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
        logger.info("[VisualizationNode] Attempting AI image generation...");
        try {
            const imagePromise = (0, OllamaImageGenerator_1.generateWithStableDiffusionWebUI)(params);
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 60000));
            imageUrl = await Promise.race([imagePromise, timeoutPromise]);
            if (imageUrl) {
                logger.info(`[VisualizationNode] ✅ AI image generated successfully`);
            }
            else {
                logger.warn("[VisualizationNode] AI generation timeout, using fallback");
            }
        }
        catch (error) {
            logger.warn(`[VisualizationNode] AI generation failed: ${error}`);
        }
        if (!imageUrl) {
            logger.info("[VisualizationNode] Generating SVG fallback...");
            svgFallback = generateSimpleSVGFallback({
                width: params.width,
                length: params.length,
                height: params.height,
                roofType: params.roof_type || "regular"
            });
        }
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
//# sourceMappingURL=VisualizationNode.js.map