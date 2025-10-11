"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_colored_screw", [
      {
        id: 1,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        colored_screw_data: '[{"start_width":"12","end_width":"24","start_length":"20","end_length":"50","start_height":"6","end_height":"16","start_price":"0","end_price":"0","cost_type":"%","cost":"3","percentage_of":[1],"is_cumulative":false}]',
        created_at: "2023-04-24 11:58:30",
        updated_at: "2024-09-24 11:58:37",
        deleted_at: null,
      },
      {
        id: 2,
        manufacturer_id: 108,
        region_id: 213,
        building_id: 1,
        colored_screw_data: '[{"start_width":"12","end_width":"20","start_length":"20","end_length":"20","start_height":"6","end_height":"9","cost_type":"$","cost":"100","percentage_of":[null],"is_cumulative":false}, {"start_width":"12","end_width":"20","start_length":"21","end_length":"25","start_height":"6","end_height":"9","cost_type":"$","cost":"125","percentage_of":[null],"is_cumulative":false}]',
        created_at: "2023-04-27 10:44:35",
        updated_at: "2023-04-27 10:52:17",
        deleted_at: null,
      },
      {
        id: 3,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        colored_screw_data: '[{"start_width":"12","end_width":"24","start_length":"20","end_length":"40","start_height":"6","end_height":"16","start_price":0,"end_price":0,"cost_type":"$","cost":"100","percentage_of":[null],"is_cumulative":false}]',
        created_at: "2023-04-27 11:20:38",
        updated_at: "2025-06-13 06:37:19",
        deleted_at: null,
      },
      {
        id: 4,
        manufacturer_id: 108,
        region_id: 213,
        building_id: 2,
        colored_screw_data: '[{"start_width":"6","end_width":"6","start_length":"20","end_length":"20","start_height":"6","end_height":"9","cost_type":"$","cost":"37.5","percentage_of":[null],"is_cumulative":false}]',
        created_at: "2023-04-27 13:31:48",
        updated_at: "2023-05-01 05:38:17",
        deleted_at: null,
      },
      {
        id: 5,
        manufacturer_id: 107,
        region_id: 214,
        building_id: 1,
        colored_screw_data: '[{"start_width":"12","end_width":"24","start_length":"20","end_length":"50","start_height":"6","end_height":"15","cost_type":"%","cost":"3","percentage_of":[2,3],"is_cumulative":false}]',
        created_at: "2023-04-27 17:22:13",
        updated_at: "2023-04-27 17:22:13",
        deleted_at: null,
      },
      {
        id: 6,
        manufacturer_id: 107,
        region_id: 214,
        building_id: 2,
        colored_screw_data: '[{"start_width":"6","end_width":"24","start_length":"20","end_length":"50","start_height":"6","end_height":"16","cost_type":"%","cost":"3","percentage_of":[2,3],"is_cumulative":false}]',
        created_at: "2023-04-27 17:26:49",
        updated_at: "2023-04-27 17:26:49",
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_colored_screw", null, {});
  },
};
