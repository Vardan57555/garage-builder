import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {ColorOption} from "@agents/tools/io/IColorChoice";
import {IChoiceService} from "@agents/tools/impl/io/IChoiceHandler";
import {ChoiceServiceImpl} from "@agents/tools/impl/ChoiceServiceImpl";
import {ColorService} from "@agents/tools/impl/io/ColorService";
import {ColorServiceImpl} from "@agents/tools/impl/ColorServiceImpl";
import {FieldPromptConfig} from "@agents/tools/io/IAskForField";
import {IAskForFieldNode} from "@agents/tools/impl/io/IAskForFieldNode";
const logger: pino.Logger = createLogger(module);

/**
 * AskForFieldNode - Responsible for managing field prompts and state transitions
 * Handles user interactions for data collection in the lead agent workflow
 */
export class AskForFieldNode implements IAskForFieldNode
{
    private choiceService: IChoiceService;
    private fieldPromptMap: Record<string, FieldPromptConfig>;
    private readonly colorService: ColorService = ColorServiceImpl.getInstance();

    constructor()
    {
        this.choiceService = ChoiceServiceImpl.getInstance();
        this.initializeFieldPromptMap();
    }

    /**
     * Initializes the field prompt configuration map
     */
    private initializeFieldPromptMap(): void
    {
        this.fieldPromptMap = {
            width: {
                template: `{params}\n\n📏 What **width** (feet)?\n(e.g., 20, 24, 30)`,
            },
            length: {
                template: `{params}\n\n📏 What **length** (feet)?\n(e.g., 25, 30, 40)`,
            },
            height: {
                template: `{params}\n\n📏 What **height** (feet)?\n(e.g., 10, 12)`,
            },
            state_name: {
                template: `{params}\n\n🗺️ Which **state**?\n(e.g., Texas, California)`,
            },
            roof_type: {
                template: `{params}\n\n🏠 Which **Roof Type** would you prefer?

1. Vertical - Best weather protection
2. Regular - Standard horizontal panels
3. Box - Economy option

Examples: "1", "vertical", "box"`,
            },
            gauge: {
                template: `{params}\n\n📊 What **gauge**?\n(e.g., 14GA, 16GA, 18GA, 20GA)`,
            },
            building_type: {
                template: this.choiceService.getPrompt("building_type"),
            },
        };
    }

    /**
     * Validates and ensures the currentField is set in the state
     */
    private async ensureCurrentField(state: LeadAgentStateType): Promise<string>
    {
        if (state.currentField)
        {
            return state.currentField;
        }

        logger.warn(`[FieldValidation] Session ${state.sessionId} - No currentField set`);

        const missingFields: string[] = LeadAgentHelpers.getMissingFields(state.userFriendlyParams);

        if (missingFields.length === 0)
        {
            throw new Error("All fields complete - should transition to calculate_price");
        }

        const nextField: string = missingFields[0];
        logger.info(`[FieldValidation] Session ${state.sessionId} - Setting field to: ${nextField}`);

        return nextField;
    }

    /**
     * Builds a formatted color menu from grouped colors
     */
    private buildColorMenu(colors: Awaited<ReturnType<typeof this.colorService.get>>): string
    {
        const groupedColors: Map<string, ColorOption[]> = this.colorService.group(colors, 5);
        let colorMenu: string = "🎨 **CHOOSE YOUR BUILDING COLOR:**\n\n";
        let colorIndex: number = 1;

        for (const [category, categoryColors] of groupedColors.entries())
        {
            if (categoryColors.length === 0)
            {
                continue;
            }

            colorMenu += `**${category}:**\n`;
            categoryColors.forEach((color: ColorOption) => {
                const costDisplay: string =
                    color.cost > 0 ? ` +$${color.cost.toFixed(2)}` : " (included)";
                colorMenu += `  ${colorIndex}. ■ ${color.name} ${color.hex_value}${costDisplay}\n`;
                colorIndex++;
            });
            colorMenu += "\n";
        }

        logger.info(`[ColorMenu] Built menu with ${colorIndex - 1} options`);

        return colorMenu;
    }

    /**
     * Formats the complete color selection prompt with instructions
     */
    private formatColorPrompt(currentParams: string, colorMenu: string): string
    {
        return (
            `${currentParams}\n\n${colorMenu}` +
            `**Examples:**\n` +
            `• "1" or "2" - Select by number\n` +
            `• "Barn Red" or "barn red" - Select by exact name\n` +
            `• "red" - Search for color\n` +
            `• "any" or "skip" - Use default (White)\n\n` +
            `Which color do you prefer?`
        );
    }

    /**
     * Generates a color selection prompt by fetching and formatting available colors
     */
    private async generateColorPrompt(currentParams: string): Promise<string>
    {
        logger.info(`[ColorPrompt] Loading colors from database...`);

        try
        {
            const allColors: ColorOption[] = await this.colorService.get();

            if (allColors.length === 0)
            {
                logger.error(`[ColorPrompt] No colors available in database`);
                return `${currentParams}\n\n❌ ERROR: No colors available in database`;
            }

            logger.info(`[ColorPrompt] Loaded ${allColors.length} colors from database`);

            const colorMenu: string = this.buildColorMenu(allColors);
            return this.formatColorPrompt(currentParams, colorMenu);
        }
        catch (error)
        {
            logger.error(`[ColorPrompt] Error loading colors`, { error });
            return `${currentParams}\n\n🎨 What color would you like?\n(e.g., "red", "white", "blue")`;
        }
    }

    /**
     * Generates the prompt message for the current field
     */
    private async generateFieldPrompt(field: string, currentParams: string): Promise<string>
    {
        const config: FieldPromptConfig = this.fieldPromptMap[field];

        if (config && !config.handler)
        {
            return config.template.replace("{params}", currentParams);
        }

        if (field === "color")
        {
            return this.generateColorPrompt(currentParams);
        }

        logger.warn(`[FieldPrompt] Unmapped field: ${field}`);
        const formattedFieldName = LeadAgentHelpers.formatFieldName(field as keyof typeof LeadAgentHelpers.formatFieldName);
        return `${currentParams}\n\nProvide: ${formattedFieldName}`;
    }

    /**
     * Main handler for requesting the next field from user
     * Manages state transitions and prompt generation
     */
    async execute(state: LeadAgentStateType): Promise<Record<string, any>>
    {
        const { sessionId } = state;
        logger.info(`[AskFieldNode] Processing field request`, { sessionId });

        try
        {
            const currentField: string = await this.ensureCurrentField(state);

            if (!currentField)
            {
                return {
                    response: "Error: All fields complete",
                    nextStep: "calculate_price",
                };
            }

            const currentParams: string = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

            const response: string = await this.generateFieldPrompt(currentField, currentParams);

            logger.info(`[AskFieldNode] Prompting for field`, {sessionId, currentField });

            return {
                response,
                userFriendlyParams: state.userFriendlyParams,
                currentField,
                nextStep: "__end__",
            };
        }
        catch (error)
        {
            logger.error(`[AskFieldNode] Error processing field request`, {sessionId: state.sessionId, error,});

            return {
                response: "An error occurred while processing your request. Please try again.",
                userFriendlyParams: state.userFriendlyParams,
                currentField: state.currentField,
                nextStep: "__end__",
            };
        }
    }
}

/**
 * Factory function to maintain backward compatibility with original function-based export
 */
export const askForFieldNode = async (state: LeadAgentStateType) => {
    const node = new AskForFieldNode();
    return node.execute(state);
};
