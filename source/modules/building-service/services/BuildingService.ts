import { Service } from "@common/service/Service";
import {IGetBuildingData} from "@modules/building-service/services/io/IBuildingMapping";

export interface BuildingService extends Service
{
    fetchBuildingData(params: Partial<IGetBuildingData>): Promise<{}>;
}

