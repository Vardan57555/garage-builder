import {ChoiceOption} from "@agents/tools/io/IChoiceHandler";

/**
 * ChoiceFormatter: Handles user-facing display of options
 */
export class ChoiceFormatter
{
    /**
     * Formats options for display with optional numbering
     */
    static formatOptions(options: ChoiceOption[], showNumbers = true): string
    {
        return options
            .map((opt, idx) => {
                const prefix = showNumbers ? `${idx + 1}. ` : "• ";
                const desc = opt.description ? ` - ${opt.description}` : "";
                return `${prefix}${opt.label}${desc}`;
            })
            .join("\n");
    }

    /**
     * Creates human-readable field label from snake_case
     */
    static formatFieldLabel(field: string): string
    {
        return field
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    /**
     * Generates complete prompt for choice field
     */
    static generatePrompt(field: string, options: ChoiceOption[]): string
    {
        const label: string = this.formatFieldLabel(field);
        const formatted: string = this.formatOptions(options);
        return `Which ${label} would you prefer?\n${formatted}`;
    }
}
