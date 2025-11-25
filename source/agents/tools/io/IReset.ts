/**
 * Domain types for reset operation
 */
export interface ResetState {
    userFriendlyParams: Record<string, any>;
    hasGarageIntent: boolean;
    priceCalculated: boolean;
    currentField: string | null;
    response: string;
    nextStep: string;
}

/**
 * Configuration for reset messages
 */
export interface ResetMessageConfig {
    greeting: string;
    prompt: string;
}
