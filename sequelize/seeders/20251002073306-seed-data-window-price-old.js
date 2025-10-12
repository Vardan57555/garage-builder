"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_window_price_old", [
      {
        id: 82,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        window_row: JSON.stringify([
          { width: 30, height: 30, door_type: "standard_window", door_category: "Standard", cost: "220", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" },
          { width: 30, height: 36, door_type: "standard_window", door_category: "Standard", cost: "240", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" }
        ]),
        created_at: null,
        updated_at: "2022-06-15 07:35:27",
        deleted_at: null
      },
      {
        id: 83,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        window_row: JSON.stringify([
          { width: 30, height: 30, door_type: "standard_window", door_category: "Standard", cost: "220", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" },
          { width: 30, height: 36, door_type: "standard_window", door_category: "Standard", cost: "240", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" }
        ]),
        created_at: null,
        updated_at: "2022-06-15 07:36:38",
        deleted_at: null
      },
      {
        id: 84,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 3,
        window_row: JSON.stringify([
          { width: 30, height: 30, door_type: "standard_window", door_category: "Standard", cost: "220", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" },
          { width: 30, height: 36, door_type: "standard_window", door_category: "Standard", cost: "240", on_side_cost: 0, vertical_side_cost: 0, frameout_cost_end: "85", frameout_cost_side: "85" }
        ]),
        created_at: null,
        updated_at: "2022-06-15 07:38:02",
        deleted_at: null
      },
      // Add remaining rows (85–93) similarly, converting window_row JSON to JSON.stringify
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_window_price_old", null, {});
  }
};
