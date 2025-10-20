export interface UserFriendlyParams {
    garage_type?: string;
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
}

export interface PricingComponent {
    name: string;
    key: keyof any;
    extractor: (pricing: any) => number;
}


export type RoofMappingResult = {
    roof_id: number;
};

export interface ConversationState {
    userFriendlyParams: Partial<UserFriendlyParams>;
    hasGarageIntent: boolean;
    currentField?: keyof UserFriendlyParams;
}

export interface StateMapping {
    map_id: number;
    manufacturer_id: number;
}

export interface UserFriendlyParams {
    garage_type?: string;
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
}
