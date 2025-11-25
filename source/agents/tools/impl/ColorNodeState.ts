import { ColorPromptBuilder } from "./ColorPromptBuilder";
import {ColorNodeResponse, ColorOption} from "@agents/tools/io/IColorChoice";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * ColorNodeState: Manages state transitions and responses
 */
export class ColorNodeState
{
    /**
     * Creates a success response with color selection prompt
     */
    static createSelectionResponse(currentParams: string, colorMenu: string, instructions: string, displayColors: ColorOption[]): ColorNodeResponse
    {
        return {
            response: ColorPromptBuilder.buildPrompt(
                currentParams,
                colorMenu,
                instructions
            ),
            userFriendlyParams: {},
            currentField: "color",
            colorOptions: displayColors,
            nextStep: "__end__",
        };
    }

    /**
     * Creates skip response (no colors available)
     */
    static createSkipResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse
    {
        logger.warn("[ColorNodeState] No colors available, skipping selection");
        return { userFriendlyParams, nextStep: "calculate_price"};
    }

    /**
     * Creates error fallback response
     */
    static createErrorResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse
    {
        return {
            response: `Proceeding with default color (${ColorPromptBuilder['DEFAULT_COLOR']}).`,
            userFriendlyParams: {
                ...userFriendlyParams,
                color: ColorPromptBuilder['DEFAULT_COLOR'],
            },
            nextStep: "calculate_price",
        };
    }
}
