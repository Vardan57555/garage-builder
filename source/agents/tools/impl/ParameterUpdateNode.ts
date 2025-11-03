// ============================================================================
// FILE: handleParameterUpdateNode.ts (COMPLETE FIX)
// ============================================================================

import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { RoofDataValidator } from "@agents/validators/RoofValidator";
import { StateDataValidator } from "@agents/validators/StateValidator";
import { GenericChoiceManager } from "@agents/tools/impl/ChoiceHandler";
import { DynamicGarageDimensionCalculator } from "@utils/dimensionCalculator/DimensionCalculator";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);
const choiceManager = new GenericChoiceManager();

interface UpdateResult {
    success: boolean;
    message: string;
    updatedParams?: Partial<UserFriendlyParams>;
}

async function validateParameterValue(
    field: keyof UserFriendlyParams,
    value: any,
    stateMapCache: Map<string, any>
): Promise<string | null> {
    if (field === "roof_type") {
        const validationResult = await RoofDataValidator.validateRoofType(value);
        if (!validationResult.isValid) {
            return `❌ "${value}" is not valid`;
        }
    }

    if (field === "state_name") {
        const validationResult = await StateDataValidator.validateState(
            value,
            async (name: string) => await LeadAgentHelpers.mapStateToDB(name, stateMapCache)
        );
        if (!validationResult.isValid) {
            return `❌ "${value}" is not valid`;
        }
    }

    if (["width", "length", "height", "gauge", "utility_length"].includes(field as string)) {
        let numValue: number;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        } else if (typeof value === "number") {
            numValue = value;
        } else {
            numValue = NaN;
        }

        if (isNaN(numValue) || numValue <= 0) {
            return `❌ Invalid ${field}`;
        }
    }

    return null;
}

// ✅ FIX: Use 'any' type or Record to avoid TypeScript inference issues
function applyParameterUpdate(
    currentParams: Partial<UserFriendlyParams>,
    field: keyof UserFriendlyParams,
    value: any
): UpdateResult {
    logger.info(`[applyParameterUpdate] Updating ${field} = ${value}`);

    // ✅ Create NEW object - Use Record to avoid type inference issues
    const updatedParams: Record<keyof UserFriendlyParams, any> = {
        ...currentParams
    } as Record<keyof UserFriendlyParams, any>;

    if (field === "garage_type") {
        const carCountMatch = String(value).match(/(\d+)/);
        const numCars = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        if (numCars && numCars > 0) {
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${numCars} cars`
            );

            if (calculation.width && calculation.length) {
                updatedParams.width = calculation.width;
                updatedParams.length = calculation.length;
                updatedParams.height = calculation.height;
                updatedParams.garage_type = calculation.garageType;

                logger.info(`[applyParameterUpdate] Updated garage_type:`, updatedParams);

                return {
                    success: true,
                    message: `✓ Updated to ${calculation.numCars}-car garage`,
                    updatedParams: updatedParams as Partial<UserFriendlyParams>,
                };
            }
        }

        return {
            success: false,
            message: `❌ Could not process ${value}`,
        };
    }

    // Numeric fields
    if (["width", "length", "height", "gauge", "utility_length"].includes(field as string)) {
        let numValue: number;
        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        } else {
            numValue = value as number;
        }

        if (isNaN(numValue) || numValue <= 0) {
            return {
                success: false,
                message: `❌ Invalid ${field}`,
            };
        }

        // ✅ This now works - no type error
        updatedParams[field] = numValue;
        logger.info(`[applyParameterUpdate] Set ${field} = ${numValue}`);

        return {
            success: true,
            message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)} to ${numValue}`,
            updatedParams: updatedParams as Partial<UserFriendlyParams>,
        };
    }

    // String fields
    // ✅ This now works - no type error
    updatedParams[field] = String(value).trim();

    logger.info(`[applyParameterUpdate] Set ${field} = ${String(value).trim()}`);

    return {
        success: true,
        message: `✓ Updated ${LeadAgentHelpers.formatFieldName(field)}`,
        updatedParams: updatedParams as Partial<UserFriendlyParams>,
    };
}

export const handleParameterUpdateNode = async (state: LeadAgentStateType) => {
    logger.info(`[UpdateNode] Pending updates: ${state.pendingUpdates.length}`);

    if (state.pendingUpdates && state.pendingUpdates.length > 0) {
        // ✅ Use Record type here too
        let updatedParams: Record<keyof UserFriendlyParams, any> = {
            ...state.userFriendlyParams
        } as Record<keyof UserFriendlyParams, any>;

        const updateMessages: string[] = [];

        for (const update of state.pendingUpdates) {
            logger.info(`[UpdateNode] Processing: ${update.field} = ${update.value}`);

            // Validate
            const validationError = await validateParameterValue(
                update.field,
                update.value,
                state.stateMapCache
            );

            if (validationError) {
                logger.warn(`[UpdateNode] Validation failed: ${validationError}`);
                return {
                    response: validationError,
                    userFriendlyParams: state.userFriendlyParams,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }

            // Handle roof choice
            if (update.field === "roof_type") {
                const isExplicit = /^(vertical|regular|box|a-frame)$/i.test(String(update.value));
                if (!isExplicit) {
                    const choice = await choiceManager.handleChoice("roof_type", String(update.value));
                    update.value = choice.selected;
                }
            }

            // Apply update
            const result = applyParameterUpdate(
                updatedParams as Partial<UserFriendlyParams>,
                update.field,
                update.value
            );

            if (!result.success) {
                logger.warn(`[UpdateNode] Update failed: ${result.message}`);
                return {
                    response: result.message,
                    userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
                    currentField: update.field,
                    nextStep: "ask_for_field",
                    pendingUpdates: [],
                };
            }

            updateMessages.push(result.message);
            if (result.updatedParams) {
                updatedParams = { ...result.updatedParams } as Record<keyof UserFriendlyParams, any>;
            }
        }

        logger.info(`[UpdateNode] All updates applied, checking missing fields`);

        // Check what's missing now
        const missingFields = LeadAgentHelpers.getMissingFields(updatedParams as Partial<UserFriendlyParams>);

        if (missingFields.length === 0) {
            logger.info(`[UpdateNode] ✅ All fields complete, moving to price calc`);
            return {
                response: updateMessages.join(" | "),
                userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
                priceCalculated: false,
                currentField: null,
                nextStep: "calculate_price",
                pendingUpdates: [],
            };
        }

        const nextField = missingFields[0];
        logger.info(`[UpdateNode] Next missing field: ${nextField}`);

        return {
            response: updateMessages.join(" | "),
            userFriendlyParams: updatedParams as Partial<UserFriendlyParams>,
            currentField: nextField,
            nextStep: "ask_for_field",
            pendingUpdates: [],
        };
    }

    // No pending updates, check if we should calculate price
    const missingFields = LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
    if (missingFields.length === 0) {
        return {
            userFriendlyParams: state.userFriendlyParams,
            nextStep: "calculate_price",
            pendingUpdates: [],
        };
    }

    return {
        userFriendlyParams: state.userFriendlyParams,
        currentField: missingFields[0],
        nextStep: "ask_for_field",
        pendingUpdates: [],
    };
};
