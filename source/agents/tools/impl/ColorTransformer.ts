import {ColorOption} from "@agents/tools/io/IColorChoice";

/**
 * ColorTransformer: Converts raw database rows to typed ColorOption objects
 */
export class ColorTransformer
{
    /**
     * Transforms a single database row to ColorOption
     */
    static transformRow(row: any): ColorOption
    {
        return {
            id: parseInt(row.id),
            name: row.name ?? "Unknown",
            hex_value: row.hex_value ?? "#000000",
            red_value: parseInt(row.red_value) || 0,
            green_value: parseInt(row.green_value) || 0,
            blue_value: parseInt(row.blue_value) || 0,
            cost: parseFloat(row.cost) || 0,
        };
    }

    /**
     * Transforms an array of rows to ColorOptions
     */
    static transformRows(rows: any[]): ColorOption[]
    {
        return rows.map(row => this.transformRow(row));
    }

    /**
     * Validates color has required fields
     */
    static isValid(color: ColorOption): boolean
    {
        return !!(
            color.id &&
            color.name &&
            color.hex_value &&
            color.red_value !== undefined &&
            color.green_value !== undefined &&
            color.blue_value !== undefined &&
            color.cost !== undefined
        );
    }
}
