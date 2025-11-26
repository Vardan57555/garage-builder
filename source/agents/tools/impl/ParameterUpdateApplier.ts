import pino from "pino";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {createLogger} from "@utils/logger/Log";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";
import {UpdateResult} from "@agents/tools/io/IParameterUpdate";
import {IDimensionManager} from "@agents/tools/impl/io/IParameterExtractionNode";
const logger: pino.Logger = createLogger(module);

export class ParameterUpdateApplier
{
    private dimensionManager: IDimensionManager = DimensionManager.getInstance();

    public apply(currentParams: Partial<UserFriendlyParams>, field: keyof UserFriendlyParams, value: any): UpdateResult
    {
        logger.info(`[ParameterUpdateApplier] Updating ${field} = ${value}`);

        if (field === "garage_type")
        {
            return this.dimensionManager.handleGarageTypeUpdate(value, currentParams);
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
