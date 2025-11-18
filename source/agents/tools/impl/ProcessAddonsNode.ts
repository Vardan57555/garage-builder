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
    logger.info(`[parseAddonSelections] Available addons: ${addonsMenu.length}`);

    if (addonsMenu.length > 0) {
        logger.info(`[parseAddonSelections] Sample addons: ${addonsMenu.slice(0, 3).map(a => a.label).join(', ')}`);
    }

    const normalizeForMatching = (text: string): string => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[_\s-]+/g, '')
            .replace(/s$/, '');
    };

    const looksLikeNumberSelection = /^[\d,\s]+$/.test(userInput.trim());

    if (looksLikeNumberSelection) {
        const numberMatches = userInput.match(/\d+/g);
        if (numberMatches && numberMatches.length > 0) {
            const potentialIndices = numberMatches.map(n => parseInt(n) - 1);
            const validIndices = potentialIndices.filter(idx => idx >= 0 && idx < addonsMenu.length);

            if (validIndices.length > 0) {
                validIndices.forEach(idx => {
                    selected.push(addonsMenu[idx]);
                });
                logger.info(`[parseAddonSelections] ✅ Selected ${selected.length} by number`);
                return selected;
            }
        }
    }

    const quantityPattern = /(?:add|also|and|get|want|need)?\s*(\d+)\s+([\w_]+(?:\s+[\w_]+)*)/gi;
    const quantityMatches = [...userInput.matchAll(quantityPattern)];

    logger.info(`[parseAddonSelections] Found ${quantityMatches.length} quantity patterns`);

    if (quantityMatches.length > 0) {
        quantityMatches.forEach((match, matchIdx) => {
            const quantity = parseInt(match[1], 10);
            const rawKeyword = match[2].trim();

            logger.info(`[parseAddonSelections] Match ${matchIdx}: quantity=${quantity}, raw="${rawKeyword}"`);

            const normalizedKeyword = normalizeForMatching(rawKeyword);
            logger.info(`[parseAddonSelections] Normalized keyword: "${normalizedKeyword}"`);

            const matchingAddons = addonsMenu.filter(addon => {
                const type = (addon.type || "").toLowerCase();
                const label = (addon.label || "").toLowerCase();
                const name = (addon.name || "").toLowerCase();

                const normalizedLabel = normalizeForMatching(label);
                const normalizedName = normalizeForMatching(name);
                const normalizedType = normalizeForMatching(type);

                if (normalizedLabel === normalizedKeyword || normalizedName === normalizedKeyword) {
                    logger.info(`[parseAddonSelections] ✅ EXACT MATCH: "${label}" = "${rawKeyword}"`);
                    return true;
                }

                if (normalizedLabel.includes(normalizedKeyword) || normalizedName.includes(normalizedKeyword)) {
                    logger.info(`[parseAddonSelections] ✅ CONTAINS: "${label}" contains "${rawKeyword}"`);
                    return true;
                }

                if (normalizedKeyword.includes(normalizedLabel) || normalizedKeyword.includes(normalizedName)) {
                    logger.info(`[parseAddonSelections] ✅ REVERSE: "${rawKeyword}" contains "${label}"`);
                    return true;
                }

                if (normalizedKeyword.includes('window') && normalizedType.includes('window')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: window`);
                    return true;
                }
                if (normalizedKeyword.includes('door') && !normalizedKeyword.includes('walkin') &&
                    normalizedType.includes('door') && !normalizedType.includes('walkin')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: door`);
                    return true;
                }
                if (normalizedKeyword.includes('walkin') && normalizedType.includes('walkin')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: walkin`);
                    return true;
                }
                if (normalizedKeyword.includes('brace') && normalizedType.includes('brace')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: brace`);
                    return true;
                }
                if (normalizedKeyword.includes('cupola') && normalizedType.includes('cupola')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: cupola`);
                    return true;
                }
                if (normalizedKeyword.includes('sectional') && normalizedLabel.includes('sectional')) {
                    logger.info(`[parseAddonSelections] ✅ TYPE: sectional`);
                    return true;
                }

                return false;
            });

            logger.info(`[parseAddonSelections] Found ${matchingAddons.length} matches for "${rawKeyword}"`);

            if (matchingAddons.length > 0) {
                for (let i = 0; i < quantity; i++) {
                    const addon = matchingAddons[i % matchingAddons.length];
                    selected.push({
                        ...addon,
                        id: `${addon.id}_${Date.now()}_${i}`,
                    });
                    logger.info(`[parseAddonSelections] Added: ${addon.label} ($${addon.cost})`);
                }
            } else {
                logger.warn(`[parseAddonSelections] ❌ No matches found for: ${rawKeyword}`);
            }
        });

        if (selected.length > 0) {
            logger.info(`[parseAddonSelections] ✅ FINAL: Selected ${selected.length} addons by keyword`);
            return selected;
        }
    }

    if (selected.length === 0) {
        const normalizedInput = normalizeForMatching(userInput);

        const keywordMatches = addonsMenu.filter(addon => {
            const normalizedLabel = normalizeForMatching(addon.label || "");
            const normalizedName = normalizeForMatching(addon.name || "");

            return normalizedLabel.includes(normalizedInput) ||
                normalizedName.includes(normalizedInput) ||
                normalizedInput.includes(normalizedLabel) ||
                normalizedInput.includes(normalizedName);
        });

        if (keywordMatches.length > 0) {
            logger.info(`[parseAddonSelections] ✅ Found ${keywordMatches.length} keyword-only matches`);
            selected.push(keywordMatches[0]);
            return selected;
        }
    }

    logger.warn(`[parseAddonSelections] ❌ No matches found for input: "${userInput}"`);
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

        if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
            logger.info(`[ProcessAddonsNode] User declined addons`);

            return {
                selectedAddons: [],
                finalPrice: state.basePrice || 0,
                priceCalculated: true,
                nextStep: "generate_visualization",
            };
        }

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

        const basePrice = state.basePrice || 0;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const finalTotal = basePrice + addonTotal;

        logger.info(`[ProcessAddonsNode] Selected ${selectedAddons.length} addons, total: $${finalTotal}`);

        return {
            selectedAddons,
            finalPrice: finalTotal,
            priceCalculated: true,
            nextStep: "generate_visualization",
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
