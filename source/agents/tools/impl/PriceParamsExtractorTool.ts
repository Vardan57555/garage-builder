import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseTool } from "@agents/tools/BaseTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { PriceServiceImpl } from "@modules/price-service/services/impl/PriceServiceImpl";
import { HumanMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {
    Dimensions,
    PricingBreakdown,
    ServiceCostsResult,
    UserFriendlyParams,
} from "@agents/tools/io/IChat";
import { Constants } from "@common/io/Constants";
import { DynamicGarageDimensionCalculator } from "@utils/dimensionCalculator/DimensionCalculator";

const logger: pino.Logger = createLogger(module);


/**
 * PriceParamsExtractorTool
 * Handles parameter extraction and price calculation
 *
 * KEY IMPROVEMENTS:
 * - Uses improved sharedLLM with auto-retry
 * - Better error handling and validation
 * - Cleaner separation of concerns
 * - Type-safe pricing calculations
 */
export class PriceParamsExtractorTool extends BaseTool {
    private static instance: PriceParamsExtractorTool;
    readonly name = "priceParamsExtractor";
    readonly description = "Extracts building pricing parameters from natural language.";

    private constructor(enforce: () => void) {
        super();

        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use PriceParamsExtractorTool.getInstance() instead of new."
            );
        }
    }

    public static getInstance(): PriceParamsExtractorTool {
        if (!PriceParamsExtractorTool.instance) {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }

        return PriceParamsExtractorTool.instance;
    }

    /**
     * STEP 1: Call LLM to extract parameters from user input
     * Uses improved sharedLLM with automatic retry logic
     */
    public async _call(userInput: string): Promise<string> {
        try {
            logger.info("[PriceParamsExtractorTool] Processing input:", userInput);

            const prompt = this.buildInferencePrompt(userInput);
            logger.debug("[PriceParamsExtractorTool] Prompt built, calling LLM...");

            // Uses sharedLLM manager which handles retries automatically
            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            const extracted = this.safeExtractUserFriendlyParams(response);
            logger.info("[PriceParamsExtractorTool] Extracted params:", extracted);

            const validated = this.validateAndInferMissingParams(extracted, userInput);
            logger.info("[PriceParamsExtractorTool] Validated and inferred params:", validated);

            return JSON.stringify(validated);
        } catch (error) {
            logger.error("[PriceParamsExtractorTool] _call failed:", error);
            return JSON.stringify({});
        }
    }

    /**
     * STEP 2: Calculate price based on pricing parameters
     * Handles service failures gracefully
     */
    public async calculatePriceWithParams(params: IPricingParams): Promise<string> {
        try {
            logger.info("[PriceParamsExtractorTool] Calculating price with params:", params);

            const result = await PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(
                params
            );

            if (!result) {
                logger.warn("[PriceParamsExtractorTool] Empty result from pricing service");
                return "⚠️ Pricing service returned empty result.";
            }

            if (!result.status && result.message) {
                logger.warn("[PriceParamsExtractorTool] Pricing service error:", result.message);
                return `⚠️ ${result.message}`;
            }

            logger.info("[PriceParamsExtractorTool] Price calculated successfully");
            return this.formatPricingResult(result, params);
        } catch (error) {
            logger.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }

    /**
     * STEP 3: Validate extracted parameters and infer missing ones
     * Intelligently fills in missing data from context
     */
    private validateAndInferMissingParams(
        params: Partial<UserFriendlyParams>,
        userInput: string
    ): Partial<UserFriendlyParams> {
        const input: string = userInput.toLowerCase();

        logger.debug("[validateAndInferMissingParams] Input params:", params);

        // Infer dimensions if missing
        if (!this.hasDimensions(params)) {
            const garageType: string = params.garage_type || this.detectGarageType(input);
            const standardDims = this.getStandardDimensions(garageType);

            logger.info(
                `[validateAndInferMissingParams] Missing dimensions, inferred from type "${garageType}":`,
                standardDims
            );

            Object.assign(params, standardDims);
            params.garage_type = garageType;
        }

        // Infer state if missing
        if (!params.state_name) {
            const extractedState = this.extractState(input);
            if (extractedState) {
                logger.info(`[validateAndInferMissingParams] Inferred state: ${extractedState}`);
                params.state_name = extractedState;
            }
        }

        logger.debug("[validateAndInferMissingParams] Final params:", params);
        return params;
    }

    /**
     * Check if all three dimensions are present
     */
    private hasDimensions(params: Partial<UserFriendlyParams>): boolean {
        const hasDims = !!(params.width && params.length && params.height);
        logger.debug(`[hasDimensions] Check: width=${params.width}, length=${params.length}, height=${params.height} => ${hasDims}`);
        return hasDims;
    }

    /**
     * Detect garage type from input text
     */
    private detectGarageType(input: string): string {
        for (const [pattern, type] of Constants.GARAGE_TYPE_PATTERNS) {
            if (pattern.test(input)) {
                logger.debug(`[detectGarageType] Matched pattern for type: ${type}`);
                return type;
            }
        }
        logger.debug("[detectGarageType] No pattern matched, defaulting to 'garage'");
        return "garage";
    }

    /**
     * Extract state name from input text
     */
    private extractState(input: string): string | null {
        for (const [pattern, stateName] of Object.entries(Constants.STATE_PATTERNS)) {
            if (new RegExp(`\\b(?:${pattern})\\b`, "i").test(input)) {
                logger.debug(`[extractState] Matched state: ${stateName}`);
                return stateName;
            }
        }
        logger.debug("[extractState] No state pattern matched");
        return null;
    }

    /**
     * STEP 4: Format complete pricing result
     */
    private formatPricingResult(pricing: any, params: IPricingParams): string {
        logger.info("[formatPricingResult] Formatting price quote...");

        const { total: kitPrice, roofPrice } = this.calculateTotalPrice(pricing, params);
        const { total: finalTotal, breakdown: serviceBreakdown } = this.addServiceCosts(
            kitPrice,
            params
        );

        const breakdownLines = [
            ...this.buildBreakdownLines(pricing, params, roofPrice),
            ...serviceBreakdown,
        ];

        const quote = this.formatQuote(
            this.formatSpecifications(pricing, params),
            finalTotal,
            breakdownLines
        );

        logger.debug("[formatPricingResult] Quote formatted successfully");
        return quote;
    }

    /**
     * Build final quote string
     */
    private formatQuote(specs: string, total: number, breakdown: string[]): string {
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
     * Format building specifications for display
     */
    private formatSpecifications(pricing: any, params: IPricingParams): string {
        const sqft: number = params.width * params.length;
        const roofName: string = Constants.ROOF_NAMES[params.roof_id] || "Custom";

        const specs: string[] = [
            "📐 **Building Specifications:**",
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft (${sqft} sq ft)`,
            `   • Roof Style: ${roofName}`,
            `   • Gauge: ${pricing.gauge ?? params.gauge ?? 14}GA`,
        ];

        // Add optional fields
        if (params.building_type) {
            specs.push(`   • Building Type: ${params.building_type}`);
        }

        if (params.utility_length && params.utility_length > 0) {
            specs.push(`   • Utility Length: ${params.utility_length}ft`);
        }

        if (params.is_barn) {
            specs.push(`   • Barn Style: Yes`);
        }

        if (pricing.manufacturer?.length > 0) {
            specs.push(`   • Manufacturer: ${pricing.manufacturer[0].manufacturer_name || "Standard"}`);
        }

        return specs.join("\n");
    }

    /**
     * Build detailed breakdown lines for pricing
     */
    private buildBreakdownLines(
        pricing: any,
        params: IPricingParams,
        roofPrice: number
    ): string[] {
        const lines: string[] = [];

        // Base building cost
        if (roofPrice > 0) {
            const roofName = Constants.ROOF_NAMES[params.roof_id] || "Standard";
            lines.push(
                `   • Base Building (${roofName}): $${this.formatCurrency(roofPrice)}`
            );
        }

        // Side closures
        const sideClosureCost: number = this.calculateSideClosureCosts(pricing, params);
        if (sideClosureCost > 0) {
            lines.push(`   • Side & End Closures: $${this.formatCurrency(sideClosureCost)}`);
        }

        // Other components
        for (const component of Constants.PRICING_COMPONENTS) {
            const cost: number = this.safeExtract(component.extractor, pricing);

            if (cost > 0) {
                lines.push(`   • ${component.name}: $${this.formatCurrency(cost)}`);
            }
        }

        // Additional features (percentage-based)
        if (pricing.additional_features?.cost_type === "%") {
            const percentageIncrease: number =
                roofPrice * ((pricing.additional_features.cost ?? 0) / 100);

            if (percentageIncrease > 0) {
                lines.push(
                    `   • Additional Features (${pricing.additional_features.cost}%): $${this.formatCurrency(percentageIncrease)}`
                );
            }
        }

        return lines;
    }

    /**
     * Calculate total kit price before service costs
     */
    private calculateTotalPrice(pricing: any, params: IPricingParams): PricingBreakdown {
        const roofPrice: number = this.selectRoofPrice(params.roof_id, pricing);
        let total: number = roofPrice;

        total += this.calculateSideClosureCosts(pricing, params);

        for (const component of Constants.PRICING_COMPONENTS) {
            total += this.safeExtract(component.extractor, pricing);
        }

        total += pricing.utility_cost ?? 0;

        if (pricing.additional_features?.cost_type === "%") {
            total += roofPrice * ((pricing.additional_features.cost ?? 0) / 100);
        }

        logger.debug("[calculateTotalPrice] Calculated total:", { total, roofPrice });
        return { total, roofPrice };
    }

    /**
     * Select appropriate roof price based on roof type
     */
    private selectRoofPrice(roofId: number, pricing: any): number {
        const fieldMap: Record<number, string> = {
            1: "base_price_vertical",
            2: "base_price_box",
            3: "base_price_regular",
        };

        const field: string = fieldMap[roofId] ?? "base_price_regular";
        const price = pricing[field] ?? pricing.base_price_regular ?? 0;

        logger.debug(`[selectRoofPrice] Roof ID ${roofId} => field ${field} => $${price}`);
        return price;
    }

    /**
     * Calculate side and end closure costs
     */
    private calculateSideClosureCosts(pricing: any, _params: IPricingParams): number {
        let totalCost: number = 0;

        // Side closures (two sides)
        if (pricing.full_length_side) {
            const sideData = Array.isArray(pricing.full_length_side)
                ? pricing.full_length_side[0]
                : pricing.full_length_side;

            const costPerSide =
                (sideData?.side_close_cost ?? 0) + (sideData?.leg_height_cost ?? 0);
            totalCost += costPerSide * 2;

            logger.debug("[calculateSideClosureCosts] Side cost:", { costPerSide, total: costPerSide * 2 });
        }

        // End closures (two ends)
        if (pricing.end) {
            const endData = Array.isArray(pricing.end) ? pricing.end[0] : pricing.end;
            const endCost = (endData?.end_close_cost ?? 0) * 2;
            totalCost += endCost;

            logger.debug("[calculateSideClosureCosts] End cost:", { endCost });
        }

        logger.debug("[calculateSideClosureCosts] Total closure cost:", totalCost);
        return totalCost;
    }

    /**
     * Add service costs (labor, foundation, delivery, contingency)
     */
    private addServiceCosts(kitPrice: number, params: IPricingParams): ServiceCostsResult {
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
        const contingency: number =
            (kitPrice + laborCost + foundationCost + deliveryCost) * CONTINGENCY_PERCENTAGE;

        logger.debug("[addServiceCosts] Service costs breakdown:", {
            labor: laborCost,
            foundation: foundationCost,
            delivery: deliveryCost,
            contingency: contingency,
        });

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
     * STEP 5: Extract and clean JSON from LLM response
     */
    public safeExtractUserFriendlyParams(rawOutput: string): Partial<UserFriendlyParams> {
        try {
            logger.debug("[safeExtractUserFriendlyParams] Raw output:", rawOutput);

            const json: string = this.extractJsonFromText(rawOutput);
            const params: Partial<UserFriendlyParams> = JSON.parse(json);

            logger.debug("[safeExtractUserFriendlyParams] Parsed JSON:", params);

            this.removeNullValues(params);
            this.normalizeNumericFields(params);

            logger.debug("[safeExtractUserFriendlyParams] Final cleaned params:", params);
            return params;
        } catch (error) {
            logger.warn("[safeExtractUserFriendlyParams] Failed to extract JSON:", error);
            return {};
        }
    }

    /**
     * Extract JSON object from potentially markdown-wrapped text
     */
    private extractJsonFromText(text: string): string {
        const cleaned: string = text
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        const startIdx: number = cleaned.indexOf("{");
        const endIdx: number = cleaned.lastIndexOf("}");

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
            throw new Error("No valid JSON found in response");
        }

        return cleaned
            .substring(startIdx, endIdx + 1)
            .replace(/undefined|NaN|\bNone\b/g, "null")
            .replace(/,\s*[}\]]/g, (match) => match.slice(-1));
    }

    /**
     * Remove null values from parameters object
     */
    private removeNullValues(params: Partial<UserFriendlyParams>): void {
        const keysToDelete: (keyof UserFriendlyParams)[] = [];

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                keysToDelete.push(key as keyof UserFriendlyParams);
            }
        });

        keysToDelete.forEach((key) => {
            delete params[key];
        });

        logger.debug("[removeNullValues] Removed keys:", keysToDelete);
    }

    /**
     * Normalize numeric fields from strings to numbers
     */
    private normalizeNumericFields(params: Partial<UserFriendlyParams>): void {
        for (const field of Constants.NUMERIC_FIELDS) {
            const value: string | number | boolean = params[field as keyof UserFriendlyParams];

            if (typeof value === "string") {
                const num: number = parseFloat(value.replace(/[^\d.]/g, ""));

                if (isNaN(num)) {
                    delete params[field as keyof UserFriendlyParams];
                    logger.debug(`[normalizeNumericFields] Deleted invalid field: ${field}`);
                } else {
                    (params as Record<string, any>)[field] = num;
                    logger.debug(`[normalizeNumericFields] Normalized ${field}: ${value} => ${num}`);
                }
            }
        }
    }

    /**
     * Get standard dimensions for a garage type
     */
    private getStandardDimensions(garageType: string): Partial<UserFriendlyParams> {
        const dims: Dimensions =
            Constants.STANDARD_DIMENSIONS[garageType] || Constants.STANDARD_DIMENSIONS.garage;

        logger.debug(`[getStandardDimensions] Type: ${garageType} => `, dims);

        return { width: dims.width, length: dims.length, height: dims.height };
    }

    /**
     * Format number as currency string
     */
    private formatCurrency(value: number): string {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Safely extract numeric value from pricing object
     */
    private safeExtract(extractor: (pricing: any) => number, pricing: any): number {
        try {
            const result = extractor(pricing) ?? 0;
            return result;
        } catch (error) {
            logger.error("[safeExtract] Extraction failed:", error);
            return 0;
        }
    }

    /**
     * Build the LLM prompt for parameter extraction
     */
    private buildInferencePrompt(userInput: string): string {
        const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(userInput);

        let dimensionExplanation: string = `
DIMENSION CALCULATION (Dynamic Formula):
- Width formula: (number_of_cars × 6) + 8 feet clearance
- Length formula: 15 (car length) + 5 feet clearance = 20 feet
- Height: 10 feet (standard) or 12 feet (truck/RV)`;

        if (calculation.numCars) {
            dimensionExplanation += `

Example for ${calculation.numCars} car(s):
- Width: (${calculation.numCars} × 6) + 8 = ${calculation.width} ft
- Length: 15 + 5 = ${calculation.length} ft
- Height: ${calculation.height} ft`;
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
- Input: "5 car garage" → {"garage_type": "5-car", "width": 38, "length": 20, "height": 10}
- Input: "10 cars" → {"garage_type": "10-car", "width": 68, "length": 20, "height": 10}
- Input: "3 cars in texas" → {"garage_type": "3-car", "width": 26, "length": 20, "height": 10, "state_name": "texas"}
- Input: "20x25x10 garage" → {"width": 20, "length": 25, "height": 10, "garage_type": null}
- Input: "truck garage" → {"garage_type": "truck", "width": varies, "length": 24, "height": 12}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no explanation):
{
  "garage_type": "detected type or null",
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
