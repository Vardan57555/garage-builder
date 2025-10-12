"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_gable_pricing_mappings", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        row_data: '[{"gable_map_id":"400","min_width":"6","max_width":"10","distance_on_width":"2","min_height":"6","max_height":"10","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"99","min_width":"25","max_width":"30","distance_on_width":"2","min_height":"6","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"558","min_width":"32","max_width":"40","distance_on_width":"2","min_height":"8","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"100","min_width":"42","max_width":"60","distance_on_width":"2","min_height":"8","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"}]',
        created_at: new Date("2025-04-04 11:05:53"),
        updated_at: new Date("2025-07-07 11:42:48"),
      },
      {
        id: 2,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 11,
        row_data: '[{"gable_map_id":"400","min_width":"6","max_width":"10","distance_on_width":"2","min_height":"6","max_height":"10","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"99","min_width":"25","max_width":"30","distance_on_width":"2","min_height":"6","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"558","min_width":"32","max_width":"40","distance_on_width":"2","min_height":"8","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"97","min_width":"12","max_width":"24","distance_on_width":"2","min_height":"6","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"}]',
        created_at: new Date("2025-04-07 13:09:11"),
        updated_at: new Date("2025-07-07 11:43:06"),
      },
      {
        id: 3,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 10,
        row_data: '[{"gable_map_id":"400","min_width":"6","max_width":"10","distance_on_width":"2","min_height":"6","max_height":"10","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"99","min_width":"25","max_width":"30","distance_on_width":"2","min_height":"6","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"558","min_width":"32","max_width":"40","distance_on_width":"2","min_height":"8","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"100","min_width":"42","max_width":"60","distance_on_width":"2","min_height":"8","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"},{"gable_map_id":"97","min_width":"12","max_width":"24","distance_on_width":"2","min_height":"6","max_height":"16","distance_on_height":"1","min_length":"20","max_length":"100","distance_on_length":"5"}]',
        created_at: new Date("2025-04-07 13:11:04"),
        updated_at: new Date("2025-04-07 13:11:04"),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_gable_pricing_mappings", null, {});
  },
};
