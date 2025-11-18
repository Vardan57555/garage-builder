import { LeadAgentStateType } from "@agents/LeadAgentState";
import { getColorsWithCache, getGroupedColorsByCategory, ColorOption } from "@agents/tools/impl/ColorDatabaseService";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * NODE: Ask user for color preference after building specs
 * Called after user has provided building dimensions but before price calculation
 */
export const askForColorNode = async (state: LeadAgentStateType) => {
    logger.info(`[ColorNode] Session ${state.sessionId} - Asking for color preference`);

    try {
        const allColors = await getColorsWithCache();

        if (allColors.length === 0) {
            logger.warn(`[ColorNode] No colors available, skipping color selection`);
            return {
                userFriendlyParams: state.userFriendlyParams,
                nextStep: "calculate_price",
            };
        }

        const groupedColors = getGroupedColorsByCategory(allColors, 5);

        const displayColors: ColorOption[] = [];
        for (const [,colors] of groupedColors.entries()) {
            displayColors.push(...colors);
        }

        logger.info(`[ColorNode] Display menu has ${displayColors.length} colors (limited from ${allColors.length} total)`);

        let colorMenu = "🎨 **CHOOSE YOUR BUILDING COLOR:**\n\n";
        let colorIndex = 1;

        for (const [category, colors] of groupedColors.entries()) {
            if (colors.length > 0) {
                colorMenu += `**${category}:**\n`;
                colors.forEach(color => {
                    const colorBox = `■`;
                    const costDisplay = color.cost > 0 ? ` +$${color.cost.toFixed(2)}` : " (included)";
                    colorMenu += `  ${colorIndex}. ${colorBox} ${color.name} ${color.hex_value}${costDisplay}\n`;
                    colorIndex++;
                });
                colorMenu += "\n";
            }
        }

        const currentParams = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

        const promptMessage =
            `${currentParams}\n\n` +
            colorMenu +
            `**Examples:**\n` +
            `• "1" - Select by number\n` +
            `• "red" or "barn red" - Select by color name\n` +
            `• "white" - Select by keyword\n` +
            `• "any" or "skip" - Use default (White)\n\n` +
            `Which color do you prefer?`;

        return {
            response: promptMessage,
            userFriendlyParams: state.userFriendlyParams,
            currentField: "color",
            colorOptions: displayColors,
            nextStep: "__end__",
        };
    } catch (error) {
        logger.error(`[ColorNode] Error:`, error);
        return {
            response: "Proceeding with default color (White).",
            userFriendlyParams: { ...state.userFriendlyParams, color: "White" },
            nextStep: "calculate_price",
        };
    }
};
