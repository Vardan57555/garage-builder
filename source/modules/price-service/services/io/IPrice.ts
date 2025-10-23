import {IManufacturer} from "@modules/manufacturer-service/service/io/IManufacturer";

export interface IPrice
{
    price_id: string;
    created_at: string;
    updated_at: string;
}


export interface IPricingParams {
    width: number;
    length: number;
    height: number;
    single_slope_height?: number;
    map_id: number;
    roof_id: number;
    utility_length?: number;
    building_type?: string;
    gauge?: number
    central_map_id?: number;
    central_height?: number;
    central_utility_length?: number;
    central_length?: number;
    state_name?: string;
    central_width?: number;
    is_barn?: boolean;
    manufacturer_id?: number;
}


export interface IEndCost {
    width: number;
    end_close_cost: number;
    vertical_ends_cost: number;
}


export interface IBasePrice {
    structure: string;
    regular_cost: number;
    box_style_cost: number;
    vertical_roof_cost: number;
}

export interface ISideHeight {
    length: number;
    side_close_cost: number;
    vertical_side_cost: number;
    leg_height_cost: number;
}

export interface IBaseStructureParams {
    map_id: number;
    roof_id: number;
}

export interface IFullStructureParams extends IBaseStructureParams {
    width: number;
    length: number;
    height: number;
}

export interface FetchComponentsParams
{
    map_id: number;
    width: number;
    height: number;
    length: number;
    roof_id: number;
    buildingStructureFull: { end_length: number; distance_on_center: number }[];
    manufacturer: IManufacturer[];
    single_slope_height?: number;
    manufacturer_id?: number;
    side_end_name?: string;
    both_side?: number;
    both_ends?: number;
    roof_only?: number;
    utility_end?:number;
    utility_side?:number;
    utility_roof?:number;
    utility_opposite_side?:number;
    pitch_side?:number;
    slope_side?:number;
    utility_slope_side?:number;
    length_without_wrap?: number;
    length_without_wrap_string?: string
    pitch_type?:string;
    state_name?: string;
    componentKeys: string[];
}

export type ProcedureConfig = (p: FetchComponentsParams & { structureString: string }) => [any[], string];

export interface GetUtilityPricingParams {
    map_id: number;
    height: number;
    length: number;
    utility_length: number;
    single_slope_height?: number;
    buildingStructureFull: {
        end_length: number;
        distance_on_center: number;
        side_end_name?: string;
    }[];
}

export interface IAddon {
    id: number;
    length?: number;
    width?: number;
    jtrim?: number;
    [key: string]: any;
}

export interface IAnchor {
    anchor_id: string;
    name: string;
    is_concrete: boolean;
    cost: number;
}

export interface IPricing {
    addons?: IAddon[];
    addons_width?: IAddon[];
    bows?: { cost: number }[];
    anchors_cost?: IAnchor[];
    braces?: { bracing_feet: number; cost: number }[];
    trusses?: { truss: number; cost: number }[];
    jtrim?: any[];
    [key: string]: any;
}

export interface IFetchPricesParams
{
    map_id: number;
    height: number;
    building_type: string;
    gauge: number;
}


export interface ISidePriceResult {
    id: string;
    map_id: number;
    length: number;
    height: number;
    lift_type: string;
    lifttype_price: number | null;
    leg_height_cost: number;
    leg_height_cost_12: number;
    side_close_cost: number;
    vertical_side_cost: number;
    double_leg_baserail_cost: number;
    double_leg_baserail_cost_12: number;
    half_side_close_cost: number;
    half_vertical_side_cost: number;
    one_fourth_side_close_cost: number;
    one_fourth_vertical_side_cost: number;
    three_fourth_side_close_cost: number;
    three_fourth_vertical_side_cost: number;
    building_length: number;
}

export interface IUtilityPricingResult {
    side: ISidePriceResult[];
    panel: ISidePriceResult[];
    utility_side: ISidePriceResult[];
    utility_slope_height: ISidePriceResult[];
}
