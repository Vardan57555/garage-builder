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
        if (enforce !== Enforce)
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use PriceParamsExtractorTool.getInstance() instead of new.");
    }
    static getInstance() {
        if (!PriceParamsExtractorTool.instance) {
            PriceParamsExtractorTool.instance = new PriceParamsExtractorTool(Enforce);
        }
        return PriceParamsExtractorTool.instance;
    }
    async _call(userInput, memory) {
        const prompt = this.buildPrompt(userInput);
        try {
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            const rawOutput = aiMessage.content;
            const pricingParams = this.safeExtractParams(rawOutput);
            if (!pricingParams.width || !pricingParams.length) {
                return "⚠️ Please provide full garage dimensions and details for accurate pricing.";
            }
            const result = await PriceServiceImpl_1.PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(pricingParams);
            if (memory) {
                memory.chatHistory.addUserMessage(userInput);
                memory.chatHistory.addAIChatMessage(result);
            }
            return result || "⚠️ Pricing service returned empty result. Please provide more info.";
        }
        catch (error) {
            console.error(`[PriceParamsExtractorTool] _call failed:`, error);
            return "⚠️ Failed to extract pricing and calculate price. Please try again.";
        }
    }
    buildPrompt(userInput) {
        return `
        You are a garage pricing assistant with general conversation abilities.

        If the user input seems to be about a garage/building, extract pricing parameters strictly following this schema:
        {
            "width": number,
            "length": number,
            "height": number,
            "single_slope_height": number | null,
            "map_id": number | null,
            "roof_id": number | null,
            "utility_length": number | null,
            "building_type": string | null,
            "gauge": number | null,
            "central_map_id": number | null,
            "central_height": number | null,
            "central_utility_length": number | null,
            "central_length": number | null,
            "central_width": number | null,
            "is_barn": boolean | null
        }

        Rules for pricing input:
        - Output ONLY valid JSON when extracting parameters.
        - Do not include explanations or code blocks.
        - Use null instead of undefined.
        - If unsure about a field, set it to null.

        If the user input is NOT related to garage/building parameters:
        - Respond normally as a helpful assistant (e.g., if the user says "Hello", reply "Hello! How can I help you today?").
        - Do not output JSON in this case.

        User input: "${userInput}"
   `.trim();
    }
    safeExtractParams(rawOutput) {
        try {
            const match = rawOutput.match(/\{[\s\S]*\}/);
            if (!match)
                return {};
            const jsonText = match[0]
                .replace(/undefined|NaN|\bNone\b/g, "null")
                .replace(/(\r\n|\n|\r)/gm, "");
            const params = JSON.parse(jsonText);
            params.width ??= 0;
            params.length ??= 0;
            params.height ??= 0;
            params.roof_id = this.normalizeRoofId(params.roof_id);
            params.map_id = this.normalizeMapId(params.map_id);
            return params;
        }
        catch (err) {
            console.warn("Invalid JSON from LLM, returning empty params:", err);
            return {};
        }
    }
    normalizeRoofId(roof) {
        if (typeof roof === "number")
            return roof;
        return 2;
    }
    normalizeMapId(map) {
        if (typeof map === "number")
            return map;
        return 1;
    }
}
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map