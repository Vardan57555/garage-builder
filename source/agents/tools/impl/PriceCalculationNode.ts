import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { InstantiationError } from "@errors/InstantiationError";
import {PriceService} from "@modules/price-service/services/PriceService";
import {ColorOption} from "@agents/tools/io/IColorChoice";
import {Constants} from "@common/io/Constants";
import {SelectedAddon} from "@agents/tools/io/IProcessAddon";
import {ColorServiceImpl} from "@agents/tools/impl/ColorServiceImpl";
import {ColorDetails, PriceBreakdown, PriceCalculationResult, StateMapping} from "@agents/tools/io/IPriceCalculator";
import {IPriceCalculatorService} from "@agents/tools/impl/io/PriceCalculatorService";
import {QuoteBreakdown} from "@agents/tools/io/IVisualization";
const logger: pino.Logger = createLogger(module);

/**
 * Service for calculating building prices with comprehensive breakdown
 */
export class PriceCalculatorService implements IPriceCalculatorService
{
    private static instance: IPriceCalculatorService;

    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceCalculatorService.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of PriceCalculatorService.
     */
    public static getInstance(): IPriceCalculatorService
    {
        if (!PriceCalculatorService.instance)
        {
            PriceCalculatorService.instance = new PriceCalculatorService(Enforce);
        }
        return PriceCalculatorService.instance;
    }

    /**
     * Calculate breakdown from parameters
     */
    public calculateBreakdown(basePrice: number, width: number, length: number, selectedAddons: any[] = []): QuoteBreakdown
    {
        const sqft: number = width * length;
        const laborCost: number = basePrice * 0.5;
        const foundationCost: number = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const subtotal = basePrice + laborCost + foundationCost + deliveryCost + addonTotal;
        const contingency: number = subtotal * 0.05;
        const finalTotal = subtotal + contingency;

        logger.debug(`[PriceCalculator] Breakdown: Base=$${basePrice}, Addons=$${addonTotal}, Total=$${finalTotal}`);

        return { basePrice, laborCost, foundationCost, deliveryCost, contingency, addonTotal, finalTotal };
    }


    public calculateTotalPrice(basePrice: number, addons: SelectedAddon[]): number
    {
        const addonTotal: number = addons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const total: number = basePrice + addonTotal;

        logger.info(`[PricingCalculator] Base: $${basePrice.toFixed(2)}, ` + `Addons: $${addonTotal.toFixed(2)}, Total: $${total.toFixed(2)}`);

        return total;
    }

    /**
     * Calculate complete price for a building configuration
     */
    public async calculatePrice(state: LeadAgentStateType): Promise<PriceCalculationResult>
    {
        logger.info(`[PriceCalculatorService] Session ${state.sessionId} - Calculating price`);
        logger.info(`[PriceCalculatorService] User params:`, state.userFriendlyParams);

        try
        {
            const technicalParams: IPricingParams = await this.convertToTechnicalParams(
                state.userFriendlyParams,
                state.stateMapCache,
                state.roofMapCache
            );

            if (!technicalParams)
            {
                return this.handleConversionError();
            }

            logger.info(`[PriceCalculatorService] Technical params converted successfully`);

            const rawPricingData = await this.fetchRawPricingData(technicalParams);

            if (!rawPricingData || rawPricingData.status === false)
            {
                return this.handleInvalidPricingData(rawPricingData);
            }

            const kitPrice: number = this.extractKitPrice(rawPricingData, technicalParams);
            logger.info(`[PriceCalculatorService] Kit price calculated: $${kitPrice.toFixed(2)}`);

            const colorCost: number = await this.calculateColorCost(state.color);

            const breakdown: PriceBreakdown = this.calculatePriceBreakdown(
                kitPrice,
                state.userFriendlyParams,
                colorCost
            );

            return this.createSuccessResponse(
                breakdown,
                state.userFriendlyParams,
                rawPricingData,
                state.color
            );
        }
        catch (error)
        {
            return this.handleUnexpectedError(error);
        }
    }

