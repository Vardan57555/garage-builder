import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * Structured choice option
 */
export interface ChoiceOption {
    value: string;
    label: string;
    description?: string;
}

/**
 * User choice result
 */
export interface ChoiceResult {
    selected: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
}

/**
 * Choice handler for structured selections
 * Uses LangChain with Zod schema for type-safe outputs
 */
export class ChoiceHandler {
    private logger: pino.Logger = logger;

    /**
     * Parse user response and map to valid choice
     *
     * EXAMPLE:
     * Options: ["vertical", "regular", "box"]
     * User says: "any"
     * Result: Asks LLM to pick one, or picks randomly
     */
    public async parseUserChoiceWithAI(
        userInput: string,
        options: ChoiceOption[],
        context: string = ""
    ): Promise<ChoiceResult> {
        try {
            this.logger.info("[ChoiceHandler] Parsing user choice:", {
                userInput,
                options: options.map(o => o.value),
                context
            });

            // If user input is a number, try direct mapping
            const numberMatch = userInput.match(/^\d+$/);
            if (numberMatch) {
                const index = parseInt(userInput) - 1;
                if (index >= 0 && index < options.length) {
                    return {
                        selected: options[index].value,
                        confidence: "high",
                        reasoning: `User selected option ${index + 1} by number`
                    };
                }
            }

            // If user input matches an option directly
            const lowerInput = userInput.toLowerCase().trim();
            const directMatch = options.find(opt =>
                opt.value.toLowerCase() === lowerInput ||
                opt.label.toLowerCase() === lowerInput ||
                opt.label.toLowerCase().includes(lowerInput)
            );

            if (directMatch) {
                return {
                    selected: directMatch.value,
                    confidence: "high",
                    reasoning: `User explicitly selected "${directMatch.label}"`
                };
            }

            // Use AI for fuzzy matching or ambiguous responses
            return await this.chooseWithAI(userInput, options, context);
        } catch (error) {
            this.logger.error("[ChoiceHandler] Error parsing choice:", error);
            // Fallback: pick first option
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "Error during parsing, selected default option"
            };
        }
    }

    /**
     * Use AI to intelligently choose from options
     * Handles vague responses like "any", "whatever", "I don't know"
     */
    private async chooseWithAI(
        userInput: string,
        options: ChoiceOption[],
        context: string
    ): Promise<ChoiceResult> {
        try {
            const optionsText = options
                .map((opt, idx) => `${idx + 1}. ${opt.label} (${opt.value})${opt.description ? ` - ${opt.description}` : ""}`)
                .join("\n");

            const prompt = `You are a helpful assistant choosing from predefined options.

Context: ${context || "No specific context"}

Available options:
${optionsText}

User response: "${userInput}"

Based on the user's response:
1. If they clearly indicate a preference, choose that option
2. If they say "any", "whatever", "I don't care", "whatever works", pick the MOST BALANCED option
3. If they mention characteristics, match to best option
4. If completely unclear, pick option #1 as default

Respond ONLY with valid JSON (no markdown):
{
  "selected": "value_of_chosen_option",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}`;

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            this.logger.debug("[ChoiceHandler] AI response:", response);

            // Parse JSON response
            const cleaned = response
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const result = JSON.parse(jsonMatch[0]);

            // Validate that selected value exists
            const isValid = options.some(opt => opt.value === result.selected);
            if (!isValid) {
                this.logger.warn("[ChoiceHandler] AI selected invalid option:", result.selected);
                return {
                    selected: options[0].value,
                    confidence: "low",
                    reasoning: `AI selected invalid option, using default`
                };
            }

            this.logger.info("[ChoiceHandler] AI choice made:", result);
            return result as ChoiceResult;
        } catch (error) {
            this.logger.error("[ChoiceHandler] AI choice failed:", error);
            // Fallback
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "AI selection failed, using default"
            };
        }
    }

    /**
     * Validate if user input is one of the valid choices
     * Returns true if clear selection, false if ambiguous
     */
    public isValidDirectChoice(userInput: string, options: ChoiceOption[]): boolean {
        const lowerInput = userInput.toLowerCase().trim();

        // Check for number (1, 2, 3, etc.)
        const numberMatch = userInput.match(/^\d+$/);
        if (numberMatch) {
            const index = parseInt(userInput) - 1;
            return index >= 0 && index < options.length;
        }

        // Check if matches any option value or label
        return options.some(opt =>
            opt.value.toLowerCase() === lowerInput ||
            opt.label.toLowerCase() === lowerInput
        );
    }

    /**
     * Format choice options for display
     */
    public formatOptionsForDisplay(options: ChoiceOption[], showNumbers = true): string {
        return options
            .map((opt, idx) => {
                const prefix = showNumbers ? `${idx + 1}. ` : "• ";
                const desc = opt.description ? ` - ${opt.description}` : "";
                return `${prefix}${opt.label}${desc}`;
            })
            .join("\n");
    }
}

