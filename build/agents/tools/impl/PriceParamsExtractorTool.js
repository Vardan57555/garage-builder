"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceParamsExtractorTool = void 0;
const InstantiationError_1 = require("../../../errors/InstantiationError");
const SharedLLM_1 = require("../../../llm/SharedLLM");
const BaseTool_1 = require("../../tools/BaseTool");
const PriceServiceImpl_1 = require("../../../modules/price-service/services/impl/PriceServiceImpl");
const messages_1 = require("@langchain/core/messages");
const Log_1 = require("../../../utils/logger/Log");
const Constants_1 = require("../../../common/io/Constants");
const DimensionCalculator_1 = require("../../../utils/dimensionCalculator/DimensionCalculator");
const logger = (0, Log_1.createLogger)(module);
class PriceParamsExtractorTool extends BaseTool_1.BaseTool {
    static instance;
    name = "priceParamsExtractor";
    description = "Extracts building pricing parameters from natural language.";
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use PriceParamsExtractorTool.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!PriceParamsExtractorTool.instance) {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }
        return PriceParamsExtractorTool.instance;
    }
    async _call(userInput) {
        try {
            logger.info("[PriceParamsExtractorTool] Processing input:", userInput);
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([
                new messages_1.HumanMessage(this.buildInferencePrompt(userInput)),
            ]);
            const extracted = this.safeExtractUserFriendlyParams(aiMessage.content);
            return JSON.stringify(this.validateAndInferMissingParams(extracted, userInput));
        }
        catch (error) {
            logger.error("[PriceParamsExtractorTool] _call failed:", error);
            return JSON.stringify({});
        }
    }
    async calculatePriceWithParams(params) {
        try {
            const result = await PriceServiceImpl_1.PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(params);
            if (!result?.status && result?.message) {
                return `⚠️ ${result.message}`;
            }
            return result ? this.formatPricingResult(result, params) : "⚠️ Pricing service returned empty result.";
        }
        catch (error) {
            logger.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }
    validateAndInferMissingParams(params, userInput) {
        const input = userInput.toLowerCase();
        if (!this.hasDimensions(params)) {
            const garageType = params.garage_type || this.detectGarageType(input);
            Object.assign(params, this.getStandardDimensions(garageType));
            params.garage_type = garageType;
        }
        if (!params.state_name) {
            params.state_name = this.extractState(input) ?? undefined;
        }
        return params;
    }
    hasDimensions(params) {
        return !!(params.width && params.length && params.height);
    }
    detectGarageType(input) {
        for (const [pattern, type] of Constants_1.Constants.GARAGE_TYPE_PATTERNS) {
            if (pattern.test(input)) {
                return type;
            }
        }
        return "garage";
    }
    extractState(input) {
        for (const [pattern, stateName] of Object.entries(Constants_1.Constants.STATE_PATTERNS)) {
            if (new RegExp(`\\b(?:${pattern})\\b`, "i").test(input)) {
                return stateName;
            }
        }
        return null;
    }
    formatPricingResult(pricing, params) {
        const { total: kitPrice, roofPrice } = this.calculateTotalPrice(pricing, params);
        const { total: finalTotal, breakdown: serviceBreakdown } = this.addServiceCosts(kitPrice, params);
        const breakdownLines = [
            ...this.buildBreakdownLines(pricing, params, roofPrice),
            ...serviceBreakdown,
        ];
        return this.formatQuote(this.formatSpecifications(pricing, params), finalTotal, breakdownLines);
    }
    formatQuote(specs, total, breakdown) {
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
    formatSpecifications(pricing, params) {
        const sqft = params.width * params.length;
        const roofName = Constants_1.Constants.ROOF_NAMES[params.roof_id] || "Custom";
        const specs = [
            "📐 **Building Specifications:**",
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft (${sqft} sq ft)`,
            `   • Roof Style: ${roofName}`,
            `   • Gauge: ${pricing.gauge ?? params.gauge ?? 14}GA`,
        ];
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
    buildBreakdownLines(pricing, params, roofPrice) {
        const lines = [];
        if (roofPrice > 0) {
            lines.push(`   • Base Building (${Constants_1.Constants.ROOF_NAMES[params.roof_id] || "Standard"}): $${this.formatCurrency(roofPrice)}`);
        }
        const sideClosureCost = this.calculateSideClosureCosts(pricing, params);
        if (sideClosureCost > 0) {
            lines.push(`   • Side & End Closures: $${this.formatCurrency(sideClosureCost)}`);
        }
        for (const component of Constants_1.Constants.PRICING_COMPONENTS) {
            const cost = this.safeExtract(component.extractor, pricing);
            if (cost > 0) {
                lines.push(`   • ${component.name}: $${this.formatCurrency(cost)}`);
            }
        }
        if (pricing.additional_features?.cost_type === "%") {
            const percentageIncrease = roofPrice * ((pricing.additional_features.cost ?? 0) / 100);
            if (percentageIncrease > 0) {
                lines.push(`   • Additional Features (${pricing.additional_features.cost}%): $${this.formatCurrency(percentageIncrease)}`);
            }
        }
        return lines;
    }
    calculateTotalPrice(pricing, params) {
        const roofPrice = this.selectRoofPrice(params.roof_id, pricing);
        let total = roofPrice;
        total += this.calculateSideClosureCosts(pricing, params);
        for (const component of Constants_1.Constants.PRICING_COMPONENTS) {
            total += this.safeExtract(component.extractor, pricing);
        }
        total += pricing.utility_cost ?? 0;
        if (pricing.additional_features?.cost_type === "%") {
            total += roofPrice * ((pricing.additional_features.cost ?? 0) / 100);
        }
        return { total, roofPrice };
    }
    selectRoofPrice(roofId, pricing) {
        const fieldMap = {
            1: "base_price_vertical",
            2: "base_price_box",
            3: "base_price_regular",
        };
        const field = fieldMap[roofId] ?? "base_price_regular";
        return pricing[field] ?? pricing.base_price_regular ?? 0;
    }
    calculateSideClosureCosts(pricing, _params) {
        let totalCost = 0;
        if (pricing.full_length_side) {
            const sideData = Array.isArray(pricing.full_length_side) ? pricing.full_length_side[0] : pricing.full_length_side;
            const costPerSide = (sideData?.side_close_cost ?? 0) + (sideData?.leg_height_cost ?? 0);
            totalCost += costPerSide * 2;
        }
        if (pricing.end) {
            const endData = Array.isArray(pricing.end) ? pricing.end[0] : pricing.end;
            totalCost += (endData?.end_close_cost ?? 0) * 2;
        }
        return totalCost;
    }
    addServiceCosts(kitPrice, params) {
        const sqft = params.width * params.length;
        const { LABOR_PERCENTAGE, FOUNDATION_COST_PER_SQFT, DELIVERY_FLAT_RATE, CONTINGENCY_PERCENTAGE, } = Constants_1.Constants.SERVICE_COSTS;
        const laborCost = kitPrice * LABOR_PERCENTAGE;
        const foundationCost = sqft * FOUNDATION_COST_PER_SQFT;
        const deliveryCost = DELIVERY_FLAT_RATE;
        const contingency = (kitPrice + laborCost + foundationCost + deliveryCost) * CONTINGENCY_PERCENTAGE;
        const breakdown = [
            `   • Installation Labor (50% of kit): $${this.formatCurrency(laborCost)}`,
            `   • Concrete Foundation (${sqft} sq ft @ $${FOUNDATION_COST_PER_SQFT}/sq ft): $${this.formatCurrency(foundationCost)}`,
            `   • Delivery & Site Preparation: $${this.formatCurrency(deliveryCost)}`,
            `   • Contingency & Misc (5%): $${this.formatCurrency(contingency)}`,
        ];
        const total = kitPrice + laborCost + foundationCost + deliveryCost + contingency;
        return { total, breakdown };
    }
    safeExtractUserFriendlyParams(rawOutput) {
        try {
            const json = this.extractJsonFromText(rawOutput);
            const params = JSON.parse(json);
            this.removeNullValues(params);
            this.normalizeNumericFields(params);
            return params;
        }
        catch (error) {
            logger.warn("Failed to extract JSON from AI output:", rawOutput, error);
            return {};
        }
    }
    extractJsonFromText(text) {
        const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const startIdx = cleaned.indexOf("{");
        const endIdx = cleaned.lastIndexOf("}");
        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
            throw new Error("No valid JSON found");
        }
        return cleaned
            .substring(startIdx, endIdx + 1)
            .replace(/undefined|NaN|\bNone\b/g, "null")
            .replace(/,\s*[}\]]/g, (match) => match.slice(-1));
    }
    removeNullValues(params) {
        Object.keys(params).forEach((key) => {
            if (params[key] === null) {
                delete params[key];
            }
        });
    }
    normalizeNumericFields(params) {
        for (const field of Constants_1.Constants.NUMERIC_FIELDS) {
            const value = params[field];
            if (typeof value === "string") {
                const num = parseFloat(value.replace(/[^\d.]/g, ""));
                if (isNaN(num)) {
                    delete params[field];
                }
                else {
                    params[field] = num;
                }
            }
        }
    }
    getStandardDimensions(garageType) {
        const dims = Constants_1.Constants.STANDARD_DIMENSIONS[garageType] || Constants_1.Constants.STANDARD_DIMENSIONS.garage;
        return { width: dims.width, length: dims.length, height: dims.height };
    }
    formatCurrency(value) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    safeExtract(extractor, pricing) {
        try {
            return extractor(pricing) ?? 0;
        }
        catch (error) {
            logger.error("[safeExtract] Extraction failed:", error);
            return 0;
        }
    }
    buildInferencePrompt(userInput) {
        const calculation = DimensionCalculator_1.DynamicGarageDimensionCalculator.calculateDimensionsFromInput(userInput);
        let dimensionExplanation = `
            DIMENSION CALCULATION (Dynamic Formula):
            - Width formula: (number_of_cars × 6) + 8 feet clearance
            - Length formula: 15 (car length) + 5 feet clearance = 20 feet
            - Height: 10 feet (standard) or 12 feet (truck/RV)
            `;
        if (calculation.numCars) {
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
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map