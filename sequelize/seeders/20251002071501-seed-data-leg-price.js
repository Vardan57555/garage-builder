"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    const now = new Date();

    return queryInterface.bulkInsert("data_leg_price", [
      {
        id: 179,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        min_height: 6,
        max_height: 20,
        length_commas_values: "4,5,10,15,20,25,30,35,40",
        gauge_prices_12: true,
        side_prices_gauge_12: false,
        side_other_leg: false,
        building_structre_row: '[{"height":6,"lifttype":null,"lifttype_price":0,"4_single":"0","4_double":"0","4_ladder":0,"g_4_single":"0","g_4_double":"0","g_4_ladder":0,"5_single":"0","5_double":"0","5_ladder":0,"g_5_single":"0","g_5_double":"0","g_5_ladder":0,"10_single":"0","10_double":"0","10_ladder":0,"g_10_single":"0","g_10_double":"0","g_10_ladder":0,"15_single":"0","15_double":"0","15_ladder":0,"g_15_single":"0","g_15_double":"0","g_15_ladder":0,"20_single":"0","20_double":"0","20_ladder":0,"g_20_single":"180","g_20_double":"0","g_20_ladder":0,"25_single":"0","25_double":"0","25_ladder":0,"g_25_single":"210","g_25_double":"0","g_25_ladder":0,"30_single":"0","30_double":"0","30_ladder":0,"g_30_single":"240","g_30_double":"0","g_30_ladder":0,"35_single":"0","35_double":"0","35_ladder":0,"g_35_single":"270","g_35_double":"0","g_35_ladder":0,"40_single":"0","40_double":"0","40_ladder":0,"g_40_single":"300","g_40_double":"0","g_40_ladder":0}]',
        side_row: '[{"height":6,"4_side":"112.5","4_vertical":"60","4_side_other":0,"4_vertical_other":0,"g_4_side":0,"g_4_vertical":0,"g_4_side_other":0,"g_4_vertical_other":0,"5_side":"112.5","5_vertical":"60","5_side_other":0,"5_vertical_other":0,"g_5_side":0,"g_5_vertical":0,"g_5_side_other":0,"g_5_vertical_other":0,"10_side":"225","10_vertical":"120","10_side_other":0,"10_vertical_other":0,"g_10_side":0,"g_10_vertical":0,"g_10_side_other":0,"g_10_vertical_other":0,"15_side":"335","15_vertical":"180","15_side_other":0,"15_vertical_other":0,"g_15_side":0,"g_15_vertical":0,"g_15_side_other":0,"g_15_vertical_other":0,"20_side":"450","20_vertical":"240","20_side_other":0,"20_vertical_other":0,"g_20_side":0,"g_20_vertical":0,"g_20_side_other":0,"g_20_vertical_other":0,"25_side":"555","25_vertical":"300","25_side_other":0,"25_vertical_other":0,"g_25_side":0,"g_25_vertical":0,"g_25_side_other":0,"g_25_vertical_other":0,"30_side":"670","30_vertical":"360","30_side_other":0,"30_vertical_other":0,"g_30_side":0,"g_30_vertical":0,"g_30_side_other":0,"g_30_vertical_other":0,"35_side":"795","35_vertical":"420","35_side_other":0,"35_vertical_other":0,"g_35_side":0,"g_35_vertical":0,"g_35_side_other":0,"g_35_vertical_other":0,"40_side":"930","40_vertical":"480","40_side_other":0,"40_vertical_other":0,"g_40_side":0,"g_40_vertical":0,"g_40_side_other":0,"g_40_vertical_other":0}]',
        leg_height_width_structure_row: "[]", // replace with full JSON from your INSERT
        applicable_wainscot_horizontal: false,
        applicable_wainscot_vertical: false,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("data_leg_price", null, {});
  },
};
