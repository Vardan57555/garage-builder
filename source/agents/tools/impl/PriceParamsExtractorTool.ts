import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import { UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";
const logger: pino.Logger = createLogger(module);

export class PriceParamsExtractorTool extends BaseTool
{
    /**
     * The singleton instance of `PriceParamsExtractorTool`.
     * @private
     */

    private static instance: PriceParamsExtractorTool;

    readonly name = "priceParamsExtractor";

    readonly description = "Extracts building pricing parameters from natural language.";

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
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use PriceParamsExtractorTool.getInstance() instead of new.");
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
     * Sends a user input prompt to the shared LLM and retrieves its response.
     * @param userInput - The raw user input string to be processed and passed to the model.
     * @returns A promise resolving to the model’s textual response.
     * Returns an empty JSON string (`"{}"`) if the LLM call fails.
     * @throws Logs an error to the console if the invocation of the LLM fails.
     */

    public async _call(userInput: string): Promise<string>
    {
        try
        {
            const aiMessage: AIMessageChunk = await sharedLLM.invoke([new HumanMessage(this.buildPrompt(userInput))]);
            return aiMessage.content as string;
        }
        catch (error)
        {
            logger.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "{}";
        }
    }

    /**
     * Calculates the building price based on the provided pricing parameters.
     * @param params - The pricing parameters (`IPricingParams`) used to request a price calculation.
     * @returns A promise resolving to a formatted pricing result string.
     * Returns a warning message if the pricing service fails or returns no data.
     * @throws Logs an error to the console if the pricing calculation process encounters an exception.
     */

    public async calculatePriceWithParams(params: IPricingParams): Promise<string>
    {
        try
        {
            const result = await PriceServiceImpl.getInstance()
                .fetchBuildingPricingWithUtility(params);

            if (!result?.status && result?.message)
            {
                return `⚠️ ${result.message}`;
            }

            if (!result)
            {
                return "⚠️ Pricing service returned empty result.";
            }

            return this.formatPricingResult(result, params);
        }
        catch (error)
        {
            logger.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }

    /**
     * Formats the pricing result into a structured, user-friendly quote message.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param params - The original pricing parameters (`IPricingParams`) used to generate the quote.
     * @returns A formatted string containing the total price, specifications, and a detailed price breakdown.
     */

    private formatPricingResult(pricing: any, params: IPricingParams): string
    {
        const roofName: string = Constants.ROOF_NAMES[params.roof_id] || 'Custom';
        const { total: totalPrice, roofPrice } = this.calculateTotalPrice(pricing, params);
        const breakdownLines: string[] = this.buildBreakdownLines(pricing, params, roofPrice);

        return [
            "✅ **Price Quote Generated!**\n",
            this.formatSpecifications(pricing, params, roofName),
            `\n💰 **ESTIMATED TOTAL PRICE: $${this.formatCurrency(totalPrice)}**\n`,
            "\n📊 **Price Breakdown:**",
            breakdownLines.join('\n'),
            "\n\n💡 This is your base quote. Add-ons and customizations can be added for additional cost."
        ].join('\n');
    }

    /**
     * Builds a formatted, human-readable specification section for the price quote.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param params - The original pricing parameters (`IPricingParams`) used to generate the quote.
     * @param roofName - The resolved name of the roof style (e.g., "Regular", "Vertical", "Custom").
     * @returns A formatted string containing the key building specifications such as dimensions, roof style, and manufacturer.
     */

    private formatSpecifications(pricing: any, params: IPricingParams, roofName: string): string
    {
        const specs = [
            "📐 **Building Specifications:**",
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft`,
            `   • Roof Style: ${roofName}`,
            `   • Map ID: ${params.map_id}`
        ];

        if (params.utility_length && params.utility_length > 0)
        {
            specs.push(`   • Utility Length: ${params.utility_length}ft`);
        }

        if (pricing.manufacturer?.length > 0)
        {
            specs.push(`   • Manufacturer: ${pricing.manufacturer[0].manufacturer_name || 'N/A'}`);
        }

        return specs.join('\n');
    }

    /**
     * Builds a detailed list of price breakdown lines for the quote output.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param params - The original pricing parameters (`IPricingParams`) used to generate the quote.
     * @param roofPrice - The calculated price of the roof portion of the building.
     * @returns An array of formatted strings, each representing a single line item in the pricing breakdown.
     */

    private buildBreakdownLines(pricing: any, params: IPricingParams, roofPrice: number): string[]
    {
        const roofName: string = Constants.ROOF_NAMES[params.roof_id] || 'Custom';
        const lines: string[] = [`   • Base Building with ${roofName} Roof: $${this.formatCurrency(roofPrice)}`];

        for (const component of Constants.PRICING_COMPONENTS)
        {
            const cost: number = component.extractor(pricing);
            if (cost > 0)
            {
                lines.push(`   • ${component.name}: $${this.formatCurrency(cost)}`);
            }
        }

        this.addArrayComponentLines(pricing, lines);

        if (pricing.additional_features?.cost_type === '%')
        {
            lines.push(`   • ${pricing.additional_features.additional_feature}: +${pricing.additional_features.cost}%`);
        }

        if (pricing.utility_cost)
        {
            lines.push(`   • Utility Items: $${this.formatCurrency(pricing.utility_cost)}`);
        }

        return lines;
    }

    /**
     * Appends pricing line items for array-based components (e.g., anchors, bows, add-ons) to the breakdown list.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param lines - The array of existing pricing breakdown lines to which new items will be added.
     * @returns void
     */

    private addArrayComponentLines(pricing: any, lines: string[]): void
    {
        const arrayComponents = [
            { array: pricing.anchors_cost, label: (item: any) => item.name },
            { array: pricing.bows, label: () => "Bow" },
            { array: pricing.addons, label: (item: any) => item.label }
        ];

        for (const { array, label } of arrayComponents)
        {
            array?.forEach((item: any) => {lines.push(`   • ${label(item)}: $${this.formatCurrency(item.cost)}`);});
        }
    }

    /**
     * Selects the appropriate roof price based on the provided `roofId` and structure pricing data.
     * @param structure - The structure pricing object containing roof and total cost values.
     * @param roofId - The ID of the selected roof style.
     * @returns The resolved roof price. Falls back to `regular_cost` or `total_price` if a specific roof price is unavailable.
     */

    private selectRoofPrice(structure: any, roofId: number): number
    {
        const priceKey: string = Constants.ROOF_PRICE_KEYS[roofId];

        if (priceKey && structure[priceKey] > 0)
        {
            return structure[priceKey];
        }

        return structure.regular_cost > 0 ? structure.regular_cost : (structure.total_price ?? 0);
    }

    /**
     * Calculates the total price of a building including roof, components, add-ons, and utilities.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param params - The original pricing parameters (`IPricingParams`) used to calculate the price.
     * @returns An object containing:
     */

    private calculateTotalPrice(pricing: any, params: IPricingParams): { total: number; roofPrice: number }
    {
        let selectedRoofPrice: number = 0;

        if (pricing.building_structure?.length > 0)
        {
            selectedRoofPrice = this.selectRoofPrice(pricing.building_structure[0], params.roof_id);
        }

        let totalPrice: number = selectedRoofPrice;

        for (const component of Constants.PRICING_COMPONENTS)
        {
            totalPrice += component.extractor(pricing);
        }

        totalPrice += pricing.anchors_cost?.reduce((sum: number, a: any) => sum + (a.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.bows?.reduce((sum: number, b: any) => sum + (b.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.addons?.reduce((sum: number, a: any) => sum + (a.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.utility_cost ?? 0;

        if (pricing.additional_features?.cost_type === '%')
        {
            totalPrice *= (1 + pricing.additional_features.cost / 100);
        }

        return { total: totalPrice, roofPrice: selectedRoofPrice };
    }

    /**
     * Formats a numeric value as a currency string with two decimal places and comma separators.
     * @param value - The numeric value to format.
     * @returns A string representing the formatted currency (e.g., `12345.67` → `"12,345.67"`).
     */

    private formatCurrency(value: number): string
    {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Constructs a detailed prompt for the AI to extract structured JSON data from flexible user input.
     * @param userInput - The raw user input describing a garage or building, which may include dimensions, roof type, state, gauge, and other details.
     * @returns A formatted string prompt instructing the AI to extract relevant information and return it as JSON.
     */

    private buildPrompt(userInput: string): string
    {
        return `You are a parameter extraction assistant for garage/building pricing.

                    Your job: **extract structured JSON data** from flexible user language. Users may mention garage size, type, location, roof style, gauge, and other details in **natural language**. You must interpret and normalize their meaning, **not just match fixed patterns**.
                    
                    📐 **Dimension Extraction Rules**:
                    - If the user provides explicit dimensions (e.g., "20 feet wide 30 feet long 10 feet high" or "20x30x10"):
                        * Extract exact numeric values for width, length, and height.
                    - If the user only mentions a vehicle or garage type (e.g., "2 car garage", "truck garage", "RV garage"):
                        * Infer realistic approximate standard dimensions.
                    
                    🗺️ **State/Location Extraction**:
                    - Extract the state name from natural language text (e.g., "I'm in Texas" → "Texas").
                    
                    🏠 **Roof Type Extraction**:
                    - Normalize roof type names to one of: "regular", "a-frame", or "vertical".
                    
                    ⚙️ **Gauge Extraction**:
                    - Look for metal gauge if specified in user input (12, 14, etc.)
                    - Normalize to number.
                    - If not mentioned, set "gauge": null.
                    
                    📋 **JSON Schema**:
                    {
                      "garage_type": string | null,
                      "width": number | null,
                      "length": number | null,
                      "height": number | null,
                      "state_name": string | null,
                      "roof_type": string | null,
                      "manufacturer_name": string | null,
                      "utility_length": number | null,
                      "building_type": string | null,
                      "gauge": number | null,
                      "is_barn": boolean | null
                    }
                    
                    ⚠️ **CRITICAL RULES**:
                    1. Return only valid JSON, no explanations.
                    2. Use null for unknown values.
                    3. Always prefer explicit numbers over inferred defaults.
                    4. Handle all U.S. states dynamically.
                    5. Extract gauge if mentioned; otherwise, set to null.
                    
                    User input: "${userInput}"
                JSON output:`.trim();
    }

    /**
     * Safely extracts and normalizes user-friendly parameters from raw AI output.
     * @param rawOutput - The raw string output from the AI, which may contain JSON embedded in text.
     * @returns A `Partial<UserFriendlyParams>` object containing cleaned and normalized parameters.
     */

    public safeExtractUserFriendlyParams(rawOutput: string): Partial<UserFriendlyParams>
    {
        try
        {
            const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
            {
                logger.warn("No JSON found in AI output");
                return {};
            }

            const cleanedJson: string = jsonMatch[0]
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/\s*\r?\n\s*/g, "");

            const params: Partial<UserFriendlyParams> = JSON.parse(cleanedJson);

            this.removeNullValues(params);
            this.normalizeNumericFields(params);

            return params;
        }
        catch (err)
        {
            logger.warn("Invalid JSON from LLM:", err);
            return {};
        }
    }

    /**
     * Removes all keys with `null` values from a `Partial<UserFriendlyParams>` object in-place.
     * @param params - The object containing user-friendly parameters to clean.
     * @returns void
     */

    private removeNullValues(params: Partial<UserFriendlyParams>): void
    {
        Object.keys(params).forEach(key =>
        {
            if (params[key as keyof UserFriendlyParams] === null)
            {
                delete params[key as keyof UserFriendlyParams];
            }
        });
    }

    /**
     * Normalizes string numeric fields in a `Partial<UserFriendlyParams>` object to actual numbers.
     * @param params - The object containing user-friendly parameters to normalize.
     * @returns void
     */

    private normalizeNumericFields(params: Partial<UserFriendlyParams>): void
    {
        for (const field of Constants.NUMERIC_FIELDS)
        {
            const value: string | number | boolean = params[field];

            if (typeof value === "string")
            {
                const num: number = parseFloat(value.replace(/[^\d.]/g, ""));
                if (!isNaN(num))
                {
                    (params as Record<string, any>)[field] = num;
                }
                else
                {
                    delete params[field];
                }
            }
        }
    }
}

function Enforce(): void {}