/**
 * EXAMPLE INTEGRATION IN LeadAgent
 *
 * For roof type selection:
 */
export class RoofTypeChoiceHandler {
    private choiceHandler: ChoiceHandler = new ChoiceHandler();

    private roofOptions: ChoiceOption[] = [
        {
            value: "vertical",
            label: "Vertical",
            description: "Best weather protection"
        },
        {
            value: "regular",
            label: "Regular",
            description: "Standard horizontal panels"
        },
        {
            value: "box",
            label: "Box",
            description: "Economy option"
        }
    ];

    /**
     * Handle user choice for roof type
     *
     * USAGE:
     * const result = await handler.handleRoofChoice("any");
     * // Returns: { selected: "regular", confidence: "medium", reasoning: "..." }
     */
    public async handleRoofChoice(userInput: string): Promise<ChoiceResult> {
        const roofContext = "The user is being asked to choose a roof style for their garage";

        return await this.choiceHandler.parseUserChoiceWithAI(
            userInput,
            this.roofOptions,
            roofContext
        );
    }

    /**
     * Check if user provided a valid roof type
     */
    public isValidRoofChoice(userInput: string): boolean {
        return this.choiceHandler.isValidDirectChoice(userInput, this.roofOptions);
    }

    /**
     * Get formatted prompt with options
     */
    public getChoicePrompt(): string {
        return `Which roof style would you prefer?\n${this.choiceHandler.formatOptionsForDisplay(this.roofOptions)}`;
    }
}

/**
 * INTEGRATION IN LeadAgent.run()
 *
 * Example of how to use this:
 */
export async function exampleIntegration() {
    const handler = new RoofTypeChoiceHandler();

    // When asking for roof choice
    const prompt = handler.getChoicePrompt();
    console.log(prompt);

    // When user responds with "any"
    const userResponse = "any";
    const choice = await handler.handleRoofChoice(userResponse);

    console.log(`Selected: ${choice.selected}`);
    console.log(`Confidence: ${choice.confidence}`);
    console.log(`Reason: ${choice.reasoning}`);
}

/**
 * GENERIC Choice Manager for any field
 * Supports multiple field types (roof, state, building type, etc.)
 */
export class GenericChoiceManager {
    private choiceHandler: ChoiceHandler = new ChoiceHandler();

    private fieldOptions: Map<string, ChoiceOption[]> = new Map([
        ["roof_type", [
            { value: "vertical", label: "Vertical", description: "Best weather protection" },
            { value: "regular", label: "Regular", description: "Standard horizontal panels" },
            { value: "box", label: "Box", description: "Economy option" }
        ]],
        ["building_type", [
            { value: "garage", label: "Garage", description: "Standard garage" },
            { value: "shed", label: "Shed", description: "Storage shed" },
            { value: "barn", label: "Barn", description: "Agricultural barn" }
        ]],
        ["garage_type", [
            { value: "1-car", label: "1-car", description: "Single car garage" },
            { value: "2-car", label: "2-car", description: "Two car garage" },
            { value: "3-car", label: "3-car", description: "Three car garage" }
        ]]
    ]);

    /**
     * Handle choice for any field
     */
    public async handleChoice(
        field: string,
        userInput: string,
        customOptions?: ChoiceOption[]
    ): Promise<ChoiceResult> {
        const options = customOptions || this.fieldOptions.get(field);

        if (!options || options.length === 0) {
            throw new Error(`No options configured for field: ${field}`);
        }

        return await this.choiceHandler.parseUserChoiceWithAI(
            userInput,
            options,
            `User is selecting a value for: ${field}`
        );
    }

    /**
     * Get choice prompt for a field
     */
    public getPrompt(field: string, customOptions?: ChoiceOption[]): string {
        const options = customOptions || this.fieldOptions.get(field);
        if (!options) {
            throw new Error(`No options configured for field: ${field}`);
        }

        const fieldLabel = field.replace(/_/g, " ").toUpperCase();
        return `Which ${fieldLabel} would you prefer?\n${this.choiceHandler.formatOptionsForDisplay(options)}`;
    }

    /**
     * Register custom options for a field
     */
    public registerOptions(field: string, options: ChoiceOption[]): void {
        this.fieldOptions.set(field, options);
        logger.info(`[GenericChoiceManager] Registered options for field: ${field}`);
    }
}
