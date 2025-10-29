"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericChoiceManager = exports.RoofTypeChoiceHandler = exports.ChoiceHandler = void 0;
exports.exampleIntegration = exampleIntegration;
const SharedLLM_1 = require("../../../llm/SharedLLM");
const messages_1 = require("@langchain/core/messages");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ChoiceHandler {
    logger = logger;
    async parseUserChoiceWithAI(userInput, options, context = "") {
        try {
            this.logger.info("[ChoiceHandler] Parsing user choice:", {
                userInput,
                options: options.map(o => o.value),
                context
            });
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
            const lowerInput = userInput.toLowerCase().trim();
            const directMatch = options.find(opt => opt.value.toLowerCase() === lowerInput ||
                opt.label.toLowerCase() === lowerInput ||
                opt.label.toLowerCase().includes(lowerInput));
            if (directMatch) {
                return {
                    selected: directMatch.value,
                    confidence: "high",
                    reasoning: `User explicitly selected "${directMatch.label}"`
                };
            }
            return await this.chooseWithAI(userInput, options, context);
        }
        catch (error) {
            this.logger.error("[ChoiceHandler] Error parsing choice:", error);
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "Error during parsing, selected default option"
            };
        }
    }
    async chooseWithAI(userInput, options, context) {
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
            const response = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            this.logger.debug("[ChoiceHandler] AI response:", response);
            const cleaned = response
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }
            const result = JSON.parse(jsonMatch[0]);
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
            return result;
        }
        catch (error) {
            this.logger.error("[ChoiceHandler] AI choice failed:", error);
            return {
                selected: options[0].value,
                confidence: "low",
                reasoning: "AI selection failed, using default"
            };
        }
    }
    isValidDirectChoice(userInput, options) {
        const lowerInput = userInput.toLowerCase().trim();
        const numberMatch = userInput.match(/^\d+$/);
        if (numberMatch) {
            const index = parseInt(userInput) - 1;
            return index >= 0 && index < options.length;
        }
        return options.some(opt => opt.value.toLowerCase() === lowerInput ||
            opt.label.toLowerCase() === lowerInput);
    }
    formatOptionsForDisplay(options, showNumbers = true) {
        return options
            .map((opt, idx) => {
            const prefix = showNumbers ? `${idx + 1}. ` : "• ";
            const desc = opt.description ? ` - ${opt.description}` : "";
            return `${prefix}${opt.label}${desc}`;
        })
            .join("\n");
    }
}
exports.ChoiceHandler = ChoiceHandler;
class RoofTypeChoiceHandler {
    choiceHandler = new ChoiceHandler();
    roofOptions = [
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
    async handleRoofChoice(userInput) {
        const roofContext = "The user is being asked to choose a roof style for their garage";
        return await this.choiceHandler.parseUserChoiceWithAI(userInput, this.roofOptions, roofContext);
    }
    isValidRoofChoice(userInput) {
        return this.choiceHandler.isValidDirectChoice(userInput, this.roofOptions);
    }
    getChoicePrompt() {
        return `Which roof style would you prefer?\n${this.choiceHandler.formatOptionsForDisplay(this.roofOptions)}`;
    }
}
exports.RoofTypeChoiceHandler = RoofTypeChoiceHandler;
async function exampleIntegration() {
    const handler = new RoofTypeChoiceHandler();
    const prompt = handler.getChoicePrompt();
    console.log(prompt);
    const userResponse = "any";
    const choice = await handler.handleRoofChoice(userResponse);
    console.log(`Selected: ${choice.selected}`);
    console.log(`Confidence: ${choice.confidence}`);
    console.log(`Reason: ${choice.reasoning}`);
}
class GenericChoiceManager {
    choiceHandler = new ChoiceHandler();
    fieldOptions = new Map([
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
    async handleChoice(field, userInput, customOptions) {
        const options = customOptions || this.fieldOptions.get(field);
        if (!options || options.length === 0) {
            throw new Error(`No options configured for field: ${field}`);
        }
        return await this.choiceHandler.parseUserChoiceWithAI(userInput, options, `User is selecting a value for: ${field}`);
    }
    getPrompt(field, customOptions) {
        const options = customOptions || this.fieldOptions.get(field);
        if (!options) {
            throw new Error(`No options configured for field: ${field}`);
        }
        const fieldLabel = field.replace(/_/g, " ").toUpperCase();
        return `Which ${fieldLabel} would you prefer?\n${this.choiceHandler.formatOptionsForDisplay(options)}`;
    }
    registerOptions(field, options) {
        this.fieldOptions.set(field, options);
        logger.info(`[GenericChoiceManager] Registered options for field: ${field}`);
    }
}
exports.GenericChoiceManager = GenericChoiceManager;
//# sourceMappingURL=ChoiceHandler.js.map