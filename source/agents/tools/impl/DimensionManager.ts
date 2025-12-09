import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {InstantiationError} from "@errors/InstantiationError";
import { IDimensionManager } from "./io/IParameterExtractionNode";
import {DimensionResult} from "@agents/tools/io/IParameterExtraction";
import {UpdateResult} from "@agents/tools/io/IParameterUpdate";
const logger: pino.Logger = createLogger(module);

export class DimensionManager implements IDimensionManager {
    private static instance: IDimensionManager;

    constructor(enforce: () => void) {
        if(enforce !== Enforce) {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use DimensionManager.getInstance() instead of new.");
        }
    }

    public static getInstance(): IDimensionManager {
        if(!DimensionManager.instance) {
            DimensionManager.instance = new DimensionManager(Enforce);
        }
        return DimensionManager.instance;
    }

    public tryParseSingleLabeledDimension(input: string): { field: 'width' | 'length' | 'height'; value: number } | null {
        const lowerInput = input.toLowerCase();

        logger.info(`[DimensionManager] Parsing single labeled dimension: "${input}"`);

        const widthMatch = lowerInput.match(/\b(?:width|w)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (this.validateDimension(value)) {
                logger.info(`[DimensionManager] ✅ Extracted width: ${value}`);
                return { field: 'width', value };
            }
        }

        const lengthMatch = lowerInput.match(/\b(?:length|l|len)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (this.validateDimension(value)) {
                logger.info(`[DimensionManager] ✅ Extracted length: ${value}`);
                return { field: 'length', value };
            }
        }

        const heightMatch = lowerInput.match(/\b(?:height|h|tall|depth)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (this.validateDimension(value)) {
                logger.info(`[DimensionManager] ✅ Extracted height: ${value}`);
                return { field: 'height', value };
            }
        }

        logger.debug(`[DimensionManager] No single labeled dimension found in: "${input}"`);
        return null;
    }

    public tryParseMultipleLabeledDimensions(input: string): Partial<{ width: number; length: number; height: number }> | null {
        const lowerInput = input.toLowerCase();

        logger.info(`[DimensionManager] Parsing multiple labeled dimensions: "${input}"`);

        const result: Partial<{ width: number; length: number; height: number }> = {};

        const widthMatch = lowerInput.match(/\b(?:width|w)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (this.validateDimension(value)) {
                result.width = value;
                logger.info(`[DimensionManager] ✅ Found width: ${value}`);
            }
        }

        const lengthMatch = lowerInput.match(/\b(?:length|l|len)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (this.validateDimension(value)) {
                result.length = value;
                logger.info(`[DimensionManager] ✅ Found length: ${value}`);
            }
        }

        const heightMatch = lowerInput.match(/\b(?:height|h|tall|depth)\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (this.validateDimension(value)) {
                result.height = value;
                logger.info(`[DimensionManager] ✅ Found height: ${value}`);
            }
        }

        if (Object.keys(result).length > 0) {
            logger.info(`[DimensionManager] ✅ Multiple dimension extraction result:`, result);
            return result;
        }

        logger.debug(`[DimensionManager] No labeled dimensions found in: "${input}"`);
        return null;
    }

    public calculateDimensions(input: string): DimensionResult {
        const lowerInput = input.toLowerCase();
        logger.info(`[DimensionManager] Input: "${input}"`);

        const abbreviatedPattern = /w\s*:?\s*(\d+)\s*l\s*:?\s*(\d+)\s*h\s*:?\s*(\d+)/i;
        const abbreviatedMatch = input.match(abbreviatedPattern);

        if (abbreviatedMatch) {
            const width = parseInt(abbreviatedMatch[1], 10);
            const length = parseInt(abbreviatedMatch[2], 10);
            const height = parseInt(abbreviatedMatch[3], 10);

            logger.info(`[DimensionManager] Regex captured: w=${width}, l=${length}, h=${height}`);

            if (this.validateDimensions(width, length, height)) {
                logger.info(`[DimensionManager] ✅ Abbreviated format: ${width}x${length}x${height}`);
                return { width, length, height, numCars: null };
            } else {
                logger.warn(`[DimensionManager] Validation failed for abbreviated format: ${width}x${length}x${height}`);
            }
        }

        const labeledResult = this.tryLabeledDimensions(input);
        if (labeledResult) {
            logger.info(`[DimensionManager] ✅ Labeled format: ${JSON.stringify(labeledResult)}`);
            return labeledResult;
        }

        const singleLabeledResult = this.tryParseSingleLabeledDimension(input);
        if (singleLabeledResult) {
            logger.info(`[DimensionManager] ✅ Single labeled dimension: ${singleLabeledResult.field} = ${singleLabeledResult.value}`);
            return {
                [singleLabeledResult.field]: singleLabeledResult.value,
                numCars: null
            };
        }

        const xFormatResult = this.tryExplicitDimensions(input);
        if (xFormatResult) {
            logger.info(`[DimensionManager] ✅ X format: ${JSON.stringify(xFormatResult)}`);
            return xFormatResult;
        }

        const commaResult = this.tryCommaSeparatedDimensions(input);
        if (commaResult) {
            logger.info(`[DimensionManager] ✅ Comma format: ${JSON.stringify(commaResult)}`);
            return commaResult;
        }

        const spaceResult = this.trySpaceSeparatedDimensions(input);
        if (spaceResult) {
            logger.info(`[DimensionManager] ✅ Space format: ${JSON.stringify(spaceResult)}`);
            return spaceResult;
        }

        const carCountPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(car|cars?)\b/i;
        const carMatch = lowerInput.match(carCountPattern);

        if (carMatch && !this.hasExplicitDimensions(input)) {
            logger.info(`[DimensionManager] Car count detected, CALCULATING dimensions`);
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(input);

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(`[DimensionManager] ✅ Calculated from car count: ${calculation.width}x${calculation.length}x${calculation.height}`);
                return calculation;
            }
        }

