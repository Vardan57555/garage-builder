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
            logger.info("[PriceParamsExtractorTool] Processing input:", userInput);

            const aiMessage: AIMessageChunk = await sharedLLM.invoke(
                [new HumanMessage(this.buildInferencePrompt(userInput))],

            );

            const rawOutput = aiMessage.content as string;
            logger.info("[PriceParamsExtractorTool] LLM response:", rawOutput);

            const extracted = this.safeExtractUserFriendlyParams(rawOutput);
            const validated = this.validateAndInferMissingParams(extracted, userInput);

            const result = JSON.stringify(validated);
            logger.info("[PriceParamsExtractorTool] Final result:", result);
            return result;
        }
        catch (error)
        {
            logger.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return JSON.stringify({});
        }
    }

    /**
     * NEW: Validate extracted parameters and intelligently infer missing ones from user context
     * This is the KEY FIX - instead of returning incomplete data, we infer what's missing
     */
    private validateAndInferMissingParams(params: Partial<UserFriendlyParams>, userInput: string): Partial<UserFriendlyParams>
    {
        const input = userInput.toLowerCase();

        if (!params.width || !params.length || !params.height)
        {
            const garageType = params.garage_type || this.detectGarageType(input);
            const dimensions = this.getStandardDimensions(garageType);

            if (!params.width) params.width = dimensions.width;
            if (!params.length) params.length = dimensions.length;
            if (!params.height) params.height = dimensions.height;
            if (!params.garage_type) params.garage_type = garageType;

            logger.info("[validateAndInferMissingParams] Inferred dimensions from garage type:", {
                garageType,
                dimensions,
            });
        }

        if (!params.roof_type)
        {
            params.roof_type = "regular";
            logger.info("[validateAndInferMissingParams] Defaulted roof_type to regular");
        }

        if (!params.state_name)
        {
            const state = this.extractState(input);
            if (state) params.state_name = state;
        }

        return params;
    }

    /**
     * NEW: Detect garage type from user input using pattern matching
     */
    private detectGarageType(input: string): string
    {
        if (/\b1\s*(?:car|bay)\b|\bone\s*(?:car|bay)\b/i.test(input)) return "1 car garage";
        if (/\b2\s*(?:car|bay)\b|\btwo\s*(?:car|bay)\b/i.test(input)) return "2 car garage";
        if (/\b3\s*(?:car|bay)\b|\bthree\s*(?:car|bay)\b/i.test(input)) return "3 car garage";
        if (/truck\s*garage|garage.*truck|heavy.*truck/i.test(input)) return "truck garage";
        if (/rv\s*garage|rv\s*(?:carport|shelter)|garage.*rv/i.test(input)) return "RV garage";
        if (/barn/i.test(input)) return "barn";
        return "garage";
    }

    /**
     * NEW: Get standard dimensions for garage types based on industry standards
     */
    private getStandardDimensions(garageType: string): { width: number; length: number; height: number }
    {
        const standardDimensions: Record<string, { width: number; length: number; height: number }> = {
            "1 car garage": { width: 12, length: 20, height: 10 },
            "2 car garage": { width: 20, length: 20, height: 10 },
            "3 car garage": { width: 30, length: 20, height: 10 },
            "truck garage": { width: 16, length: 24, height: 12 },
            "rv garage": { width: 14, length: 40, height: 12 },
            "barn": { width: 30, length: 40, height: 14 },
            "garage": { width: 20, length: 20, height: 10 },
        };

        return standardDimensions[garageType] || { width: 20, length: 20, height: 10 };
    }

    /**
     * NEW: Extract state from input string
     */
    private extractState(input: string): string | null
    {
        const statePatterns: Record<string, string> = {
            "texas|tx": "Texas",
            "california|ca": "California",
            "florida|fl": "Florida",
            "new york|ny": "New York",
            "pennsylvania|pa": "Pennsylvania",
            "illinois|il": "Illinois",
            "ohio|oh": "Ohio",
            "georgia|ga": "Georgia",
            "north carolina|nc": "North Carolina",
            "michigan|mi": "Michigan",
            "new jersey|nj": "New Jersey",
            "virginia|va": "Virginia",
            "washington|wa": "Washington",
            "arizona|az": "Arizona",
            "massachusetts|ma": "Massachusetts",
            "tennessee|tn": "Tennessee",
            "maryland|md": "Maryland",
            "missouri|mo": "Missouri",
            "wisconsin|wi": "Wisconsin",
            "colorado|co": "Colorado",
            "minnesota|mn": "Minnesota",
            "south carolina|sc": "South Carolina",
            "alabama|al": "Alabama",
            "louisiana|la": "Louisiana",
            "kentucky|ky": "Kentucky",
            "oregon|or": "Oregon",
            "oklahoma|ok": "Oklahoma",
            "connecticut|ct": "Connecticut",
            "iowa|ia": "Iowa",
            "nevada|nv": "Nevada",
            "arkansas|ar": "Arkansas",
            "mississippi|ms": "Mississippi",
            "kansas|ks": "Kansas",
            "utah|ut": "Utah",
            "new mexico|nm": "New Mexico",
            "nebraska|ne": "Nebraska",
            "idaho|id": "Idaho",
            "maine|me": "Maine",
            "montana|mt": "Montana",
            "rhode island|ri": "Rhode Island",
            "delaware|de": "Delaware",
            "south dakota|sd": "South Dakota",
            "north dakota|nd": "North Dakota",
            "alaska|ak": "Alaska",
            "hawaii|hi": "Hawaii",
            "wyoming|wy": "Wyoming",
            "vermont|vt": "Vermont",
            "new hampshire|nh": "New Hampshire",
            "west virginia|wv": "West Virginia",
        };

        for (const [pattern, stateName] of Object.entries(statePatterns))
        {
            if (new RegExp(`\\b(?:${pattern})\\b`, "i").test(input))
            {
                return stateName;
            }
        }

        return null;
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
        logger.info("[formatPricingResult] ====== PRICE CALC DEBUG ======");
        logger.info("[formatPricingResult] Roof ID:", params.roof_id);
        logger.info("[formatPricingResult] Constants.ROOF_PRICE_KEYS mapping:", Constants.ROOF_PRICE_KEYS);
        logger.info("[formatPricingResult] Building structure data:", JSON.stringify(pricing.building_structure, null, 2));
        logger.info("[formatPricingResult] ====== END DEBUG ======");

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
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft`
        ];

        // ✅ Add building type if available
        if (params.building_type)
        {
            specs.push(`   • Building Type: ${params.building_type}`);
        }

        specs.push(`   • Roof Style: ${roofName}`);
        specs.push(`   • Gauge: ${pricing.gauge ?? params.gauge ?? 14}`);

        if (params.utility_length && params.utility_length > 0)
        {
            specs.push(`   • Utility Length: ${params.utility_length}ft`);
        }

        // ✅ Add is_barn if applicable
        if (params.is_barn)
        {
            specs.push(`   • Barn: Yes`);
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

        // ✅ ADD THIS DEBUG LOGGING
        logger.info("[buildBreakdownLines] ====== COMPONENT DEBUG ======");
        logger.info("[buildBreakdownLines] Components being processed:", {
            insulation: pricing.insulation,
            certificate: pricing.certificate,
            end_cross_bracing: pricing.end_cross_bracing,
            side_cross_bracing: pricing.side_cross_bracing,
            full_length_panel: pricing.full_length_panel,
            connection_fees: pricing.connection_fees,
            utility_cost: pricing.utility_cost,
            additional_features: pricing.additional_features,
            jtrim: pricing.jtrim
        });
        logger.info("[buildBreakdownLines] ====== END DEBUG ======");

        for (const component of Constants.PRICING_COMPONENTS)
        {
            const cost: number = component.extractor(pricing);
            logger.info(`[buildBreakdownLines] Component "${component.name}":`, cost);
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
        logger.info(`[selectRoofPrice] Selecting price for roofId=${roofId}`);
        logger.info(`[selectRoofPrice] Available prices:`, {
            regular_cost: structure.regular_cost,
            box_style_cost: structure.box_style_cost,
            vertical_roof_cost: structure.vertical_roof_cost
        });

        // Map roof_id to the correct price field
        // Typically: 1=regular, 2=box_style, 3=vertical, etc.
        // Adjust these mappings based on your Constants.ROOF_PRICE_KEYS
        let selectedPrice: number = 0;

        switch (roofId) {
            case 1:  // Vertical
                selectedPrice = structure.vertical_roof_cost ?? 0;
                logger.info(`[selectRoofPrice] Using vertical_roof_cost: $${selectedPrice}`);
                break;
            case 2:  // Box style
                selectedPrice = structure.box_style_cost ?? 0;
                logger.info(`[selectRoofPrice] Using box_style_cost: $${selectedPrice}`);
                break;
            case 3:  // Regular
            default:
                selectedPrice = structure.regular_cost ?? 0;
                logger.info(`[selectRoofPrice] Using regular_cost: $${selectedPrice}`);
        }

        if (selectedPrice === 0) {
            logger.warn(`[selectRoofPrice] Selected price is $0! Falling back to regular_cost`);
            selectedPrice = structure.regular_cost ?? 0;
        }

        return selectedPrice;
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

        logger.info("[calculateTotalPrice] ====== PRICE CALCULATION DEBUG ======");
        logger.info("[calculateTotalPrice] Roof ID:", params.roof_id);
        logger.info("[calculateTotalPrice] Available price fields:", {
            regular: pricing.base_price_regular,
            box: pricing.base_price_box,
            vertical: pricing.base_price_vertical
        });

        // ✅ FIX: Select correct roof price based on roof_id
        selectedRoofPrice = this.selectRoofPrice({
            regular_cost: pricing.base_price_regular ?? 0,
            box_style_cost: pricing.base_price_box ?? 0,
            vertical_roof_cost: pricing.base_price_vertical ?? 0
        }, params.roof_id);

        logger.info("[calculateTotalPrice] Selected roof price:", selectedRoofPrice);

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

        logger.info("[calculateTotalPrice] Final total price:", totalPrice);
        logger.info("[calculateTotalPrice] ====== END DEBUG ======");

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
     * IMPROVED: Smarter prompt that tells LLM to INFER missing data instead of asking
     */
    private buildInferencePrompt(userInput: string): string
    {
        return `You are a garage/building specification extraction system.

CRITICAL: You MUST infer all required data from context. NEVER ask clarifying questions.

Task: Extract and intelligently infer building parameters from user input.

RULES:
1. If user specifies garage type (e.g., "2 car garage"), infer standard dimensions:
   - 1 car garage: 12×20×10 ft
   - 2 car garage: 20×20×10 ft
   - 3 car garage: 30×20×10 ft
   - Truck garage: 16×24×12 ft
   - RV garage: 14×40×12 ft

2. If explicit dimensions given (e.g., "20x30x10"), use those exact numbers

3. For missing optional fields: Use null, don't ask for them

4. Default values for common fields:
   - roof_type: "regular" if not specified
   - height: infer from garage type or default 10 ft

5. Extract state if mentioned in input

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "garage_type": "detected type or null",
  "width": number or null,
  "length": number or null,
  "height": number or null,
  "state_name": "state name or null",
  "roof_type": "regular|a-frame|vertical or null",
  "manufacturer_name": "string or null",
  "utility_length": number or null,
  "building_type": "string or null",
  "gauge": number or null,
  "is_barn": boolean or null
}

