import pino from "pino";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {UpdateResult} from "@agents/tools/impl/io/IParameterUpdate";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class DimensionHandler
{
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