    private async convertToTechnicalParams(userParams: Partial<UserFriendlyParams>, stateMapCache: Map<string, any>, roofMapCache: Map<string, number>): Promise<IPricingParams | null>
    {
        try
        {
            const { map_id, manufacturer_id } = await this.getStateMapping(userParams.state_name, stateMapCache);

            const roof_id: number = await this.getRoofId(
                userParams.roof_type,
                map_id,
                roofMapCache
            );

            return {
                width: userParams.width!,
                length: userParams.length!,
                height: userParams.height!,
                map_id,
                roof_id,
                manufacturer_id,
                gauge: userParams.gauge ?? Constants.PRICING_CONSTANTS.DEFAULT_GAUGE,
                building_type: userParams.building_type,
                utility_length: userParams.utility_length,
                is_barn: userParams.is_barn,
            };
        }
        catch (error)
        {
            logger.error("[convertToTechnicalParams] Error:", error);
            return null;
        }
    }

    private async getStateMapping(stateName: string | undefined, stateMapCache: Map<string, any>): Promise<StateMapping>
    {
        if (!stateName)
        {
            return {
                map_id: Constants.PRICING_CONSTANTS.DEFAULT_MAP_ID,
                manufacturer_id: Constants.PRICING_CONSTANTS.DEFAULT_MANUFACTURER_ID,
            };
        }

        const mapping: StateMapping = await LeadAgentHelpers.mapStateToDB(stateName, stateMapCache);

        return mapping
            ? { map_id: mapping.map_id, manufacturer_id: mapping.manufacturer_id }
            : {
                map_id: Constants.PRICING_CONSTANTS.DEFAULT_MAP_ID,
                manufacturer_id: Constants.PRICING_CONSTANTS.DEFAULT_MANUFACTURER_ID,
            };
    }

    private async getRoofId(roofType: string | undefined, mapId: number, roofMapCache: Map<string, number>): Promise<number>
    {
        if (!roofType)
        {
            return Constants.PRICING_CONSTANTS.DEFAULT_ROOF_ID;
        }

        return await LeadAgentHelpers.mapRoofTypeToDB(roofType, mapId, roofMapCache);
    }

