import {IChoiceService} from "./io/IChoiceHandler";
import {ChoiceOption, ChoiceResult, FieldConfig} from "@agents/tools/io/IChoiceHandler";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {InstantiationError} from "@errors/InstantiationError";
import {Constants} from "@common/io/Constants";
const logger: pino.Logger = createLogger(module);

/**
 * ChoiceParser: Handles user input matching and validation
 * Implements fallback strategy: number match → text match → indifference → AI → default
 */
export class ChoiceServiceImpl implements IChoiceService
{
    private configs: Map<string, FieldConfig>;
    private static instance: IChoiceService;

    private static readonly INDIFFERENCE_KEYWORDS: string[] = [
        "any",
        "whatever",
        "i don't care",
        "dunno",
        "idk",
        "doesn't matter",
        "don't care",
        "idc",
        "no preference",
        "doesn't care",
    ];

    constructor(enforce: () => void, configs: FieldConfig[])
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ChoiceServiceImpl.getInstance() instead of new.");
        }

        this.configs = new Map(configs.map(c => [c.name, c]));
    }

    public static getInstance(): IChoiceService
    {
        if(!ChoiceServiceImpl.instance)
        {
            ChoiceServiceImpl.instance = new ChoiceServiceImpl(Enforce, Constants.DEFAULT_FIELDS);
        }

        return ChoiceServiceImpl.instance;
    }

    /**
     * Main parsing method with strict priority order
     */
    public async parse(userInput: string, options: ChoiceOption[], context: string = ""): Promise<ChoiceResult>
    {
        logger.info(`[ChoiceParser] Parsing: "${userInput}" from ${options.length} options`);

        const numberResult: ChoiceResult = this.tryNumberMatch(userInput, options);
        if (numberResult) {
            logger.info(`[ChoiceParser] ✅ Number match: ${numberResult.selected}`);
            return numberResult;
        }

        const textResult: ChoiceResult = this.tryTextMatch(userInput, options);
        if (textResult) {
            logger.info(`[ChoiceParser] ✅ Text match: ${textResult.selected}`);
            return textResult;
        }

        if (this.isIndifferenceExpressed(userInput))
        {
            logger.info(`[ChoiceParser] ✅ Indifference detected for: "${userInput}"`);
            const balancedResult = this.selectBalancedOption(options);
            logger.info(`[ChoiceParser] Selected balanced option: ${balancedResult.selected}`);
            return balancedResult;
        }

        logger.info(`[ChoiceParser] No direct match, trying AI`);
        try {
            const aiResult: ChoiceResult = await this.decideWithAI(userInput, options, context);
            logger.info(`[ChoiceParser] ✅ AI result: ${aiResult.selected}`);
            return aiResult;
        } catch (aiError) {
            logger.error(`[ChoiceParser] AI failed:`, aiError);
        }

        logger.warn(`[ChoiceParser] All methods failed, using default`);
        return this.defaultFallback(options);
    }

    /**
     * STRICT: Attempts direct number-based selection ONLY
     */
    private tryNumberMatch(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const trimmed: string = userInput.trim();

        const numberMatch: RegExpMatchArray = trimmed.match(/^\d+$/);
        if (!numberMatch)
        {
            return null;
        }

        const index: number = parseInt(trimmed) - 1;

        if (index < 0 || index >= options.length)
        {
            logger.warn(`[ChoiceParser] Number ${trimmed} out of range (1-${options.length})`);
            return null;
        }

        const selected: ChoiceOption = options[index];
        logger.info(`[ChoiceParser] Number match: ${trimmed} → option[${index}] = ${selected.value}`);

        return {
            selected: selected.value,
            confidence: "high",
            reasoning: `User selected option ${trimmed} (${selected.label})`,
        };
    }

    /**
     * STRICT: Attempts text match - EXACT or CONTAINS only
     */
    private tryTextMatch(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const lowerInput: string = userInput.toLowerCase().trim();

        for (const option of options)
        {
            const optionLabel: string = option.label.toLowerCase();
            const optionValue: string = option.value.toLowerCase();

            if (optionLabel === lowerInput || optionValue === lowerInput)
            {
                logger.info(`[ChoiceParser] Exact text match: "${option.label}" (${option.value})`);
                return {
                    selected: option.value,
                    confidence: "high",
                    reasoning: `User selected "${option.label}"`,
                };
            }

            if (optionLabel.includes(lowerInput) || lowerInput.includes(optionLabel))
            {
                logger.info(`[ChoiceParser] Contains match: "${option.label}" (${option.value})`);
                return {
                    selected: option.value,
                    confidence: "high",
                    reasoning: `User indicated "${option.label}"`,
                };
            }
        }

        return null;
    }

    /**
     * STRICT: Check if user expressed indifference
     */
    private isIndifferenceExpressed(userInput: string): boolean
    {
        const trimmed: string = userInput.trim().toLowerCase();
        const isIndifferent: boolean = ChoiceServiceImpl.INDIFFERENCE_KEYWORDS.includes(trimmed);

        if (isIndifferent)
        {
            logger.info(`[ChoiceParser] Indifference keyword detected: "${userInput}"`);
        }

        return isIndifferent;
    }

    /**
     * Select balanced option (middle of list) for indifferent users
     */
    private selectBalancedOption(options: ChoiceOption[]): ChoiceResult
    {
        if (options.length === 0)
        {
            logger.error(`[ChoiceParser] No options available for balanced selection!`);
            throw new Error("No options available");
        }

        const middleIndex: number = Math.floor(options.length / 2);
        const selected: ChoiceOption = options[middleIndex];

        logger.info(`[ChoiceParser] Balanced selection: index ${middleIndex}/${options.length} = ${selected.value}`);

        return {
            selected: selected.value,
            confidence: "high",
            reasoning: `User expressed no preference, selected balanced option: ${selected.label}`,
        };
    }

    /**
     * Default fallback: Use first option
     */
    private defaultFallback(options: ChoiceOption[]): ChoiceResult
    {
        if (options.length === 0)
        {
            logger.error(`[ChoiceParser] CRITICAL: No options available for default fallback!`);
            throw new Error("No options available for default fallback");
        }

        const selected = options[0];
        logger.warn(`[ChoiceParser] Using default fallback: ${selected.value}`);

        return {
            selected: selected.value,
            confidence: "low",
            reasoning: "No match found, using first option as default",
        };
    }

    /**
     * Uses LLM only as last resort
     */
    private async decideWithAI(userInput: string, options: ChoiceOption[], context: string): Promise<ChoiceResult>
    {
        try
        {
            const prompt: string = this.buildLLMPrompt(userInput, options, context);
            logger.info("[ChoiceParser] Invoking LLM for decision");

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
            logger.debug(`[ChoiceParser] LLM response: ${response.substring(0, 150)}`);

            return this.parseLLMResponse(response, options);
        }
        catch (error)
        {
            logger.error("[ChoiceParser] AI decision failed:", error);
            throw error;
        }
    }

    private buildLLMPrompt(userInput: string, options: ChoiceOption[], context: string): string
    {
        const optionsText: string = options
            .map((opt, idx) =>
                `${idx + 1}. ${opt.label} (${opt.value})${opt.description ? ` - ${opt.description}` : ""}`
            )
            .join("\n");

        return `You are choosing from predefined options. Return ONLY valid JSON.

                Context: ${context}
                
                Available options:
                ${optionsText}
                
                User said: "${userInput}"
                
                RULES:
                1. Return the value of the selected option
                2. Confidence: high|medium|low
                3. No explanations, ONLY JSON
                
                {
                  "selected": "option_value",
                  "confidence": "high",
                  "reasoning": "brief reason"
                }`;
    }

    private parseLLMResponse(response: string, options: ChoiceOption[]): ChoiceResult
    {
        try {
            const cleaned: string = response
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
            {
                logger.warn("[ChoiceParser] No JSON in LLM response");
                throw new Error("No JSON in response");
            }

            const result = JSON.parse(jsonMatch[0]) as ChoiceResult;

            const isValid: boolean = options.some(opt => opt.value === result.selected);
            if (!isValid)
            {
                logger.warn(`[ChoiceParser] LLM selected invalid option: ${result.selected}`);
                const validValues = options.map(o => o.value).join(", ");
                logger.warn(`[ChoiceParser] Valid options: ${validValues}`);
                throw new Error(`Invalid option: ${result.selected}`);
            }

            logger.info(`[ChoiceParser] ✅ LLM validated choice: ${result.selected}`);
            return result;
        }
        catch (parseError)
        {
            logger.error("[ChoiceParser] Error parsing LLM response:", parseError);
            throw parseError;
        }
    }

    public formatOptions(options: ChoiceOption[], showNumbers = true): string
    {
        return options
            .map((opt, idx) => {
                const prefix: string = showNumbers ? `${idx + 1}. ` : "• ";
                const desc: string = opt.description ? ` - ${opt.description}` : "";
                return `${prefix}${opt.label}${desc}`;
            })
            .join("\n");
    }

    public formatFieldLabel(field: string): string
    {
        return field
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    public generatePrompt(field: string, options: ChoiceOption[]): string
    {
        const label: string = this.formatFieldLabel(field);
        const formatted: string = this.formatOptions(options);
        return `Which ${label} would you prefer?\n${formatted}`;
    }

    public getPrompt(field: string, customOptions?: ChoiceOption[]): string
    {
        const options: ChoiceOption[] = customOptions || this.getOptions(field);
        return this.generatePrompt(field, options);
    }

    public getOptions(field: string): ChoiceOption[]
    {
        const config: FieldConfig = this.configs.get(field);
        if (!config)
        {
            throw new Error(`No options configured for field: ${field}`);
        }

        logger.error(`[DEBUG] getOptions("${field}") returning:`);
        config.options.forEach((opt, idx) => {
            logger.error(`  ${idx}. value="${opt.value}" label="${opt.label}"`);
        });

        return config.options;
    }

    public async parseUserChoiceWithAI(userInput: string, options: ChoiceOption[], context: string = ""): Promise<ChoiceResult>
    {
        return this.parse(userInput, options, context);
    }

    public async handleChoice(field: string, userInput: string, customOptions?: ChoiceOption[]): Promise<ChoiceResult>
    {
        logger.info(`[ChoiceService] Handling choice for ${field}: "${userInput}"`);
        const options: ChoiceOption[] = customOptions || this.getOptions(field);
        return this.parse(userInput, options, `User is selecting a value for: ${field}`);
    }

    public async resolve(field: keyof UserFriendlyParams, value: any): Promise<any>
    {
        logger.info(`[ChoiceService] Resolving ${field} = ${value}`);

        if (/^(vertical|regular|box|a-frame)$/i.test(String(value)))
        {
            logger.info(`[ChoiceService] Value is explicit, returning: ${value}`);
            return value;
        }

        if (field !== "roof_type")
        {
            return value;
        }

        logger.info(`[ChoiceService] Resolving roof_type choice`);

        const options: ChoiceOption[] = this.getOptions("roof_type");
        logger.error(`[DEBUG] resolve() - options before handleChoice:`);
        options.forEach((opt, idx) => {
            logger.error(`  ${idx}. ${opt.value}`);
        });

        const result: ChoiceResult = await this.handleChoice("roof_type", String(value));
        logger.info(`[ChoiceService] Resolved to: ${result.selected}`);

        return result.selected;
    }
}

/**
 * Enforce singleton pattern
 */
function Enforce(): void
{
}
