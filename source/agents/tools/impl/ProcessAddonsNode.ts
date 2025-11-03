import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import {buildAddonsMenuFromPricing} from "@agents/tools/impl/ShowAddonsNode";

const logger: pino.Logger = createLogger(module);

interface AddonItem {
    id: string;
    label: string;
    cost: number;
    description: string;
}

/**
 * Build addons menu from pricing data
 */
// function buildAddonsMenuForSelection(pricingData: any): AddonItem[] {
//     const addons: AddonItem[] = [];
//
//     try {
//         // Extract from checkbox (simple items)
//         if (pricingData?.checkbox && Array.isArray(pricingData.checkbox)) {
//             pricingData.checkbox.forEach((item: any, idx: number) => {
//                 addons.push({
//                     id: `checkbox_${idx}`,
//                     label: item.label || item.name || `Option ${idx + 1}`,
//                     cost: item.cost || 0,
//                     description: "Optional feature",
//                 });
//             });
//         }
//
//         // Extract from checkbox_quantity (windows, doors, anchors)
//         if (pricingData?.checkbox_quantity && Array.isArray(pricingData.checkbox_quantity)) {
//             pricingData.checkbox_quantity.forEach((item: any, idx: number) => {
//                 addons.push({
//                     id: `checkbox_qty_${idx}`,
//                     label: item.label || item.name || `Item ${idx + 1}`,
//                     cost: item.cost || 0,
//                     description: "Cost per unit",
//                 });
//             });
//         }
//
//         // Extract garage door options
//         if (pricingData?.garage_door && Array.isArray(pricingData.garage_door)) {
//             pricingData.garage_door.forEach((door: any, idx: number) => {
//                 addons.push({
//                     id: `garage_door_${door.id || idx}`,
//                     label: `Garage Door - ${door.door_category || door.door_type || 'Standard'}`,
//                     cost: door.cost || 0,
//                     description: door.door_type || "Standard garage door",
//                 });
//             });
//         }
//
//         // Extract window options
//         if (pricingData?.window_frameout && Array.isArray(pricingData.window_frameout)) {
//             pricingData.window_frameout.forEach((window: any, idx: number) => {
//                 addons.push({
//                     id: `window_${window.id || idx}`,
//                     label: `Window - ${window.door_category || window.door_type || 'Standard'}`,
//                     cost: window.cost || 0,
//                     description: window.door_type || "Standard window",
//                 });
//             });
//         }
//
//         // Extract walk-in door options
//         if (pricingData?.walkin_door_frameout && Array.isArray(pricingData.walkin_door_frameout)) {
//             pricingData.walkin_door_frameout.forEach((door: any, idx: number) => {
//                 addons.push({
//                     id: `walkin_${door.id || idx}`,
//                     label: `Walk-in Door - ${door.door_category || door.door_type || 'Standard'}`,
//                     cost: door.cost || 0,
//                     description: door.door_type || "Walk-in door",
//                 });
//             });
//         }
//
//         // Extract braces
//         if (pricingData?.braces && Array.isArray(pricingData.braces)) {
//             pricingData.braces.forEach((item: any, idx: number) => {
//                 addons.push({
//                     id: `braces_${idx}`,
//                     label: `Braces - ${item.bracing_feet || 'Standard'}`,
//                     cost: item.cost || 0,
//                     description: "Additional bracing",
//                 });
//             });
//         }
//
//         // Extract anchors
//         if (pricingData?.anchors_cost && Array.isArray(pricingData.anchors_cost)) {
//             pricingData.anchors_cost.forEach((anchor: any, idx: number) => {
//                 addons.push({
//                     id: `anchor_${anchor.id || idx}`,
//                     label: anchor.name || `Anchor ${idx + 1}`,
//                     cost: anchor.cost || 0,
//                     description: "Foundation anchor",
//                 });
//             });
//         }
//     } catch (error) {
//         logger.error("[buildAddonsMenuForSelection] Error building addon menu:", error);
//     }
//
//     return addons;
// }

/**
 * Parse user's addon selections from input
 */
