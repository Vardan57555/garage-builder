"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceParamsExtractorTool = void 0;
const InstantiationError_1 = require("../../../errors/InstantiationError");
const SharedLLM_1 = require("../../../llm/SharedLLM");
const BaseTool_1 = require("../../tools/BaseTool");
const PriceServiceImpl_1 = require("../../../modules/price-service/services/impl/PriceServiceImpl");
const messages_1 = require("@langchain/core/messages");
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
        const prompt = this.buildPrompt(userInput);
        try {
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            const rawOutput = aiMessage.content;
            return rawOutput;
        }
        catch (error) {
            console.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "{}";
        }
    }
    async calculatePriceWithParams(params) {
        try {
            console.log("[PriceParamsExtractorTool] Calculating with params:", params);
            const result = await PriceServiceImpl_1.PriceServiceImpl.getInstance()
                .fetchBuildingPricingWithUtility(params);
            if (!result || (result.status === false && result.message)) {
                return `⚠️ ${result.message || 'Pricing service returned empty result.'}`;
            }
            return this.formatPricingResult(result, params);
        }
        catch (error) {
            console.error("[PriceParamsExtractorTool] calculatePriceWithParams failed:", error);
            return "⚠️ Failed to calculate price with the given parameters.";
        }
    }
    formatPricingResult(pricing, params) {
        const roofNames = {
            1: "Vertical",
            2: "Regular",
            3: "Boxed-Eave"
        };
        let message = "✅ **Price Quote Generated!**\n\n";
        message += "📐 **Building Specifications:**\n";
        message += `   • Dimensions: ${params.width}ft × ${params.length}ft × ${params.height}ft\n`;
        message += `   • Roof Style: ${roofNames[params.roof_id] || 'Custom'}\n`;
        message += `   • Map ID: ${params.map_id}\n`;
        if (params.utility_length && params.utility_length > 0) {
            message += `   • Utility Length: ${params.utility_length}ft\n`;
        }
        if (pricing.manufacturer && pricing.manufacturer.length > 0) {
            message += `   • Manufacturer: ${pricing.manufacturer[0].manufacturer_name || 'N/A'}\n`;
        }
        let totalPrice = 0;
        let selectedRoofPrice = 0;
        if (pricing.building_structure && pricing.building_structure.length > 0) {
            const structure = pricing.building_structure[0];
            if (params.roof_id === 1 && structure.vertical_roof_cost > 0) {
                selectedRoofPrice = structure.vertical_roof_cost;
            }
            else if (params.roof_id === 3 && structure.box_style_cost > 0) {
                selectedRoofPrice = structure.box_style_cost;
            }
            else if (structure.regular_cost > 0) {
                selectedRoofPrice = structure.regular_cost;
            }
            else {
                selectedRoofPrice = structure.total_price || 0;
            }
            totalPrice += selectedRoofPrice;
        }
        if (pricing.end?.end_close_cost)
            totalPrice += pricing.end.end_close_cost;
        if (pricing.garage_door?.cost)
            totalPrice += pricing.garage_door.cost;
        if (pricing.anchors_cost?.length) {
            totalPrice += pricing.anchors_cost.reduce((sum, a) => sum + (a.cost || 0), 0);
        }
        if (pricing.bows?.length) {
            totalPrice += pricing.bows.reduce((sum, b) => sum + (b.cost || 0), 0);
        }
        if (pricing.addons?.length) {
            totalPrice += pricing.addons.reduce((sum, a) => sum + (a.cost || 0), 0);
        }
        if (pricing.additional_features?.cost_type === '%') {
            totalPrice += (pricing.additional_features.cost / 100) * totalPrice;
        }
        if (pricing.utility_cost) {
            totalPrice += pricing.utility_cost;
        }
        message += "\n💰 **ESTIMATED TOTAL PRICE: $" + this.formatCurrency(totalPrice) + "**\n";
        message += "\n📊 **Price Breakdown:**\n";
        message += `   • Base Building with ${roofNames[params.roof_id] || 'Custom'} Roof: $${this.formatCurrency(selectedRoofPrice)}\n`;
        if (pricing.end?.end_close_cost) {
            message += `   • End Panels: $${this.formatCurrency(pricing.end.end_close_cost)}\n`;
        }
        if (pricing.garage_door?.cost) {
            message += `   • Garage Door: $${this.formatCurrency(pricing.garage_door.cost)}\n`;
        }
        if (pricing.anchors_cost?.length) {
            pricing.anchors_cost.forEach((a) => {
                message += `   • ${a.name}: $${this.formatCurrency(a.cost)}\n`;
            });
        }
        if (pricing.bows?.length) {
            pricing.bows.forEach((b) => {
                message += `   • Bow: $${this.formatCurrency(b.cost)}\n`;
            });
        }
        if (pricing.addons?.length) {
            pricing.addons.forEach((a) => {
                message += `   • ${a.label}: $${this.formatCurrency(a.cost)}\n`;
            });
        }
        if (pricing.additional_features?.cost_type === '%') {
            message += `   • ${pricing.additional_features.additional_feature}: +${pricing.additional_features.cost}%\n`;
        }
        if (pricing.utility_cost) {
            message += `   • Utility Items: $${this.formatCurrency(pricing.utility_cost)}\n`;
        }
        message += "\n💡 This is your base quote. Add-ons and customizations can be added for additional cost.";
        return message;
    }
    formatCurrency(value) {
        return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    buildPrompt(userInput) {
        return `
You are a parameter extraction assistant for garage/building pricing.

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

🧾 **Examples**:
- "I want a 2-car garage, 20x24x9, in Texas, gauge 14" → 
  {"garage_type": "2 car garage", "width": 20, "length": 24, "height": 9, "state_name": "Texas", "roof_type": null, "manufacturer_name": null, "utility_length": null, "building_type": null, "gauge": 14, "is_barn": null}

- "Regular roof garage in Florida" → 
  {"garage_type": null, "width": null, "length": null, "height": null, "state_name": "Florida", "roof_type": "regular", "manufacturer_name": null, "utility_length": null, "building_type": null, "gauge": null, "is_barn": null}

User input: "${userInput}"

JSON output:
  `.trim();
    }
    safeExtractUserFriendlyParams(rawOutput) {
        try {
            const match = rawOutput.match(/\{[\s\S]*\}/);
            if (!match) {
                console.warn("No JSON found in AI output:", rawOutput);
                return {};
            }
            const jsonText = match[0]
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/(\r\n|\n|\r)/gm, "");
            const params = JSON.parse(jsonText, (key, value) => {
                if (value === "null")
                    return null;
                return value;
            });
            Object.keys(params).forEach(key => {
                if (params[key] === null) {
                    delete params[key];
                }
            });
            const numericFields = ['width', 'length', 'height', 'utility_length', 'gauge'];
            numericFields.forEach(field => {
                const value = params[field];
                if (value !== undefined && value !== null && typeof value === 'string') {
                    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
                    if (!isNaN(numericValue)) {
                        params[field] = numericValue;
                    }
                    else {
                        delete params[field];
                    }
                }
            });
            return params;
        }
        catch (err) {
            console.warn("Invalid JSON from LLM:", err);
            return {};
        }
    }
}
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map