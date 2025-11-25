import {Constants} from "@common/io/Constants";

export class InputValidator {
    static isIndecisive(input: string): boolean {
        return Constants.INDECISION_PATTERNS.some((pattern) =>
            pattern.test(input)
        );
    }

    static containsCodeArtifacts(value: string): boolean {
        return (
            Constants.CODE_INDICATORS.some((indicator) =>
                value.includes(indicator)
            ) || value.length > 100
        );
    }

    static isNullValue(value: string): boolean {
        return Constants.NULL_VALUES.includes(value as any);
    }

    static parseNumericValue(value: string | number): number {
        if (typeof value === "number") return value;
        return parseFloat(value.replace(/[^\d.]/g, ""));
    }

    static isValidNumericField(value: number): boolean {
        return !isNaN(value) && value > 0;
    }

    static isValidGauge(value: number): boolean {
        return Constants.VALID_GAUGES.includes(value as any);
    }
}
