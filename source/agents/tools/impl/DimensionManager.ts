import {IDimensionManager} from "@agents/tools/io/IParameterExtractionNode";
import {DimensionResult} from "@agents/tools/impl/io/IParameterExtraction";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {UpdateResult} from "@agents/tools/impl/io/IParameterUpdate";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {InstantiationError} from "@errors/InstantiationError";
const logger: pino.Logger = createLogger(module);

export class DimensionManager implements IDimensionManager
{
    private static instance: IDimensionManager;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use DimensionManager.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of BuildingService.
     *
     * @returns The singleton instance of BuildingService.
     */

    public static getInstance(): IDimensionManager
    {
        if(!DimensionManager.instance)
        {
            DimensionManager.instance = new DimensionManager(Enforce);
        }

        return DimensionManager.instance;
    }


    public calculateDimensions(input: string): DimensionResult
    {
        return DynamicGarageDimensionCalculator.calculateDimensionsFromInput(input);
    }

    public isGarageTypeChanged(newGarageType?: string, oldGarageType?: string): boolean
    {
        return !!(newGarageType && newGarageType !== oldGarageType);
    }

    public clearDimensions(params: Record<string, any>): void
    {
        delete params.width;
        delete params.length;
        delete params.height;
    }

    public applyDimensions(params: Record<string, any>, dimensions: DimensionResult): boolean
    {
        if (!dimensions.width || !dimensions.length || !dimensions.height)
        {
            return false;
        }

        params.width = dimensions.width;
        params.length = dimensions.length;
        params.height = dimensions.height;
        return true;
    }

    public preserveExistingDimensions(merged: Record<string, any>, current: Record<string, any>, extracted: Record<string, any>): void
    {
        if (current.width && !extracted.width)
        {
            merged.width = current.width;
        }

        if (current.length && !extracted.length)
        {
            merged.length = current.length;
        }

        if (current.height && !extracted.height)
        {
            merged.height = current.height;
        }
    }

    public handleGarageTypeUpdate(value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult
    {
        const carCountMatch: RegExpMatchArray = String(value).match(/(\d+)/);
        const numCars: number = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        if (!numCars || numCars <= 0)
        {
            return {success: false, message: `❌ Could not process ${value}`};
        }

        const calculation =
            DynamicGarageDimensionCalculator.calculateDimensionsFromInput(`${numCars} cars`);

        if (!calculation.width || !calculation.length)
        {
            return {success: false, message: `❌ Could not process ${value}`,};
        }

        logger.info(`[DimensionHandler] Garage type changing from "${currentParams.garage_type}" to "${value}"`);
        logger.info(`[DimensionHandler] OLD dimensions: ${currentParams.width}×${currentParams.length}×${currentParams.height}`);

        const updatedParams = { ...currentParams };
        delete updatedParams.width;
        delete updatedParams.length;
        delete updatedParams.height;

        logger.info(`[DimensionHandler] Deleted old dimensions`);

        updatedParams.width = calculation.width;
        updatedParams.length = calculation.length;
        updatedParams.height = calculation.height;
        updatedParams.garage_type = calculation.garageType;

        logger.info(`[DimensionHandler] NEW dimensions: ${calculation.width}×${calculation.length}×${calculation.height}`);

        return {
            success: true,
            message: `✓ Updated to ${calculation.numCars}-car garage (${calculation.width}×${calculation.length}×${calculation.height}ft)`,
            updatedParams,
        };
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
