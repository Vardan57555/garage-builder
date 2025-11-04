import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";

const logger: pino.Logger = createLogger(module);

/**
 * Parse addon selections from user input
 * Supports: number selection, quantity + keyword, keyword only
 */
function parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
    const selected: any[] = [];

    logger.info(`[parseAddonSelections] Parsing: "${userInput}"`);

    // METHOD 1: Number selection (e.g., "1" or "1, 2")
    const numberMatches = userInput.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
        const potentialIndices = numberMatches.map(n => parseInt(n) - 1);
        const validIndices = potentialIndices.filter(idx => idx >= 0 && idx < addonsMenu.length);

        if (validIndices.length > 0) {
            validIndices.forEach(idx => {
                selected.push(addonsMenu[idx]);
            });
            logger.info(`[parseAddonSelections] Selected ${selected.length} by number`);
            return selected;
        }
    }

    // METHOD 2: Quantity + keyword selection
    const quantityPattern = /(?:add|also|and)?\s*(\d+)\s+(window|door|walkin|walk.?in|brace|anchor|cupola|truss)s?/gi;
    const quantityMatches = [...userInput.matchAll(quantityPattern)];

    if (quantityMatches.length > 0) {
        quantityMatches.forEach(match => {
            const quantity = parseInt(match[1], 10);
            const keyword = match[2].toLowerCase();

            const matchingAddons = addonsMenu.filter(addon => {
                const type = addon.type?.toLowerCase() || "";
                const label = addon.label?.toLowerCase() || "";

                if (/window/i.test(keyword)) return /window/i.test(type) || /window/i.test(label);
                if (/walk.?in/i.test(keyword)) return /walkin|walk.?in/i.test(type);
                if (/door/i.test(keyword) && !/walk/i.test(keyword)) {
                    return (/door/i.test(type) && !/walk/i.test(type));
                }
                if (/brace|anchor/i.test(keyword)) return /brace|anchor/i.test(type);
                if (/cupola/i.test(keyword)) return /cupola/i.test(type);
                if (/truss/i.test(keyword)) return /truss/i.test(type);
                return false;
            });

            if (matchingAddons.length > 0) {
                for (let i = 0; i < quantity; i++) {
                    const addon = matchingAddons[i % matchingAddons.length];
                    selected.push({
                        ...addon,
                        id: `${addon.id}_${i}`,
                    });
                }
            }
        });

        if (selected.length > 0) {
            logger.info(`[parseAddonSelections] Selected ${selected.length} by keyword`);
            return selected;
        }
    }

    return selected;
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
                response: "Please specify which addons you'd like.",
                nextStep: "__end__",
                selectedAddons: [],
                finalPrice: state.basePrice || 0,
            };
        }

        // Check if user declined addons
        if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
            logger.info(`[ProcessAddonsNode] User declined addons`);

            return {
                selectedAddons: [],
                finalPrice: state.basePrice || 0,
                priceCalculated: true,
                nextStep: "generate_visualization", // ✅ Route to visualization
            };
        }

        // Get addons menu from state (passed from showAddonsNode)
        let addonsMenu = (state as any).addonsMenu || [];

        if (!addonsMenu || addonsMenu.length === 0) {
            logger.warn(`[ProcessAddonsNode] No addons menu in state`);
            return {
                response: "Error: Addon menu not available.",
                nextStep: "__end__",
                selectedAddons: [],
                finalPrice: state.basePrice || 0,
            };
        }

        const selectedAddons = parseAddonSelections(userInput, addonsMenu);

        if (selectedAddons.length === 0) {
            logger.warn(`[ProcessAddonsNode] No addons matched`);
            return {
                response: `I didn't catch that. Try:\n• "1" or "1, 2" to select by number\n• "2 windows" to specify quantity\n• "no" to skip`,
                nextStep: "__end__",
                selectedAddons: [],
                finalPrice: state.basePrice || 0,
            };
        }

        // Calculate final price with addons
        const basePrice = state.basePrice || 0;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const finalTotal = basePrice + addonTotal;

        logger.info(`[ProcessAddonsNode] Selected ${selectedAddons.length} addons, total: $${finalTotal}`);

        return {
            selectedAddons,
            finalPrice: finalTotal,
            priceCalculated: true,
            nextStep: "generate_visualization", // ✅ Route to visualization
        };
    } catch (error) {
        logger.error(`[ProcessAddonsNode] Error:`, error);
        return {
            response: "❌ Error processing addons.",
            nextStep: "__end__",
            selectedAddons: [],
            finalPrice: state.basePrice || 0,
        };
    }
};
