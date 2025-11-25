import pino from "pino";
import {ParameterValidator} from "@agents/tools/validators/ParameterValidator";
import {FieldUpdate, ProcessUpdateResult, UpdateResult} from "@agents/tools/impl/io/IParameterUpdate";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {FieldValueExtractor} from "@agents/tools/FieldValueExtractor";
import {ChoiceResolver} from "@agents/tools/impl/ChoiceResolver";
import {ParameterUpdateApplier} from "@agents/tools/impl/ParameterUpdateApplier";

export class UpdateProcessor
{
    private logger: pino.Logger;
    private fieldExtractor: FieldValueExtractor;
    private parameterValidator: ParameterValidator;
    private updateApplier: ParameterUpdateApplier;
    private choiceResolver: ChoiceResolver;

    constructor(logger: pino.Logger) {
        this.logger = logger;
        this.fieldExtractor = new FieldValueExtractor(logger);
        this.parameterValidator = new ParameterValidator();
        this.updateApplier = new ParameterUpdateApplier();
        this.choiceResolver = new ChoiceResolver();
    }

    async process(update: FieldUpdate, userInput: string, currentParams: Partial<UserFriendlyParams>, stateMapCache: Map<string, any>): Promise<
        | { result: UpdateResult; resolvedValue: any }
        | { error: ProcessUpdateResult }
    > {
        const extractedValue = await this.fieldExtractor.extractWithLLM(
            userInput,
            update.field,
            currentParams
        );

        if (extractedValue === null) {
            this.logger.warn(
                `[UpdateProcessor] Could not extract ${update.field}`
            );
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

        if (validationError) {
            this.logger.warn(`[UpdateProcessor] Validation failed: ${validationError}`);
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

        const resolvedValue = await this.choiceResolver.resolve(
            update.field,
            extractedValue
        );
        const result = this.updateApplier.apply(
            currentParams,
            update.field,
            resolvedValue
        );

        if (!result.success) {
            this.logger.warn(`[UpdateProcessor] Update failed: ${result.message}`);
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
}
