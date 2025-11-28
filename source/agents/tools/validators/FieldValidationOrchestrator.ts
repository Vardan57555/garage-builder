import {IFieldValidationOrchestrator} from "@agents/tools/impl/io/IValidationNode";
import { ValidationResult, ValidationState } from "../io/IValidation";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {InstantiationError} from "@errors/InstantiationError";

const logger: pino.Logger = createLogger(module);

/**
 * Orchestrates field validation workflow
 */
class FieldValidationOrchestrator implements IFieldValidationOrchestrator
{
    private static instance: FieldValidationOrchestrator;

    constructor(enforce: () => void) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use FieldValidationOrchestrator.getInstance() instead of new."
            );
        }
    }

    public static getInstance(): FieldValidationOrchestrator {
        if (!FieldValidationOrchestrator.instance) {
            FieldValidationOrchestrator.instance = new FieldValidationOrchestrator(Enforce);
        }
        return FieldValidationOrchestrator.instance;
    }

    /**
     * Validate state and return the appropriate response
     */
    async validate(state: LeadAgentStateType): Promise<ValidationResult>
    {
        logger.info(`[FieldValidationOrchestrator] Session ${state.sessionId} - Validating user parameters`);

        if (!FieldValidationOrchestrator.isValidParams(state.userFriendlyParams))
        {
            logger.error(`[FieldValidationOrchestrator] Invalid state parameters`);
            throw new Error("Invalid user parameters in state");
        }

        try {

            const hasPendingUpdates: boolean = FieldValidationOrchestrator.hasPendingUpdates(state.pendingUpdates);
            if (hasPendingUpdates)
            {
                logger.info(`[FieldValidationOrchestrator] Pending updates detected`);
                return FieldValidationOrchestrator.buildPendingUpdatesResponse(state.userFriendlyParams);
            }

            const missingFields: string[] = FieldValidationOrchestrator.getMissingFields(state.userFriendlyParams);

            const nextStep: ValidationState = FieldValidationOrchestrator.determineNextStep(false, missingFields.length);

            switch (nextStep)
            {
                case ValidationState.ALL_COMPLETE:
                    logger.info(`[FieldValidationOrchestrator] ✅ All fields complete`);
                    return FieldValidationOrchestrator.buildCompletionResponse(state.userFriendlyParams);

                case ValidationState.MISSING_FIELDS:
                    const currentField: string = missingFields[0];
                    logger.info(`[FieldValidationOrchestrator] Missing field: ${currentField}`);
                    return FieldValidationOrchestrator.buildMissingFieldResponse(
                        state.userFriendlyParams,
                        currentField
                    );

                default:
                    logger.error(`[FieldValidationOrchestrator] Unknown validation state: ${nextStep}`);
                    throw new Error(`Unknown validation state: ${nextStep}`);
            }
        }
        catch (error)
        {
            logger.error(`[FieldValidationOrchestrator] Error during validation:`,
                {
                    sessionId: state.sessionId,
                    error: error instanceof Error ? error.message : String(error),
                }
            );
            throw error;
        }
    }

    /**
     * Determine the next validation step
     */
    public static determineNextStep(hasPendingUpdates: boolean, missingFieldsCount: number): ValidationState
    {
        if (hasPendingUpdates)
        {
            logger.debug(`[ValidationRouter] Routing to pending updates handler`);
            return ValidationState.PENDING_UPDATES;
        }

        if (missingFieldsCount === 0)
        {
            logger.debug(`[ValidationRouter] All fields complete, routing to color selection`);
            return ValidationState.ALL_COMPLETE;
        }

        logger.debug(`[ValidationRouter] Missing fields detected, routing to field prompt`);
        return ValidationState.MISSING_FIELDS;
    }

    /**
     * Build response for a pending updates scenario
     */
    public static buildPendingUpdatesResponse(params: Record<string, any>): ValidationResult
    {
        logger.info(`[ValidationResponseBuilder] Building pending updates response`);
        return {
            userFriendlyParams: params,
            currentField: null,
            nextStep: ValidationState.PENDING_UPDATES,
        };
    }

    /**
     * Build response for completed validation
     */
    public static buildCompletionResponse(params: Record<string, any>): ValidationResult
    {
        logger.info(`[ValidationResponseBuilder] Building completion response`);
        return {
            userFriendlyParams: params,
            currentField: null,
            nextStep: ValidationState.ALL_COMPLETE,
        };
    }

    /**
     * Build response for a missing field scenario
     */
    public static buildMissingFieldResponse(params: Record<string, any>, currentField: string): ValidationResult
    {
        logger.info(`[ValidationResponseBuilder] Building missing field response - requesting: ${currentField}`);
        return {
            userFriendlyParams: params,
            currentField,
            nextStep: ValidationState.MISSING_FIELDS,
        };
    }

    /**
     * Check if pending updates exist
     */
    public static hasPendingUpdates(pendingUpdates: any[] | undefined): boolean
    {
        return Array.isArray(pendingUpdates) && pendingUpdates.length > 0;
    }

    /**
     * Get list of missing fields
     */
    public static getMissingFields(params: Record<string, any>): string[]
    {
        const missing: string[] = LeadAgentHelpers.getMissingFields(params);
        logger.debug(`[ParameterValidator] Missing fields: ${missing.length > 0 ? missing.join(", ") : "none"}`);
        return missing;
    }

    /**
     * Validate user params structure
     */
    public static isValidParams(params: Record<string, any> | undefined): boolean
    {
        if (!params || typeof params !== "object")
        {
            logger.warn(`[ParameterValidator] Invalid params structure`);
            return false;
        }
        return true;
    }
}

/**
 * NODE: Validate user parameters and determine next field to request
 * ✅ Returns ValidationResult which graph uses to determine nextStep
 */
export const checkMissingFieldsNode = async (state: LeadAgentStateType): Promise<ValidationResult> =>
{
    try {
        logger.info(`[checkMissingFieldsNode] Session ${state.sessionId} - Starting validation`);

        const orchestrator = FieldValidationOrchestrator.getInstance();
        const result = await orchestrator.validate(state);  // ✅ ADD await HERE

        logger.debug(`[checkMissingFieldsNode] Result:`, {
            nextStep: result.nextStep,
            currentField: result.currentField,
        });

        return result;
    } catch (error) {
        logger.error(`[checkMissingFieldsNode] Error:`, error);

        return {
            userFriendlyParams: state.userFriendlyParams,
            currentField: null,
            nextStep: "__end__",
        };
    }
};

/**
 * Function to enforce Singleton pattern
 */
function Enforce(): void {}

/**
 * Export for use in graph
 */
export { FieldValidationOrchestrator, ValidationResult, ValidationState };
