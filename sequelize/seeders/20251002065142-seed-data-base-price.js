"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_base_price", [
      {
        id: 214,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        min_width: 12,
        max_width: 24,
        min_length: 20,
        max_length: 40,
        min_height: 6,
        max_height: 20,
        distance_on_width: 2,
        distance_on_length: 5,
        building_structre_row: JSON.stringify([
          { structure: "12x20", regular_cost_14: "1510", regular_cost_12: "1510", box_style_cost_14: "1605", box_style_cost_12: "1605", vertical_roof_cost_14: "2150", vertical_roof_cost_12: "2150" },
          { structure: "12x25", regular_cost_14: "1805", regular_cost_12: "1805", box_style_cost_14: "1955", box_style_cost_12: "1955", vertical_roof_cost_14: "2650", vertical_roof_cost_12: "2650" },
          { structure: "12x30", regular_cost_14: "2205", regular_cost_12: "2205", box_style_cost_14: "2410", box_style_cost_12: "2410", vertical_roof_cost_14: "3195", vertical_roof_cost_12: "3195" },
          // ... include all other objects from your JSON array here
        ]),
        created_at: "2025-04-30 07:27:46",
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 215,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        min_width: 6,
        max_width: 24,
        min_length: 20,
        max_length: 40,
        min_height: 6,
        max_height: 20,
        distance_on_width: 2,
        distance_on_length: 5,
        building_structre_row: JSON.stringify([
          { structure: "6x20", regular_cost_14: "755", regular_cost_12: "755", box_style_cost_14: "802.5", box_style_cost_12: "802.5", vertical_roof_cost_14: "1075", vertical_roof_cost_12: "1075" },
          { structure: "6x25", regular_cost_14: "902.5", regular_cost_12: "902.5", box_style_cost_14: "977.5", box_style_cost_12: "977.5", vertical_roof_cost_14: "1325", vertical_roof_cost_12: "1325" },
          { structure: "6x30", regular_cost_14: "1102.5", regular_cost_12: "1102.5", box_style_cost_14: "1205", box_style_cost_12: "1205", vertical_roof_cost_14: "1597.5", vertical_roof_cost_12: "1597.5" },
        ]),
        created_at: "2025-04-30 08:03:24",
        updated_at: null,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_base_price", { id: [214, 215] });
  },
};
