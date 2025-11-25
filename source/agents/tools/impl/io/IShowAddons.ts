/**
 * Domain types
 */
export interface AddonMenuItem {
    id: string;
    label: string;
    type?: string;
    cost: number;
    description: string;
}

export interface ShowAddonsResponse {
    response: string;
    addonsMenu?: AddonMenuItem[];
    pricingData?: any;
    basePrice?: number;
    finalPrice?: number;
    nextStep: string;
}
