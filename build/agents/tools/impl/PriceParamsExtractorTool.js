"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceParamsExtractorTool = void 0;
const InstantiationError_1 = require("../../../errors/InstantiationError");
const SharedLLM_1 = require("../../../llm/SharedLLM");
const BaseTool_1 = require("../../tools/BaseTool");
const PriceServiceImpl_1 = require("../../../modules/price-service/services/impl/PriceServiceImpl");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
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
    async _call(userInput) {
        const prompt = this.buildPrompt(userInput);
        try {
            const { response: rawOutput = "" } = await SharedLLM_1.sharedLLM.generate({
                model: "llama3.2:latest",
                prompt,
            });
            const pricingParams = this.extractParams(rawOutput);
            return await PriceServiceImpl_1.PriceServiceImpl.getInstance().fetchBuildingPricingWithUtility(pricingParams);
        }
        catch (error) {
            logger.error(`[PriceParamsExtractorTool] _call failed:, ${error.message}`);
            throw new Error(`Failed to extract pricing and calculate price ${error.message}`);
        }
    }
    buildPrompt(userInput) {
        return `
                You are a garage pricing assistant.

                User input: "${userInput}"

                Tasks:
                1. Extract all fields required for the IPricingParams interface:
                width, length, height, single_slope_height, map_id, roof_id,
                utility_length, building_type, gauge, central_map_id, central_height,
                central_utility_length, central_length, central_width, is_barn
                2. If a field is missing in the user input, omit it.
                3. Respond ONLY in JSON format matching IPricingParams.
             `.trim();
    }
    extractParams(rawOutput) {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`No JSON found in LLM output: ${rawOutput}`);
        }
        let params;
        try {
            params = JSON.parse(jsonMatch[0]);
        }
        catch {
            throw new Error(`Invalid JSON in LLM output: ${rawOutput}`);
        }
        this.validateRequiredFields(params);
        params.roof_id = this.normalizeRoofId(params.roof_id);
        params.map_id = this.normalizeMapId(params.map_id);
        return params;
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
}
exports.PriceParamsExtractorTool = PriceParamsExtractorTool;
function Enforce() { }
//# sourceMappingURL=PriceParamsExtractorTool.js.map