import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { BaseMessage, MessageContentComplex } from "@langchain/core/messages";

export class PriceParamsExtractorTool extends BaseTool
{
    private static instance: PriceParamsExtractorTool;

    readonly name: string = "priceParamsExtractor";
    readonly description: string =
        "Extracts building pricing parameters from natural language and outputs JSON for pricing calculation.";

    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Error: Instantiation failed: Use PriceParamsExtractorTool.getInstance() instead of new."
            );
        }
    }

    public static getInstance(): PriceParamsExtractorTool
    {
        if (!PriceParamsExtractorTool.instance)
        {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }

        return PriceParamsExtractorTool.instance;
    }

    async _call(question: string): Promise<string>
    {
        const prompt = `
            You are a garage pricing assistant. 

            User description: "${question}"

            Tasks:
            1. Extract all necessary parameters for pricing (width, length, height, utility length, roof type, building type, etc.).
            2. Decide which DB tables to query to fetch base structures, components, and manufacturer info.
            3. Calculate pricing based on the fetched data (components, utilities, central structure, connection fees, addons, etc.).
            4. Summarize the full pricing in a customer-friendly message.

            Output:
            - JSON object with all pricing details
            - Customer-friendly summary text
          `;

        const response: BaseMessage = await sharedLLM.invoke([{ role: "user", content: prompt }]);

        const message: string | MessageContentComplex[] = response.content;

        if (typeof message === "string")
        {
            return message.trim();
        }

        return JSON.stringify(message);
    }
}

function Enforce(): void {}
