// ============================================================================
// FILE: ProcessAddonsNode.ts - FIXED ADDON SELECTION
// ============================================================================

import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import {buildAddonsMenuFromPricing} from "@agents/tools/impl/ShowAddonsNode";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ IMPROVED: Parse user's addon selections with better quantity handling
 */
function parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
    const selected: any[] = [];
    const lowerInput = userInput.toLowerCase();

    logger.info(`[parseAddonSelections] Parsing: "${userInput}"`);
    logger.info(`[parseAddonSelections] Available addons: ${addonsMenu.length}`);

    // ✅ METHOD 1: Number selection (e.g., "1" or "1, 2" or "1 and 2")
    const numberMatches = userInput.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
        logger.info(`[parseAddonSelections] Found numbers: ${numberMatches.join(", ")}`);

        // Check if these numbers are addon indices (1-based)
        const potentialIndices = numberMatches.map(n => parseInt(n) - 1);
        const validIndices = potentialIndices.filter(idx => idx >= 0 && idx < addonsMenu.length);

        // If we have valid addon indices, use them
        if (validIndices.length > 0) {
            validIndices.forEach(idx => {
                selected.push(addonsMenu[idx]);
                logger.info(`[parseAddonSelections] Selected by number: ${addonsMenu[idx].label}`);
            });
            return selected;
        }
    }

    // ✅ METHOD 2: Keyword selection with quantity (e.g., "2 windows", "add 3 doors")

    // Extract quantity pattern: "2 windows" or "add 2 windows" or "also 2 windows"
    const quantityPattern = /(?:add|also|and)?\s*(\d+)\s+(window|door|walkin|walk.?in|brace|anchor|cupola|garage door)/gi;
    const quantityMatches = [...userInput.matchAll(quantityPattern)];

    if (quantityMatches.length > 0) {
        logger.info(`[parseAddonSelections] Found quantity matches: ${quantityMatches.length}`);

        quantityMatches.forEach(match => {
            const quantity = parseInt(match[1], 10);
            const addonType = match[2].toLowerCase();

            logger.info(`[parseAddonSelections] Looking for ${quantity} × "${addonType}"`);

            // Find matching addons
            let matchingAddons: any[] = [];

            if (/window/i.test(addonType)) {
                matchingAddons = addonsMenu.filter(a => /window/i.test(a.label));
            } else if (/walk.?in/i.test(addonType)) {
                matchingAddons = addonsMenu.filter(a => /walk.?in/i.test(a.label));
            } else if (/garage door/i.test(addonType) || (/door/i.test(addonType) && !/walk/i.test(addonType))) {
                matchingAddons = addonsMenu.filter(a => /door/i.test(a.label) && !/walk.?in/i.test(a.label));
            } else if (/brace|anchor/i.test(addonType)) {
                matchingAddons = addonsMenu.filter(a => /brace|anchor/i.test(a.label));
            }

            // Add the requested quantity
            for (let i = 0; i < Math.min(quantity, matchingAddons.length); i++) {
                selected.push(matchingAddons[i]);
                logger.info(`[parseAddonSelections] Added: ${matchingAddons[i].label}`);
            }

            // If user wants more than available, repeat the last one
            if (quantity > matchingAddons.length && matchingAddons.length > 0) {
                const lastAddon = matchingAddons[matchingAddons.length - 1];
                for (let i = matchingAddons.length; i < quantity; i++) {
                    selected.push({ ...lastAddon, id: `${lastAddon.id}_${i}` });
                    logger.info(`[parseAddonSelections] Added duplicate: ${lastAddon.label}`);
                }
            }
        });

        if (selected.length > 0) {
            logger.info(`[parseAddonSelections] Total selected from quantity matches: ${selected.length}`);
            return selected;
        }
    }

    // ✅ METHOD 3: Keyword without quantity (e.g., "windows", "doors", "add windows and doors")
    logger.info(`[parseAddonSelections] Checking for keywords without quantity`);

    if (/window/i.test(lowerInput)) {
        const windowAddons = addonsMenu.filter(a => /window/i.test(a.label));
        if (windowAddons.length > 0) {
            selected.push(windowAddons[0]);  // Add first window option
            logger.info(`[parseAddonSelections] Added default window: ${windowAddons[0].label}`);
        }
    }

    if (/door/i.test(lowerInput) && !/walk/i.test(lowerInput)) {
        const doorAddons = addonsMenu.filter(a => /door/i.test(a.label) && !/walk.?in/i.test(a.label));
        if (doorAddons.length > 0) {
            selected.push(doorAddons[0]);
            logger.info(`[parseAddonSelections] Added default door: ${doorAddons[0].label}`);
        }
    }

    if (/walk.?in/i.test(lowerInput)) {
        const walkinAddons = addonsMenu.filter(a => /walk.?in/i.test(a.label));
        if (walkinAddons.length > 0) {
            selected.push(walkinAddons[0]);
            logger.info(`[parseAddonSelections] Added default walk-in: ${walkinAddons[0].label}`);
        }
    }

    if (/brace|anchor/i.test(lowerInput)) {
        const braceAddons = addonsMenu.filter(a => /brace|anchor/i.test(a.label));
        if (braceAddons.length > 0) {
            selected.push(braceAddons[0]);
            logger.info(`[parseAddonSelections] Added default brace: ${braceAddons[0].label}`);
        }
    }

    // Remove duplicates by ID
    const uniqueMap = new Map();
    selected.forEach((addon) => {
        if (!uniqueMap.has(addon.id)) {
            uniqueMap.set(addon.id, addon);
        }
    });

    const finalSelected = Array.from(uniqueMap.values());
    logger.info(`[parseAddonSelections] ✅ Final selected count: ${finalSelected.length}`);
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

            const basePrice = state.basePrice || 0;
            const params = state.userFriendlyParams;

            // Calculate full price with service costs
            const sqft = (params.width || 0) * (params.length || 0);
            const laborCost = basePrice * 0.5;
            const foundationCost = sqft * 8.5;
            const deliveryCost = 750;
            const contingency = (basePrice + laborCost + foundationCost + deliveryCost) * 0.05;
            const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency;

            const response = formatFinalPrice(
                params,
                basePrice,
                [],
                0,
                finalTotal,
                laborCost,
                foundationCost,
                deliveryCost,
                contingency
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
        logger.info(`[ProcessAddonsNode] Available addons in menu: ${addonsMenu.length}`);

        if (addonsMenu.length === 0) {
            logger.warn(`[ProcessAddonsNode] No addons available in pricing data`);
            return {
                response: "No addons are available for this building configuration.",
                nextStep: "__end__",
            };
        }

        const selectedAddons = parseAddonSelections(userInput, addonsMenu);
        logger.info(`[ProcessAddonsNode] User selected: ${selectedAddons.length} addon(s)`);

        if (selectedAddons.length === 0) {
            logger.warn(`[ProcessAddonsNode] No addons matched user input`);
            return {
                response: `I couldn't understand which addons you want. Please try:\n• Select by number (e.g., "1" or "1 and 2")\n• Specify quantity (e.g., "2 windows")\n• Or say "no" to skip addons`,
                nextStep: "__end__",
            };
        }

        // Calculate addon total
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);

        // Calculate full price including service costs
        const basePrice = state.basePrice || 0;
        const params = state.userFriendlyParams;
        const sqft = (params.width || 0) * (params.length || 0);
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const contingency = (basePrice + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;
        const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency + addonTotal;

        logger.info(`[ProcessAddonsNode] Price calculation:`);
        logger.info(`  - Base: $${basePrice}`);
        logger.info(`  - Addons: $${addonTotal}`);
        logger.info(`  - Services: $${(laborCost + foundationCost + deliveryCost + contingency).toFixed(2)}`);
        logger.info(`  - Final: $${finalTotal}`);

        const response = formatFinalPrice(
            params,
            basePrice,
            selectedAddons,
            addonTotal,
            finalTotal,
            laborCost,
            foundationCost,
            deliveryCost,
            contingency
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
    finalTotal: number,
    laborCost: number,
    foundationCost: number,
    deliveryCost: number,
    contingency: number
): string {
    const currentParams = LeadAgentHelpers.formatCurrentParams(params);
    const sqft = (params.width || 0) * (params.length || 0);

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
• Contingency & Misc (5%): $${contingency.toFixed(2)}`;

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
💰 **FINAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **What's Included:**
  • Building kit and all materials
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
