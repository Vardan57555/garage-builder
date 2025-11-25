
/**
 * Domain types
 */
export interface ValidationResult {
    userFriendlyParams: Record<string, any>;
    currentField: string | null;
    nextStep: string;
}

/**
 * Types of validation states
 */
export enum ValidationState {
    PENDING_UPDATES = "handle_update",
    ALL_COMPLETE = "calculate_price",
    MISSING_FIELDS = "ask_for_field",
}
