"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAddonsNode = void 0;
const Log_1 = require("../../../utils/logger/Log");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const AddonDatabaseService_1 = require("../../tools/impl/AddonDatabaseService");
const logger = (0, Log_1.createLogger)(module);
function formatAddonsMenu(addons) {
    return addons
        .map((addon, idx) => {
        const costDisplay = addon.cost > 0 ? ` - ${addon.cost.toFixed(2)}` : " - Included";
        const typeLabel = addon.type ? ` [${addon.type}]` : "";
        return `${idx + 1}. ${addon.label}${typeLabel}${costDisplay}\n   ${addon.description || ""}`;
    })
        .join("\n\n");
}
async function buildAddonsMenu() {
    try {
        logger.info("[buildAddonsMenu] Fetching addons from database");
        const allAddons = await (0, AddonDatabaseService_1.getAddonsWithCache)();
        if (allAddons.length === 0) {
            logger.warn("[buildAddonsMenu] No addons available");
            return [];
        }
        const limited = (0, AddonDatabaseService_1.getLimitedAddonsByType)(allAddons, 10);
        const menu = limited.map(addon => ({
            id: addon.id,
            label: addon.label,
            type: addon.type,
            cost: addon.cost,
            description: addon.description || "",
        }));
        logger.info(`[buildAddonsMenu] ✅ Built menu with ${menu.length} addons (limited from ${allAddons.length} total)`);
        return menu;
    }
    catch (error) {
        logger.error("[buildAddonsMenu] Error:", error);
        return [];
    }
}
const showAddonsNode = async (state) => {
    logger.info(`[ShowAddonsNode] Session ${state.sessionId} - Showing addon options`);
    try {
        const addonsMenu = await buildAddonsMenu();
        if (addonsMenu.length === 0) {
            logger.info(`[ShowAddonsNode] No addons available`);
            return {
                response: "✓ Price calculated. No additional options available at this time.",
                nextStep: "__end__",
            };
        }
        logger.info(`[ShowAddonsNode] Found ${addonsMenu.length} addon options`);
        const addonDisplay = formatAddonsMenu(addonsMenu);
        const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
        const promptMessage = `${currentParams}\n\n` +
            `✨ **Would you like to add any optional features?**\n\n` +
            `${addonDisplay}\n\n` +
            `**Examples:**\n` +
            `• "1" or "1, 2" - Select by number\n` +
            `• "2 windows" - Select by name and quantity\n` +
            `• "add 3 doors and 2 windows" - Multiple addons\n` +
            `• "no" or "skip" - No addons\n\n` +
            `What would you like to add?`;
        return {
            response: promptMessage,
            addonsMenu,
            pricingData: state.pricingData,
            basePrice: state.basePrice,
            finalPrice: state.basePrice,
            nextStep: "__end__",
        };
    }
    catch (error) {
        logger.error(`[ShowAddonsNode] Error:`, error);
        return {
            response: "✓ Price calculated. Ready to finalize your quote.",
            nextStep: "__end__",
        };
    }
};
exports.showAddonsNode = showAddonsNode;
//# sourceMappingURL=ShowAddonsNode.js.map