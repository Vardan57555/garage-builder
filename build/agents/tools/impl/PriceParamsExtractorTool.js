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
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(this.buildPrompt(userInput))]);
            return aiMessage.content;
        }
        catch (error) {
            logger.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "{}";
        }
    }
    async calculatePriceWithParams(params) {
        try {
            const result = await PriceServiceImpl_1.PriceServiceImpl.getInstance()
                .fetchBuildingPricingWithUtility(params);
            if (!result?.status && result?.message) {
                return `⚠️ ${result.message}`;
            }
            if (!result) {
                return "⚠️ Pricing service returned empty result.";
            }
            return this.formatPricingResult(result, params);
        }
        catch (error) {
            logger.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }
    formatPricingResult(pricing, params) {
        const roofName = Constants_1.Constants.ROOF_NAMES[params.roof_id] || 'Custom';
        const { total: totalPrice, roofPrice } = this.calculateTotalPrice(pricing, params);
        const breakdownLines = this.buildBreakdownLines(pricing, params, roofPrice);
        return [
            "✅ **Price Quote Generated!**\n",
            this.formatSpecifications(pricing, params, roofName),
            `\n💰 **ESTIMATED TOTAL PRICE: $${this.formatCurrency(totalPrice)}**\n`,
            "\n📊 **Price Breakdown:**",
            breakdownLines.join('\n'),
            "\n\n💡 This is your base quote. Add-ons and customizations can be added for additional cost."
        ].join('\n');
    }
    formatSpecifications(pricing, params, roofName) {
        const specs = [
            "📐 **Building Specifications:**",
            `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft`,
            `   • Roof Style: ${roofName}`,
            `   • Map ID: ${params.map_id}`
        ];
        if (params.utility_length && params.utility_length > 0) {
            specs.push(`   • Utility Length: ${params.utility_length}ft`);
        }
        if (pricing.manufacturer?.length > 0) {
            specs.push(`   • Manufacturer: ${pricing.manufacturer[0].manufacturer_name || 'N/A'}`);
        }
        return specs.join('\n');
    }
    buildBreakdownLines(pricing, params, roofPrice) {
        const roofName = Constants_1.Constants.ROOF_NAMES[params.roof_id] || 'Custom';
        const lines = [`   • Base Building with ${roofName} Roof: $${this.formatCurrency(roofPrice)}`];
        for (const component of Constants_1.Constants.PRICING_COMPONENTS) {
            const cost = component.extractor(pricing);
            if (cost > 0) {
                lines.push(`   • ${component.name}: $${this.formatCurrency(cost)}`);
            }
        }
        this.addArrayComponentLines(pricing, lines);
        if (pricing.additional_features?.cost_type === '%') {
            lines.push(`   • ${pricing.additional_features.additional_feature}: +${pricing.additional_features.cost}%`);
        }
        if (pricing.utility_cost) {
            lines.push(`   • Utility Items: $${this.formatCurrency(pricing.utility_cost)}`);
        }
        return lines;
    }
    addArrayComponentLines(pricing, lines) {
        const arrayComponents = [
            { array: pricing.anchors_cost, label: (item) => item.name },
            { array: pricing.bows, label: () => "Bow" },
            { array: pricing.addons, label: (item) => item.label }
        ];
        for (const { array, label } of arrayComponents) {
            array?.forEach((item) => { lines.push(`   • ${label(item)}: $${this.formatCurrency(item.cost)}`); });
        }
    }
    selectRoofPrice(structure, roofId) {
        const priceKey = Constants_1.Constants.ROOF_PRICE_KEYS[roofId];
        if (priceKey && structure[priceKey] > 0) {
            return structure[priceKey];
        }
        return structure.regular_cost > 0 ? structure.regular_cost : (structure.total_price ?? 0);
    }
    calculateTotalPrice(pricing, params) {
        let selectedRoofPrice = 0;
        if (pricing.building_structure?.length > 0) {
            selectedRoofPrice = this.selectRoofPrice(pricing.building_structure[0], params.roof_id);
        }
        let totalPrice = selectedRoofPrice;
        for (const component of Constants_1.Constants.PRICING_COMPONENTS) {
            totalPrice += component.extractor(pricing);
        }
        totalPrice += pricing.anchors_cost?.reduce((sum, a) => sum + (a.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.bows?.reduce((sum, b) => sum + (b.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.addons?.reduce((sum, a) => sum + (a.cost ?? 0), 0) ?? 0;
        totalPrice += pricing.utility_cost ?? 0;
        if (pricing.additional_features?.cost_type === '%') {
            totalPrice *= (1 + pricing.additional_features.cost / 100);
        }
        return { total: totalPrice, roofPrice: selectedRoofPrice };
    }
    formatCurrency(value) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    buildPrompt(userInput) {
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
    safeExtractUserFriendlyParams(rawOutput) {
        try {
            const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn("No JSON found in AI output");
                return {};
            }
            const cleanedJson = jsonMatch[0]
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/\s*\r?\n\s*/g, "");
            const params = JSON.parse(cleanedJson);
            this.removeNullValues(params);
            this.normalizeNumericFields(params);
            return params;
        }
        catch (err) {
            logger.warn("Invalid JSON from LLM:", err);
            return {};
        }
    }
    removeNullValues(params) {
        Object.keys(params).forEach(key => {
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
                if (!isNaN(num)) {
                    params[field] = num;
                }
                else {
                    delete params[field];
                }
            }
        }
    }
}
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map