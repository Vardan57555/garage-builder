export interface ExtractionContext {
    userInput: string;
    currentField?: string;
    currentParams: Record<string, any>;
}

export interface DimensionResult {
    numCars?: number;
    width?: number;
    length?: number;
    height?: number;
}

export interface ValidationResult {
    isValid: boolean;
    normalizedValue?: string;
    error?: string;
}

export interface ExtractionResult {
    userFriendlyParams: Record<string, any>;
    nextStep?: string;
    validationError?: string;
    response?: string;
    currentField?: string;
    pendingUpdates?: any;
}
