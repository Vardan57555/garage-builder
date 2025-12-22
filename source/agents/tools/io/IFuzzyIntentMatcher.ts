export interface FuzzyMatchResult {
    intent: 'width' | 'length' | 'height' | 'skip' | 'state' | 'roof_type' | 'gauge' | 'building_type' | 'color' | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    extractedValue?: string | number;
}
