"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("windows", [
      { id: 161, map_id: 296, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 162, map_id: 296, is_custom_size: 0, width: 24, height: 36, width_range: null, height_range: null, cost: 220, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 163, map_id: 296, is_custom_size: 0, width: 36, height: 36, width_range: null, height_range: null, cost: 325, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 164, map_id: 296, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 165, map_id: 296, is_custom_size: 0, width: 24, height: 36, width_range: null, height_range: null, cost: 220, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 166, map_id: 296, is_custom_size: 0, width: 36, height: 36, width_range: null, height_range: null, cost: 325, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 80, frameout_cost_end: 80, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 395, map_id: 92, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 175, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 396, map_id: 92, is_custom_size: 0, width: 30, height: 40, width_range: null, height_range: null, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 397, map_id: 92, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 0, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 398, map_id: 92, is_custom_size: 0, width: 30, height: 40, width_range: null, height_range: null, cost: 0, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 415, map_id: 93, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 175, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 416, map_id: 93, is_custom_size: 0, width: 30, height: 40, width_range: null, height_range: null, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'window' },
      { id: 417, map_id: 93, is_custom_size: 0, width: 30, height: 30, width_range: null, height_range: null, cost: 0, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
      { id: 418, map_id: 93, is_custom_size: 0, width: 30, height: 40, width_range: null, height_range: null, cost: 0, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, door_type: 'standard_window', door_category: 'Standard', is_default: null, type: 'frameout' },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("windows", null, {});
  }
};
