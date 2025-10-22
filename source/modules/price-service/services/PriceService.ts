import { Service } from "@common/service/Service";
import {IFetchPricesParams, IPrice, IPricingParams} from "@modules/price-service/services/io/IPrice";

export interface PriceService extends Service
{
    fetchBuildingPricingWithUtility(body: IPricingParams)

    fetchAllPrices({map_id, height, building_type, gauge}: IFetchPricesParams): Promise<IPrice | IPrice[]>
}
