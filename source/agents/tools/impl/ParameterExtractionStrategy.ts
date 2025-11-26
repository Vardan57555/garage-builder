import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
import {ExtractionResult} from "@agents/tools/io/IParameterExtraction";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";
import {IParameterExtractionStrategy} from "@agents/tools/impl/io/IParameterExtractionStrategy";
import {InstantiationError} from "@errors/InstantiationError";

export class ParameterExtractionStrategy implements IParameterExtractionStrategy
{
    private static instance: IParameterExtractionStrategy;
    private readonly codeIndicators: string[] = [
        "def ",
        "import ",
        "function ",
        "const ",
        "pattern ",
        "regex",
    ];

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ParameterExtractionStrategy.getInstance() instead of new.");
        }

    }

    /**
     * Gets the singleton instance of AddonService.
     *
     * @returns The singleton instance of AddonService.
     */

    public static getInstance(): IParameterExtractionStrategy
    {
        if(!ParameterExtractionStrategy.instance)
        {
            ParameterExtractionStrategy.instance = new ParameterExtractionStrategy(Enforce);
        }

        return ParameterExtractionStrategy.instance;
    }

    public buildLockedContext(params: Partial<UserFriendlyParams>): string
    {
        const entries: string[] = [
            params.width && `  - width: ${params.width}ft`,
            params.length && `  - length: ${params.length}ft`,
            params.height && `  - height: ${params.height}ft`,
            params.state_name && `  - state_name: "${params.state_name}"`,
            params.roof_type && `  - roof_type: "${params.roof_type}"`,
            params.gauge && `  - gauge: ${params.gauge}`,
            params.garage_type && `  - garage_type: "${params.garage_type}"`,
        ].filter(Boolean);

        return entries.length > 0
            ? `Already extracted (do NOT override):\n${entries.join("\n")}`
            : "";
    }

    public buildExtractionPrompt(field: keyof UserFriendlyParams, userInput: string, lockedContext: string): string
    {
        const config =
            Constants.FIELD_EXTRACTION_CONFIGS[field];

        return `CRITICAL: You are ONLY extracting a single value. NO EXPLANATIONS. NO CODE.

FIELD: ${field}
INSTRUCTION: ${config.instructions}

${lockedContext}

⚠️ STRICT RULES:
1. Return ONLY the value - nothing else
2. NO explanations, NO code, NO comments
3. NO markdown, NO JSON structure
4. If user expresses indecision ("any", "idk", "whatever", etc), return the DEFAULT for this field
5. If user mentions different field, return: null
6. If cannot extract, return: null

EXAMPLES:
${config.examples}

USER INPUT: "${userInput}"

RETURN ONLY THE VALUE:`;
    }

    public async extractLLMResponse(userInput: string, prompt: string): Promise<string>
    {
        const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

        if (this.containsCode(response))
        {
            throw new Error("LLM returned code instead of JSON");
        }

        return response;
    }

    public extract(context: string, baseParams: Record<string, any>): ExtractionResult | null
    {
        const carCountMatch: RegExpMatchArray = context.match(/(\d+)\s*cars?/i);

        if (!carCountMatch)
        {
            return null;
        }

        const numCars: number = parseInt(carCountMatch[1], 10);
        const garageType = `${numCars}-car`;

        const calc = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(garageType);

        if (!calc.width || !calc.length || !calc.height)
        {
            return null;
        }

        return {
            userFriendlyParams: {
                ...baseParams,
                garage_type: garageType,
                width: calc.width,
                length: calc.length,
                height: calc.height,
                building_type: "garage",
            },
            nextStep: "check_missing_fields",
        };
    }

    private containsCode(response: string): boolean
    {
        return this.codeIndicators.some((indicator) => response.includes(indicator));
    }
}


/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
