"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_window_price", [
      {
        id: 82,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        window_data: JSON.stringify({
          window: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "6 Grid Window", cost: "240", on_side_cost: "150", vertical_side_cost: 0 },
            { width: "30", height: "36", door_type: "window_with_black_grid_window", door_category: "Black Frame Window", cost: "250", on_side_cost: "150", vertical_side_cost: 0 }
          ],
          frameout: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "Standard", is_custom_size: null, frameout_cost_end: "85", frameout_cost_side: "85" },
            { width: "12-60", height: "12-60", door_type: "standard_window", door_category: "Standard", is_custom_size: true, frameout_cost_end: "85", frameout_cost_side: "85" }
          ],
          show_custom_size_frameout: "true",
          clearance_option_frameout: null
        }),
        created_at: null,
        updated_at: "2025-05-15 05:33:23",
        deleted_at: null
      },
      {
        id: 83,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        window_data: JSON.stringify({
          window: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "6 Grid Window", cost: "240", on_side_cost: "150", vertical_side_cost: 0 },
            { width: "30", height: "36", door_type: "window_with_black_grid_window", door_category: "Black Frame Window", cost: "250", on_side_cost: "150", vertical_side_cost: 0 }
          ],
          frameout: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "Standard", is_custom_size: null, frameout_cost_end: "85", frameout_cost_side: "85" },
            { width: "12-60", height: "12-60", door_type: "standard_window", door_category: "Standard", is_custom_size: true, frameout_cost_end: "85", frameout_cost_side: "85" }
          ],
          show_custom_size_frameout: "true",
          clearance_option_frameout: null
        }),
        created_at: null,
        updated_at: "2025-05-15 06:00:02",
        deleted_at: null
      },
      {
        id: 84,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 3,
        window_data: JSON.stringify({
          window: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "6 Grid Window", cost: "240", on_side_cost: "150", vertical_side_cost: 0 },
            { width: "30", height: "36", door_type: "window_with_black_grid_window", door_category: "Black Frame Window", cost: "250", on_side_cost: "150", vertical_side_cost: 0 }
          ],
          frameout: [
            { width: "30", height: "36", door_type: "standard_window", door_category: "Standard", is_custom_size: null, frameout_cost_end: "85", frameout_cost_side: "85" },
            { width: "12-60", height: "12-60", door_type: "standard_window", door_category: "Standard", is_custom_size: true, frameout_cost_end: "85", frameout_cost_side: "85" }
          ],
          show_custom_size_frameout: "true",
          clearance_option_frameout: null
        }),
        created_at: null,
        updated_at: "2025-05-15 06:00:37",
        deleted_at: null
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_window_price", null, {});
  }
};
