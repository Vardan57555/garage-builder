import { LeadAgentStateType } from "@agents/LeadAgentState";
import { ColorGrouper } from "@agents/tools/impl/ColorDatabaseService";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { ColorNodeResponse, ColorOption } from "@agents/tools/io/IColorChoice";
import {IColorNodeManagerFull} from "@agents/tools/impl/io/IColorChoiceNode";
import {IColorCache} from "@agents/tools/impl/io/IColorDatabaseService";
import { ColorPromptBuilder } from "./ColorPromptBuilder";
import {ColorNodeState} from "@agents/tools/impl/ColorNodeState";
import {ColorCache} from "@agents/tools/impl/ColorCache";
const logger: pino.Logger = createLogger(module);

/**
 * ColorNodeManager: Orchestrates color selection workflow
 * Handles data loading, formatting, and state management
 */
class ColorNodeManager implements IColorNodeManagerFull
{
    private readonly colorCacheInstance:IColorCache = ColorCache.getInstance();

    /**
     * Loads and validates colors from a cache
     */
    private async loadColors(): Promise<ColorOption[] | null>
    {
        try
        {
            const colors: ColorOption[] = await this.colorCacheInstance.get();

            if (colors.length === 0)
            {
                logger.warn("[ColorNodeManager] No colors in database");
                return null;
            }

            logger.info(`[ColorNodeManager] Loaded ${colors.length} colors from cache`);
            return colors;
        }
        catch (error)
        {
            logger.error("[ColorNodeManager] Error loading colors:", error);
            return null;
        }
    }

    /**
     * Prepares display colors with grouping and formatting
     */
    private prepareDisplayColors(allColors: ColorOption[]): Map<string, ColorOption[]>
    {
        return ColorGrouper.group(allColors, ColorPromptBuilder['COLORS_PER_CATEGORY']);
    }

    /**
     * Extracts a flat array of display colors from a grouped map
     */
    private flattenDisplayColors(groupedColors: Map<string, ColorOption[]>): ColorOption[]
    {
        const displayColors: ColorOption[] = [];
        for (const colors of groupedColors.values())
        {
            displayColors.push(...colors);
        }
        return displayColors;
    }

    /**
     * Executes color selection node workflow
     */
    async execute(state: LeadAgentStateType): Promise<ColorNodeResponse>
    {
        logger.info(`[ColorNodeManager] Session ${state.sessionId} - Starting color selection`);

        const colors: ColorOption[] = await this.loadColors();
        if (!colors)
        {
            return ColorNodeState.createSkipResponse(state.userFriendlyParams);
        }

        const groupedColors: Map<string, ColorOption[]> = this.prepareDisplayColors(colors);
        const displayColors: ColorOption[] = this.flattenDisplayColors(groupedColors);

        logger.info(`[ColorNodeManager] Display: ${displayColors.length} colors (from ${colors.length} total)`);

        const { menu } = ColorPromptBuilder.buildColorMenu(groupedColors);
        const instructions: string = ColorPromptBuilder.buildInstructions();
        const currentParams: string = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

        return ColorNodeState.createSelectionResponse(
            currentParams,
            menu,
            instructions,
            displayColors
        );
    }
}

const colorNodeManager = new ColorNodeManager();

/**
 * NODE: Prompts user for color preference after building specs
 * Called after user has provided building dimensions but before price calculation
 */
export const askForColorNode = async (state: LeadAgentStateType): Promise<ColorNodeResponse> =>
{
    try
    {
        return await colorNodeManager.execute(state);
    }
    catch (error)
    {
        logger.error("[askForColorNode] Unhandled error:", error);
        return ColorNodeState.createErrorResponse(state.userFriendlyParams);
    }
};
