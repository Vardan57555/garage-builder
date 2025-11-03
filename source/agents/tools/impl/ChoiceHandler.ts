import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export interface ChoiceOption {
    value: string;
    label: string;
    description?: string;
}

export interface ChoiceResult {
    selected: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
}

export class ChoiceHandler {
    private logger: pino.Logger = logger;

    public async parseUserChoiceWithAI(
        userInput: string,
        options: ChoiceOption[],
        context: string = ""
    ): Promise<ChoiceResult> {
        try {
            this.logger.info(
                { userInput, optionCount: options.length },
                "[ChoiceHandler] Parsing user choice"
            );

            const numberMatch = userInput.match(/^\d+$/);
            if (numberMatch) {
                const index = parseInt(userInput) - 1;
                if (index >= 0 && index < options.length) {
                    this.logger.info(`[ChoiceHandler] Direct number match: option ${index + 1}`);
                    return {
                        selected: options[index].value,
                        confidence: "high",
                        reasoning: `User selected option ${index + 1} by number`,
                    };
                }
            }

            const lowerInput = userInput.toLowerCase().trim();
            const directMatch = options.find(
                (opt) =>
                    opt.value.toLowerCase() === lowerInput ||
                    opt.label.toLowerCase() === lowerInput ||
                    opt.label.toLowerCase().includes(lowerInput)
            );

            if (directMatch) {
                this.logger.info(`[ChoiceHandler] Direct match found: ${directMatch.value}`);
                return {
                    selected: directMatch.value,
                    confidence: "high",
                    reasoning: `User explicitly selected "${directMatch.label}"`,
                };
            }

            this.logger.info(`[ChoiceHandler] No direct match, using AI to decide`);
            return await this.chooseWithAI(userInput, options, context);
        } catch (error) {
            this.logger.error({ err: error }, "[ChoiceHandler] Error parsing choice");
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "Error during parsing, selected default option",
            };
        }
    }

    private async chooseWithAI(
        userInput: string,
        options: ChoiceOption[],
        context: string
    ): Promise<ChoiceResult> {
        try {
            this.logger.info(`[chooseWithAI] Starting AI-based selection`);

            const lowerInput = userInput.toLowerCase().trim();

            if (["any", "whatever", "i don't care", "dunno", "idk", "doesn't matter"].includes(lowerInput)) {
                logger.info(`[chooseWithAI] User said "${lowerInput}" - selecting most balanced option`);

                const middleIndex = Math.floor(options.length / 2);
                return {
                    selected: options[middleIndex].value,
                    confidence: "high",
                    reasoning: `User expressed no preference, selected balanced option: ${options[middleIndex].label}`,
                };
            }

            const optionsText = options
                .map(
                    (opt, idx) =>
                        `${idx + 1}. ${opt.label} (${opt.value})${
                            opt.description ? ` - ${opt.description}` : ""
                        }`
                )
                .join("\n");

            const prompt = `You are a helpful assistant choosing from predefined options.

                        Context: ${context || "No specific context"}
                        
                        Available options:
                        ${optionsText}
                        
                        User response: "${userInput}"
                        
                        Based on the user's response:
                        1. If they clearly indicate a preference, choose that option.
                        2. If they say "any", "whatever", "I don't care", pick the MOST BALANCED option.
                        3. If they mention characteristics, match to best option.
                        4. If unclear, pick option #1 as default.
                        
                        Respond ONLY with valid JSON (no markdown):
                        {
                          "selected": "value_of_chosen_option",
                          "confidence": "high|medium|low",
                          "reasoning": "brief explanation"
                 }`;

            this.logger.info(`[chooseWithAI] Calling LLM for choice decision`);

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            this.logger.info(`[chooseWithAI] LLM response received`);

            const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                this.logger.warn(`[chooseWithAI] No JSON found in response`);
                throw new Error("No JSON found in response");
            }

            const result = JSON.parse(jsonMatch[0]);

            const isValid = options.some((opt) => opt.value === result.selected);

            if (!isValid) {
                this.logger.warn(
                    `[chooseWithAI] AI selected invalid option: ${result.selected}, using default`
                );
                return {
                    selected: options[0].value,
                    confidence: "low",
                    reasoning: "AI selected invalid option, using default",
                };
            }

            this.logger.info(`[chooseWithAI] Valid choice selected: ${result.selected}`);
            return result as ChoiceResult;
        } catch (error) {
            this.logger.error(`[chooseWithAI] Error in AI selection:`, error);
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "Error during AI selection, using default",
            };
        }
    }

    public formatOptionsForDisplay(
        options: ChoiceOption[],
        showNumbers = true
    ): string {
        return options
            .map((opt, idx) => {
                const prefix = showNumbers ? `${idx + 1}. ` : "• ";
                const desc = opt.description ? ` - ${opt.description}` : "";
                return `${prefix}${opt.label}${desc}`;
            })
            .join("\n");
    }
}

export class GenericChoiceManager {
    private choiceHandler: ChoiceHandler = new ChoiceHandler();

    private fieldOptions: Map<string, ChoiceOption[]> = new Map([
        [
            "roof_type",
            [
                { value: "vertical", label: "Vertical", description: "Best weather protection" },
                { value: "regular", label: "Regular", description: "Standard horizontal panels" },
                { value: "box", label: "Box", description: "Economy option" },
            ],
        ],
        [
            "building_type",
            [
                { value: "garage", label: "Garage", description: "Standard garage" },
                { value: "shed", label: "Shed", description: "Storage shed" },
                { value: "barn", label: "Barn", description: "Agricultural barn" },
            ],
        ],
        [
            "garage_type",
            [
                { value: "1-car", label: "1-car", description: "Single car garage" },
                { value: "2-car", label: "2-car", description: "Two car garage" },
                { value: "3-car", label: "3-car", description: "Three car garage" },
            ],
        ],
    ]);

    public async handleChoice(
        field: string,
        userInput: string,
        customOptions?: ChoiceOption[]
    ): Promise<ChoiceResult> {
        const options = customOptions || this.fieldOptions.get(field);

        if (!options || options.length === 0) {
            throw new Error(`No options configured for field: ${field}`);
        }

        logger.info(`[GenericChoiceManager] Handling choice for field: ${field}`);

        return await this.choiceHandler.parseUserChoiceWithAI(
            userInput,
            options,
            `User is selecting a value for: ${field}`
        );
    }

    public getPrompt(field: string, customOptions?: ChoiceOption[]): string {
        const options = customOptions || this.fieldOptions.get(field);

        if (!options) {
            throw new Error(`No options configured for field: ${field}`);
        }

        const fieldLabel = field.replace(/_/g, " ").toUpperCase();

        return `Which ${fieldLabel} would you prefer?\n${this.choiceHandler.formatOptionsForDisplay(
            options
        )}`;
    }
}
