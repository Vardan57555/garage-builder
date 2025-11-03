import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { LeadAgentStateType } from "@agents/LeadAgentState";

const logger: pino.Logger = createLogger(module);

async function convertToTechnicalParams(
    userParams: any,
    stateMapCache: Map<string, any>,
    roofMapCache: Map<string, number>
): Promise<IPricingParams | null> {
    try {
        let map_id = 1;
        let manufacturer_id = 1;

        if (userParams.state_name) {
            const mapping = await LeadAgentHelpers.mapStateToDB(userParams.state_name, stateMapCache);
            if (mapping) {
                map_id = mapping.map_id;
                manufacturer_id = mapping.manufacturer_id;
            }
        }

        const roof_id = userParams.roof_type
            ? await LeadAgentHelpers.mapRoofTypeToDB(userParams.roof_type, map_id, roofMapCache)
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
    } catch (error) {
        logger.error("[convertToTechnicalParams] Error:", error);
        return null;
    }
}

export const calculatePriceNode = async (state: LeadAgentStateType) => {
    logger.info(`[PriceNode] Session ${state.sessionId} - Calculating price`);
    logger.info(`[PriceNode] User params:`, state.userFriendlyParams);

    try {
        const technicalParams = await convertToTechnicalParams(
            state.userFriendlyParams,
            state.stateMapCache,
            state.roofMapCache
        );

        if (!technicalParams) {
            logger.error(`[PriceNode] Failed to convert parameters`);
            return {
                response: "❌ Failed to convert parameters to technical format.",
                nextStep: "__end__",
                priceCalculated: false,
            };
        }

        logger.info(`[PriceNode] Technical params converted successfully`);

        const { PriceServiceImpl } = await import("@modules/price-service/services/impl/PriceServiceImpl");
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

        const extractor = PriceParamsExtractorTool.getInstance();
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
    } catch (error) {
        logger.error(`[PriceNode] Error:`, error);
        return {
            response: `❌ Failed to calculate price: ${error instanceof Error ? error.message : 'Unknown error'}`,
            nextStep: "__end__",
            priceCalculated: false,
        };
    }
};

function formatCompletePrice(kitPrice: number, params: any): string {
    const sqft = params.width * params.length;
    const laborCost = kitPrice * 0.5;
    const foundationCost = sqft * 8.5;
    const deliveryCost = 750;
    const contingency = (kitPrice + laborCost + foundationCost + deliveryCost) * 0.05;
    const finalTotal = kitPrice + laborCost + foundationCost + deliveryCost + contingency;

    const currentParams = LeadAgentHelpers.formatCurrentParams(params);

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

