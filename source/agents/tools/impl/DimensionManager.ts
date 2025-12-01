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

    public calculateDimensions(input: string): DimensionResult {
        logger.info(`[DimensionManager] Input: "${input}"`);

        // ✅ PRIORITY 1: Labeled format - "width 10 length 10 height 10"
        const labeledResult = this.tryLabeledDimensions(input);
        if (labeledResult) {
            logger.info(`[DimensionManager] ✅ Labeled format: ${JSON.stringify(labeledResult)}`);
            return labeledResult;
        }

        // Priority 2: X format "10x10x10"
        const xFormatResult = this.tryExplicitDimensions(input);
        if (xFormatResult) {
            logger.info(`[DimensionManager] ✅ X format: ${JSON.stringify(xFormatResult)}`);
            return xFormatResult;
        }

        // Priority 3: Comma-separated "10, 10, 10"
        const commaResult = this.tryCommaSeparatedDimensions(input);
        if (commaResult) {
            logger.info(`[DimensionManager] ✅ Comma format: ${JSON.stringify(commaResult)}`);
            return commaResult;
        }

        // Priority 4: Space-separated "10 10 10"
        const spaceResult = this.trySpaceSeparatedDimensions(input);
        if (spaceResult) {
            logger.info(`[DimensionManager] ✅ Space format: ${JSON.stringify(spaceResult)}`);
            return spaceResult;
        }

        // Fallback: Use existing calculator
        logger.info(`[DimensionManager] No explicit format matched, using calculator`);
        return DynamicGarageDimensionCalculator.calculateDimensionsFromInput(input);
    }


    private tryCommaSeparatedDimensions(input: string): DimensionResult | null {
        // Match 3 numbers separated by commas
        const match = input.match(/(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);

        if (!match) {
            return null;
        }

        const width = parseInt(match[1], 10);
        const length = parseInt(match[2], 10);
        const height = parseInt(match[3], 10);

        if (!this.validateDimensions(width, length, height)) {
            logger.warn(`[DimensionManager] Invalid comma-separated values: ${width}x${length}x${height}`);
            return null;
        }

        logger.info(`[DimensionManager] Comma-separated match: ${width}x${length}x${height}`);
        return { width, length, height, numCars: null };
    }

    private trySpaceSeparatedDimensions(input: string): DimensionResult | null {
        // Match only if it's 3 bare numbers with spaces (not mixed with other text)
        const trimmed = input.trim();

        // Must start with optional context then have 3 numbers
        const match = trimmed.match(/(?:^|\D)(\d+)\s+(\d+)\s+(\d+)(?:\s|$|[^\d])/);

        if (!match) {
            return null;
        }

        const width = parseInt(match[1], 10);
        const length = parseInt(match[2], 10);
        const height = parseInt(match[3], 10);

        if (!this.validateDimensions(width, length, height)) {
            return null;
        }

        logger.info(`[DimensionManager] Space-separated match: ${width}x${length}x${height}`);
        return { width, length, height, numCars: null };
    }

    private tryLabeledDimensions(input: string): DimensionResult | null {
        const lowerInput = input.toLowerCase();

        // ✅ FIX: Use word boundaries to avoid partial matches
        const widthMatch = lowerInput.match(/\bwidth\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        const lengthMatch = lowerInput.match(/\blength\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        const heightMatch = lowerInput.match(/\bheight\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);

        const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
        const length = lengthMatch ? parseInt(lengthMatch[1], 10) : null;
        const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

        // ✅ CRITICAL: All three MUST be present
        if (width && length && height && this.validateDimensions(width, length, height)) {
            logger.info(`[DimensionManager] Labeled match: ${width}x${length}x${height}`);
            return { width, length, height, numCars: null };
        }

        logger.debug(`[DimensionManager] Labeled format incomplete - W:${width}, L:${length}, H:${height}`);
        return null;
    }

    private validateDimensions(w: number, l: number, h: number): boolean {
        const valid = w > 0 && l > 0 && h > 0 && w <= 500 && l <= 500 && h <= 500;
        if (!valid) {
            logger.warn(`[DimensionManager] Dimension validation failed: ${w}x${l}x${h}`);
        }
        return valid;
    }

    /**
     * Original X format parser (keep existing)
     */
    private tryExplicitDimensions(input: string): DimensionResult | null {
        // ✅ FIXED: Allow spaces around 'x' and handle both cases
        const match = input.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);

        if (!match) {
            return null;
        }

        const width = parseInt(match[1], 10);
        const length = parseInt(match[2], 10);
        const height = parseInt(match[3], 10);

        if (width <= 0 || length <= 0 || height <= 0 ||
            width > 500 || length > 500 || height > 500) {
            logger.warn(`[DimensionManager] Invalid X-format values: ${width}x${length}x${height}`);
            return null;
        }

        return { width, length, height, numCars: null };
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

    public handleGarageTypeUpdate(value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult {
        const carCountMatch: RegExpMatchArray = String(value).match(/(\d+)/);
        const numCars: number = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        if (!numCars || numCars <= 0) {
            return {success: false, message: `❌ Could not process ${value}`};
        }

        logger.info(`[DimensionHandler] Garage type changing from "${currentParams.garage_type}" to "${value}"`);
        logger.info(`[DimensionHandler] Current dimensions: ${currentParams.width}×${currentParams.length}×${currentParams.height}`);

        // ✅ ONLY update garage_type, DON'T auto-calculate dimensions
        const updatedParams = { ...currentParams };
        updatedParams.garage_type = value;

        logger.info(`[DimensionHandler] Updated garage_type to: ${value}`);
        logger.info(`[DimensionHandler] Dimensions remain: ${updatedParams.width}×${updatedParams.length}×${updatedParams.height}`);

        return {
            success: true,
            message: `✓ Updated to ${numCars}-car garage`,
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
