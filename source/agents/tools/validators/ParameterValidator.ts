import {StateDataValidator} from "@agents/validators/StateValidator";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {RoofDataValidator} from "@agents/validators/RoofValidator";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {ValidationResult} from "@agents/tools/io/IParameterExtraction";

export class ParameterValidator
{
    async validate(field: keyof UserFriendlyParams, value: any, stateMapCache: Map<string, any>): Promise<string | null> {
        if (field === "roof_type")
        {
            return this.validateRoofType(value);
        }

        if (field === "state_name")
        {
            return this.validateStateName(value, stateMapCache);
        }

        if (this.isNumericField(field))
        {
            return this.validateNumericField(field, value);
        }

        return null;
    }

    private async validateRoofType(value: any): Promise<string | null> {
        const validationResult = await RoofDataValidator.validateRoofType(value);
        if (!validationResult.isValid) {
            return `"${value}" is not a valid roof type (vertical, regular, box, a-frame)`;
        }
        return null;
    }

    private async validateStateName(value: any, stateMapCache: Map<string, any>): Promise<string | null>
    {
        const validationResult = await StateDataValidator.validateState(
            value,
            async (name: string) =>
                await LeadAgentHelpers.mapStateToDB(name, stateMapCache)
        );
        if (!validationResult.isValid)
        {
            return `"${value}" is not a valid state`;
        }
        return null;
    }

    private validateNumericField(field: keyof UserFriendlyParams, value: any): string | null
    {
        const numValue: number = InputValidator.parseNumericValue(value);

        if (!InputValidator.isValidNumericField(numValue))
        {
            return `Invalid ${field}: must be a positive number`;
        }

        if (field === "gauge" && !InputValidator.isValidGauge(numValue))
        {
            return `Invalid gauge. Must be 14, 16, 18, or 20`;
        }

        return null;
    }

    private isNumericField(field: keyof UserFriendlyParams): boolean
    {
        return ["width", "length", "height", "gauge", "utility_length"].includes(field);
    }

    static async validateState(stateName: string, cache: any): Promise<ValidationResult>
    {
        const result = await StateDataValidator.validateState(
            stateName,
            async (name: string) => await LeadAgentHelpers.mapStateToDB(name, cache)
        );

        return {
            isValid: result.isValid,
            normalizedValue: result.normalizedName,
            error: result.isValid ? undefined : `"${stateName}" is not valid`,
        };
    }

    static async validateRoofType(roofType: string): Promise<ValidationResult>
    {
        const result = await RoofDataValidator.validateRoofType(roofType);

        return {
            isValid: result.isValid,
            normalizedValue: result.normalizedType,
            error: result.isValid ? undefined : `"${roofType}" is not valid`,
        };
    }
}
