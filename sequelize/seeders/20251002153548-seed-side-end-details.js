"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("side_end_details", [
      {
        id: 1,
        map_id: 97,
        settings: `{"side_closed":[{"name":"board_and_batten_metal_siding","label":"Board and Batten (Flat)","min_height":7,"max_height":7,"distance_on_height":1,"distance_on_center":5,"price_type":"%","price_of":["full_building_price"],"percentage_amount":"15","panel_price_from":["vertical"],"panel_orientation":[],"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]},{"name":"wood_siding","label":"Wood Grain Designer Panels","min_height":16,"max_height":16,"distance_on_height":1,"distance_on_center":5,"price_type":"%","price_of":["full_building_price"],"percentage_amount":"15","panel_price_from":[],"panel_orientation":["vertical"],"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]},{"name":"stackstone","label":"Stackstone","min_height":16,"max_height":16,"distance_on_height":1,"distance_on_center":5,"price_type":"%","price_of":["full_building_price"],"percentage_amount":"15","panel_price_from":["vertical"],"panel_orientation":["horizontal","vertical"],"applicable_wainscot_horizontal":["stackstone"],"applicable_wainscot_vertical":["board_and_batten_metal_siding","stackstone","wood_siding"]}],"end_closed":[],"extra_panels":[],"gable_ends":[],"wainscot":[{"name":"board_and_batten_metal_siding","label":"Board and Batten Metal Siding","price_type":"%","price_of":["full_building_price"],"horizontal_cost":"0","vertical_cost":"5","panel_price_from":["vertical"],"panel_orientation":null},{"name":"stackstone","label":"Stackstone Ash Siding","price_type":"%","price_of":["full_building_price"],"horizontal_cost":"5","vertical_cost":"5","panel_price_from":null,"panel_orientation":["horizontal","vertical"]},{"name":"wood_siding","label":"Wood Siding","price_type":"%","price_of":["full_building_price"],"horizontal_cost":0,"vertical_cost":"5","panel_price_from":null,"panel_orientation":["vertical"]}]}`
      },
      {
        id: 2,
        map_id: 99,
        settings: `{"side_closed":[{"name":"board_and_batten_siding_8_ribs","label":"Board and Batten (8\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null},{"name":"board_and_batten_siding_10_ribs","label":"Board and Batten (10\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null},{"name":"board_and_batten_siding_12_ribs","label":"Board and Batten (12\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":null},{"name":"metal","label":"Metal","price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null,"applicable_wainscot_horizontal":null,"applicable_wainscot_vertical":["board_and_batten_siding","stackstone","wood_siding"]}],"end_closed":[{"name":"board_and_batten_siding_8_ribs","label":"Board and Batten (8\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null},{"name":"board_and_batten_siding_10_ribs","label":"Board and Batten (10\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null},{"name":"board_and_batten_siding_12_ribs","label":"Board and Batten (12\" Ribs)","min_height":6,"max_height":14,"distance_on_height":1,"distance_on_center":5,"price_type":"$","price_of":null,"percentage_amount":0,"panel_price_from":null,"panel_orientation":null}]}`
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("side_end_details", null, {});
  }
};
