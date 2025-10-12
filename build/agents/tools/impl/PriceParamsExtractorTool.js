"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceParamsExtractorTool = void 0;
const InstantiationError_1 = require("../../../errors/InstantiationError");
const SharedLLM_1 = require("../../../llm/SharedLLM");
const BaseTool_1 = require("../../tools/BaseTool");
const PriceServiceImpl_1 = require("../../../modules/price-service/services/impl/PriceServiceImpl");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const messages_1 = require("@langchain/core/messages");
class PriceParamsExtractorTool extends BaseTool_1.BaseTool {
    static instance;
    name = "priceParamsExtractor";
    description = "Extracts building pricing parameters from natural language, calculates building price, and returns structured pricing data.";
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceParamsExtractorTool.getInstance() instead of new.");
        }
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
            const pricingParams = this.extractParams(rawOutput);
            if (!pricingParams) {
                return "";
            }
            const result = await PriceServiceImpl_1.PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(pricingParams);
            if (memory) {
                memory.chatHistory.addUserMessage(userInput);
                memory.chatHistory.addAIChatMessage(result);
            }
            return result;
        }
        catch (error) {
            logger.error(`[PriceParamsExtractorTool] _call failed: ${error.message}`);
            throw new Error(`Failed to extract pricing and calculate price: ${error.message}`);
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
    extractParams(rawOutput) {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return null;
        }
        try {
            let jsonText = jsonMatch[0]
                .replace(/undefined/g, "null")
                .replace(/NaN/g, "null")
                .replace(/\bNone\b/g, "null")
                .replace(/(\r\n|\n|\r)/gm, "");
            const params = JSON.parse(jsonText);
            this.validateRequiredFields(params);
            params.roof_id = this.normalizeRoofId(params.roof_id);
            params.map_id = this.normalizeMapId(params.map_id);
            return params;
        }
        catch (err) {
            throw new Error(`Invalid JSON in LLM output: ${rawOutput}`);
        }
    }
    validateRequiredFields(params) {
        const requiredFields = ["width", "length", "height", "map_id", "roof_id"];
        const missing = requiredFields.filter((f) => !(f in params));
        if (missing.length) {
            throw new Error(`Missing required fields: ${missing.join(", ")}`);
        }
    }
    normalizeRoofId(roof) {
        const roofMap = {
            "gable roof": 1,
            "single slope roof": 2,
            "double slope roof": 3,
            "flat roof": 4,
        };
        if (typeof roof === "string") {
            return roofMap[roof.toLowerCase().trim()] ?? 2;
        }
        if (typeof roof === "number") {
            return roof;
        }
        return 2;
    }
    normalizeMapId(map) {
        if (typeof map === "string") {
            return 1;
        }
        if (typeof map === "number") {
            return map;
        }
        return 1;
    }
    canHandle(input) {
        const garageKeywords = /garage|building|width|length|height/i;
        return garageKeywords.test(input);
    }
}
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map