import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";

interface UserFriendlyParams {
    garage_type?: string;
    width?: number;
    length?: number;
    height?: number;
    state_name?: string;
    roof_type?: string;
    manufacturer_name?: string;
    utility_length?: number;
    building_type?: string;
    gauge?: number;
    is_barn?: boolean;
}

interface PricingComponent {
    name: string;
    key: keyof any;
    extractor: (pricing: any) => number;
}

export class PriceParamsExtractorTool extends BaseTool
{
    private static instance: PriceParamsExtractorTool;

    private readonly ROOF_NAMES: Record<number, string> = {
        1: "Vertical",
        2: "Regular",
        3: "Boxed-Eave"
    };

    private readonly ROOF_PRICE_KEYS: Record<number, string> = {
        1: 'vertical_roof_cost',
        3: 'box_style_cost'
    };

    private readonly NUMERIC_FIELDS: (keyof UserFriendlyParams)[] =
        ["width", "length", "height", "utility_length", "gauge"];

    private readonly PRICING_COMPONENTS: PricingComponent[] = [
        { name: "End Panels", key: "end", extractor: (p) => p.end?.end_close_cost ?? 0 },
        { name: "Garage Door", key: "garage_door", extractor: (p) => p.garage_door?.cost ?? 0 },
    ];

    readonly name = "priceParamsExtractor";
    readonly description = "Extracts building pricing parameters from natural language.";

    constructor(enforce: () => void)
    {
        super();
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use PriceParamsExtractorTool.getInstance() instead of new.");
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

    public async _call(userInput: string): Promise<string>
    {
        try
        {
            const aiMessage: AIMessageChunk = await sharedLLM.invoke([new HumanMessage(this.buildPrompt(userInput))]);
            return aiMessage.content as string;
        }
        catch (error)
        {
            console.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "{}";
        }
    }

    public async calculatePriceWithParams(params: IPricingParams): Promise<string>
    {
        try
        {
            console.log("[PriceParamsExtractorTool] Calculating with params:", params);

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
            console.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }

    private formatPricingResult(pricing: any, params: IPricingParams): string
    {
        const roofName: string = this.ROOF_NAMES[params.roof_id] || 'Custom';
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

    private buildBreakdownLines(pricing: any, params: IPricingParams, roofPrice: number): string[]
    {
        const roofName: string = this.ROOF_NAMES[params.roof_id] || 'Custom';
        const lines: string[] = [`   • Base Building with ${roofName} Roof: $${this.formatCurrency(roofPrice)}`];

        for (const component of this.PRICING_COMPONENTS)
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

    private selectRoofPrice(structure: any, roofId: number): number
    {
        const priceKey: string = this.ROOF_PRICE_KEYS[roofId];

        if (priceKey && structure[priceKey] > 0)
        {
            return structure[priceKey];
        }

        return structure.regular_cost > 0 ? structure.regular_cost : (structure.total_price ?? 0);
    }

    private calculateTotalPrice(pricing: any, params: IPricingParams): { total: number; roofPrice: number }
    {
        let selectedRoofPrice: number = 0;

        if (pricing.building_structure?.length > 0)
        {
            selectedRoofPrice = this.selectRoofPrice(pricing.building_structure[0], params.roof_id);
        }

        let totalPrice: number = selectedRoofPrice;

        for (const component of this.PRICING_COMPONENTS)
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

    private formatCurrency(value: number): string
    {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

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

    public safeExtractUserFriendlyParams(rawOutput: string): Partial<UserFriendlyParams>
    {
        try
        {
            const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
            {
                console.warn("No JSON found in AI output");
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
            console.warn("Invalid JSON from LLM:", err);
            return {};
        }
    }

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

    private normalizeNumericFields(params: Partial<UserFriendlyParams>): void
    {
        for (const field of this.NUMERIC_FIELDS)
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
