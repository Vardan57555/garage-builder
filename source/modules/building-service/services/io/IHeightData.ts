export interface IHeightData
{
    min_height: number;
    max_height: number;
    min_smaller_height: number;
    max_smaller_height: number;
}

export interface IOutputEntry
{
    map_id: number;
    height_data: Record<number, IHeightData>;
}
