import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { LeadAgentStateType } from "@agents/LeadAgentState";

const logger: pino.Logger = createLogger(module);

async function convertToTechnicalParams(
    userParams: Partial<UserFriendlyParams>,
    stateMapCache: Map<string, any>,
    roofMapCache: Map<string, number>
): Promise<IPricingParams | null> {
    try {
        let map_id: number = 1;
        let manufacturer_id: number = 1;

        if (userParams.state_name) {
            logger.info(`[convertToTechnicalParams] Mapping state: ${userParams.state_name}`);

            const mapping = await LeadAgentHelpers.mapStateToDB(userParams.state_name, stateMapCache);
            if (mapping) {
                map_id = mapping.map_id;
                manufacturer_id = mapping.manufacturer_id;
                logger.info(`[convertToTechnicalParams] Mapped to map_id: ${map_id}, manufacturer_id: ${manufacturer_id}`);
            } else {
                logger.warn(`[convertToTechnicalParams] State not found, using default map_id: 1`);
            }
        }

        const roof_id: number = userParams.roof_type
            ? await LeadAgentHelpers.mapRoofTypeToDB(userParams.roof_type, map_id, roofMapCache)
            : 2;

        logger.info(`[convertToTechnicalParams] Roof type mapped to roof_id: ${roof_id}`);

        const technicalParams: IPricingParams = {
            width: userParams.width ?? 0,
            length: userParams.length ?? 0,
            height: userParams.height ?? 0,
            map_id,
            roof_id,
            manufacturer_id,
            utility_length: userParams.utility_length,
            building_type: userParams.building_type,
            gauge: userParams.gauge ?? 14,
            is_barn: userParams.is_barn,
        };

        logger.info(`[convertToTechnicalParams] Final technical params:`, {
            width: technicalParams.width,
            length: technicalParams.length,
            height: technicalParams.height,
            map_id: technicalParams.map_id,
            roof_id: technicalParams.roof_id,
            gauge: technicalParams.gauge,
        });

        return technicalParams;
    } catch (error) {
        logger.error("[convertToTechnicalParams] Param conversion failed:", error);
        return null;
    }
}

export const calculatePriceNode = async (state: LeadAgentStateType) => {
    logger.info(`[PriceNode] Session ${state.sessionId} - Calculating price`);
    logger.info(`[PriceNode] User params:`, state.userFriendlyParams);

    try {
        // ✅ STEP 1: Convert user params to technical params
        const technicalParams = await convertToTechnicalParams(
            state.userFriendlyParams as Partial<UserFriendlyParams>,
            state.stateMapCache,
            state.roofMapCache
        );

        if (!technicalParams) {
            logger.error(`[PriceNode] Failed to convert parameters`);
            return {
                response: "❌ Failed to convert parameters to technical format.",
                nextStep: "__end__",
                userFriendlyParams: state.userFriendlyParams,
                priceCalculated: false,
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
            };
        }

        logger.info(`[PriceNode] Technical params converted successfully`);

        // ✅ STEP 2: Call pricing service to get pricing data
        logger.info(`[PriceNode] Calling pricing service...`);

        const { PriceServiceImpl } = await import("@modules/price-service/services/impl/PriceServiceImpl");
        const priceService = PriceServiceImpl.getInstance();

        // ✅ Get RAW pricing data (not just formatted quote)
        const rawPricingData = await priceService.fetchBuildingPricingWithUtility(technicalParams);

        logger.info(`[PriceNode] Raw pricing data received`);
        logger.info(`[PriceNode] Pricing data keys:`, Object.keys(rawPricingData || {}));

        // ✅ Check if we got valid pricing
        if (!rawPricingData || (rawPricingData.status === false)) {
            logger.warn(`[PriceNode] Invalid pricing data:`, rawPricingData);
            return {
                response: rawPricingData?.message || "❌ Failed to calculate price.",
                nextStep: "__end__",
                userFriendlyParams: state.userFriendlyParams,
                priceCalculated: false,
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
            };
        }

        // ✅ STEP 3: Extract base price from raw data
        const basePrice = rawPricingData.base_price_vertical ??
            rawPricingData.base_price_regular ??
            rawPricingData.base_price_box ?? 0;

        logger.info(`[PriceNode] Base price extracted: $${basePrice.toFixed(2)}`);

        // ✅ STEP 4: Format price for display
        const extractor = PriceParamsExtractorTool.getInstance();
        const formattedPrice = extractor.formatPricingResult(rawPricingData, technicalParams);

        logger.info(`[PriceNode] Price formatted successfully`);
        logger.info(`[PriceNode] Formatted price length: ${formattedPrice.length} chars`);

        // ✅ STEP 5: Return with all necessary data stored
        return {
            response: formattedPrice,
            userFriendlyParams: state.userFriendlyParams,
            pricingData: rawPricingData,      // ← Store full pricing data
            basePrice: basePrice,              // ← Store base price
            priceCalculated: true,
            currentField: null,
            nextStep: "show_addons",           // ← Go to show addons
            selectedAddons: [],
            finalPrice: basePrice,             // Initial final price (before addons)
        };
    } catch (error) {
        logger.error(`[PriceNode] Error:`, error);
        return {
            response: `❌ Failed to calculate price: ${error instanceof Error ? error.message : 'Unknown error'}`,
            nextStep: "__end__",
            userFriendlyParams: state.userFriendlyParams,
            priceCalculated: false,
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
        };
    }
};