function parseAddonSelections(
    userInput: string,
    addonsMenu: AddonItem[]
): AddonItem[] {
    const selected: AddonItem[] = [];
    const lowerInput = userInput.toLowerCase();

    // Check for "no/skip" patterns
    if (/(no|skip|none|without|don't|nope)/i.test(userInput)) {
        logger.info("[parseAddonSelections] User skipped addons");
        return [];
    }

    // Try parsing numbers (e.g., "1, 2, 3" or "1 and 2" or "add 2 windows")
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
            logger.info(`[parseAddonSelections] Selected ${selected.length} addons by number`);
            return selected;
        }
    }

    // Try parsing by name keywords
    if (/window/i.test(lowerInput)) {
        selected.push(
            ...addonsMenu.filter((addon) => /window/i.test(addon.label))
        );
    }
    if (/door/i.test(lowerInput)) {
        selected.push(
            ...addonsMenu.filter((addon) => /door/i.test(addon.label) && !/walk/i.test(addon.label))
        );
    }
    if (/garage door/i.test(lowerInput)) {
        selected.push(
            ...addonsMenu.filter((addon) => /garage door/i.test(addon.label))
        );
    }
    if (/walk.?in/i.test(lowerInput)) {
        selected.push(
            ...addonsMenu.filter((addon) => /walk.?in/i.test(addon.label))
        );
    }
    if (/brace|anchor/i.test(lowerInput)) {
        selected.push(
            ...addonsMenu.filter((addon) => /brace|anchor/i.test(addon.label))
        );
    }

    // Remove duplicates
    const uniqueMap = new Map<string, AddonItem>();
    selected.forEach((addon) => {
        uniqueMap.set(addon.id, addon);
    });

    logger.info(`[parseAddonSelections] Selected ${uniqueMap.size} addons by name`);
    return Array.from(uniqueMap.values());
}

/**
 * NODE: Process user's addon selections and show final price with addons included
 */
export const processAddonsSelectionNode = async (state: LeadAgentStateType) => {
    logger.info(`[ProcessAddonsNode] Session ${state.sessionId} - Processing addon selection`);

    try {
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        if (!userInput) {
            logger.warn(`[ProcessAddonsNode] No user input`);
            return {
                response: "Please specify which addons you'd like to add.",
                nextStep: "__end__",
            };
        }

        logger.info(`[ProcessAddonsNode] User input: "${userInput}"`);

        // ✅ CHECK IF USER IS SKIPPING ADDONS
        const skipPatterns = /(no|skip|none|without|don't|nope|nah|nothing)/i;
        if (skipPatterns.test(userInput)) {
            logger.info(`[ProcessAddonsNode] User skipped addons`);

            // ✅ SHOW FINAL PRICE WITHOUT ADDONS
            const basePrice = state.basePrice || 0;
            const sqft = state.userFriendlyParams.width! * state.userFriendlyParams.length!;
            const laborCost = basePrice * 0.5;
            const foundationCost = sqft * 8.5;
            const deliveryCost = 750;
            const contingency = (basePrice + laborCost + foundationCost + deliveryCost) * 0.05;
            const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency;

            const currentParams = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
            const response = `✅ **FINAL PRICE QUOTE**

${currentParams}

---

📊 **Price Breakdown:**
• Base Building: $${basePrice.toFixed(2)}
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}

---

💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**

---

📝 This includes:
  • Building kit and materials
  • Installation labor
  • Foundation slab preparation
  • Delivery & site preparation

🔧 Want to modify anything? (e.g., "change width to 30", "add more windows")
Or **start over** to create a new quote.`;

            return {
                response,
                selectedAddons: [],
                finalPrice: finalTotal,
                priceCalculated: true,
                nextStep: "__end__",
            };
        }

        // ✅ If NOT skipping, check if pricing data exists
        if (!state.pricingData) {
            logger.warn(`[ProcessAddonsNode] No pricing data available`);
            return {
                response: "❌ Error: No pricing data available.",
                nextStep: "__end__",
            };
        }

        // ✅ If they selected addons, process them
        logger.info(`[ProcessAddonsNode] Processing addon selections`);

        // Build addon menu from pricing data
        const addonsMenu = buildAddonsMenuFromPricing(state.pricingData);
        const selectedAddons = parseAddonSelections(userInput, addonsMenu);

        const basePrice = state.basePrice || 0;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.cost, 0);
        const sqft = state.userFriendlyParams.width! * state.userFriendlyParams.length!;
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const contingency = (basePrice + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;
        const finalTotal = basePrice + addonTotal + laborCost + foundationCost + deliveryCost + contingency;

        const currentParams = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
        let response = `✅ **FINAL PRICE QUOTE WITH ADD-ONS**

${currentParams}

---

📊 **Price Breakdown:**
• Base Building: $${basePrice.toFixed(2)}`;

        if (selectedAddons.length > 0) {
            response += `\n\n**Selected Add-ons:**`;
            selectedAddons.forEach((addon) => {
                response += `\n  • ${addon.label}: $${addon.cost.toFixed(2)}`;
            });
            response += `\n\n• Add-ons Total: +$${addonTotal.toFixed(2)}`;
        }

        response += `
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}

---

💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**

---

📝 This includes:
  • Building kit and materials
  • Installation labor
  • Foundation slab preparation
  • Delivery & site preparation
${selectedAddons.length > 0 ? `  • Selected add-ons (${selectedAddons.length} items)` : ''}

🔧 Want to modify anything? (e.g., "change width to 30", "add more windows")
Or **start over** to create a new quote.`;

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