    private async fetchColorDetails(colorName: string): Promise<ColorDetails | null>
    {
        try
        {
            const allColors: ColorOption[] = await ColorServiceImpl.getInstance().get();

            const selectedColor: ColorOption = allColors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());

            return selectedColor
                ? { name: selectedColor.name, cost: selectedColor.cost }
                : null;
        }
        catch (error)
        {
            logger.error(`[fetchColorDetails] Error:`, error);
            return null;
        }
    }

    private async calculateColorCost(colorName: string | null | undefined): Promise<number>
    {
        if (!colorName)
        {
            return 0;
        }

        logger.info(`[calculateColorCost] Calculating cost for: ${colorName}`);

        const colorDetails: ColorDetails = await this.fetchColorDetails(colorName);

        if (!colorDetails)
        {
            logger.warn(`[calculateColorCost] Color "${colorName}" not found in database`);
            return 0;
        }

        if (colorDetails.cost > 0)
        {
            logger.info(`[calculateColorCost] ✅ Color cost: $${colorDetails.cost.toFixed(2)}`);
            return colorDetails.cost;
        }

        logger.info(`[calculateColorCost] Color "${colorName}" is included (no extra cost)`);
        return 0;
    }

    private async fetchRawPricingData(technicalParams: IPricingParams): Promise<any>
    {
        const { PriceServiceImpl } = await import("@modules/price-service/services/impl/PriceServiceImpl");
        const priceService: PriceService = PriceServiceImpl.getInstance();

        return await priceService.fetchBuildingPricingWithUtility(technicalParams);
    }

    private extractKitPrice(rawPricingData: any, technicalParams: IPricingParams): number
    {
        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const { total: kitPrice } = extractor.calculateTotalPrice(rawPricingData, technicalParams);
        return kitPrice;
    }

    private calculatePriceBreakdown(kitPrice: number, params: Partial<UserFriendlyParams>, colorCost: number): PriceBreakdown
    {
        const sqft: number = (params.width ?? 0) * (params.length ?? 0);
        const laborCost: number = kitPrice * Constants.PRICING_CONSTANTS.LABOR_MULTIPLIER;
        const foundationCost: number = sqft * Constants.PRICING_CONSTANTS.FOUNDATION_COST_PER_SQFT;
        const deliveryCost: number = Constants.PRICING_CONSTANTS.DELIVERY_COST;

        const subtotal: number = kitPrice + laborCost + foundationCost + deliveryCost + colorCost;
        const contingency: number = subtotal * Constants.PRICING_CONSTANTS.CONTINGENCY_RATE;
        const finalTotal: number = subtotal + contingency;

        return {
            kitPrice,
            colorCost,
            laborCost,
            foundationCost,
            deliveryCost,
            contingency,
            finalTotal,
        };
    }

    private formatCompletePrice(breakdown: PriceBreakdown, params: Partial<UserFriendlyParams>, colorName: string | null = null): string
    {
        const currentParams: string = LeadAgentHelpers.formatCurrentParams(params);


        return `
 **TOTAL ESTIMATED PRICE: $${breakdown.finalTotal.toFixed(2)} for ${currentParams}**
`;
    }

    private createErrorResponse(message: string): PriceCalculationResult
    {
        return {
            response: message,
            nextStep: "__end__",
            priceCalculated: false,
        };
    }

    private handleConversionError(): PriceCalculationResult
    {
        logger.error(`[calculatePrice] Failed to convert parameters`);
        return this.createErrorResponse(Constants.ERROR_MESSAGES.CONVERSION_FAILED);
    }

    private handleInvalidPricingData(rawPricingData: any): PriceCalculationResult
    {
        logger.warn(`[calculatePrice] Invalid pricing data:`, rawPricingData);
        const message = rawPricingData?.message || Constants.ERROR_MESSAGES.PRICE_CALCULATION_FAILED;
        return this.createErrorResponse(message);
    }

    private handleUnexpectedError(error: unknown): PriceCalculationResult
    {
        logger.error(`[calculatePrice] Error:`, error);
        const message: string = error instanceof Error ? Constants.ERROR_MESSAGES.UNKNOWN_ERROR(error.message) : Constants.ERROR_MESSAGES.UNKNOWN_ERROR("Unknown error");
        return this.createErrorResponse(message);
    }

    private createSuccessResponse(
        breakdown: PriceBreakdown,
        params: Partial<UserFriendlyParams>,
        rawPricingData: any,
        colorName: string | null | undefined
    ): PriceCalculationResult {
        const formattedPrice: string = this.formatCompletePrice(breakdown, params, colorName ?? null);

        logger.info(`[createSuccessResponse] ✅ Creating success response`, {
            priceCalculated: true,
            basePrice: breakdown.kitPrice,
            finalPrice: breakdown.finalTotal,
            colorCost: breakdown.colorCost,
        });

        const result: PriceCalculationResult = {
            response: formattedPrice,
            userFriendlyParams: params,
            pricingData: rawPricingData,
            basePrice: breakdown.kitPrice,
            priceCalculated: true,
            currentField: null,
            nextStep: "show_addons",
            selectedAddons: [],
            finalPrice: breakdown.finalTotal,
            color: colorName ?? null,
            colorCost: breakdown.colorCost,
        };

        logger.info(`[createSuccessResponse] Response structure:`, {
            hasResponse: !!result.response,
            priceCalculated: result.priceCalculated,
            nextStep: result.nextStep,
            basePrice: result.basePrice,
            finalPrice: result.finalPrice,
        });

        return result;
    }
}

function Enforce(): void {}

/**
 * Legacy node handler for backward compatibility
 */
/**
 * Legacy node handler for backward compatibility
 * ✅ CRITICAL: This must set nextStep to transition to show_addons
 */
export const calculatePriceNode = async (state: LeadAgentStateType): Promise<PriceCalculationResult> => {
    logger.info(`[calculatePriceNode] Session ${state.sessionId} - Starting price calculation`);

    try {
        const result = await PriceCalculatorService.getInstance().calculatePrice(state);

        if (result.priceCalculated && result.response) {
            logger.info(`[calculatePriceNode] ✅ Price calculated successfully, transitioning to show_addons`);

            return {
                ...result,
                nextStep: "show_addons",
            };
        }

        logger.warn(`[calculatePriceNode] Price calculation failed`);
        return {
            ...result,
            nextStep: "__end__",
        };
    } catch (error) {
        logger.error(`[calculatePriceNode] Unexpected error:`, error);
        return {
            response: "❌ Error calculating price. Please try again.",
            nextStep: "__end__",
            priceCalculated: false,
        };
    }
};
