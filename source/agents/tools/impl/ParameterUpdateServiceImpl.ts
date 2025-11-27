import pino from "pino";
import {ParameterValidator} from "@agents/tools/validators/ParameterValidator";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {FieldValueExtractor} from "@agents/tools/FieldValueExtractor";
import {IChoiceService} from "@agents/tools/impl/io/IChoiceHandler";
import {ChoiceServiceImpl} from "@agents/tools/impl/ChoiceServiceImpl";
import {FieldUpdate, ProcessUpdateResult, UpdateResult} from "@agents/tools/io/IParameterUpdate";
import {createLogger} from "@utils/logger/Log";
import {ParameterUpdateService} from "@agents/tools/impl/io/ParameterUpdateService";
import {IDimensionManager} from "@agents/tools/impl/io/IParameterExtractionNode";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {InstantiationError} from "@errors/InstantiationError";
const logger: pino.Logger = createLogger(module);

export class ParameterUpdateServiceImpl implements ParameterUpdateService
{
    private static instance: ParameterUpdateService;
    private fieldExtractor: FieldValueExtractor;
    private parameterValidator: ParameterValidator;
    private choiceService: IChoiceService;
    private dimensionManager: IDimensionManager = DimensionManager.getInstance();

    constructor(enforce: () => void)
    {

        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonServiceImpl.getInstance() instead of new.");
        }

        this.fieldExtractor = new FieldValueExtractor();
        this.parameterValidator = new ParameterValidator();
        this.choiceService = ChoiceServiceImpl.getInstance();
    }

    /**
     * Gets the singleton instance of AddonService.
     *
     * @returns The singleton instance of AddonService.
     */

    public static getInstance(): ParameterUpdateService
    {
        if(!ParameterUpdateServiceImpl.instance)
        {
            ParameterUpdateServiceImpl.instance = new ParameterUpdateServiceImpl(Enforce);
        }

        return ParameterUpdateServiceImpl.instance;
    }

    public async process(update: FieldUpdate, userInput: string, currentParams: Partial<UserFriendlyParams>, stateMapCache: Map<string, any>): Promise<| { result: UpdateResult; resolvedValue: any } | { error: ProcessUpdateResult }>
    {
        const extractedValue = await this.fieldExtractor.extractWithLLM(
            userInput,
            update.field,
            currentParams
        );

        if (extractedValue === null)
        {
            logger.warn(`[UpdateProcessor] Could not extract ${update.field}`);
            return {
                result: { success: false, message: "" },
                resolvedValue: null,
            };
        }

        const validationError = await this.parameterValidator.validate(
            update.field,
            extractedValue,
            stateMapCache
        );

        if (validationError)
        {
            logger.warn(`[UpdateProcessor] Validation failed: ${validationError}`);
            return {
                error: {
                    response: validationError,
                    userFriendlyParams: currentParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                },
            };
        }

        const resolvedValue = await this.choiceService.resolve(
            update.field,
            extractedValue
        );
        const result: UpdateResult = this.apply(
            currentParams,
            update.field,
            resolvedValue
        );

        if (!result.success)
        {
            logger.warn(`[UpdateProcessor] Update failed: ${result.message}`);
            return {
                error: {
                    response: result.message,
                    userFriendlyParams: currentParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                },
            };
        }

        return { result, resolvedValue };
    }

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
        const updatedParams = {...currentParams, [field]: String(value).trim()};
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


/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
