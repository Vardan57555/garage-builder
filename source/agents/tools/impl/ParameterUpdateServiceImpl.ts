import pino from "pino";
import { ParameterValidator } from "@agents/tools/validators/ParameterValidator";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { FieldValueExtractor } from "@agents/tools/FieldValueExtractor";
import { IChoiceService } from "@agents/tools/impl/io/IChoiceHandler";
import { ChoiceServiceImpl } from "@agents/tools/impl/ChoiceServiceImpl";
import { FieldUpdate, ProcessUpdateResult, UpdateResult } from "@agents/tools/io/IParameterUpdate";
import { createLogger } from "@utils/logger/Log";
import { ParameterUpdateService } from "@agents/tools/impl/io/ParameterUpdateService";
import { IDimensionManager } from "@agents/tools/impl/io/IParameterExtractionNode";
import { DimensionManager } from "@agents/tools/impl/DimensionManager";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { InstantiationError } from "@errors/InstantiationError";

const logger: pino.Logger = createLogger(module);

export class ParameterUpdateServiceImpl implements ParameterUpdateService {
    private static instance: ParameterUpdateService;
    private fieldExtractor: FieldValueExtractor;
    private parameterValidator: ParameterValidator;
    private choiceService: IChoiceService;
    private dimensionManager: IDimensionManager = DimensionManager.getInstance();

    constructor(enforce: () => void) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Error: Instantiation failed: Use ParameterUpdateServiceImpl.getInstance() instead of new."
            );
        }

        this.fieldExtractor = new FieldValueExtractor();
        this.parameterValidator = new ParameterValidator();
        this.choiceService = ChoiceServiceImpl.getInstance();
    }

    /**
     * Gets the singleton instance of ParameterUpdateService.
     */
    public static getInstance(): ParameterUpdateService {
        if (!ParameterUpdateServiceImpl.instance) {
            ParameterUpdateServiceImpl.instance = new ParameterUpdateServiceImpl(Enforce);
        }

        return ParameterUpdateServiceImpl.instance;
    }

    public async process(
        update: FieldUpdate,
        userInput: string,
        currentParams: Partial<UserFriendlyParams>,
        stateMapCache: Map<string, any>
    ): Promise<{ result: UpdateResult; resolvedValue: any } | { error: ProcessUpdateResult }> {
        logger.info(`[ParameterUpdateServiceImpl] Processing: ${update.field} = ${update.value}`);

        try {
            let extractedValue = update.value;

            if (extractedValue === null || extractedValue === undefined) {
                extractedValue = await this.fieldExtractor.extractWithLLM(
                    userInput,
                    update.field,
                    currentParams
                );

                if (extractedValue === null) {
                    logger.warn(`[ParameterUpdateServiceImpl] Could not extract ${update.field}`);
                    return {
                        result: { success: false, message: "" },
                        resolvedValue: null,
                    };
                }
            }

            logger.info(
                `[ParameterUpdateServiceImpl] Extracted/received value: ${extractedValue} (type: ${typeof extractedValue})`
            );

            if (this.isNumericField(update.field)) {
                logger.info(`[ParameterUpdateServiceImpl] Numeric field detected, skipping validation`);
                const result: UpdateResult = this.apply(currentParams, update.field, extractedValue);

                if (!result.success) {
                    logger.warn(`[ParameterUpdateServiceImpl] Apply failed: ${result.message}`);
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

                return { result, resolvedValue: extractedValue };
            }

            const validationError = await this.parameterValidator.validate(
                update.field,
                extractedValue,
                stateMapCache
            );

            if (validationError) {
                logger.warn(`[ParameterUpdateServiceImpl] Validation failed: ${validationError}`);
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

            const resolvedValue = await this.choiceService.resolve(update.field, extractedValue);

            const result: UpdateResult = this.apply(currentParams, update.field, resolvedValue);

            if (!result.success) {
                logger.warn(`[ParameterUpdateServiceImpl] Apply failed: ${result.message}`);
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
        } catch (error) {
            logger.error(`[ParameterUpdateServiceImpl] Exception during process:`, error);
            return {
                error: {
                    response: `Error updating ${update.field}. Please try again.`,
                    userFriendlyParams: currentParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                },
            };
        }
    }

    public apply(
        currentParams: Partial<UserFriendlyParams>,
        field: keyof UserFriendlyParams,
        value: any
    ): UpdateResult {
        logger.info(`[ParameterUpdateServiceImpl] Applying: ${field} = ${value}`);

        if (field === "garage_type") {
            return this.dimensionManager.handleGarageTypeUpdate(value, currentParams);
        }

        if (this.isNumericField(field)) {
            return this.applyNumericFieldUpdate(field, value, currentParams);
        }

        return this.applyTextFieldUpdate(field, value, currentParams);
    }

    /**
     * ✅ IMPROVED: More lenient numeric field parsing
     */
    private applyNumericFieldUpdate(
        field: keyof UserFriendlyParams,
        value: any,
        currentParams: Partial<UserFriendlyParams>
    ): UpdateResult {
        logger.info(`[ParameterUpdateServiceImpl] Parsing numeric field: ${field} = ${value}`);

        let numValue: number;

        if (typeof value === "number") {
            numValue = value;
        } else if (typeof value === "string") {
            const match = String(value).match(/(\d+(?:\.\d+)?)/);
            if (match) {
                numValue = parseFloat(match[1]);
            } else {
                numValue = NaN;
            }
        } else {
            numValue = NaN;
        }

        logger.info(
            `[ParameterUpdateServiceImpl] Parsed value: ${value} → ${numValue} (isNaN: ${isNaN(numValue)})`
        );

        if (isNaN(numValue) || numValue <= 0 || numValue > 500) {
            logger.warn(
                `[ParameterUpdateServiceImpl] Invalid numeric value: ${value} (parsed: ${numValue})`
            );
            return {
                success: false,
                message: `❌ Invalid ${field}: must be between 1 and 500`,
            };
        }

        if (field === "gauge") {
            const validGauges = [14, 16, 18, 20];
            if (!validGauges.includes(numValue)) {
                logger.warn(`[ParameterUpdateServiceImpl] Invalid gauge: ${numValue}`);
                return {
                    success: false,
                    message: `❌ Invalid gauge: ${numValue}. Valid options: ${validGauges.join(", ")}`,
                };
            }
        }

        const updatedParams = { ...currentParams, [field]: numValue };
        logger.info(`[ParameterUpdateServiceImpl] ✅ ${field} updated to ${numValue}`);

        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)} to ${numValue}${
                field !== "gauge" ? "ft" : ""
            }`,
            updatedParams,
        };
    }

    private applyTextFieldUpdate(
        field: keyof UserFriendlyParams,
        value: any,
        currentParams: Partial<UserFriendlyParams>
    ): UpdateResult {
        const textValue = String(value).trim();

        if (!textValue) {
            logger.warn(`[ParameterUpdateServiceImpl] Empty text value for ${field}`);
            return {
                success: false,
                message: `❌ ${field} cannot be empty`,
            };
        }

        const updatedParams = { ...currentParams, [field]: textValue };
        logger.info(`[ParameterUpdateServiceImpl] ✅ ${field} updated to ${textValue}`);

        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)} to ${textValue}`,
            updatedParams,
        };
    }

    private isNumericField(field: keyof UserFriendlyParams): boolean {
        return ["width", "length", "height", "gauge", "utility_length"].includes(field);
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void {}
