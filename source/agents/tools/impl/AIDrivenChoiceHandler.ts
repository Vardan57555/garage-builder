import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {ChoiceServiceImpl} from "@agents/tools/impl/ChoiceServiceImpl";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ AI-DRIVEN CHOICE HANDLER: No hardcoding, pure AI validation
 */
export class AIDrivenChoiceHandler {

    /**
     * 🎯 MAIN: Process user choice and validate against field options
     */
    static async processUserChoice(
        userInput: string,
        fieldName: string,
        availableOptions: string[]
    ): Promise<{
        field: string;
        value: string;
        confidence: "high" | "medium" | "low";
        reasoning: string;
        requiresConfirmation: boolean;
        clarificationPrompt?: string;
    } | null> {

        logger.info(`[AIDrivenChoiceHandler] Processing choice for ${fieldName}`);
        logger.info(`[AIDrivenChoiceHandler] User input: "${userInput}"`);
        logger.info(`[AIDrivenChoiceHandler] Available options: ${availableOptions.join(", ")}`);

        if (!userInput?.trim()) {
            logger.warn(`[AIDrivenChoiceHandler] Empty input`);
            return null;
        }

        const matchResult = await this.matchUserInputToOption(
            userInput,
            fieldName,
            availableOptions
        );

        if (!matchResult) {
            logger.warn(`[AIDrivenChoiceHandler] No valid match found`);
            return null;
        }

        let clarificationPrompt: string | undefined;
        if (matchResult.confidence === "medium" || matchResult.confidence === "low") {
            clarificationPrompt = await this.generateClarificationPrompt(
                userInput,
                matchResult.value,
                availableOptions,
                fieldName
            );
        }

        return {
            field: fieldName,
            value: matchResult.value,
            confidence: matchResult.confidence,
            reasoning: matchResult.reasoning,
            requiresConfirmation: matchResult.confidence !== "high",
            clarificationPrompt,
        };
    }

