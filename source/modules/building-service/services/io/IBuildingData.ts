import {IBuildingDetail} from "@modules/building-service/services/io/IBuildingDetail";

export interface IBuildingData
{
    building: IBuildingDetail[];
    color: any[];
    color_object: Record<string, any>;
    default_building: any[];
    manufacture_data: any[];
    popular_colors: any[],
    garageDoorColor: any[];
}
