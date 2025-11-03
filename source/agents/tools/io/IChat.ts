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

// ✅ This is what your graph RETURNS
export interface GraphAddon {
    id: string;
    label: string;
    cost: number;
    description: string;
}

// ✅ This is what you use AFTER processing in the UI/session
export interface AddonSelection {
    id: string;
    name: string;              // internal name (matches catalog `name`)
    label: string;             // display name for UI
    description: string;
    quantity: number;          // how many units selected
    cost: number;              // cost per unit
    totalCost: number;         // quantity × cost
    type: 'window' | 'door' | 'brace' | 'other'; // addon type category
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

// ✅ FIX: Define SessionState interface with correct addon shape
export interface SessionState {
    userFriendlyParams: Partial<UserFriendlyParams>;
    hasGarageIntent: boolean;
    priceCalculated?: boolean;
    currentField?: keyof UserFriendlyParams;
    pricingData?: any;
    basePrice?: number;
    // ✅ USES GraphAddon - what the graph returns
    selectedAddons: GraphAddon[];
    finalPrice?: number;
}

// ✅ FIXED: Update LeadAgentSessionMetadata to use SessionState
export interface LeadAgentSessionMetadata extends SessionMetadata {
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    expiresAt: number;
    memory: BufferMemory;
    state: SessionState;  // ← Now uses the proper SessionState interface
    stateMapCache: Map<string, any>;
    roofMapCache: Map<string, any>;
}
