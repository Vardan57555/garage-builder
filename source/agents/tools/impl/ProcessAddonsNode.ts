import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";

const logger: pino.Logger = createLogger(module);

/**
 * Parse addon selections from user input
 * Supports: number selection, quantity + keyword, keyword only
 */
function parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
    const selected: any[] = [];
    const lowerInput = userInput.toLowerCase();

    logger.info(`[parseAddonSelections] Parsing: "${userInput}"`);
    logger.info(`[parseAddonSelections] Available addons: ${addonsMenu.length}`);

    // METHOD 1: Number selection (e.g., "1" or "1, 2" or "1 and 2")
    const numberMatches = userInput.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
        logger.info(`[parseAddonSelections] Found numbers: ${numberMatches.join(", ")}`);

        const potentialIndices = numberMatches.map(n => parseInt(n) - 1);
        const validIndices = potentialIndices.filter(idx => idx >= 0 && idx < addonsMenu.length);

        if (validIndices.length > 0) {
            validIndices.forEach(idx => {
                selected.push(addonsMenu[idx]);
                logger.info(`[parseAddonSelections] Selected by number: ${addonsMenu[idx].label}`);
            });
            return selected;
        }
    }

    // METHOD 2: Quantity + keyword selection (e.g., "2 windows", "add 3 doors")
    const quantityPattern = /(?:add|also|and)?\s*(\d+)\s+(window|door|walkin|walk.?in|brace|anchor|cupola|truss)s?/gi;
    const quantityMatches = [...userInput.matchAll(quantityPattern)];

    if (quantityMatches.length > 0) {
        logger.info(`[parseAddonSelections] Found quantity matches: ${quantityMatches.length}`);

        quantityMatches.forEach(match => {
            const quantity = parseInt(match[1], 10);
            const keyword = match[2].toLowerCase();

            logger.info(`[parseAddonSelections] Looking for ${quantity} × "${keyword}"`);

            // Find matching addons by type from menu
            let matchingAddons = addonsMenu.filter(addon => {
                const addonType = addon.type?.toLowerCase() || "";
                const addonLabel = addon.label?.toLowerCase() || "";

                if (/window/i.test(keyword)) return /window/i.test(addonType) || /window/i.test(addonLabel);
                if (/walk.?in/i.test(keyword)) return /walkin|walk.?in/i.test(addonType) || /walkin|walk.?in/i.test(addonLabel);
                if (/door/i.test(keyword) && !/walk/i.test(keyword)) {
                    return (/door/i.test(addonType) && !/walk/i.test(addonType)) ||
                        (/door/i.test(addonLabel) && !/walk/i.test(addonLabel));
                }
                if (/brace|anchor/i.test(keyword)) return /brace|anchor/i.test(addonType) || /brace|anchor/i.test(addonLabel);
                if (/cupola/i.test(keyword)) return /cupola/i.test(addonType) || /cupola/i.test(addonLabel);
                if (/truss/i.test(keyword)) return /truss/i.test(addonType) || /truss/i.test(addonLabel);
                return false;
            });

            logger.info(`[parseAddonSelections] Found ${matchingAddons.length} matching addons for "${keyword}"`);

            // Add requested quantity
            if (matchingAddons.length > 0) {
                for (let i = 0; i < quantity; i++) {
                    const addon = matchingAddons[i % matchingAddons.length];
                    selected.push({
                        ...addon,
                        id: `${addon.id}_${i}`,  // Unique ID for each instance
                    });
                    logger.info(`[parseAddonSelections] Added: ${addon.label}`);
                }
            }
        });

        if (selected.length > 0) {
            logger.info(`[parseAddonSelections] Total selected from quantity matches: ${selected.length}`);
            return selected;
        }
    }

    // METHOD 3: Keyword without quantity (e.g., "windows", "add doors")
    logger.info(`[parseAddonSelections] Checking for keywords without quantity`);

    const keywordTests = [
        { keyword: "window", regex: /window/i },
        { keyword: "door", regex: /\bdoor\b/i },
        { keyword: "walkin", regex: /walk.?in/i },
        { keyword: "brace", regex: /brace/i },
        { keyword: "anchor", regex: /anchor/i },
        { keyword: "cupola", regex: /cupola/i },
        { keyword: "truss", regex: /truss/i },
    ];

    for (const { keyword, regex } of keywordTests) {
        if (regex.test(lowerInput)) {
            const matchingAddons = addonsMenu.filter(addon => {
                const addonType = addon.type?.toLowerCase() || "";
                const addonLabel = addon.label?.toLowerCase() || "";
                return regex.test(addonType) || regex.test(addonLabel);
            });

            if (matchingAddons.length > 0) {
                selected.push(matchingAddons[0]);
                logger.info(`[parseAddonSelections] Added default ${keyword}: ${matchingAddons[0].label}`);
            }
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
 * Format final price with all details
 */
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

/**
 * NODE: Process user's addon selections
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

        // ✅ Get addons menu from state (passed by showAddonsNode)
        // If not in state, fetch from database
        let addonsMenu = (state as any).addonsMenu;

        if (!addonsMenu || addonsMenu.length === 0) {
            logger.warn(`[ProcessAddonsNode] No addons menu in state, this shouldn't happen`);
            return {
                response: "Error: Addon menu not available. Please try again.",
                nextStep: "__end__",
            };
        }

        logger.info(`[ProcessAddonsNode] Using addons menu: ${addonsMenu.length} options`);

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
