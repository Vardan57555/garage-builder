import {IDimensionManager} from "@agents/tools/io/IParameterExtractionNode";
import {DimensionResult} from "@agents/tools/impl/io/IParameterExtraction";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";

export class DimensionManager implements IDimensionManager
{
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
}
