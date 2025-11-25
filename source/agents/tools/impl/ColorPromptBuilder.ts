import {ColorDisplayEntry, ColorOption} from "@agents/tools/io/IColorChoice";

/**
 * ColorPromptBuilder: Constructs color selection prompts with formatting
 */
export class ColorPromptBuilder
{
    private static readonly DEFAULT_COLOR:string = "White";
    private static readonly COLORS_PER_CATEGORY = 5;

    /**
     * Builds categorized a color menu with numbering and pricing
     */
    static buildColorMenu(groupedColors: Map<string, ColorOption[]>): { menu: string; displayEntries: ColorDisplayEntry[]; }
    {
        const displayEntries: ColorDisplayEntry[] = [];
        let menu: string = "🎨 **CHOOSE YOUR BUILDING COLOR:**\n\n";
        let colorIndex: number = 1;

        for (const [category, colors] of groupedColors.entries())
        {
            if (colors.length === 0)
            {
                continue;
            }

            menu += `**${category}:**\n`;

            colors.forEach(color =>
            {
                const costDisplay: string = this.formatCostDisplay(color.cost);
                const display = `  ${colorIndex}. ■ ${color.name} ${color.hex_value}${costDisplay}`;

                displayEntries.push({
                    index: colorIndex,
                    category,
                    color,
                    display,
                });

                menu += display + "\n";
                colorIndex++;
            });

            menu += "\n";
        }

        return { menu, displayEntries };
    }

    /**
     * Formats cost display for UI
     */
    private static formatCostDisplay(cost: number): string
    {
        return cost > 0 ? ` +$${cost.toFixed(2)}` : " (included)";
    }

    /**
     * Generates selection instructions
     */
    static buildInstructions(): string
    {
        return (
            `**Examples:**\n` +
            `• "1" - Select by number\n` +
            `• "red" or "barn red" - Select by color name\n` +
            `• "white" - Select by keyword\n` +
            `• "any" or "skip" - Use default (${this.DEFAULT_COLOR})\n`
        );
    }

    /**
     * Constructs complete color selection prompt
     */
    static buildPrompt(currentParams: string, colorMenu: string, instructions: string): string
    {
        return (`${currentParams}\n\n` + colorMenu + instructions + `\nWhich color do you prefer?`);
    }
}
