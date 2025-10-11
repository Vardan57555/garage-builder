export interface IAiAnswer {
    data: {
        building_to_maxlength: number;
        manufacturer: { manufacturer_id: number }[];
        building_structure: {
            id: number;
            map_id: number;
            building_id: number;
            roof_id: number;
            frame_length: number;
            start_length: number;
            end_length: number;
            min_start_width: number;
            min_width: number;
            max_width: number;
            conditions: { condition: any[] };
            created_at: number;
            updated_at: number;
            [key: string]: any;
        }[];
        side: any[];
        panel: any[];
        utility_side: any[];
        utility_slope_height: any[];
        checkbox: any[];
        checkbox_quantity: any[];
        checkbox_quantity_dropdown: any[];
        truss_name: any[];
    };
    status: boolean;
    message: string;
}
