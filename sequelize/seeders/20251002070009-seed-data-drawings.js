"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_drawings", [
      {
        id: 1,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        row_data: JSON.stringify([
          { name: "Generic Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "Engineered Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "None", is_cost: "1", cost_type: "$", cost: 0, is_default: "yes" },
        ]),
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 2,
        row_data: JSON.stringify([
          { name: "Generic Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "Engineered Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "None", is_cost: "1", cost_type: "$", cost: 0, is_default: "yes" },
        ]),
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 3,
        row_data: JSON.stringify([
          { name: "Generic Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "Engineered Drawing", is_cost: "1", cost_type: "$", cost: 0, is_default: "no" },
          { name: "None", is_cost: "1", cost_type: "$", cost: 0, is_default: "yes" },
        ]),
        created_at: now,
        updated_at: now
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_drawings", null, {});
  },
};
