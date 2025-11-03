import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";

const logger: pino.Logger = createLogger(module);

/**
 * Extract pricing data from the price calculation response
 * Builds a structured addon menu from available options
 */
export function buildAddonsMenuFromPricing(pricingData: any): Array<{
    id: string;
    label: string;
    cost: number;
    description: string;
}> {
    const addons: Array<{
        id: string;
        label: string;
        cost: number;
        description: string;
    }> = [];

    try {
        if (pricingData?.garage_door_frameout && Array.isArray(pricingData.garage_door_frameout)) {
            pricingData.garage_door_frameout.forEach((door: any, idx: number) => {
                addons.push({
                    id: `garage_door_${idx}`,
                    label: door.door_type || `Garage Door ${idx + 1}`,
                    cost: door.cost || 0,
                    description: door.description || "Garage door option",
                });
            });
        }

        if (pricingData?.window_frameout && Array.isArray(pricingData.window_frameout)) {
            pricingData.window_frameout.forEach((window: any, idx: number) => {
                addons.push({
                    id: `window_${idx}`,
                    label: window.door_type || `Window ${idx + 1}`,
                    cost: window.cost || 0,
                    description: window.description || "Window option",
                });
            });
        }

        if (pricingData?.walkin_door_frameout && Array.isArray(pricingData.walkin_door_frameout)) {
            pricingData.walkin_door_frameout.forEach((door: any, idx: number) => {
                addons.push({
                    id: `walkin_${idx}`,
                    label: door.door_type || `Walk-in Door ${idx + 1}`,
                    cost: door.cost || 0,
                    description: door.description || "Walk-in door option",
                });
            });
        }
    } catch (error) {
        logger.error("[buildAddonsMenuFromPricing] Error:", error);
    }

    return addons;
}

// function parseAddonSelections(
//     userInput: string,
//     addonsMenu: Array<{
//         id: string;
//         label: string;
//         cost: number;
//         description: string;
//     }>
// ): Array<{
//     id: string;
//     label: string;
//     cost: number;
//     description: string;
// }> {
//     const selected: Array<{
//         id: string;
//         label: string;
//         cost: number;
//         description: string;
//     }> = [];
//
//     // Try parsing numbers (e.g., "1, 2, 3")
//     const numberMatches = userInput.match(/\d+/g);
//     if (numberMatches && numberMatches.length > 0) {
//         const uniqueNumbers = new Set<number>();
//         numberMatches.forEach((numStr) => {
//             const index = parseInt(numStr) - 1;
//             if (index >= 0 && index < addonsMenu.length) {
//                 uniqueNumbers.add(index);
//             }
//         });
//
//         if (uniqueNumbers.size > 0) {
//             uniqueNumbers.forEach((idx) => {
//                 selected.push(addonsMenu[idx]);
//             });
//             return selected;
//         }
//     }
//
//     return selected;
// }

/**
 * Format addons menu for display
 */
function formatAddonsForDisplay(
    addons: Array<{
        id: string;
        label: string;
        cost: number;
        description: string;
    }>
): string {
    if (addons.length === 0) {
        return "No additional options available.";
    }

    return addons
        .map((addon, idx) => {
            const costDisplay = addon.cost > 0 ? ` - $${addon.cost.toFixed(2)}` : " - Included";
            return `${idx + 1}. ${addon.label}${costDisplay}\n   ${addon.description || ""}`;
        })
        .join("\n\n");
}

/**
 * NODE: Show available addons after price calculation
 *
 * This node:
 * 1. Validates pricing data was calculated
 * 2. Extracts available addon options from pricing response
 * 3. Formats addon menu for user display
 * 4. Returns prompt waiting for user addon selection
 * 5. Preserves pricing data for next node (processAddonsSelectionNode)
 *
 * Flow:
 * calculate_price → show_addons → [user responds] → process_addons
 */
export const showAddonsNode = async (state: LeadAgentStateType) => {
    logger.info(`[ShowAddonsNode] Session ${state.sessionId} - Showing addon options`);

    try {
        // Validate we have pricing data
        if (!state.pricingData) {
            logger.warn(`[ShowAddonsNode] No pricing data available, skipping addons`);
            return {
                response: "✓ Price calculated. No additional options available.",
                nextStep: "__end__",
            };
        }

        // Build addon menu from pricing data
        const addonsMenu = buildAddonsMenuFromPricing(state.pricingData);

        if (addonsMenu.length === 0) {
            logger.info(`[ShowAddonsNode] No addons available`);
            return {
                response: "✓ Price calculated. No additional options available at this time.",
                nextStep: "__end__",
            };
        }

        logger.info(`[ShowAddonsNode] Found ${addonsMenu.length} addon options`);

        // Get current parameters for reference
        const currentParams = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

        // Build the prompt message
        const promptMessage =
            `${currentParams}\n\n` +
            `✨ **Would you like to add any optional features?**\n\n` +
            `${formatAddonsForDisplay(addonsMenu)}\n\n` +
            `**Examples:**\n` +
            `• "1" or "1, 2" - Select by number\n` +
            `• "windows and doors" - Select by name\n` +
            `• "no" or "skip" - No addons\n\n` +
            `What would you like to add?`;

        logger.info(`[ShowAddonsNode] Showing ${addonsMenu.length} addon options to user`);

        return {
            response: promptMessage,
            pricingData: state.pricingData, // Preserve pricing data for next node
            nextStep: "__end__", // Wait for user input in next iteration
        };
    } catch (error) {
        logger.error(`[ShowAddonsNode] Error:`, error);
        return {
            response: "✓ Price calculated. Ready to finalize your quote.",
            nextStep: "__end__",
        };
    }
};