ABSOLUTE REQUIREMENTS:
- Return ONLY JSON, nothing else
- NEVER ask questions
- ALWAYS infer missing standard parameters
- Use null only for truly optional/unknown data
- Ensure width, length, height are ALWAYS numbers

User input: "${userInput}"`;
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
            let cleanedOutput = rawOutput
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();

            const startIdx = cleanedOutput.indexOf('{');
            const endIdx = cleanedOutput.lastIndexOf('}');

            if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx)
            {
                logger.warn("No valid JSON found in AI output:", rawOutput);
                return {};
            }

            const jsonString = cleanedOutput.substring(startIdx, endIdx + 1);

            const cleanedJson: string = jsonString
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]");

            const params: Partial<UserFriendlyParams> = JSON.parse(cleanedJson);

            this.removeNullValues(params);
            this.normalizeNumericFields(params);

            logger.info("Extracted parameters:", params);
            return params;
        }
        catch (error)
        {
            logger.warn("Failed to extract JSON from AI output:", rawOutput, error);
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
        const numericFields = ["width", "length", "height", "utility_length", "gauge"];

        for (const field of numericFields)
        {
            const value: any = params[field as keyof UserFriendlyParams];

            if (typeof value === "string")
            {
                const num: number = parseFloat(value.replace(/[^\d.]/g, ""));
                if (!isNaN(num))
                {
                    (params as Record<string, any>)[field] = num;
                }
                else
                {
                    delete params[field as keyof UserFriendlyParams];
                }
            }
        }
    }
}

function Enforce(): void {}