    /**
     * ✅ STEP 1: Match user input to available options using AI
     * 🔧 FIX: Add exact match detection BEFORE AI call
     */
    private static async matchUserInputToOption(
        userInput: string,
        fieldName: string,
        availableOptions: string[]
    ): Promise<{
        value: string;
        confidence: "high" | "medium" | "low";
        reasoning: string;
    } | null> {

        try {
            const normalizedInput = userInput.trim().toLowerCase();

            const exactMatch = availableOptions.find(
                opt => opt.toLowerCase() === normalizedInput
            );

            if (exactMatch) {
                logger.info(`[matchUserInputToOption] ✅ EXACT MATCH: "${userInput}" → "${exactMatch}"`);
                return {
                    value: exactMatch,
                    confidence: "high",
                    reasoning: `Exact match for ${fieldName}`
                };
            }

            const inputAsNumber = parseInt(normalizedInput, 10);
            if (!isNaN(inputAsNumber) && inputAsNumber >= 1 && inputAsNumber <= availableOptions.length) {
                const selectedOption = availableOptions[inputAsNumber - 1];
                logger.info(`[matchUserInputToOption] ✅ OPTION NUMBER MATCH: "${userInput}" → "${selectedOption}" (option ${inputAsNumber})`);
                return {
                    value: selectedOption,
                    confidence: "high",
                    reasoning: `Selected option ${inputAsNumber} for ${fieldName}`
                };
            }

            logger.info(`[matchUserInputToOption] No exact match, using AI for fuzzy matching...`);

            const examplesForField = availableOptions
                .map((opt, idx) => `- "${idx + 1}" → value: "${opt}" (option ${idx + 1})`)
                .join("\n");

            const prompt = `You are a parameter matching AI. Match the user's input to ONE of the available options.

FIELD: ${fieldName}
AVAILABLE OPTIONS: ${availableOptions.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}

MATCHING RULES:
1. User might use abbreviations, synonyms, or descriptions
2. User might enter a number (1, 2, 3) → map to corresponding option
3. User might type partial matches → find best match
4. Match by meaning, not just exact text

Confidence levels:
- high: Exact match, clear abbreviation, or unambiguous option number
- medium: Partial match, likely synonym, or reasonable interpretation
- low: Vague input, multiple possible matches, or unclear match

⚠️ CRITICAL NUMBER MAPPING for ${fieldName}:
${examplesForField}

OTHER EXAMPLES:
- "vert" → value: "${availableOptions[0]}" (partial match)
- "V" → value: "${availableOptions[0]}" (abbreviation)

Return ONLY JSON (NO markdown, NO explanation):
{
  "value": "<matched_option_from_available_options>",
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of why this match was chosen"
}

User input: "${userInput}"

ONLY valid JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[matchUserInputToOption] AI response: "${response}"`);

            const parsed = this.parseAIResponse(response);

            if (!parsed) {
                logger.warn(`[matchUserInputToOption] Failed to parse AI response`);
                return null;
            }

            const isValidOption = availableOptions.some(
                opt => opt.toLowerCase() === (parsed.value?.toLowerCase() || "")
            );

            if (!isValidOption) {
                logger.warn(`[matchUserInputToOption] AI suggested invalid option: ${parsed.value}`);
                logger.warn(`[matchUserInputToOption] Available: ${availableOptions.join(", ")}`);
                return null;
            }

            logger.info(`[matchUserInputToOption] ✅ Matched: ${parsed.value} (confidence: ${parsed.confidence})`);

            return parsed;

        } catch (error) {
            logger.error(`[matchUserInputToOption] Error:`, error);
            return null;
        }
    }

    /**
     * ✅ STEP 2: Generate AI clarification prompt for low/medium confidence
     */
    private static async generateClarificationPrompt(
        userInput: string,
        matchedValue: string,
        availableOptions: string[],
        fieldName: string
    ): Promise<string> {

        try {
            const prompt = `Generate a clarification prompt to confirm the user's choice.

CONTEXT:
- Field: ${fieldName}
- User said: "${userInput}"
- We think they meant: "${matchedValue}"
- Available options: ${availableOptions.join(", ")}

REQUIREMENTS:
1. Be conversational and friendly
2. Clearly show what we understood (the matched option)
3. Provide context/description of the matched option
4. Ask for confirmation (yes/no or similar)
5. Offer to show other options if wrong

EXAMPLES:
Input: "vert", Matched: "vertical", Field: "roof_type"
Output: "Got it! You want a **Vertical** roof (best weather protection). Is that correct? \n\nOther options: Regular (standard panels), Box (economy), or A-Frame (pitched roof)"

Input: "1", Matched: "vertical", Field: "roof_type"
Output: "You chose option 1 - **Vertical** roof with best weather protection. Should I go with that? \n\nOther options: 2. Regular, 3. Box, 4. A-Frame"

Generate a clarification prompt for this scenario:
Field: ${fieldName}
User input: "${userInput}"
Matched value: "${matchedValue}"
Available options: ${availableOptions.join(", ")}

Return ONLY the clarification prompt text (NO JSON, NO markdown formatting):`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const clarification = response.trim();

            logger.debug(`[generateClarificationPrompt] Generated: "${clarification}"`);

            return clarification;

        } catch (error) {
            logger.error(`[generateClarificationPrompt] Error:`, error);
            return `Did you mean "${matchedValue}"? Please confirm or try again.`;
        }
    }

    /**
     * ✅ Generate dynamic choice prompt from options
     */
    static async generateChoicePrompt(
        fieldName: string,
        availableOptions: string[],
        fieldDescription?: string
    ): Promise<string> {

        try {
            const optionsFormatted = availableOptions
                .map((opt, i) => `${i + 1}. ${opt}`)
                .join("\n");

            const prompt = `Generate a user-friendly choice prompt for selecting a value.

FIELD: ${fieldName}
DESCRIPTION: ${fieldDescription || "no description provided"}
OPTIONS:
${optionsFormatted}

REQUIREMENTS:
1. Use conversational tone
2. Explain what each option means briefly
3. Provide examples of how to respond (e.g., "Enter: 1, vertical, V, or vert")
4. Make it clear what to do next

EXAMPLE OUTPUT for roof_type:
"🏠 Which **Roof Type** would you prefer?

1. **Vertical** - Best weather protection (recommended)
2. **Regular** - Standard horizontal panels
3. **Box** - Economy option
4. **A-Frame** - Pitched roof style

You can enter: a number (1-4), the name, or abbreviation (e.g., "1", "vertical", "V", "vert")"

Generate the prompt:

ONLY the prompt text (NO JSON, NO explanation):`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const choicePrompt = response.trim();

            logger.info(`[generateChoicePrompt] Generated choice prompt for ${fieldName}`);

            return choicePrompt;

        } catch (error) {
            logger.error(`[generateChoicePrompt] Error:`, error);
            return `Select a ${fieldName}:\n${availableOptions.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}`;
        }
    }

    /**
     * ✅ Handle confirmation response
     */
    static async confirmChoice(
        confirmationInput: string,
        matchedValue: string
    ): Promise<{
        confirmed: boolean;
        reasoning: string;
    }> {

        try {
            const prompt = `User is confirming if they want to select: "${matchedValue}"

Their response: "${confirmationInput}"

Determine if they:
- Confirmed (yes, okay, correct, sure, etc.)
- Rejected (no, wrong, different, etc.)
- Unclear

Return ONLY JSON:
{
  "confirmed": <true or false>,
  "reasoning": "brief explanation"
}

User response: "${confirmationInput}"

ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const parsed = this.parseAIResponse(response);

            if (!parsed) {
                logger.warn(`[confirmChoice] Could not parse confirmation response`);
                return {
                    confirmed: false,
                    reasoning: "Could not understand confirmation"
                };
            }

            logger.info(`[confirmChoice] Confirmation: ${parsed.confirmed} (${parsed.reasoning})`);

            return {
                confirmed: parsed.confirmed,
                reasoning: parsed.reasoning
            };

        } catch (error) {
            logger.error(`[confirmChoice] Error:`, error);
            return {
                confirmed: false,
                reasoning: "Error processing confirmation"
            };
        }
    }

    /**
     * ✅ UTILITY: Parse AI responses
     */
    private static parseAIResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[parseAIResponse] No JSON found in: "${response}"`);
                return null;
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error(`[parseAIResponse] Failed to parse:`, error);
            return null;
        }
    }

    /**
     * ✅ Get available options for a field dynamically
     */
    static getAvailableOptions(fieldName: string): string[] {
        const choiceService = ChoiceServiceImpl.getInstance();

        try {
            const options = choiceService.getOptions(fieldName);
            const values = options.map(opt => opt.value);

            logger.info(`[getAvailableOptions] Field: ${fieldName}, Options:`, values);

            return values;
        } catch (error) {
            logger.warn(`[getAvailableOptions] No options for ${fieldName}, using fallback`);

            const optionsMap: { [key: string]: string[] } = {
                "roof_type": ["vertical", "regular", "box"],
                "gauge": ["14", "16", "18", "20"],
                "building_type": ["garage", "shed", "barn"],
                "color": []
            };

            return optionsMap[fieldName] || [];
        }
    }
}

/**
 * ✅ MAIN EXPORT: Use in your ChoiceServiceImpl
 */
export async function handleChoiceWithAI(
    fieldName: string,
    userInput: string,
    availableOptions?: string[]
): Promise<{
    field: string;
    selected: string;
    confidence: "high" | "medium" | "low";
    requiresConfirmation: boolean;
    clarificationPrompt?: string;
} | null> {

    const options = availableOptions || AIDrivenChoiceHandler.getAvailableOptions(fieldName);

    if (!options.length) {
        logger.warn(`[handleChoiceWithAI] No options available for ${fieldName}`);
        return null;
    }

    const result = await AIDrivenChoiceHandler.processUserChoice(
        userInput,
        fieldName,
        options
    );

    if (!result) return null;

    return {
        field: result.field,
        selected: result.value,
        confidence: result.confidence,
        requiresConfirmation: result.requiresConfirmation,
        clarificationPrompt: result.clarificationPrompt
    };
}
