import {BufferMemory} from "langchain/memory";
import {SessionMetadata} from "@utils/session/io/ISession";

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

export interface LeadAgentSessionMetadata extends SessionMetadata {
    memory: BufferMemory;
    state: {
        userFriendlyParams: Partial<UserFriendlyParams>;
        hasGarageIntent: boolean;
        currentField?: keyof UserFriendlyParams;
        priceCalculated?: boolean;
    };
    stateMapCache: Map<string, StateMapping | null>;
    roofMapCache: Map<string, number>;
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
