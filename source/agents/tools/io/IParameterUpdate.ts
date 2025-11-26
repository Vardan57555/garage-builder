import {UserFriendlyParams} from "@agents/tools/io/IChat";

export interface UpdateResult {
    success: boolean;
    message: string;
    updatedParams?: Partial<UserFriendlyParams>;
}

export interface FieldExtractionConfig {
    instructions: string;
    examples: string;
    defaultValue?: any;
}

export interface ProcessUpdateResult {
    response: string;
    userFriendlyParams: Partial<UserFriendlyParams>;
    currentField: keyof UserFriendlyParams | null;
    nextStep: string;
    pendingUpdates: any[];
    priceCalculated?: boolean;
}

export interface FieldUpdate {
    field: keyof UserFriendlyParams;
    value: any;
}
