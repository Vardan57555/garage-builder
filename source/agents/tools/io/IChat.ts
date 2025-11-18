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
    color?: string;
    color_hex?: string;
}

export interface StateMapping {
    map_id: number;
    manufacturer_id: number;
}

export interface Dimensions {
    width: number;
    length: number;
    height: number;
}

export interface PricingBreakdown {
    total: number;
    roofPrice: number;
}

export interface ServiceCostsResult {
    total: number;
    breakdown: string[];
}
