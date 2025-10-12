"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("colored_screw", [
      {
        id: 67,
        map_id: 1529,
        start_width: 32,
        end_width: 50,
        start_length: 20,
        end_length: 50,
        start_height: 8,
        end_height: 18,
        start_price: 0.0,
        end_price: 0.0,
        cost_type: "%",
        cost: 3.0,
        percentage_of: "2,3",
        is_cumulative: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 374,
        map_id: 75,
        start_width: 12,
        end_width: 24,
        start_length: 20,
        end_length: 50,
        start_height: 6,
        end_height: 14,
        start_price: 0.0,
        end_price: 0.0,
        cost_type: "%",
        cost: 2.0,
        percentage_of: "2,3",
        is_cumulative: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: 375,
        map_id: 76,
        start_width: 6,
        end_width: 24,
        start_length: 20,
        end_length: 50,
        start_height: 6,
        end_height: 14,
        start_price: 0.0,
        end_price: 0.0,
        cost_type: "%",
        cost: 2.0,
        percentage_of: "2,3",
        is_cumulative: 0,
        created_at: now,
        updated_at: now
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("colored_screw", null, {});
  },
};
