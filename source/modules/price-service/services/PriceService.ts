import { Service } from "@common/service/Service";
import {IFetchPricesParams, IPrice, IPricingParams} from "@modules/price-service/services/io/IPrice";
import {IAiAnswer} from "@common/io/IAiAgent";

export interface PriceService extends Service
{
    fetchBuildingPricingWithUtility(body: IPricingParams)

    fetchAllPrices({map_id, height, building_type, gauge}: IFetchPricesParams): Promise<IPrice | IPrice[]>

    predict(body: IPricingParams);

    generateAssistantResponse(body: Record<string, string>): Promise<IAiAnswer>

    convertUserParamsToTechnical(userParams: {
        width?: number;
        length?: number;
        height?: number;
        state_name?: string;
        roof_type?: string;
        manufacturer_name?: string;
        utility_length?: number;
        building_type?: string;
        gauge?: number;
        is_barn?: boolean;
        single_slope_height?: number;
        central_map_id?: number;
        central_height?: number;
        central_utility_length?: number;
        central_length?: number;
        central_width?: number;
    }): Promise<IPricingParams>
}
