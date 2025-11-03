import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import {buildAddonsMenuFromPricing} from "@agents/tools/impl/ShowAddonsNode";

const logger: pino.Logger = createLogger(module);

/**
 * Parse user's addon selections from input
 */
function parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
    const selected: any[] = [];

    // Try number selection
    const numberMatches = userInput.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
        const uniqueNumbers = new Set<number>();
        numberMatches.forEach((numStr) => {
            const index = parseInt(numStr) - 1;
            if (index >= 0 && index < addonsMenu.length) {
                uniqueNumbers.add(index);
            }
        });

        if (uniqueNumbers.size > 0) {
            uniqueNumbers.forEach((idx) => {
                selected.push(addonsMenu[idx]);
            });
            return selected;
        }
    }

    // Try name matching
    const lowerInput = userInput.toLowerCase();
    if (/window/i.test(lowerInput)) {
        selected.push(...addonsMenu.filter((a) => /window/i.test(a.label)));
    }
    if (/door/i.test(lowerInput)) {
        selected.push(...addonsMenu.filter((a) => /door/i.test(a.label) && !/walk/i.test(a.label)));
    }
    if (/walk.?in/i.test(lowerInput)) {
        selected.push(...addonsMenu.filter((a) => /walk.?in/i.test(a.label)));
    }
    if (/brace|anchor/i.test(lowerInput)) {
        selected.push(...addonsMenu.filter((a) => /brace|anchor/i.test(a.label)));
    }

    // Remove duplicates
    const uniqueMap = new Map();
    selected.forEach((addon) => {
        uniqueMap.set(addon.id, addon);
    });

    return Array.from(uniqueMap.values());
}

/**
 * NODE: Process user's addon selections and show final price with addons included
 */
export const processAddonsSelectionNode = async (state: LeadAgentStateType) => {
    logger.info(`[ProcessAddonsNode] Session ${state.sessionId} - Processing selection`);

    try {
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        if (!userInput) {
            return {
                response: "Please specify which addons you'd like to add.",
                nextStep: "__end__",
            };
        }

        // ✅ Check if user declined addons
        if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
            logger.info(`[ProcessAddonsNode] User declined addons`);

            const finalTotal = state.basePrice || 0;
            // ✅ FIX: Use the correct function name
            const response = formatFinalPrice(
                state.userFriendlyParams,
                state.basePrice || 0,
                [],  // empty addons
                0,   // no addon total
                finalTotal
            );

            return {
                response,
                selectedAddons: [],
                finalPrice: finalTotal,
                priceCalculated: true,
                nextStep: "__end__",
            };
        }

        // ✅ Check if user selected addons
        if (!state.pricingData) {
            return {
                response: "❌ Error: No pricing data available.",
                nextStep: "__end__",
            };
        }

        const addonsMenu = buildAddonsMenuFromPricing(state.pricingData);
        const selectedAddons = parseAddonSelections(userInput, addonsMenu);

        const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.cost, 0);
        const finalTotal = (state.basePrice || 0) + addonTotal;

        const response = formatFinalPrice(
            state.userFriendlyParams,
            state.basePrice || 0,
            selectedAddons,
            addonTotal,
            finalTotal
        );

        return {
            response,
            selectedAddons,
            finalPrice: finalTotal,
            priceCalculated: true,
            nextStep: "__end__",
        };
    } catch (error) {
        logger.error(`[ProcessAddonsNode] Error:`, error);
        return {
            response: "❌ Error processing selection. Please try again.",
            nextStep: "__end__",
        };
    }
};


function formatFinalPrice(
    params: any,
    basePrice: number,
    selectedAddons: any[],
    addonTotal: number,
    finalTotal: number
): string {
    const currentParams = LeadAgentHelpers.formatCurrentParams(params);
    let response = `${currentParams}

📊 **Price Summary:**

• Base Building (including all services): $${basePrice.toFixed(2)}`;

    if (selectedAddons.length > 0) {
        response += `\n\n**Selected Add-ons:**`;
        selectedAddons.forEach((addon) => {
            response += `\n  • ${addon.label}: $${addon.cost.toFixed(2)}`;
        });
        response += `\n\n• Add-ons Total: +$${addonTotal.toFixed(2)}`;
    }

    response += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **FINAL PRICE: $${finalTotal.toFixed(2)}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 This includes:
  • Building kit and materials
  • Installation labor
  • Foundation slab preparation
  • Delivery & site preparation
${selectedAddons.length > 0 ? `  • Selected add-ons (${selectedAddons.length} items)` : ''}

🔧 Want to modify anything? (e.g., "change width to 30", "add more windows")
Or **start over** to create a new quote.`;

    return response;
}
