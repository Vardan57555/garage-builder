import {UserFriendlyParams} from "@agents/tools/io/IChat";

export interface PriceCalculationResult {
    response: string;
    userFriendlyParams?: Partial<UserFriendlyParams>;
    pricingData?: any;
    basePrice?: number;
    priceCalculated: boolean;
    currentField?: null;
    nextStep: string;
    selectedAddons?: any[];
    finalPrice?: number;
    color?: string | null;
    colorCost?: number;
}

export interface PriceBreakdown {
    kitPrice: number;
    colorCost: number;
    laborCost: number;
    foundationCost: number;
    deliveryCost: number;
    contingency: number;
    finalTotal: number;
}

export interface ColorDetails {
    name: string;
    cost: number;
}

export interface StateMapping {
    map_id: number;
    manufacturer_id: number;
}
