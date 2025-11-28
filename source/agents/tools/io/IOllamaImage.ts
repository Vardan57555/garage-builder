/**
 * Building specification
 */
export interface BuildingSpec {
    width: number;
    length: number;
    height: number;
    roofType: string;
}

/**
 * Price breakdown components
 */
export interface PriceBreakdown {
    basePrice: number;
    laborCost: number;
    foundationCost: number;
    deliveryCost: number;
    addonTotal: number;
    contingency: number;
    finalTotal: number;
    sqft: number;
}
