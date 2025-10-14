// PriceParamsExtractorTool.ts
import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import { HumanMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";

export class PriceParamsExtractorTool extends BaseTool {
    private static instance: PriceParamsExtractorTool;
    readonly name = "priceParamsExtractor";
    readonly description = "Extracts building pricing parameters from natural language.";

    constructor(enforce: () => void) {
        super();
        if (enforce !== Enforce) throw new InstantiationError(
            InstantiationError.NOT_INSTANTIABLE,
            "Use PriceParamsExtractorTool.getInstance() instead of new."
        );
    }

    public static getInstance(): PriceParamsExtractorTool {
        if (!PriceParamsExtractorTool.instance) {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }
        return PriceParamsExtractorTool.instance;
    }

    public async _call(userInput: string, memory?: BufferMemory): Promise<string> {
        const prompt = this.buildPrompt(userInput);
        try {
            const aiMessage = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const rawOutput = aiMessage.content as string;

            // ✅ Safe parse & defaults
            const pricingParams = this.safeExtractParams(rawOutput);

            if (!pricingParams.width || !pricingParams.length) {
                return "⚠️ Please provide full garage dimensions and details for accurate pricing.";
            }

            const result = await PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(pricingParams as IPricingParams);

            if (memory) {
                memory.chatHistory.addUserMessage(userInput);
                memory.chatHistory.addAIChatMessage(result);
            }

            return result || "⚠️ Pricing service returned empty result. Please provide more info.";
        } catch (error) {
            console.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "⚠️ Failed to extract pricing and calculate price. Please try again.";
        }
    }

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
     * Safely parse LLM output and assign defaults
     */
    private safeExtractParams(rawOutput: string): Partial<IPricingParams> {
        try {
            const match = rawOutput.match(/\{[\s\S]*\}/);
            if (!match) return {};

            const jsonText = match[0]
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/(\r\n|\n|\r)/gm, "");

            const params: Partial<IPricingParams> = JSON.parse(jsonText);

            // Defaults for critical fields
            params.width ??= 0;
            params.length ??= 0;
            params.height ??= 0;
            params.roof_id = this.normalizeRoofId(params.roof_id);
            params.map_id = this.normalizeMapId(params.map_id);

            return params;
        } catch (err) {
            console.warn("Invalid JSON from LLM, returning empty params:", err);
            return {};
        }
    }

    private normalizeRoofId(roof: unknown): number {
        if (typeof roof === "number") return roof;
        return 2; // default single slope roof
    }

    private normalizeMapId(map: unknown): number {
        if (typeof map === "number") return map;
        return 1; // default map
    }
}

function Enforce(): void {}
