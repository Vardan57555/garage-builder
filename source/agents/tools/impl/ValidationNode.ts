import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {ValidationResult, ValidationState } from "./io/IValidation";
import { IFieldValidationOrchestrator } from "@agents/tools/io/IValidationNode";

const logger: pino.Logger = createLogger(module);

/**
 * Determines validation routing based on state
 */
class ValidationRouter
{
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
            logger.debug(`[ValidationRouter] All fields complete, routing to pricing`);
            return ValidationState.ALL_COMPLETE;
        }

        logger.debug(`[ValidationRouter] Missing fields detected, routing to field prompt`);
        return ValidationState.MISSING_FIELDS;
    }
}

/**
 * Validates completeness of user parameters
 */
class ParameterValidator
{
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
 * Constructs validation responses
 */
class ValidationResponseBuilder
{
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
}

/**
 * Orchestrates field validation workflow
 */
class FieldValidationOrchestrator implements IFieldValidationOrchestrator
{
    /**
     * Validate state and return the appropriate response
     */
    async validate(state: LeadAgentStateType): Promise<ValidationResult>
    {
        logger.info(`[FieldValidationOrchestrator] Session ${state.sessionId} - Validating user parameters`);

        if (!ParameterValidator.isValidParams(state.userFriendlyParams))
        {
            logger.error(`[FieldValidationOrchestrator] Invalid state parameters`);
            throw new Error("Invalid user parameters in state");
        }

        try {

            const hasPendingUpdates: boolean = ParameterValidator.hasPendingUpdates(state.pendingUpdates);
            if (hasPendingUpdates)
            {
                logger.info(`[FieldValidationOrchestrator] Pending updates detected`);
                return ValidationResponseBuilder.buildPendingUpdatesResponse(state.userFriendlyParams);
            }

            const missingFields: string[] = ParameterValidator.getMissingFields(state.userFriendlyParams);

            const nextStep: ValidationState = ValidationRouter.determineNextStep(false, missingFields.length);

            switch (nextStep)
            {
                case ValidationState.ALL_COMPLETE:
                    return ValidationResponseBuilder.buildCompletionResponse(state.userFriendlyParams);

                case ValidationState.MISSING_FIELDS:
                    const currentField: string = missingFields[0];
                    return ValidationResponseBuilder.buildMissingFieldResponse(
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
}

/**
 * NODE: Validate user parameters and determine next field to request
 */
export const checkMissingFieldsNode = async (state: LeadAgentStateType): Promise<ValidationResult> =>
{
    const orchestrator = new FieldValidationOrchestrator();
    return orchestrator.validate(state);
};

/**
 * Export classes for testing and customization
 */
export {
    FieldValidationOrchestrator,
    ParameterValidator,
    ValidationRouter,
    ValidationResponseBuilder,
    ValidationResult,
    ValidationState,
};
