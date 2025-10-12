import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);
import { HumanMessage } from "@langchain/core/messages";
import {BufferMemory} from "langchain/memory";

export class PriceParamsExtractorTool extends BaseTool
{
    /**
     * The singleton instance of `PriceParamsExtractorTool`.
     * @private
     */

    private static instance: PriceParamsExtractorTool;

    /**
     * The unique name identifier for the `PriceParamsExtractorTool`.
     * Used internally to distinguish this tool within the agent system.
     */

    readonly name = "priceParamsExtractor";

    /**
     * Describes the purpose of the `PriceParamsExtractorTool`.
     */

    readonly description = "Extracts building pricing parameters from natural language, calculates building price, and returns structured pricing data.";

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceParamsExtractorTool.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of PriceParamsExtractorTool.
     *
     * @returns The singleton instance of PriceParamsExtractorTool.
     */

    public static getInstance(): PriceParamsExtractorTool
    {
        if (!PriceParamsExtractorTool.instance)
        {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }

        return PriceParamsExtractorTool.instance;
    }

    /**
     * Main method: receives user input, generates IPricingParams, calculates pricing, returns result
     */

    async _call(userInput: string, memory?: BufferMemory): Promise<string>
    {
        const prompt: string = this.buildPrompt(userInput);

        try
        {
            const aiMessage = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const rawOutput = aiMessage.content as string;

            const pricingParams: Partial<IPricingParams> = this.extractParams(rawOutput);

            if (!pricingParams)
            {
                return "";
            }

            const result = await PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(pricingParams as IPricingParams);

            if (memory)
            {
                memory.chatHistory.addUserMessage(userInput);
                memory.chatHistory.addAIChatMessage(result);
            }

            return result;
        }
        catch (error)
        {
            logger.error(`[PriceParamsExtractorTool] _call failed: ${error.message}`);
            throw new Error(`Failed to extract pricing and calculate price: ${error.message}`);
        }
    }



    /**
     * Builds the structured LLM prompt
     */

    private buildPrompt(userInput: string): string
    {
        return `
                You are a garage pricing assistant with general conversation abilities.

                If the user input seems to be about a garage/building, extract pricing parameters strictly following this schema:
                {
                    "width": number,
                    "length": number,
                    "height": number,
                    "single_slope_height": number | null,
                    "map_id": number | null,
                    "roof_id": number | null,
                    "utility_length": number | null,
                    "building_type": string | null,
                    "gauge": number | null,
                    "central_map_id": number | null,
                    "central_height": number | null,
                    "central_utility_length": number | null,
                    "central_length": number | null,
                    "central_width": number | null,
                    "is_barn": boolean | null
                }

                Rules for pricing input:
                - Output ONLY valid JSON when extracting parameters.
                - Do not include explanations or code blocks.
                - Use null instead of undefined.
                - If unsure about a field, set it to null.

                If the user input is NOT related to garage/building parameters:
                - Respond normally as a helpful assistant (e.g., if the user says "Hello", reply "Hello! How can I help you today?").
                - Do not output JSON in this case.

                User input: "${userInput}"
           `.trim();

    }


    /**
     * Extracts and validates pricing params from raw LLM output
     */

    public extractParams(rawOutput: string): Partial<IPricingParams> | null
    {
        const jsonMatch: RegExpMatchArray = rawOutput.match(/\{[\s\S]*\}/);

        if (!jsonMatch)
        {
            return null;
        }

        try {
            let jsonText: string = jsonMatch[0]
                .replace(/undefined/g, "null")
                .replace(/NaN/g, "null")
                .replace(/\bNone\b/g, "null")
                .replace(/(\r\n|\n|\r)/gm, "");

            const params: Partial<IPricingParams> = JSON.parse(jsonText);
            this.validateRequiredFields(params);
            params.roof_id = this.normalizeRoofId(params.roof_id);
            params.map_id = this.normalizeMapId(params.map_id);
            return params;
        }
        catch (err)
        {
            throw new Error(`Invalid JSON in LLM output: ${rawOutput}`);
        }
    }

    /**
     * Ensures required fields exist
     */

    private validateRequiredFields(params: Partial<IPricingParams>): void
    {
        const requiredFields: (keyof IPricingParams)[] = ["width", "length", "height", "map_id", "roof_id"];
        const missing: (keyof IPricingParams)[] = requiredFields.filter((f) => !(f in params));

        if (missing.length)
        {
            throw new Error(`Missing required fields: ${missing.join(", ")}`);
        }
    }

    /**
     * Normalize roof_id: accepts string or number, defaults to "single slope roof" (2).
     */

    private normalizeRoofId(roof: unknown): number
    {
        const roofMap: Record<string, number> = {
            "gable roof": 1,
            "single slope roof": 2,
            "double slope roof": 3,
            "flat roof": 4,
        };

        if (typeof roof === "string")
        {
            return roofMap[roof.toLowerCase().trim()] ?? 2;
        }

        if (typeof roof === "number")
        {
            return roof;
        }

        return 2;
    }

    /**
     * Normalize map_id: accepts string or number, defaults to 1.
     */

    private normalizeMapId(map: unknown): number
    {
        if (typeof map === "string")
        {
            return 1
        }

        if (typeof map === "number")
        {
            return map
        }

        return 1;
    }

    /**
     * Determines if the input string contains keywords related to garages/buildings.
     * Returns true if any relevant keyword is found, false otherwise.
     */

    public canHandle(input: string): boolean
    {
        const garageKeywords = /garage|building|width|length|height/i;
        return garageKeywords.test(input);
    }
}

function Enforce(): void {}
