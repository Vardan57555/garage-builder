import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {Dimensions, PricingBreakdown, UserFriendlyParams} from "@agents/tools/io/IChat";
import { Constants } from "@common/io/Constants";

const logger: pino.Logger = createLogger(module);

/**
 * Tool for extracting and processing building pricing parameters from natural language input.
 * Implements a singleton pattern for efficient resource management.
 */

export class PriceParamsExtractorTool extends BaseTool
{
    private static instance: PriceParamsExtractorTool;

    readonly name: string = "priceParamsExtractor";
    readonly description: string = "Extracts building pricing parameters from natural language.";

    private constructor(enforce: () => void)
    {
        super();
        this.validateInstantiation(enforce);
    }

    /**
     * Validates that the class is instantiated through the proper factory method.
     */

    private validateInstantiation(enforce: () => void): void
    {
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

    /**
     * Main entry point for parameter extraction from user input.
     * Orchestrates the extraction, validation, and inference pipeline.
     */

    public async _call(userInput: string): Promise<string>
    {
        try
        {
            logger.info({ inputLength: userInput.length }, "[PriceParamsExtractorTool] Processing input");

            const extractedParams: Partial<UserFriendlyParams> = await this.extractParameters(userInput);
            const validatedParams: Partial<UserFriendlyParams> = this.validateAndEnrichParams(extractedParams, userInput);

            return JSON.stringify(validatedParams);
        }
        catch (error)
        {
            logger.error({ error }, "[PriceParamsExtractorTool] Extraction failed");
            return JSON.stringify({});
        }
    }

    /**
     * Extracts parameters using LLM inference.
     */
    private async extractParameters(userInput: string): Promise<Partial<UserFriendlyParams>>
    {
        const prompt: string = this.buildInferencePrompt(userInput);
        logger.debug({ promptLength: prompt.length }, "[extractParameters] Invoking LLM");

        const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
        return this.parseExtractedParams(response);
    }

    /**
     * Validates extracted parameters and infers missing required fields.
     */

    private validateAndEnrichParams(params: Partial<UserFriendlyParams>, userInput: string): Partial<UserFriendlyParams>
    {
        if (this.hasRequiredDimensions(params))
        {
            logger.debug({ keys: Object.keys(params) }, "[validateAndEnrichParams] All dimensions present");
            return params;
        }

        return this.inferMissingDimensions(params, userInput);
    }

    /**
     * Infers missing dimensions based on garage type detection.
     */
    private inferMissingDimensions(params: Partial<UserFriendlyParams>, userInput: string): Partial<UserFriendlyParams>
    {
        const garageType: string = params.garage_type || this.detectGarageType(userInput);
        const standardDims: Partial<UserFriendlyParams> = this.getStandardDimensions(garageType);

        logger.info({ garageType, ...standardDims }, "[inferMissingDimensions] Applied standard dimensions");

        return {...params, ...standardDims, garage_type: garageType};
    }

    /**
     * Checks if all required dimensions are present.
     */
    private hasRequiredDimensions(params: Partial<UserFriendlyParams>): boolean
    {
        const hasAll: boolean = !!(params.width && params.length && params.height);
        logger.debug({ width: params.width, length: params.length, height: params.height, hasAll }, "[hasRequiredDimensions] Dimension check");
        return hasAll;
    }

    /**
     * Detects a garage type from user input using pattern matching.
     */
    private detectGarageType(input: string): string
    {
        const normalizedInput: string = input.toLowerCase();

        for (const [pattern, type] of Constants.GARAGE_TYPE_PATTERNS)
        {
            if (pattern.test(normalizedInput))
            {
                logger.debug({ type, pattern: pattern.source }, "[detectGarageType] Pattern matched");
                return type;
            }
        }

        logger.debug("[detectGarageType] No pattern matched, using default");
        return "garage";
    }

    /**
     * Calculates total kit price including all components.
     */
    public calculateTotalPrice(pricing: any, params: IPricingParams): PricingBreakdown
    {
        const roofPrice: number = this.selectRoofPrice(params.roof_id, pricing);
        let total: number = roofPrice;

        total += this.calculateClosureCosts(pricing, params);
        total += this.sumComponentCosts(pricing);
        total += pricing.utility_cost ?? 0;
        total += this.calculateAdditionalFeaturesCost(pricing, roofPrice);

        logger.debug({ total, roofPrice }, "[calculateTotalPrice] Price calculation complete");
        return { total, roofPrice };
    }

    /**
     * Sums all component costs from pricing data.
     */
    private sumComponentCosts(pricing: any): number
    {
        return Constants.PRICING_COMPONENTS.reduce((sum, component) => {
            return sum + this.safeExtractCost(component.extractor, pricing);
        }, 0);
    }

    /**
     * Calculates additional features cost if percentage-based.
     */
    private calculateAdditionalFeaturesCost(pricing: any, roofPrice: number): number
    {
        if (pricing.additional_features?.cost_type === "%")
        {
            const percentage = pricing.additional_features.cost ?? 0;
            return roofPrice * (percentage / 100);
        }
        return 0;
    }

    /**
     * Selects the appropriate roof price based on roof type ID.
     */
    private selectRoofPrice(roofId: number, pricing: any): number
    {
        const roofPriceFields: Record<number, string> = {
            1: "base_price_vertical",
            2: "base_price_regular",
            3: "base_price_box",
        };

        const field: string = roofPriceFields[roofId] ?? "base_price_regular";
        const price = pricing[field] ?? pricing.base_price_regular ?? 0;

        logger.debug(
            {
                roofId,
                field,
                price,
                availableFields: Object.keys(pricing).filter(k => k.includes('base_price'))
            },
            "[selectRoofPrice] Roof price selected"
        );

        return price;
    }

    /**
     * Calculates total costs for side and end closures.
     */
    private calculateClosureCosts(pricing: any, _params: IPricingParams): number
    {
        const sideCost: number = this.calculateSideClosureCost(pricing);
        const endCost: number = this.calculateEndClosureCost(pricing);
        const total: number = sideCost + endCost;

        logger.debug({ sideCost, endCost, total }, "[calculateClosureCosts] Closure costs calculated");
        return total;
    }

    /**
     * Calculates side closure costs (both sides).
     */
    private calculateSideClosureCost(pricing: any): number
    {
        if (!pricing.full_length_side)
        {
            return 0;
        }

        const sideData = Array.isArray(pricing.full_length_side)
            ? pricing.full_length_side[0]
            : pricing.full_length_side;

        const costPerSide = (sideData?.side_close_cost ?? 0) + (sideData?.leg_height_cost ?? 0);
        return costPerSide * 2;
    }

    /**
     * Calculates end closure costs (both ends).
     */
    private calculateEndClosureCost(pricing: any): number
    {
        if (!pricing.end)
        {
            return 0;
        }

        const endData = Array.isArray(pricing.end) ? pricing.end[0] : pricing.end;
        return (endData?.end_close_cost ?? 0) * 2;
    }

    /**
     * Parses and validates extracted parameters from LLM response.
     */
    private parseExtractedParams(rawOutput: string): Partial<UserFriendlyParams>
    {
        try
        {
            logger.debug({ outputLength: rawOutput.length }, "[parseExtractedParams] Parsing response");

            const jsonString = this.extractJsonFromText(rawOutput);
            const params = JSON.parse(jsonString) as Partial<UserFriendlyParams>;

            logger.debug({ keys: Object.keys(params) }, "[parseExtractedParams] JSON parsed");

            this.cleanParams(params);
            return params;
        }
        catch (error)
        {
            logger.warn({ error }, "[parseExtractedParams] Failed to parse response");
            return {};
        }
    }

    public safeExtractUserFriendlyParams(rawOutput: string): Partial<UserFriendlyParams>
    {
        try
        {
            logger.debug({ outputLength: rawOutput.length }, "[safeExtractUserFriendlyParams] Raw output received");

            const json: string = this.extractJsonFromText(rawOutput);
            const params: Partial<UserFriendlyParams> = JSON.parse(json);

            logger.debug({ keys: Object.keys(params) }, "[safeExtractUserFriendlyParams] Parsed JSON");

            this.removeNullValues(params);
            this.normalizeNumericFields(params);

            logger.debug({ keys: Object.keys(params) }, "[safeExtractUserFriendlyParams] Final cleaned params");
            return params;
        }
        catch (error)
        {
            logger.warn({ err: error }, "[safeExtractUserFriendlyParams] Failed to extract JSON");
            return {};
        }
    }

    /**
     * Cleans extracted parameters by removing nulls and normalizing values.
     */

    private cleanParams(params: Partial<UserFriendlyParams>): void
    {
        this.removeNullValues(params);
        this.normalizeNumericFields(params);
        logger.debug({ keys: Object.keys(params) }, "[cleanParams] Parameters cleaned");
    }

    /**
     * Extracts JSON object from text that may contain markdown or extra content.
     */

    private extractJsonFromText(text: string): string
    {
        const cleaned: string = text
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        const startIdx: number = cleaned.indexOf("{");
        const endIdx: number = cleaned.lastIndexOf("}");

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx)
        {
            throw new Error("No valid JSON found in response");
        }

        return cleaned
            .substring(startIdx, endIdx + 1)
            .replace(/undefined|NaN|\bNone\b/g, "null")
            .replace(/,\s*[}\]]/g, match => match.slice(-1));
    }

    /**
     * Removes all null and undefined values from params object.
     */
    private removeNullValues(params: Partial<UserFriendlyParams>): void
    {
        const keysToRemove = Object.entries(params)
            .filter(([_, value]) => value === null || value === undefined)
            .map(([key]) => key as keyof UserFriendlyParams);

        keysToRemove.forEach(key => delete params[key]);

        logger.debug({ removedCount: keysToRemove.length }, "[removeNullValues] Null values removed");
    }

    /**
     * Normalizes numeric fields by parsing strings and removing invalid values.
     */

    private normalizeNumericFields(params: Partial<UserFriendlyParams>): void
    {
        for (const field of Constants.NUMERIC_FIELDS)
        {
            this.normalizeField(params, field);
        }
    }

    /**
     * Normalizes a single numeric field.
     */

    private normalizeField(params: Partial<UserFriendlyParams>, field: string): void
    {
        const value: string | number | boolean = params[field as keyof UserFriendlyParams];

        if (typeof value !== "string")
        {
            return;
        }

        const parsed: number = parseFloat(value.replace(/[^\d.]/g, ""));

        if (isNaN(parsed))
        {
            delete params[field as keyof UserFriendlyParams];
            logger.debug({ field }, "[normalizeField] Invalid numeric field removed");
        }
        else
        {
            (params as Record<string, any>)[field] = parsed;
            logger.debug({ field, original: value, parsed }, "[normalizeField] Field normalized");
        }
    }

    /**
     * Retrieves standard dimensions for a given garage type.
     */
    private getStandardDimensions(garageType: string): Partial<UserFriendlyParams>
    {
        const dims: Dimensions = Constants.STANDARD_DIMENSIONS[garageType] || Constants.STANDARD_DIMENSIONS.garage;

        logger.debug({ garageType, width: dims.width, length: dims.length, height: dims.height }, "[getStandardDimensions] Standard dimensions retrieved");

        return {
            width: dims.width,
            length: dims.length,
            height: dims.height,
        };
    }

    /**
     * Safely extracts cost using the provided extractor function.
     */

    private safeExtractCost(extractor: (pricing: any) => number, pricing: any): number
    {
        try
        {
            return extractor(pricing) ?? 0;
        }
        catch (error)
        {
            logger.error({ error }, "[safeExtractCost] Extraction failed");
            return 0;
        }
    }

    /**
     * Builds the LLM prompt for parameter extraction.
     */
    private buildInferencePrompt(userInput: string): string {
        return `You are a garage/building specification extraction system.

⚠️  CRITICAL RULES FOR DIMENSIONS:
1. ONLY extract dimensions if user EXPLICITLY provides them
2. DO NOT infer, guess, or calculate default dimensions
3. DO NOT use standard garage sizes unless explicitly stated
4. If user says "garage" or "2 car garage" WITHOUT dimensions → return null for width/length/height
5. ONLY return dimensions if user provides actual numbers

EXPLICIT DIMENSION FORMATS (extract these):
✅ "20x30x10" → Extract all three
✅ "width 20 length 30 height 10" → Extract all three
✅ "20 feet by 30 feet by 10 feet" → Extract all three
✅ "20, 30, 10" → Extract all three

IMPLICIT REQUESTS (DO NOT extract dimensions):
❌ "i want garage" → {"width": null, "length": null, "height": null}
❌ "2 car garage" → {"garage_type": "2-car", "width": null, "length": null, "height": null}
❌ "build me a garage" → {"width": null, "length": null, "height": null}
❌ "need storage" → {"width": null, "length": null, "height": null}

GARAGE TYPE DETECTION (without dimensions):
- "2 cars", "three car garage" → Extract garage_type ONLY, dimensions stay null
- "truck garage", "RV garage" → Extract building_type ONLY, dimensions stay null

OTHER PARAMETERS (always extract if mentioned):
- state_name: Extract if mentioned ("in Texas", "California")
- roof_type: Extract ONLY if explicitly mentioned ("vertical roof", "box roof")
- gauge: Extract if mentioned ("14ga", "16 gauge")
- color: Extract if mentioned ("red", "barn red")

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "garage_type": "detected type or null",
  "width": null unless explicitly provided,
  "length": null unless explicitly provided,
  "height": null unless explicitly provided,
  "state_name": "state name or null",
  "roof_type": "roof type or null",
  "gauge": number or null,
  "color": "color or null",
  "building_type": "type or null"
}

EXAMPLES:
Input: "i want garage"
Output: {"garage_type": "garage", "width": null, "length": null, "height": null}

Input: "2 car garage"
Output: {"garage_type": "2-car", "width": null, "length": null, "height": null}

Input: "20x30x10 garage"
Output: {"width": 20, "length": 30, "height": 10}

Input: "width 20 length 30 height 10"
Output: {"width": 20, "length": 30, "height": 10}

Input: "i want a building in Texas"
Output: {"state_name": "Texas", "width": null, "length": null, "height": null}

⚠️  REMEMBER: If dimensions are NOT explicitly stated, return null for them!

User input: "${userInput}"

Return ONLY valid JSON:`;
    }

    /**
     * Builds dimension calculation explanation for the prompt.
     */
    // private buildDimensionExplanation(calculation: any): string
    // {
    //     let explanation: string = `
    //             DIMENSION CALCULATION (Dynamic Formula):
    //             - Width formula: (number_of_cars × 6) + 8 feet clearance
    //             - Length formula: 15 (car length) + 5 feet clearance = 20 feet
    //             - Height: 10 feet (standard) or 12 feet (truck/RV)`;
    //
    //                     if (calculation.numCars) {
    //                         explanation += `
    //
    //             Example for ${calculation.numCars} car(s):
    //             - Width: (${calculation.numCars} × 6) + 8 = ${calculation.width} ft
    //             - Length: 15 + 5 = ${calculation.length} ft
    //             - Height: ${calculation.height} ft`;
    //     }
    //
    //     return explanation;
    // }
}

/**
 * Enforcement function for singleton pattern.
 */
function Enforce(): void {}
