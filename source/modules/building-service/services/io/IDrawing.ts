export interface IDrawingItem
{
    id: string | number;
    map_id: string | number;
    width: number;
    name: string;
    cost_type: string;
    cost: number;
    is_cost: boolean;
    is_default: boolean;
}

export interface IDrawingGroup
{
    map_id: string | number;
    data: IDrawingItem[];
}
