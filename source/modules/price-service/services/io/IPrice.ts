import { IManufacturer } from "@modules/manufacturer-service/service/io/IManufacturer";
import { IBuildingStructure as IBuildingStructureFromService } from "@modules/building-service/services/io/IBuildingStructure";

export interface IPrice
{
    price_id: string;
    created_at: string;
    updated_at: string;
}

export interface IPricingParams
{
    width: number;
    length: number;
    height: number;
    map_id: number;
    roof_id: number;
    single_slope_height?: number;
    pitch_height?: number;
    utility_length?: number;
    utility_width?: number;
    building_type?: string;
    gauge?: number;
    is_barn?: boolean;
    manufacturer_id?: number;
    state_name?: string;
    central_map_id?: number;
    central_height?: number;
    central_length?: number;
    central_width?: number;
    central_utility_length?: number;
}

export type IBuildingStructure = IBuildingStructureFromService & {
    side_end_name?: string;
    conditions?: Record<string, any>;
};

export interface IBasePrice
{
    id: number;
    structure: string;
    map_id: number;
    regular_cost: number;
    box_style_cost: number;
    vertical_roof_cost: number;
    gauge: number;
}

export interface ISideHeight
{
    id: number;
    map_id: number;
    length: number;
    height: number;
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
    lift_type: string;
    lifttype_price: number | null;
    utility_length?: number;
    building_length?: number;
}

export interface ISidePriceResult extends ISideHeight {}

export interface IEndCost
{
    id: number;
    map_id: number;
    width: number;
    height: number;
    end_close_cost: number;
    certified_end_cost?: number;
    vertical_ends_cost: number;
    half_end_close_cost: number;
    half_vertical_ends_cost: number;
    one_fourth_end_close_cost: number;
    one_fourth_vertical_ends_cost: number;
    three_fourth_end_close_cost: number;
    three_fourth_vertical_ends_cost: number;
}

export interface IAddon
{
    id: number;
    map_id: number;
    length?: number;
    width?: number;
    jtrim?: number;
    is_jtrim?: string;
    panel_jtrim?: number;
    is_panel_jtrim?: string;
    cut_panel_jtrim?: number;
    is_cut_panel_jtrim?: string;
    cost?: number;
    [key: string]: any;
}

export interface IAnchor
{
    id?: number;
    anchor_id: string;
    name: string;
    is_concrete: boolean;
    cost: number;
    map_id?: number;
}

export interface IBracesItem
{
    id?: number;
    bracing_feet: number;
    cost: number;
}

export interface ITrussItem
{
    id?: number;
    truss: number;
    cost: number;
    length?: number;
    height?: number;
}

export interface FetchComponentsParams
{
    map_id: number;
    width: number;
    height: number;
    length: number;
    roof_id?: number;
    buildingStructureFull: IBuildingStructure[];
    manufacturer: IManufacturer[];
    single_slope_height?: number;
    manufacturer_id?: number;
    side_end_name?: string | null;
    both_side?: number;
    both_ends?: number;
    roof_only?: number;
    utility_end?: number;
    utility_side?: number;
    utility_roof?: number;
    utility_opposite_side?: number;
    pitch_side?: number;
    pitch_type?: string;
    slope_side?: number;
    utility_slope_side?: number;
    length_without_wrap?: number;
    length_without_wrap_string?: string;
    state_name?: string;
    utility_length?: number;
    componentKeys: string[];
    structureString?: string;
    lengthArray?: number[];
}

export type ProcedureConfig = (
    p: FetchComponentsParams & { structureString?: string; lengthArray?: number[] }
) => [any[], string];

export interface IBaseStructureParams
{
    map_id: number;
    roof_id: number;
}

export interface IFullStructureParams extends IBaseStructureParams
{
    width: number;
    length: number;
    height: number;
}

export interface GetUtilityPricingParams
{
    map_id: number;
    height: number;
    length: number;
    utility_length: number;
    buildingStructureFull: IBuildingStructure[];
    single_slope_height?: number;
}

export interface IUtilityPricingResult
{
    side: ISidePriceResult[];
    panel: any[];
    utility_side: ISidePriceResult[];
    utility_slope_height: (ISidePriceResult & { utility_length: number })[];
}

export interface IFetchPricesParams
{
    map_id: number;
    height: number;
    building_type: string;
    gauge: number;
}

export interface IPricing
{
    building_to_maxlength?: number;
    manufacturer?: IManufacturer[];
    building_structure?: IBuildingStructure[];
    base_price_regular?: number;
    base_price_box?: number;
    base_price_vertical?: number;
    gauge?: number;
    base?: IBasePrice[];
    end?: IEndCost[];
    end_combo_v3?: IEndCost[];
    gable_end?: any[];
    truss_name?: any[];
    garage_door?: any[];
    garage_door_v3?: any[];
    garage_door_frameout?: any[];
    walkin_door_frameout?: any[];
    walkin_door_frameout_v3?: any[];
    window_frameout?: any[];
    window_frameout_v3?: any[];
    insulation?: any[];
    certificate?: any[];
    full_length_panel?: any[];
    panel?: any[];
    end_cross_bracing?: any[];
    side_cross_bracing?: any[];
    roof_pitch?: any[];
    connection_fees?: any[];
    braces?: IBracesItem[];
    trusses?: ITrussItem[];
    trusses_slope?: ITrussItem[];
    additional_features?: any;
    bows?: Array<{ cost: number }>;
    cupola?: any;
    canopy?: any;
    delux_two_tone?: any[];
    utility_delux_two_tone?: any[];
    full_length_side?: ISidePriceResult[];
    side?: ISidePriceResult[];
    side_combo_v3?: ISidePriceResult[];
    side_slope_height?: ISidePriceResult[];
    utility_side?: ISidePriceResult[];
    utility_slope_height?: ISidePriceResult[];
    central_building_structure?: IBuildingStructure[];
    central_side_full_length?: ISidePriceResult[];
    central_side?: ISidePriceResult[];
    central_end?: IEndCost[];
    central_trusses?: ITrussItem[];
    central_certificate?: any[];
    central_utility_side?: ISidePriceResult[];
    anchors_cost?: IAnchor[];
    addons?: IAddon[];
    addons_width?: IAddon[];
    jtrim?: any[];
    column_status?: any[];
    extra_items?: any[];
    checkbox?: any[];
    checkbox_quantity?: any[];
    checkbox_quantity_dropdown?: any[];
    [key: string]: any;
}
