"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("column_status", [
      { id: 14, map_id: 18, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 19, map_id: 24, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 26, map_id: 32, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 50, map_id: 67, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 60, map_id: 95, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 61, map_id: 96, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 63, map_id: 98, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 67, map_id: 102, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 70, map_id: 105, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 71, map_id: 106, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 135, map_id: 228, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 148, map_id: 244, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 156, map_id: 260, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 157, map_id: 261, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 158, map_id: 262, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 159, map_id: 263, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 203, map_id: 318, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 204, map_id: 319, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 205, map_id: 320, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 209, map_id: 324, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 271, map_id: 405, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 299, map_id: 439, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 300, map_id: 440, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 301, map_id: 441, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 302, map_id: 442, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 330, map_id: 470, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 424, map_id: 606, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
      { id: 427, map_id: 609, module: "length_add_on", column_name: "fourth_center_cost", status: 1 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("column_status", null, {});
  },
};
