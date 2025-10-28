import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {Dimensions, PricingBreakdown, ServiceCostsResult, UserFriendlyParams,} from "@agents/tools/io/IChat";
import { Constants } from "@common/io/Constants";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";

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

    private constructor(enforce: () => void)
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
            logger.info("[PriceParamsExtractorTool] Processing input:", userInput);

            const aiMessage: AIMessageChunk = await sharedLLM.invoke([
                new HumanMessage(this.buildInferencePrompt(userInput)),
            ]);

            const extracted = this.safeExtractUserFriendlyParams(aiMessage.content as string);
            return JSON.stringify(this.validateAndInferMissingParams(extracted, userInput));
        }
        catch (error)
        {
            logger.error("[PriceParamsExtractorTool] _call failed:", error);
            return JSON.stringify({});
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
            const result = await PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(params);

            if (!result?.status && result?.message)
            {
                return `⚠️ ${result.message}`;
            }

            return result ? this.formatPricingResult(result, params) : "⚠️ Pricing service returned empty result.";
        }
        catch (error)
        {
            logger.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }

    /**
     * NEW: Validate extracted parameters and intelligently infer missing ones from user context
     * This is the KEY FIX - instead of returning incomplete data, we infer what's missing
     */

    private validateAndInferMissingParams(params: Partial<UserFriendlyParams>, userInput: string): Partial<UserFriendlyParams>
    {
        const input: string = userInput.toLowerCase();

        if (!this.hasDimensions(params))
        {
            const garageType: string = params.garage_type || this.detectGarageType(input);
            Object.assign(params, this.getStandardDimensions(garageType));
            params.garage_type = garageType;
        }

        if (!params.state_name)
        {
            params.state_name = this.extractState(input) ?? undefined;
        }

        return params;
    }

    /**
     * @param params - A partial set of user-friendly parameters that may contain width, length, and height.
     * @returns `true` if all three dimensions (`width`, `length`, and `height`) are present and truthy; otherwise, `false`.
     */

    private hasDimensions(params: Partial<UserFriendlyParams>): boolean
    {
        return !!(params.width && params.length && params.height);
    }

    /**
     * @param input - The raw input string used to identify the garage type.
     * @returns The detected garage type string, or `"garage"` if no match is found.
     */

    private detectGarageType(input: string): string
    {
        for (const [pattern, type] of Constants.GARAGE_TYPE_PATTERNS)
        {
            if (pattern.test(input))
            {
                return type;
            }
        }
        return "garage";
    }

    /**
     * @param input - The input string to search for a matching state pattern.
     * @returns The matched state name if found; otherwise, `null`.
     */

    private extractState(input: string): string | null
    {
        for (const [pattern, stateName] of Object.entries(Constants.STATE_PATTERNS))
        {
            if (new RegExp(`\\b(?:${pattern})\\b`, "i").test(input))
            {
                return stateName;
            }
        }
        return null;
    }

    /**
     * @param pricing - The raw pricing data object containing cost details for the structure.
     * @param params - The pricing parameters used to calculate totals and build the breakdown.
     * @returns A formatted quote string including specifications, total cost, and detailed breakdown.
     */

    private formatPricingResult(pricing: any, params: IPricingParams): string
    {
        const { total: kitPrice, roofPrice } = this.calculateTotalPrice(pricing, params);
        const { total: finalTotal, breakdown: serviceBreakdown } = this.addServiceCosts(
            kitPrice,
            params
        );

        const breakdownLines = [
            ...this.buildBreakdownLines(pricing, params, roofPrice),
            ...serviceBreakdown,
        ];

        return this.formatQuote(
            this.formatSpecifications(pricing, params),
            finalTotal,
            breakdownLines
        );
    }

    /**
     * @param specs - The formatted structure specifications to include in the quote.
     * @param total - The total calculated price of the garage, including all costs.
     * @param breakdown - An array of formatted breakdown lines detailing individual cost components.
     * @returns A formatted markdown string representing the complete price quote.
     */

    private formatQuote(specs: string, total: number, breakdown: string[]): string
    {
        return [
            "✅ **Price Quote Generated!**\n",
            specs,
            `\n💰 **ESTIMATED TOTAL PRICE: $${this.formatCurrency(total)}**\n`,
            "\n📊 **Price Breakdown:**",
            breakdown.join("\n"),
            "\n💡 Includes kit + installation labor + foundation slab preparation",
            "\n🔧 Additional upgrades and customizations available",
        ].join("\n");
    }

    /**
     * Builds a formatted, human-readable specification section for the price quote.
     * @param pricing - The raw pricing data returned from the pricing service.
     * @param params - The original pricing parameters (`IPricingParams`) used to generate the quote.
     * @returns A formatted string containing the key building specifications such as dimensions, roof style, and manufacturer.
     */

    private formatSpecifications(pricing: any, params: IPricingParams): string
    {
        const sqft: number = params.width * params.length;
        const roofName: string = Constants.ROOF_NAMES[params.roof_id] || "Custom";

        const specs: string[] = [
            "📐 **Building Specifications:**",
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft (${sqft} sq ft)`,
            `   • Roof Style: ${roofName}`,
            `   • Gauge: ${pricing.gauge ?? params.gauge ?? 14}GA`,
        ];

        if (params.building_type)
        {
            specs.push(`   • Building Type: ${params.building_type}`);
        }

        if (params.utility_length && params.utility_length > 0)
        {
            specs.push(`   • Utility Length: ${params.utility_length}ft`);
        }

        if (params.is_barn)
        {
            specs.push(`   • Barn Style: Yes`);
        }

        if (pricing.manufacturer?.length > 0)
        {
            specs.push(`   • Manufacturer: ${pricing.manufacturer[0].manufacturer_name || "Standard"}`);
        }

        return specs.join("\n");
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
        const lines: string[] = [];

        if (roofPrice > 0)
        {
            lines.push(`   • Base Building (${Constants.ROOF_NAMES[params.roof_id] || "Standard"}): $${this.formatCurrency(roofPrice)}`);
        }

        const sideClosureCost: number = this.calculateSideClosureCosts(pricing, params);

        if (sideClosureCost > 0)
        {
            lines.push(`   • Side & End Closures: $${this.formatCurrency(sideClosureCost)}`);
        }

        for (const component of Constants.PRICING_COMPONENTS)
        {
            const cost: number = this.safeExtract(component.extractor, pricing);

            if (cost > 0)
            {
                lines.push(`   • ${component.name}: $${this.formatCurrency(cost)}`);
            }
        }

        if (pricing.additional_features?.cost_type === "%")
        {
            const percentageIncrease: number = roofPrice * ((pricing.additional_features.cost ?? 0) / 100);

            if (percentageIncrease > 0)
            {
                lines.push(`   • Additional Features (${pricing.additional_features.cost}%): $${this.formatCurrency(percentageIncrease)}`);
            }
        }

        return lines;
    }

    /**
     * @param pricing - The raw pricing data object containing component and feature costs.
     * @param params - The pricing parameters that define structure options such as roof type and closures.
     * @returns An object containing the total calculated price and the specific roof price used in the computation.
     */

    private calculateTotalPrice(pricing: any, params: IPricingParams): PricingBreakdown
    {
        const roofPrice: number = this.selectRoofPrice(params.roof_id, pricing);
        let total: number = roofPrice;

        total += this.calculateSideClosureCosts(pricing, params);

        for (const component of Constants.PRICING_COMPONENTS)
        {
            total += this.safeExtract(component.extractor, pricing);
        }

        total += pricing.utility_cost ?? 0;

        if (pricing.additional_features?.cost_type === "%")
        {
            total += roofPrice * ((pricing.additional_features.cost ?? 0) / 100);
        }

        return { total, roofPrice };
    }

    /**
     * @param roofId - The numeric identifier of the selected roof type.
     * @param pricing - The pricing data object containing base price fields for different roof types.
     * @returns The corresponding roof price value, or `0` if unavailable.
     */

    private selectRoofPrice(roofId: number, pricing: any): number
    {
        const fieldMap: Record<number, string> = {
            1: "base_price_vertical",
            2: "base_price_box",
            3: "base_price_regular",
        };

        const field: string = fieldMap[roofId] ?? "base_price_regular";
        return pricing[field] ?? pricing.base_price_regular ?? 0;
    }

    /**
     *
     * @param pricing - The pricing data object containing cost details for side and end closures.
     * @param _params - The pricing parameters (currently unused, reserved for future logic or extensions).
     * @returns The total calculated cost for all side and end closures.
     */

    private calculateSideClosureCosts(pricing: any, _params: IPricingParams): number
    {
        let totalCost: number = 0;

        if (pricing.full_length_side)
        {
            const sideData = Array.isArray(pricing.full_length_side) ? pricing.full_length_side[0] : pricing.full_length_side;

            const costPerSide = (sideData?.side_close_cost ?? 0) + (sideData?.leg_height_cost ?? 0); totalCost += costPerSide * 2;
        }

        if (pricing.end)
        {
            const endData = Array.isArray(pricing.end) ? pricing.end[0] : pricing.end;
            totalCost += (endData?.end_close_cost ?? 0) * 2;
        }

        return totalCost;
    }

    /**
     * @param kitPrice - The base price of the garage kit before any service costs are applied.
     * @param params - The pricing parameters, including width and length, used to compute area-based costs.
     * @returns An object containing the total price (including all service costs) and a formatted breakdown list.
     */

    private addServiceCosts(kitPrice: number, params: IPricingParams): ServiceCostsResult
    {
        const sqft: number = params.width * params.length;
        const {
            LABOR_PERCENTAGE,
            FOUNDATION_COST_PER_SQFT,
            DELIVERY_FLAT_RATE,
            CONTINGENCY_PERCENTAGE,
        } = Constants.SERVICE_COSTS;

        const laborCost: number = kitPrice * LABOR_PERCENTAGE;
        const foundationCost: number = sqft * FOUNDATION_COST_PER_SQFT;
        const deliveryCost = DELIVERY_FLAT_RATE;
        const contingency: number = (kitPrice + laborCost + foundationCost + deliveryCost) * CONTINGENCY_PERCENTAGE;

        const breakdown: string[] = [
            `   • Installation Labor (50% of kit): $${this.formatCurrency(laborCost)}`,
            `   • Concrete Foundation (${sqft} sq ft @ $${FOUNDATION_COST_PER_SQFT}/sq ft): $${this.formatCurrency(foundationCost)}`,
            `   • Delivery & Site Preparation: $${this.formatCurrency(deliveryCost)}`,
            `   • Contingency & Misc (5%): $${this.formatCurrency(contingency)}`,
        ];

        const total: number = kitPrice + laborCost + foundationCost + deliveryCost + contingency;

        return { total, breakdown };
    }

    /**
     *
     * @param rawOutput - The raw text output from the AI model that may contain a JSON object.
     * @returns A partial `UserFriendlyParams` object with cleaned and normalized data, or an empty object on failure.
     */

    public safeExtractUserFriendlyParams(rawOutput: string): Partial<UserFriendlyParams>
    {
        try
        {
            const json: string = this.extractJsonFromText(rawOutput);
            const params: Partial<UserFriendlyParams> = JSON.parse(json);

            this.removeNullValues(params);
            this.normalizeNumericFields(params);

            return params;
        }
        catch (error)
        {
            logger.warn("Failed to extract JSON from AI output:", rawOutput, error);
            return {};
        }
    }

    /**
     * @param text - The raw input text that may contain a JSON object.
     * @returns A cleaned JSON string ready for parsing.
     * @throws Error if a valid JSON object cannot be found within the input text.
     */

    private extractJsonFromText(text: string): string
    {
        const cleaned: string = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const startIdx: number = cleaned.indexOf("{");
        const endIdx: number = cleaned.lastIndexOf("}");

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx)
        {
            throw new Error("No valid JSON found");
        }

        return cleaned
            .substring(startIdx, endIdx + 1)
            .replace(/undefined|NaN|\bNone\b/g, "null")
            .replace(/,\s*[}\]]/g, (match) => match.slice(-1));
    }

    /**
     * @param params - A partial `UserFriendlyParams` object to clean of `null` values.
     */

    private removeNullValues(params: Partial<UserFriendlyParams>): void
    {
        Object.keys(params).forEach((key: string) =>
        {
            if (params[key as keyof UserFriendlyParams] === null)
            {
                delete params[key as keyof UserFriendlyParams];
            }
        });
    }

    /**
     * @param params - A partial `UserFriendlyParams` object whose numeric fields should be normalized.
     */

    private normalizeNumericFields(params: Partial<UserFriendlyParams>): void
    {
        for (const field of Constants.NUMERIC_FIELDS)
        {
            const value: string | number | boolean = params[field as keyof UserFriendlyParams];

            if (typeof value === "string")
            {
                const num: number = parseFloat(value.replace(/[^\d.]/g, ""));

                if (isNaN(num))
                {
                    delete params[field as keyof UserFriendlyParams];
                }
                else
                {
                    (params as Record<string, any>)[field] = num;
                }
            }
        }
    }

    /**
     * @param garageType - The type of garage for which to retrieve standard dimensions.
     * @returns A partial `UserFriendlyParams` object containing `width`, `length`, and `height`.
     */

    private getStandardDimensions(garageType: string): Partial<UserFriendlyParams>
    {
        const dims: Dimensions = Constants.STANDARD_DIMENSIONS[garageType] || Constants.STANDARD_DIMENSIONS.garage;
        return { width: dims.width, length: dims.length, height: dims.height };
    }

    /**
     * @param value - The numeric value to format.
     * @returns A string representing the formatted currency.
     */

    private formatCurrency(value: number): string
    {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * @param extractor - A function that takes the pricing object and returns a number.
     * @param pricing - The pricing object to extract data from.
     * @returns The extracted numeric value, or `0` if extraction fails.
     */

    private safeExtract(extractor: (pricing: any) => number, pricing: any): number
    {
        try
        {
            return extractor(pricing) ?? 0;
        }
        catch (error)
        {
            logger.error("[safeExtract] Extraction failed:", error);
            return 0;
        }
    }

    /**
     * Builds a structured prompt for the AI model to extract and infer garage/building specifications.
     *
     * @param userInput - The raw user input describing the garage or building.
     * @returns A string prompt formatted for the AI model containing instructions and user input.
     */

    private buildInferencePrompt(userInput: string): string
    {
        const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(userInput);

        let dimensionExplanation: string = `
            DIMENSION CALCULATION (Dynamic Formula):
            - Width formula: (number_of_cars × 6) + 8 feet clearance
            - Length formula: 15 (car length) + 5 feet clearance = 20 feet
            - Height: 10 feet (standard) or 12 feet (truck/RV)
            `;

        if (calculation.numCars)
        {
            dimensionExplanation += `
            Example for ${calculation.numCars} car(s):
            - Width: (${calculation.numCars} × 6) + 8 = ${calculation.width} ft
            - Length: 15 + 5 = ${calculation.length} ft
            - Height: ${calculation.height} ft
            `;
        }

        return `You are a garage/building specification extraction system.
            CRITICAL: You MUST infer all required data from context. NEVER ask clarifying questions.
            
            Task: Extract and intelligently infer building parameters from user input.
            
            RULES:
            1. If user specifies number of cars (e.g., "2 cars", "5 car garage", "10 cars"), calculate dimensions dynamically:
               ${dimensionExplanation}
            2. If explicit dimensions given (e.g., "20x30x10"), use those exact numbers INSTEAD of calculated defaults
            3. Special garage types:
               - Truck garage: width varies by car count, length: 24 ft, height: 12 ft
               - RV garage: width: 14 ft, length: 40 ft, height: 12 ft
            4. For missing optional fields: Use null, don't ask for them
            5. CRITICAL - Roof type handling:
               - ONLY extract roof_type if user EXPLICITLY mentions it
               - Do NOT infer or default roof_type to "regular"
               - If user does NOT mention roof style, return null
               - Valid values if specified: "regular", "a-frame", "vertical", "box"
            6. Extract state if mentioned in input
            
            EXAMPLES:
            - Input: "5 car garage" → {"garage_type": "5-car", "width": 38, "length": 20, "height": 10, ...}
            - Input: "10 cars" → {"garage_type": "10-car", "width": 68, "length": 20, "height": 10, ...}
            - Input: "3 cars in texas" → {"garage_type": "3-car", "width": 26, "length": 20, "height": 10, "state_name": "texas", ...}
            - Input: "20x25x10 garage" → {"width": 20, "length": 25, "height": 10, "garage_type": null, ...}
            - Input: "truck garage" → {"garage_type": "truck", "width": varies, "length": 24, "height": 12, ...}
            
            OUTPUT FORMAT - Return ONLY valid JSON:
            {
              "garage_type": "detected type (e.g., '5-car', 'truck', 'rv') or null",
              "width": number or null,
              "length": number or null,
              "height": number or null,
              "state_name": "state name or null",
              "roof_type": null if not mentioned, or "regular"|"a-frame"|"vertical"|"box" if specified,
              "manufacturer_name": "string or null",
              "utility_length": number or null,
              "building_type": "string or null",
              "gauge": number or null,
              "is_barn": boolean or null
            }

        User input: "${userInput}"`;
    }
}

function Enforce(): void {}
