/**
 * Detected building type with confidence metadata
 */
export interface BuildingTypeMatch {
    type: string;
    confidence: "high" | "medium";
    matchedPattern: string;
}

/**
 * Node response structure
 */
export interface BuildingTypeNodeResponse {
    userFriendlyParams?: Record<string, any>;
    response?: string;
    nextStep: string;
}

/**
 * Pattern configuration with type mapping
 */
export interface DetectionPattern {
    pattern: RegExp;
    type: string;
    confidence: "high" | "medium";
}
