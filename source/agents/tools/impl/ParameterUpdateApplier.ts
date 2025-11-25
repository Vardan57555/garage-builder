import pino from "pino";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {UpdateResult} from "@agents/tools/impl/io/IParameterUpdate";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {DimensionHandler} from "@agents/tools/impl/DimensionHandler";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class ParameterUpdateApplier
{
    private dimensionHandler: DimensionHandler;

    constructor() {
        this.dimensionHandler = new DimensionHandler();
    }

    public apply(currentParams: Partial<UserFriendlyParams>, field: keyof UserFriendlyParams, value: any): UpdateResult
    {
        logger.info(`[ParameterUpdateApplier] Updating ${field} = ${value}`);

        if (field === "garage_type")
        {
            return this.dimensionHandler.handleGarageTypeUpdate(value, currentParams);
        }

        if (this.isNumericField(field))
        {
            return this.applyNumericFieldUpdate(field, value, currentParams);
        }

        return this.applyTextFieldUpdate(field, value, currentParams);
    }

    private applyNumericFieldUpdate(field: keyof UserFriendlyParams, value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult
    {
        const numValue: number = InputValidator.parseNumericValue(value);

        if (!InputValidator.isValidNumericField(numValue))
        {
            return {
                success: false,
                message: `❌ Invalid ${field}`,
            };
        }

        const updatedParams = { ...currentParams, [field]: numValue };
        logger.info(`[ParameterUpdateApplier] Set ${field} = ${numValue}`);

        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)} to ${numValue}`,
            updatedParams,
        };
    }

    private applyTextFieldUpdate(field: keyof UserFriendlyParams, value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult
    {
        const updatedParams = {
            ...currentParams,
            [field]: String(value).trim(),
        };
        logger.info(`[ParameterUpdateApplier] Set ${field} = ${String(value).trim()}`);

        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)}`,
            updatedParams,
        };
    }

    private isNumericField(field: keyof UserFriendlyParams): boolean
    {
        return ["width", "length", "height", "gauge", "utility_length"].includes(field);
    }
}
