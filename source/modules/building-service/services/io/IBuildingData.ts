export interface BuildingData {
    building: BuildingDetail[];
    color: any[];
    color_object: Record<string, any>;
    default_building: any[];
    manufacture_data: any[];
    popular_colors: any[],
    garageDoorColor: any[];
}

export interface BuildingDetail {
    building_type: any;
    roof_style: any[];
    truss_name: any[];
    garage_door: any[];
    garage_door_v3: any[]
    garage_door_frameout: any[];
    walkin_door_frameout: any[];
    walkin_door_frameout_v3: any;
    window_frameout: any[];
    window_frameout_v3: any[];
    fixed_new_leg_width: any;
    drawings: any;
    gable_mapping: any;
    side_end_details: any;
    wainscot_details: any;
    lean_to_roof_pitch: any;
    custom_size_status: any;
}

export interface IGetBuildingData
{
    state_id: string;
    manufacturer_id: string;
    state_check: boolean;
}


export interface IBuildingMappingItem {
    map_id: number | string;
    building_id: number | string;
    type_of_building?: number;
}


export const ManufacturerIds = {
    M162: "162",
    M174: "174",
} as const;

export const StateIds = {
    OPEN_STATES: ["3","12","14","15","17","22","26","31","32","34","37","40","41"],
    SPECIAL_STATES: ["6","28"],
};

export const BuildingIdsToRemove = {
    DEFAULT: ["1", "3", "4", "27"],
    M174: ["4", "37", "38", "39", "40"],
    M162_SPECIAL: ["1", "3", "4", "27", "7", "11", "19", "33", "34", "71", "74", "77"],
};

export const BuildingIdSelection = {
    M162: {
        "12": ["7", "19", "32", "33", "34"],
        "17": ["7", "19", "32", "33", "34"],
        "31": ["7", "19", "32", "33", "34"],
        "34": ["7", "19", "32", "33", "34"],
        "6": ["72", "76", "97", "100"],
        "28": ["72", "76", "97", "100"],
    },
    M174: {
        "12": ["7", "19", "33", "34"],
        "17": ["7", "19", "33", "34"],
        "31": ["7", "19", "33", "34"],
        "34": ["7", "19", "33", "34"],
    },
};


export interface HeightData
{
    min_height: number;
    max_height: number;
    min_smaller_height: number;
    max_smaller_height: number;
}

export interface OutputEntry
{
    map_id: string;
    height_data: Record<number, HeightData>; // keyed by width
}
