"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePriceNode = void 0;
const PriceParamsExtractorTool_1 = require("../../tools/impl/PriceParamsExtractorTool");
const Log_1 = require("../../../utils/logger/Log");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const logger = (0, Log_1.createLogger)(module);
async function convertToTechnicalParams(userParams, stateMapCache, roofMapCache) {
    try {
        let map_id = 1;
        let manufacturer_id = 1;
        if (userParams.state_name) {
            const mapping = await LeadAgentHelpers_1.LeadAgentHelpers.mapStateToDB(userParams.state_name, stateMapCache);
            if (mapping) {
                map_id = mapping.map_id;
                manufacturer_id = mapping.manufacturer_id;
            }
        }
        const roof_id = userParams.roof_type
            ? await LeadAgentHelpers_1.LeadAgentHelpers.mapRoofTypeToDB(userParams.roof_type, map_id, roofMapCache)
            : 2;
        return {
            width: userParams.width,
            length: userParams.length,
            height: userParams.height,
            map_id,
            roof_id,
            manufacturer_id,
            gauge: userParams.gauge ?? 14,
            building_type: userParams.building_type,
            utility_length: userParams.utility_length,
            is_barn: userParams.is_barn,
        };
    }
    catch (error) {
        logger.error("[convertToTechnicalParams] Error:", error);
        return null;
    }
}
const calculatePriceNode = async (state) => {
    logger.info(`[PriceNode] Session ${state.sessionId} - Calculating price`);
    logger.info(`[PriceNode] User params:`, state.userFriendlyParams);
    try {
        const technicalParams = await convertToTechnicalParams(state.userFriendlyParams, state.stateMapCache, state.roofMapCache);
        if (!technicalParams) {
            logger.error(`[PriceNode] Failed to convert parameters`);
            return {
                response: "❌ Failed to convert parameters to technical format.",
                nextStep: "__end__",
                priceCalculated: false,
            };
        }
        logger.info(`[PriceNode] Technical params converted successfully`);
        const { PriceServiceImpl } = await Promise.resolve().then(() => __importStar(require("../../../modules/price-service/services/impl/PriceServiceImpl")));
        const priceService = PriceServiceImpl.getInstance();
        const rawPricingData = await priceService.fetchBuildingPricingWithUtility(technicalParams);
        if (!rawPricingData || rawPricingData.status === false) {
            logger.warn(`[PriceNode] Invalid pricing data:`, rawPricingData);
            return {
                response: rawPricingData?.message || "❌ Failed to calculate price.",
                nextStep: "__end__",
                priceCalculated: false,
            };
        }
        const extractor = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance();
        const { total: kitPrice } = extractor.calculateTotalPrice(rawPricingData, technicalParams);
        logger.info(`[PriceNode] Kit price calculated: $${kitPrice.toFixed(2)}`);
        const formattedPrice = formatCompletePrice(kitPrice, state.userFriendlyParams);
        return {
            response: formattedPrice,
            userFriendlyParams: state.userFriendlyParams,
            pricingData: rawPricingData,
            basePrice: kitPrice,
            priceCalculated: true,
            currentField: null,
            nextStep: "show_addons",
            selectedAddons: [],
            finalPrice: kitPrice,
        };
    }
    catch (error) {
        logger.error(`[PriceNode] Error:`, error);
        return {
            response: `❌ Failed to calculate price: ${error instanceof Error ? error.message : 'Unknown error'}`,
            nextStep: "__end__",
            priceCalculated: false,
        };
    }
};
exports.calculatePriceNode = calculatePriceNode;
function formatCompletePrice(kitPrice, params) {
    const sqft = params.width * params.length;
    const laborCost = kitPrice * 0.5;
    const foundationCost = sqft * 8.5;
    const deliveryCost = 750;
    const contingency = (kitPrice + laborCost + foundationCost + deliveryCost) * 0.05;
    const finalTotal = kitPrice + laborCost + foundationCost + deliveryCost + contingency;
    const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(params);
    return `${currentParams}

📊 **PRICE BREAKDOWN:**

• Base Building Kit: $${kitPrice.toFixed(2)}
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
//# sourceMappingURL=PriceCalculationNode.js.map