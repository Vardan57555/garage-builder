import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ ENHANCED: Better parameter update detection with choice field validation
 */
export class ParameterUpdateDetector {
    private static instance: ParameterUpdateDetector;

    // Valid choices for each field
    private readonly VALID_CHOICES = {
        roof_type: ["box", "vertical", "regular", "horizontal"],
        gauge: ["12", "14", "16", "29"],
        building_type: ["garage", "carport", "barn", "commercial", "residential"],
        state_name: [] // Will be validated separately
    };

    private constructor() {}

    public static getInstance(): ParameterUpdateDetector {
        if (!ParameterUpdateDetector.instance) {
            ParameterUpdateDetector.instance = new ParameterUpdateDetector();
        }
        return ParameterUpdateDetector.instance;
    }

    /**
     * ✅ MAIN: Detect parameter updates with proper validation
     */
    public async detectParameterUpdate(userInput: string): Promise<{
        isUpdate: boolean;
        field: string | null;
        value: any;
        confidence: "high" | "medium" | "low";
        validationError?: string;
    }> {
        try {
            logger.info(`[ParameterUpdateDetector] Analyzing: "${userInput}"`);

            const prompt = `Analyze if the user wants to UPDATE a building parameter.

User input: "${userInput}"

Updatable parameters:
- width: Building width (1-500 feet) - e.g., "make width 10", "change width to 20"
- length: Building length (1-500 feet) - e.g., "make length 30"
- height: Building height (1-50 feet) - e.g., "update height to 12"
- utility_length: Utility room length (feet) - e.g., "utility length 8"
- roof_type: Roof style - MUST be one of: "box", "vertical", "regular", "horizontal"
- gauge: Metal thickness - MUST be one of: "12", "14", "16", "29"
- building_type: Type - MUST be one of: "garage", "carport", "barn", "commercial", "residential"
- state_name: US state abbreviation (e.g., "CA", "TX", "NY")

IMPORTANT RULES:
1. For roof_type: User might say "box eave", "vertical roof", "regular style" → extract just "box", "vertical", "regular"
2. For gauge: User might say "14 gauge", "gauge 14", "14ga" → extract just "14"
3. For building_type: User might say "I want a garage", "make it a barn" → extract just "garage", "barn"
4. Ignore color changes (return null)
5. Ignore addon requests (return null)
6. For dimensions, extract the numeric value

Return ONLY JSON (no markdown):
{
  "isParameterUpdate": <true/false>,
  "field": <parameter name or null>,
  "value": <extracted value or null>,
  "confidence": <"high"/"medium"/"low">,
  "reasoning": <brief explanation>
}

Examples:
- "make width 10" → {"isParameterUpdate": true, "field": "width", "value": "10", "confidence": "high", "reasoning": "Clear width update"}
- "change roof to box eave" → {"isParameterUpdate": true, "field": "roof_type", "value": "box", "confidence": "high", "reasoning": "Box eave roof type"}
- "14 gauge please" → {"isParameterUpdate": true, "field": "gauge", "value": "14", "confidence": "high", "reasoning": "Gauge specification"}
- "vertical roof style" → {"isParameterUpdate": true, "field": "roof_type", "value": "vertical", "confidence": "high", "reasoning": "Vertical roof"}
- "make it blue" → {"isParameterUpdate": false, "field": null, "value": null, "confidence": "high", "reasoning": "Color, not parameter"}
- "add 2 windows" → {"isParameterUpdate": false, "field": null, "value": null, "confidence": "high", "reasoning": "Addon request"}
- "update height to 12 feet" → {"isParameterUpdate": true, "field": "height", "value": "12", "confidence": "high", "reasoning": "Height update"}
- "change to carport" → {"isParameterUpdate": true, "field": "building_type", "value": "carport", "confidence": "high", "reasoning": "Building type change"}

ONLY valid JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const parsed = this.parseAIResponse(response);

            if (!parsed || !parsed.isParameterUpdate) {
                return {
                    isUpdate: false,
                    field: null,
                    value: null,
                    confidence: "low",
                };
            }

            // ✅ VALIDATE the detected parameter
            const validation = this.validateParameter(parsed.field, parsed.value);

            if (!validation.isValid) {
                logger.warn(`[ParameterUpdateDetector] Validation failed: ${validation.error}`);
                return {
                    isUpdate: true,
                    field: parsed.field,
                    value: parsed.value,
                    confidence: parsed.confidence || "low",
                    validationError: validation.error,
                };
            }

            logger.info(
                `[ParameterUpdateDetector] ✅ Valid update: ${parsed.field} = ${validation.normalizedValue}`
            );

            return {
                isUpdate: true,
                field: parsed.field,
                value: validation.normalizedValue,
                confidence: parsed.confidence || "medium",
            };
        } catch (error) {
            logger.error(`[ParameterUpdateDetector] Error:`, error);
            return {
                isUpdate: false,
                field: null,
                value: null,
                confidence: "low",
            };
        }
    }

    /**
     * ✅ VALIDATE: Check if the parameter value is valid
     */
    private validateParameter(
        field: string,
        value: any
    ): { isValid: boolean; normalizedValue?: any; error?: string } {
        if (!field || value === null || value === undefined) {
            return { isValid: false, error: "Missing field or value" };
        }

        const stringValue = String(value).toLowerCase().trim();

        // Dimension fields
        if (["width", "length", "height", "utility_length"].includes(field)) {
            const num = parseInt(stringValue, 10);

            if (isNaN(num) || num <= 0) {
                return { isValid: false, error: `${field} must be a positive number` };
            }

            if (field === "height" && num > 50) {
                return { isValid: false, error: "Height must be between 1 and 50 feet" };
            }

            if (["width", "length", "utility_length"].includes(field) && num > 500) {
                return { isValid: false, error: `${field} must be between 1 and 500 feet` };
            }

            return { isValid: true, normalizedValue: num };
        }

        // Choice fields - validate against allowed values
        if (field === "roof_type") {
            const normalized = this.normalizeRoofType(stringValue);
            if (!normalized) {
                return {
                    isValid: false,
                    error: `Invalid roof type. Choose: ${this.VALID_CHOICES.roof_type.join(", ")}`,
                };
            }
            return { isValid: true, normalizedValue: normalized };
        }

        if (field === "gauge") {
            const normalized = this.normalizeGauge(stringValue);
            if (!normalized) {
                return {
                    isValid: false,
                    error: `Invalid gauge. Choose: ${this.VALID_CHOICES.gauge.join(", ")}`,
                };
            }
            return { isValid: true, normalizedValue: normalized };
        }

        if (field === "building_type") {
            const normalized = this.normalizeBuildingType(stringValue);
            if (!normalized) {
                return {
                    isValid: false,
                    error: `Invalid building type. Choose: ${this.VALID_CHOICES.building_type.join(", ")}`,
                };
            }
            return { isValid: true, normalizedValue: normalized };
        }

        if (field === "state_name") {
            const normalized = this.normalizeState(stringValue);
            if (!normalized) {
                return {
                    isValid: false,
                    error: "Invalid state. Please use 2-letter state code (e.g., CA, TX, NY)",
                };
            }
            return { isValid: true, normalizedValue: normalized };
        }

        // Unknown field
        return { isValid: false, error: `Unknown parameter: ${field}` };
    }

    /**
     * ✅ Normalize roof type variations
     */
    private normalizeRoofType(input: string): string | null {
        const mapping: { [key: string]: string } = {
            box: "box",
            "box eave": "box",
            boxed: "box",
            vertical: "vertical",
            vert: "vertical",
            "vertical roof": "vertical",
            regular: "regular",
            standard: "regular",
            horizontal: "horizontal",
            horiz: "horizontal",
            "a-frame": "regular",
        };

        for (const [key, value] of Object.entries(mapping)) {
            if (input.includes(key)) {
                return value;
            }
        }

        return null;
    }

    /**
     * ✅ Normalize gauge variations
     */
    private normalizeGauge(input: string): string | null {
        const gaugeMatch = input.match(/(\d+)/);
        if (!gaugeMatch) return null;

        const gauge = gaugeMatch[1];
        if (this.VALID_CHOICES.gauge.includes(gauge)) {
            return gauge;
        }

        return null;
    }

    /**
     * ✅ Normalize building type variations
     */
    private normalizeBuildingType(input: string): string | null {
        const mapping: { [key: string]: string } = {
            garage: "garage",
            carport: "carport",
            "car port": "carport",
            barn: "barn",
            commercial: "commercial",
            "commercial building": "commercial",
            residential: "residential",
            "residential building": "residential",
        };

        for (const [key, value] of Object.entries(mapping)) {
            if (input.includes(key)) {
                return value;
            }
        }

        return null;
    }

    /**
     * ✅ Normalize state variations
     */
    private normalizeState(input: string): string | null {
        // If already 2-letter code, return uppercase
        if (input.length === 2 && /^[a-z]{2}$/i.test(input)) {
            return input.toUpperCase();
        }

        // Map common state names to codes
        const stateMap: { [key: string]: string } = {
            california: "CA",
            texas: "TX",
            florida: "FL",
            "new york": "NY",
            pennsylvania: "PA",
            // Add more as needed
        };

        const stateName = input.toLowerCase();
        return stateMap[stateName] || null;
    }

    private parseAIResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error(`[parseAIResponse] Failed to parse:`, error);
            return null;
        }
    }
}
