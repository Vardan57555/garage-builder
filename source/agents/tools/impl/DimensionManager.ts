import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {InstantiationError} from "@errors/InstantiationError";
import { IDimensionManager } from "./io/IParameterExtractionNode";
import {DimensionResult} from "@agents/tools/io/IParameterExtraction";
import {UpdateResult} from "@agents/tools/io/IParameterUpdate";
const logger: pino.Logger = createLogger(module);

export class DimensionManager implements IDimensionManager
{
    private static instance: IDimensionManager;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use DimensionManager.getInstance() instead of new.");
        }
    }

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
        // ✅ CRITICAL: Check for explicit WxLxH format FIRST
        const explicitMatch = this.tryExplicitDimensions(input);
        if (explicitMatch) {
            logger.info(`[DimensionManager] ✅ Explicit WxLxH format detected:`, explicitMatch);
            return explicitMatch;
        }

        // Then try other formats
        return DynamicGarageDimensionCalculator.calculateDimensionsFromInput(input);
    }

    /**
     * ✅ NEW: Try to parse explicit WxLxH format
     */
    private tryExplicitDimensions(input: string): DimensionResult | null {
        const match = input.match(/^(\d+)\s*x\s*(\d+)\s*x\s*(\d+)$/i);

        if (!match) {
            return null;
        }

        const width = parseInt(match[1], 10);
        const length = parseInt(match[2], 10);
        const height = parseInt(match[3], 10);

        // Validate ranges
        if (width <= 0 || length <= 0 || height <= 0 ||
            width > 500 || length > 500 || height > 500) {
            logger.warn(`[DimensionManager] Invalid dimension values: ${width}x${length}x${height}`);
            return null;
        }

        logger.info(`[DimensionManager] Explicit WxLxH format: ${width}x${length}x${height}`);

        return {
            width,
            length,
            height,
            numCars: null,
        };
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
