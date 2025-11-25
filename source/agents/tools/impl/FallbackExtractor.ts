import {IFallbackExtractor} from "@agents/tools/io/IParameterExtractionNode";
import {ExtractionResult} from "@agents/tools/impl/io/IParameterExtraction";
import {DynamicGarageDimensionCalculator} from "@utils/dimensionCalculator/DimensionCalculator";

export class FallbackExtractor implements IFallbackExtractor
{
    public extract(context: string, baseParams: Record<string, any>): ExtractionResult | null
    {
        const carCountMatch: RegExpMatchArray = context.match(/(\d+)\s*cars?/i);

        if (!carCountMatch)
        {
            return null;
        }

        const numCars: number = parseInt(carCountMatch[1], 10);
        const garageType = `${numCars}-car`;

        const calc = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(garageType);

        if (!calc.width || !calc.length || !calc.height)
        {
            return null;
        }

        return {
            userFriendlyParams: {
                ...baseParams,
                garage_type: garageType,
                width: calc.width,
                length: calc.length,
                height: calc.height,
                building_type: "garage",
            },
            nextStep: "check_missing_fields",
        };
    }
}
