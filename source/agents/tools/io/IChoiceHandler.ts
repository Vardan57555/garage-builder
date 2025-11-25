/**
 * Represents a selectable option with metadata
 */
export interface ChoiceOption {
    value: string;
    label: string;
    description?: string;
}

/**
 * Result of choice parsing with confidence and reasoning
 */
export interface ChoiceResult {
    selected: string;
    confidence: "high" | "medium" | "low";
    reasoning: string;
}

/**
 * Field configuration with associated options
 */
export interface FieldConfig {
    name: string;
    options: ChoiceOption[];
}
