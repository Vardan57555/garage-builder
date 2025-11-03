import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {LeadAgentStateType} from "@agents/LeadAgentState";

const logger: pino.Logger = createLogger(module);

function extractBasePrice(pricingData: any): number {
    if (pricingData.base_price_regular) return pricingData.base_price_regular;
    if (pricingData.base_price_box) return pricingData.base_price_box;
    if (pricingData.base_price_vertical) return pricingData.base_price_vertical;

    let total = 0;
    const numericFields = [
        'base_price_regular', 'base_price_box', 'base_price_vertical',
        'height_premium'
    ];

    numericFields.forEach(field => {
        if (typeof pricingData[field] === 'number') {
            total += pricingData[field];
        }
    });

    return total > 0 ? total : 0;
}

export const showFinalPriceNode = async (state: LeadAgentStateType) => {
    logger.info(`[FinalPriceNode] Session ${state.sessionId} - Showing final price`);

    if (!state.pricingData) {
        return {
            response: "Error calculating final price",
            nextStep: "__end__",
        };
    }

    const basePrice = extractBasePrice(state.pricingData);
    const selectedAddons = state.selectedAddons || [];
    const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.cost, 0);
    const finalTotal = basePrice + addonTotal;

    const currentParams = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

    let response = `
✅ **FINAL PRICE QUOTE**

${currentParams}

---

📊 **Price Breakdown:**

• Base Building: $${basePrice.toFixed(2)}
`;

    if (selectedAddons.length > 0) {
        response += `\n**Selected Add-ons:**\n`;
        selectedAddons.forEach(addon => {
            response += `  • ${addon.label}: $${addon.cost.toFixed(2)}\n`;
        });
        response += `\n• Add-ons Total: $${addonTotal.toFixed(2)}\n`;
    }

    response += `
---

💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**

---

📝 *This includes:*
  • Building kit and materials
  • Installation labor (50% of kit)
  • Foundation slab preparation
  • Delivery & site preparation
  • Selected add-ons

🔧 **Want to modify anything?** (e.g., "change width to 30", "add more windows")
Or **start over** to create a new quote.
`;

    return {
        response,
        finalPrice: finalTotal,
        priceCalculated: true,
        nextStep: "__end__",
    };
};