        logger.info(`[DimensionManager] Using fallback calculator`);
        return DynamicGarageDimensionCalculator.calculateDimensionsFromInput(input);
    }

    private tryCommaSeparatedDimensions(input: string): DimensionResult | null {
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

    private hasExplicitDimensions(input: string): boolean {
        const explicitPatterns = [
            /\d+\s*x\s*\d+\s*x\s*\d+/i,
            /width.*?\d+.*?length.*?\d+/i,
            /\d+\s*ft.*?\d+\s*ft/i,
            /\d+\s*,\s*\d+\s*,\s*\d+/,
            /w\s*:?\s*\d+\s*l\s*:?\s*\d+\s*h\s*:?\s*\d+/i,
        ];

        return explicitPatterns.some(pattern => pattern.test(input));
    }

    private trySpaceSeparatedDimensions(input: string): DimensionResult | null {
        const trimmed = input.trim();
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

        const widthMatch = lowerInput.match(/\bwidth\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        const lengthMatch = lowerInput.match(/\blength\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);
        const heightMatch = lowerInput.match(/\bheight\s*[:=]?\s*(\d+(?:\.\d+)?)\b/);

        const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
        const length = lengthMatch ? parseInt(lengthMatch[1], 10) : null;
        const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

        if (width && length && height && this.validateDimensions(width, length, height)) {
            logger.info(`[DimensionManager] Labeled match: ${width}x${length}x${height}`);
            return { width, length, height, numCars: null };
        }

        logger.debug(`[DimensionManager] Labeled format incomplete - W:${width}, L:${length}, H:${height}`);
        return null;
    }

    private validateDimension(value: number): boolean {
        return value > 0 && value <= 500;
    }

    private validateDimensions(w: number, l: number, h: number): boolean {
        const valid = w > 0 && l > 0 && h > 0 && w <= 500 && l <= 500 && h <= 500;
        if (!valid) {
            logger.warn(`[DimensionManager] Dimension validation failed: ${w}x${l}x${h}`);
        }
        return valid;
    }

    private tryExplicitDimensions(input: string): DimensionResult | null {
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

    public isGarageTypeChanged(newGarageType?: string, oldGarageType?: string): boolean {
        return !!(newGarageType && newGarageType !== oldGarageType);
    }

    public clearDimensions(params: Record<string, any>): void {
        delete params.width;
        delete params.length;
        delete params.height;
    }

    public applyDimensions(params: Record<string, any>, dimensions: DimensionResult): boolean {
        if (!dimensions.width || !dimensions.length || !dimensions.height) {
            return false;
        }

        params.width = dimensions.width;
        params.length = dimensions.length;
        params.height = dimensions.height;
        return true;
    }

    public preserveExistingDimensions(merged: Record<string, any>, current: Record<string, any>, extracted: Record<string, any>): void {
        if (current.width && !extracted.width) {
            merged.width = current.width;
        }

        if (current.length && !extracted.length) {
            merged.length = current.length;
        }

        if (current.height && !extracted.height) {
            merged.height = current.height;
        }
    }

    public handleGarageTypeUpdate(value: any, currentParams: Partial<UserFriendlyParams>): UpdateResult {
        const carCountMatch: RegExpMatchArray = String(value).match(/(\d+)/);
        const numCars: number = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        if (!numCars || numCars <= 0) {
            return {success: false, message: `❌ Could not process ${value}`};
        }

        logger.info(`[DimensionManager] Garage type changing to "${value}" (${numCars} cars)`);

        const width = (numCars * 6) + 8;
        const length = 20;
        const height = 10;

        const updatedParams = {
            ...currentParams,
            garage_type: value,
            width,
            length,
            height
        };

        logger.info(`[DimensionManager] ✅ Calculated dimensions: ${width}×${length}×${height}`);

        return {
            success: true,
            message: `✓ Updated to ${numCars}-car garage (${width}ft × ${length}ft × ${height}ft)`,
            updatedParams,
        };
    }
}

function Enforce(): void {}
