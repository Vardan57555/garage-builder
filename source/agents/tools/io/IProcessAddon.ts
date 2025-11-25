export interface Addon {
    id: string;
    label: string;
    name?: string;
    type?: string;
    cost: number;
}

export interface SelectedAddon extends Addon {
    id: string;
}

export interface ProcessingResult {
    selectedAddons: SelectedAddon[];
    finalPrice: number;
    priceCalculated: boolean;
    nextStep: string;
    response?: string;
}
