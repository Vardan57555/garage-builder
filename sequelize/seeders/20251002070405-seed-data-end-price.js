"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_end_price", [
      {
        id: 194,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        min_width: 12,
        max_width: 24,
        min_height: 6,
        max_height: 20,
        distance_on_width: 2,
        gauge_prices_12: false,
        other_leg: false,
        each_end_structure_row: JSON.stringify({
          height: 6,
          "12_h": "525",
          "12_v": "120",
          "12_h_other": 0,
          "12_v_other": 0
        }),
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_end_price", null, {});
  },
};
