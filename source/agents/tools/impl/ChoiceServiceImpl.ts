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
export class ChoiceServiceImpl implements IChoiceService {
    private static instance: IChoiceService;
    private static readonly INDIFFERENCE_KEYWORDS: Set<string> = new Set([
        "any", "whatever", "i don't care", "dunno", "idk",
        "doesn't matter", "don't care", "idc", "no preference", "doesn't care"
    ]);
    private static readonly ROOF_TYPE_PATTERN: RegExp = /^(vertical|regular|box|a-frame)$/i;
    private static readonly JSON_EXTRACT_PATTERN: RegExp = /\{[\s\S]*\}/;
    protected static readonly NUMBER_PATTERN: RegExp = /^\d+$/;

    private readonly configs: Map<string, FieldConfig>;

    constructor(enforce: () => void, configs: FieldConfig[])
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ChoiceServiceImpl.getInstance() instead of new.");
        }
        this.configs = new Map(configs.map(c => [c.name, c]));
    }

    public static getInstance(): IChoiceService
    {
        return ChoiceServiceImpl.instance ??= new ChoiceServiceImpl(Enforce, Constants.DEFAULT_FIELDS);
    }

    /**
     * Main parsing method with strict priority order
     *
     * ⚠️ CRITICAL: The `options` array MUST be in the EXACT order shown to the user!
     * If user sees: 1. Red, 2. Blue, 3. Green
     * Then options[0] must be Red, options[1] must be Blue, options[2] must be Green
     */
    public async parse(userInput: string, options: ChoiceOption[], context = ""): Promise<ChoiceResult>
    {
        logger.info(`[ChoiceParser] Parsing: "${userInput}" from ${options.length} options`);

        logger.info(`[ChoiceParser] Options array order (MUST match display order):`);
        options.forEach((opt, idx) => {
            logger.info(`  [${idx}] → Display #${idx + 1}: "${opt.label}" (value: ${opt.value})`);
        });

        const strategies = [
            () => this.tryNumberMatch(userInput, options),
            () => this.tryTextMatch(userInput, options),
            () => this.tryIndifference(userInput, options)
        ];

        for (const strategy of strategies)
        {
            const result: ChoiceResult = strategy();
            if (result) {
                logger.info(`[ChoiceParser] ✅ Match: ${result.selected}`);
                return result;
            }
        }

        logger.info(`[ChoiceParser] No direct match, trying AI`);
        try
        {
            const aiResult: ChoiceResult = await this.decideWithAI(userInput, options, context);
            logger.info(`[ChoiceParser] ✅ AI result: ${aiResult.selected}`);
            return aiResult;
        }
        catch (aiError)
        {
            logger.error(`[ChoiceParser] AI failed:`, aiError);
        }

        logger.warn(`[ChoiceParser] All methods failed, using default`);
        return this.defaultFallback(options);
    }

    /**
     * STRICT: Attempts direct number-based selection ONLY
     *
     * ⚠️ ASSUMES: options[i] corresponds to display position i+1
     * If display shows "4. Evergreen" then options[3].value must be "Evergreen"
     */
    private tryNumberMatch(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const trimmed: string = userInput.trim();
        if (!ChoiceServiceImpl.NUMBER_PATTERN.test(trimmed))
        {
            return null;
        }

        const displayNumber: number = parseInt(trimmed, 10);
        const index: number = displayNumber - 1;

        if (index < 0 || index >= options.length)
        {
            logger.warn(`[ChoiceParser] Number ${displayNumber} out of range (1-${options.length})`);
            return null;
        }

        const selected: ChoiceOption = options[index];
        logger.info(`[ChoiceParser] ✅ NUMBER MATCH: user entered "${displayNumber}" → array index ${index} → "${selected.label}" (${selected.value})`);

        return {
            selected: selected.value,
            confidence: "high",
            reasoning: `User selected option ${displayNumber} (${selected.label})`
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
                    reasoning: `User selected "${option.label}"`
                };
            }

            if (optionLabel.includes(lowerInput) || lowerInput.includes(optionLabel))
            {
                logger.info(`[ChoiceParser] Contains match: "${option.label}" (${option.value})`);
                return {
                    selected: option.value,
                    confidence: "high",
                    reasoning: `User indicated "${option.label}"`
                };
            }
        }

        return null;
    }

    /**
     * STRICT: Check if user expressed indifference
     */
    private tryIndifference(userInput: string, options: ChoiceOption[]): ChoiceResult | null
    {
        const trimmed: string = userInput.trim().toLowerCase();
        if (!ChoiceServiceImpl.INDIFFERENCE_KEYWORDS.has(trimmed)) return null;

        logger.info(`[ChoiceParser] ✅ Indifference detected for: "${userInput}"`);
        const result = this.selectBalancedOption(options);
        logger.info(`[ChoiceParser] Selected balanced option: ${result.selected}`);
        return result;
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
            reasoning: `User expressed no preference, selected balanced option: ${selected.label}`
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

        const selected: ChoiceOption = options[0];
        logger.warn(`[ChoiceParser] Using default fallback: ${selected.value}`);

        return {
            selected: selected.value,
            confidence: "low",
            reasoning: "No match found, using first option as default"
        };
    }

    /**
     * Uses LLM only as last resort
     */
    private async decideWithAI(userInput: string, options: ChoiceOption[], context: string): Promise<ChoiceResult>
    {
        const prompt: string = this.buildLLMPrompt(userInput, options, context);
        logger.info("[ChoiceParser] Invoking LLM for decision");

        const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
        logger.debug(`[ChoiceParser] LLM response: ${response.substring(0, 150)}`);

        return this.parseLLMResponse(response, options);
    }

    private buildLLMPrompt(userInput: string, options: ChoiceOption[], context: string): string
    {
        const optionsText: string = options
            .map((opt, idx) => `${idx + 1}. ${opt.label} (${opt.value})${opt.description ? ` - ${opt.description}` : ""}`)
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
        const cleaned: string = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const jsonMatch: RegExpMatchArray = cleaned.match(ChoiceServiceImpl.JSON_EXTRACT_PATTERN);

        if (!jsonMatch)
        {
            logger.warn("[ChoiceParser] No JSON in LLM response");
            throw new Error("No JSON in response");
        }

        const result = JSON.parse(jsonMatch[0]) as ChoiceResult;
        const isValid: boolean = options.some(opt => opt.value === result.selected);

        if (!isValid)
        {
            const validValues: string = options.map(o => o.value).join(", ");
            logger.warn(`[ChoiceParser] LLM selected invalid option: ${result.selected}`);
            logger.warn(`[ChoiceParser] Valid options: ${validValues}`);
            throw new Error(`Invalid option: ${result.selected}`);
        }

        logger.info(`[ChoiceParser] ✅ LLM validated choice: ${result.selected}`);
        return result;
    }

    public formatOptions(options: ChoiceOption[], showNumbers = true): string
    {
        return options
            .map((opt, idx) => {
                const prefix = showNumbers ? `${idx + 1}. ` : "• ";
                const desc = opt.description ? ` - ${opt.description}` : "";
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

    /**
     * ⚠️ CRITICAL: Returns options in their CONFIGURED order
     * If your UI displays them differently, you MUST reorder them before calling parse()!
     */
    public getOptions(field: string): ChoiceOption[]
    {
        const config: FieldConfig = this.configs.get(field);
        if (!config)
        {
            throw new Error(`No options configured for field: ${field}`);
        }

        logger.info(`[ChoiceService] getOptions("${field}") returning ${config.options.length} options:`);
        config.options.forEach((opt, idx) => {logger.info(`  [${idx}] value="${opt.value}" label="${opt.label}"`);});

        return config.options;
    }

    public async parseUserChoiceWithAI(userInput: string, options: ChoiceOption[], context = ""): Promise<ChoiceResult>
    {
        return this.parse(userInput, options, context);
    }

    /**
     * ⚠️ CRITICAL: The options passed here MUST be in display order!
     */
    public async handleChoice(field: string, userInput: string, customOptions?: ChoiceOption[]): Promise<ChoiceResult>
    {
        logger.info(`[ChoiceService] Handling choice for ${field}: "${userInput}"`);
        const options: ChoiceOption[] = customOptions || this.getOptions(field);

        if (customOptions)
        {
            logger.info(`[ChoiceService] Using custom options (ensure they match display order!)`);
        }

        return this.parse(userInput, options, `User is selecting a value for: ${field}`);
    }

    public async resolve(field: keyof UserFriendlyParams, value: any): Promise<any> {
        logger.info(`[ChoiceService] Resolving ${field} = ${value}`);

        if (ChoiceServiceImpl.ROOF_TYPE_PATTERN.test(String(value))) {
            logger.info(`[ChoiceService] Value is explicit, returning: ${value}`);
            return value;
        }

        if (field !== "roof_type") return value;

        logger.info(`[ChoiceService] Resolving roof_type choice`);

        const result = await this.handleChoice("roof_type", String(value));
        logger.info(`[ChoiceService] Resolved to: ${result.selected}`);

        return result.selected;
    }
}

/**
 * Enforce singleton pattern
 */
function Enforce(): void {}
