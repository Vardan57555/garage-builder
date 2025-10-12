"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_sides_ends", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        side_closed_rows: `[{"sheet_name":"board_and_batten_metal_siding","sheet_label":"Board and Batten Metal Siding","sheet_category":"Board and Batten (Flat)","row_data":[{"height":7,"4_side":"15","4_vertical":"15","4_side_other":0,"4_vertical_other":0,"g_4_side":0,"g_4_vertical":0,"g_4_side_other":0,"g_4_vertical_other":0}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":"vertical","other_leg":false,"min_row":7,"max_row":7,"distance_on_row":1,"distance_on_center":5,"column_values":"4","panel_orientation":[],"panel_price_from":["vertical"],"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]},{"sheet_name":"wood_siding","sheet_label":"Wood Siding","sheet_category":"Wood Grain Designer Panels","row_data":[{"height":16,"4_side":"15","4_vertical":"15","4_side_other":0,"4_vertical_other":0,"g_4_side":0,"g_4_vertical":0,"g_4_side_other":0,"g_4_vertical_other":0}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":"vertical","other_leg":false,"min_row":16,"max_row":16,"distance_on_row":1,"distance_on_center":5,"column_values":"4","panel_orientation":["vertical"],"panel_price_from":[],"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]},{"sheet_name":"stackstone","sheet_label":"Stackstone Ash Siding","sheet_category":"Stackstone","row_data":[{"height":16,"4_side":"15","4_vertical":"15","4_side_other":0,"4_vertical_other":0,"g_4_side":0,"g_4_vertical":0,"g_4_side_other":0,"g_4_vertical_other":0}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":"vertical","other_leg":false,"min_row":16,"max_row":16,"distance_on_row":1,"distance_on_center":5,"column_values":"4","panel_orientation":["horizontal","vertical"],"panel_price_from":["vertical"],"applicable_wainscot_horizontal":["stackstone"],"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]}]`,
        end_closed_rows: "[]",
        extra_panels_rows: "[]",
        gable_ends_rows: "[]",
        wainscot_rows: `[{"sheet_name":"board_and_batten_metal_siding","sheet_label":"Board and Batten Metal Siding","sheet_category":"Board and Batten (Flat)","row_data":[{"end":[{"width":"12","on_end_horizontal":"5","on_end_vertical":"5","on_end_horizontal_type":"$","on_end_vertical_type":"$"}],"price_modify_obj":{"increase_value_by":null,"increment_by":null,"rows":null,"columns":null,"fields":null},"side":[{"length":"50","on_side_horizontal":"0","on_side_vertical":"5","on_side_horizontal_type":"$","on_side_vertical_type":"$"}]}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":false,"other_leg":false,"min_row":0,"max_row":0,"distance_on_row":0,"distance_on_center":0,"column_values":0,"panel_orientation":null,"panel_price_from":["vertical"],"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null},{"sheet_name":"stackstone","sheet_label":"Stackstone Ash Siding","sheet_category":"Stackstone","row_data":[{"end":[{"width":"12","on_end_horizontal":"5","on_end_vertical":"5","on_end_horizontal_type":"$","on_end_vertical_type":"$"}],"price_modify_obj":{"increase_value_by":null,"increment_by":null,"rows":null,"columns":null,"fields":null},"side":[{"length":"20","on_side_horizontal":"5","on_side_vertical":"5","on_side_horizontal_type":"$","on_side_vertical_type":"$"}]}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":false,"other_leg":false,"min_row":0,"max_row":0,"distance_on_row":0,"distance_on_center":0,"column_values":0,"panel_orientation":["horizontal","vertical"],"panel_price_from":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null},{"sheet_name":"wood_siding","sheet_label":"Wood Siding","sheet_category":"Wood Grain Designer Panels","row_data":[{"end":[{"width":"12","on_end_horizontal":0,"on_end_vertical":"5","on_end_horizontal_type":"$","on_end_vertical_type":"$"}],"price_modify_obj":{"increase_value_by":null,"increment_by":null,"rows":null,"columns":null,"fields":null},"side":[{"length":"20","on_side_horizontal":0,"on_side_vertical":"5","on_side_horizontal_type":"$","on_side_vertical_type":"$"}]}],"price_type":"%","price_of":["full_building_price"],"gauge_12":false,"default_type":false,"other_leg":false,"min_row":0,"max_row":0,"distance_on_row":0,"distance_on_center":0,"column_values":0,"panel_orientation":["vertical"],"panel_price_from":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null}]`,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_sides_ends", null, {});
  },
};
