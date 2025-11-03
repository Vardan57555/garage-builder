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
    const lowerInput = userInput.toLowerCase();

    logger.info(`[parseAddonSelections] Parsing: "${userInput}"`);

    // ✅ METHOD 1: Number selection (e.g., "1" or "1, 2" or "1 and 2")
    const numberMatches = userInput.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
        logger.info(`[parseAddonSelections] Found numbers: ${numberMatches.join(", ")}`);

        const uniqueNumbers = new Set<number>();
        numberMatches.forEach((numStr) => {
            const index = parseInt(numStr) - 1;
            if (index >= 0 && index < addonsMenu.length) {
                logger.info(`[parseAddonSelections] Adding addon at index ${index}`);
                uniqueNumbers.add(index);
            }
        });

        if (uniqueNumbers.size > 0) {
            uniqueNumbers.forEach((idx) => {
                selected.push(addonsMenu[idx]);
                logger.info(`[parseAddonSelections] Selected: ${addonsMenu[idx].label}`);
            });
            return selected;
        }
    }

    // ✅ METHOD 2: Keyword selection with quantity (e.g., "2 windows", "also 2 windows")

    // Extract quantity if mentioned
    const quantityMatch = userInput.match(/(\d+)\s*(window|door|brace|anchor|cupola|garage door|walk)/i);
    let quantity = 1;
    if (quantityMatch) {
        quantity = parseInt(quantityMatch[1], 10);
        logger.info(`[parseAddonSelections] Found quantity: ${quantity}`);
    }

    // Check for window selections
    if (/window/i.test(lowerInput)) {
        logger.info(`[parseAddonSelections] User wants ${quantity} window(s)`);
        const windowAddons = addonsMenu.filter((a) => /window/i.test(a.label));

        for (let i = 0; i < Math.min(quantity, windowAddons.length); i++) {
            selected.push(windowAddons[i]);
            logger.info(`[parseAddonSelections] Added window: ${windowAddons[i].label}`);
        }
    }

    // Check for door selections
    if (/door/i.test(lowerInput) && !/walk/i.test(lowerInput)) {
        logger.info(`[parseAddonSelections] User wants ${quantity} door(s)`);
        const doorAddons = addonsMenu.filter((a) => /door/i.test(a.label) && !/walk/i.test(a.label));

        for (let i = 0; i < Math.min(quantity, doorAddons.length); i++) {
            selected.push(doorAddons[i]);
            logger.info(`[parseAddonSelections] Added door: ${doorAddons[i].label}`);
        }
    }

    // Check for walk-in selections
    if (/walk.?in/i.test(lowerInput)) {
        logger.info(`[parseAddonSelections] User wants ${quantity} walk-in door(s)`);
        const walkinAddons = addonsMenu.filter((a) => /walk.?in/i.test(a.label));

        for (let i = 0; i < Math.min(quantity, walkinAddons.length); i++) {
            selected.push(walkinAddons[i]);
            logger.info(`[parseAddonSelections] Added walk-in: ${walkinAddons[i].label}`);
        }
    }

    // Check for brace selections
    if (/brace|anchor/i.test(lowerInput)) {
        logger.info(`[parseAddonSelections] User wants ${quantity} brace(s)`);
        const braceAddons = addonsMenu.filter((a) => /brace|anchor/i.test(a.label));

        for (let i = 0; i < Math.min(quantity, braceAddons.length); i++) {
            selected.push(braceAddons[i]);
            logger.info(`[parseAddonSelections] Added brace: ${braceAddons[i].label}`);
        }
    }

    // Remove duplicates by ID
    const uniqueMap = new Map();
    selected.forEach((addon) => {
        uniqueMap.set(addon.id, addon);
    });

    const finalSelected = Array.from(uniqueMap.values());
    logger.info(`[parseAddonSelections] Final selected count: ${finalSelected.length}`);
    return finalSelected;
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

        // Check if user declined addons
        if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
            logger.info(`[ProcessAddonsNode] User declined addons`);

            const finalTotal = state.basePrice || 0;
            const response = formatFinalPrice(
                state.userFriendlyParams,
                state.basePrice || 0,
                [],
                0,
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

        if (!state.pricingData) {
            logger.error(`[ProcessAddonsNode] No pricing data available`);
            return {
                response: "❌ Error: No pricing data available.",
                nextStep: "__end__",
            };
        }

        const addonsMenu = buildAddonsMenuFromPricing(state.pricingData);
        logger.info(`[ProcessAddonsNode] Available addons: ${addonsMenu.length}`);

        const selectedAddons = parseAddonSelections(userInput, addonsMenu);
        logger.info(`[ProcessAddonsNode] User selected: ${selectedAddons.length} addon(s)`);

        // Calculate addon total
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const finalTotal = (state.basePrice || 0) + addonTotal;

        logger.info(`[ProcessAddonsNode] Base price: $${state.basePrice}, Addon total: $${addonTotal}, Final: $${finalTotal}`);

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

    // Calculate service costs
    const sqft = (params.width || 0) * (params.length || 0);
    const laborCost = basePrice * 0.5;
    const foundationCost = sqft * 8.5;
    const deliveryCost = 750;
    const contingency = (basePrice + laborCost + foundationCost + deliveryCost) * 0.05;
    const totalWithServices = basePrice + laborCost + foundationCost + deliveryCost + contingency;
    const grandTotal = totalWithServices + addonTotal;

    let response = `${currentParams}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **DETAILED PRICE BREAKDOWN:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Building Kit & Materials:**
• Base Building Package: $${basePrice.toFixed(2)}

**Installation & Construction:**
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}

**Subtotal (Building + Services): $${totalWithServices.toFixed(2)}**`;

    if (selectedAddons.length > 0) {
        response += `

**Selected Add-ons:**`;
        selectedAddons.forEach((addon) => {
            response += `\n  • ${addon.label}: $${(addon.cost || 0).toFixed(2)}`;
        });
        response += `\n\n**Add-ons Total: +$${addonTotal.toFixed(2)}**`;
    }

    response += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **FINAL ESTIMATED PRICE: $${grandTotal.toFixed(2)}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **What's Included:**
  • Building kit and materials
  • Professional installation labor
  • Foundation slab preparation (concrete)
  • Delivery & site preparation
  • 5% contingency for unforeseen costs
${selectedAddons.length > 0 ? `  • ${selectedAddons.length} selected add-on(s)` : ''}

📞 **Next Steps:**
Contact us to finalize your order and discuss:
  • Custom modifications
  • Financing options
  • Installation timeline
  • Warranty details

🔧 **Want to modify anything?**
Say "start over" to create a new quote.`;

    return response;
}
