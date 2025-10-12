export interface IGetBuildingData {
    state_id: string;
    manufacturer_id: string;
    state_check: boolean;
}

export interface IBuildingMappingItem {
    map_id: number | string;
    building_id: number | string;
    type_of_building?: number;
}
