import { IChoiceParser } from "./io/IChoiceHandler";
import {ChoiceOption, ChoiceResult} from "@agents/tools/io/IChoiceHandler";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
const logger: pino.Logger = createLogger(module);

/**
 *
 * ChoiceParser: Handles user input matching and validation
 * Implements fallback strategy: direct match → AI → default
 */
export class ChoiceParser implements IChoiceParser
{
    private static readonly INDIFFERENCE_KEYWORDS: string[] = [
        "any",
        "whatever",
        "i don't care",
        "dunno",
        "idk",
        "doesn't matter",
    ];

    /**
     * Parses user choice with an intelligent fallback strategy
     */
    public async parse(userInput: string, options: ChoiceOption[], context: string = ""): Promise<ChoiceResult>
    {
        logger.info({ userInput, optionCount: options.length }, "[ChoiceParser] Parsing user choice");

        try
        {
            let result: ChoiceResult = this.tryNumberMatch(userInput, options);

            if (result)
            {
                return result;
            }

            result = this.tryTextMatch(userInput, options);

            if (result)
            {
                return result;
            }

            if (this.isIndifferenceExpressed(userInput))
            {
                return this.selectBalancedOption(options);
            }

            logger.info("[ChoiceParser] No direct match, using AI");
            return await this.decideWithAI(userInput, options, context);
        }
        catch (error)
        {
            logger.error({ err: error }, "[ChoiceParser] Error parsing choice");
            return this.defaultFallback(options);
        }
    }

    /**
     * Attempts direct number-based selection
     */
    private tryNumberMatch(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const numberMatch: RegExpMatchArray = userInput.match(/^\d+$/);

        if (!numberMatch)
        {
            return null;
        }

        const index: number = parseInt(userInput) - 1;

        if (index < 0 || index >= options.length)
        {
            return null;
        }

        logger.info(`[ChoiceParser] Number match: option ${index + 1}`);
        return {
            selected: options[index].value,
            confidence: "high",
            reasoning: `User selected option ${index + 1} by number`,
        };
    }

    /**
     * Attempts case-insensitive text matching against label/value
     */
    private tryTextMatch(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const lowerInput: string = userInput.toLowerCase().trim();

        const directMatch: ChoiceOption = options.find(
            opt =>
                opt.value.toLowerCase() === lowerInput ||
                opt.label.toLowerCase() === lowerInput ||
                opt.label.toLowerCase().includes(lowerInput)
        );

        if (!directMatch)
        {
            return null;
        }

        logger.info(`[ChoiceParser] Text match: ${directMatch.value}`);
        return {
            selected: directMatch.value,
            confidence: "high",
            reasoning: `User explicitly selected "${directMatch.label}"`,
        };
    }

    /**
     * Checks if the user expressed indifference
     */
    private isIndifferenceExpressed(userInput: string): boolean
    {
        return ChoiceParser.INDIFFERENCE_KEYWORDS.includes(userInput.toLowerCase().trim());
    }

    /**
     * Selects a middle option when user is indifferent
     */
    private selectBalancedOption(options: ChoiceOption[]): ChoiceResult
    {
        const middleIndex: number = Math.floor(options.length / 2);
        const selected: ChoiceOption = options[middleIndex];

        logger.info(`[ChoiceParser] Indifference detected, selecting balanced option`);
        return {
            selected: selected.value,
            confidence: "high",
            reasoning: `User expressed no preference, selected balanced option: ${selected.label}`,
        };
    }

    /**
     * Fallback result when all parsings fail
     */
    private defaultFallback(options: ChoiceOption[]): ChoiceResult
    {
        return {
            selected: options[0].value,
            confidence: "low",
            reasoning: "Error during parsing, selected default option",
        };
    }

    /**
     * Uses LLM to match user input to a best option
     */
    private async decideWithAI(userInput: string, options: ChoiceOption[], context: string): Promise<ChoiceResult>
    {
        try
        {
            const prompt: string = this.buildLLMPrompt(userInput, options, context);
            logger.info("[ChoiceParser] Invoking LLM for decision");

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            return this.parseLLMResponse(response, options);
        }
        catch (error)
        {
            logger.error({ err: error }, "[ChoiceParser] AI decision failed");
            return this.defaultFallback(options);
        }
    }

    /**
     * Constructs LLM prompt with options and context
     */
    private buildLLMPrompt(userInput: string, options: ChoiceOption[], context: string): string
    {
        const optionsText: string = options
            .map(
                (opt, idx) =>
                    `${idx + 1}. ${opt.label} (${opt.value})${
                        opt.description ? ` - ${opt.description}` : ""
                    }`
            )
            .join("\n");

        return `You are a helpful assistant choosing from predefined options.

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
    }

    /**
     * Extracts and validates JSON from LLM response
     */
    private parseLLMResponse(response: string, options: ChoiceOption[]): ChoiceResult
    {
        const cleaned: string = response
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        const jsonMatch: RegExpMatchArray = cleaned.match(/\{[\s\S]*\}/);

        if (!jsonMatch)
        {
            logger.warn("[ChoiceParser] No JSON found in LLM response");
            throw new Error("Invalid LLM response format");
        }

        const result = JSON.parse(jsonMatch[0]) as ChoiceResult;

        if (!options.some(opt => opt.value === result.selected))
        {
            logger.warn(`[ChoiceParser] LLM selected invalid option: ${result.selected}`);
            throw new Error("LLM selected invalid option");
        }

        logger.info(`[ChoiceParser] Valid LLM choice: ${result.selected}`);
        return result;
    }
}
