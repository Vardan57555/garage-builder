"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGarageVisualizationNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const logger = (0, Log_1.createLogger)(module);
function generateGarageSVG(spec) {
    const { width, length, height, roofType } = spec;
    const scale = 3.5;
    const svgWidth = length * scale + 120;
    const svgHeight = height * scale + 200;
    const wallColor = "#C0504D";
    const roofColor = roofType === "vertical" ? "#2E5C8A" : "#4472C4";
    const trimColor = "#F2F2F2";
    const doorWidth = Math.min(width * scale * 0.25, 60);
    const doorHeight = Math.min(height * scale * 0.6, 80);
    const doorCount = Math.max(1, Math.floor(width / 10));
    const doorSpacing = (length * scale - doorWidth * doorCount) / (doorCount + 1);
    logger.info(`[generateGarageSVG] Generating: ${width}x${length}x${height}`);
    const svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 60%, #90EE90 60%, #7CB342 100%); border: 1px solid #ddd; border-radius: 4px;"><defs><linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:${wallColor};stop-opacity:1" /><stop offset="100%" style="stop-color:#A73D38;stop-opacity:1" /></linearGradient><linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${roofColor};stop-opacity:1" /><stop offset="100%" style="stop-color:#1B3A52;stop-opacity:1" /></linearGradient><filter id="shadow"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter></defs><ellipse cx="${svgWidth / 2}" cy="${svgHeight * 0.68}" rx="${length * scale * 0.45}" ry="20" fill="#00000020"/><g id="building" filter="url(#shadow)"><rect x="60" y="100" width="${length * scale}" height="${height * scale}" fill="url(#wallGradient)" stroke="#5B2E2E" stroke-width="2"/>${roofType === "vertical" ? `<polygon points="60,100 ${60 + length * scale},100 ${60 + length * scale / 2},${100 - height * scale * 0.3}" fill="url(#roofGradient)" stroke="#1B3A52" stroke-width="2"/>` : `<rect x="60" y="80" width="${length * scale}" height="20" fill="url(#roofGradient)" stroke="#1B3A52" stroke-width="2"/>`}${Array.from({ length: doorCount }).map((_, idx) => {
        const doorX = doorSpacing + idx * (doorWidth + doorSpacing);
        return `<g id="door-${idx + 1}"><rect x="${doorX}" y="${100 + height * scale * 0.15}" width="${doorWidth}" height="${doorHeight}" fill="#8B6914" stroke="#654321" stroke-width="1"/>${Array.from({ length: 3 }).map((_, panel) => {
            const panelY = 100 + height * scale * 0.15 + panel * (doorHeight / 3);
            return `<line x1="${doorX}" y1="${panelY}" x2="${doorX + doorWidth}" y2="${panelY}" stroke="#654321" stroke-width="0.5" opacity="0.5"/>`;
        }).join("")}<circle cx="${doorX + doorWidth * 0.8}" cy="${100 + height * scale * 0.5}" r="2" fill="#FFD700"/></g>`;
    }).join("")}<rect x="60" y="100" width="${length * scale}" height="${height * scale}" fill="none" stroke="${trimColor}" stroke-width="2" opacity="0.5"/></g><g id="dimensions" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#333"><line x1="60" y1="${100 + height * scale + 15}" x2="${60 + length * scale}" y2="${100 + height * scale + 15}" stroke="#666" stroke-width="1"/><line x1="60" y1="${100 + height * scale + 12}" x2="60" y2="${100 + height * scale + 18}" stroke="#666" stroke-width="1"/><line x1="${60 + length * scale}" y1="${100 + height * scale + 12}" x2="${60 + length * scale}" y2="${100 + height * scale + 18}" stroke="#666" stroke-width="1"/><text x="${60 + length * scale / 2}" y="${100 + height * scale + 35}" text-anchor="middle" font-size="14" font-weight="bold">${length}' Long</text><line x1="45" y1="100" x2="45" y2="${100 + height * scale}" stroke="#666" stroke-width="1"/><line x1="42" y1="100" x2="48" y2="100" stroke="#666" stroke-width="1"/><line x1="42" y1="${100 + height * scale}" x2="48" y2="${100 + height * scale}" stroke="#666" stroke-width="1"/><text x="20" y="${100 + height * scale / 2}" text-anchor="middle" font-size="14" font-weight="bold" transform="rotate(-90 20 ${100 + height * scale / 2})">${height}'</text><text x="${60 + length * scale + 30}" y="${100 + height * scale / 2 + 5}" font-size="14" font-weight="bold">${width}'</text><text x="${svgWidth / 2}" y="65" text-anchor="middle" font-size="12" fill="#2E5C8A">${roofType.charAt(0).toUpperCase() + roofType.slice(1)} Roof</text></g><g id="specs-box"><rect x="${svgWidth - 140}" y="10" width="130" height="50" fill="white" stroke="#4472C4" stroke-width="2" rx="4" opacity="0.95"/><text x="${svgWidth - 135}" y="30" font-family="Arial" font-size="11" font-weight="bold" fill="#333">${width}' × ${length}' × ${height}'</text><text x="${svgWidth - 135}" y="50" font-family="Arial" font-size="10" fill="#666">Area: ${(width * length).toFixed(0)} sq ft</text></g></svg>`;
    return svg;
}
function formatFinalQuoteWithVisualization(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, svgVisualization) {
    const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(params);
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
    const line = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    let response = `✅ YOUR FINAL GARAGE QUOTE

${currentParams}

${line}
🎨 BUILDING VISUALIZATION:
${line}

${svgVisualization}

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
        const svgString = generateGarageSVG({
            width: params.width || 20,
            length: params.length || 20,
            height: params.height || 10,
            roofType: params.roof_type || "regular",
            doorCount: selectedAddons.filter(a => a.label?.toLowerCase().includes("door")).length || 1,
        });
        logger.info(`[VisualizationNode] ✅ SVG generated (${svgString.length} chars)`);
        logger.info(`[VisualizationNode] SVG starts with: ${svgString.substring(0, 50)}...`);
        const sqft = (params.width || 0) * (params.length || 0);
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const contingency = (basePrice + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;
        const response = formatFinalQuoteWithVisualization(params, basePrice, selectedAddons, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft, svgString);
        logger.info(`[VisualizationNode] ✅ Visualization complete`);
        logger.info(`[VisualizationNode] Response length: ${response.length} chars`);
        logger.info(`[VisualizationNode] Contains SVG: ${response.includes("<svg")}`);
        return {
            response,
            finalPrice: finalTotal,
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