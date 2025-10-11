"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("windows_old", [
      { id: 442, map_id: 33, width: 24, height: 36, cost: 150, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 443, map_id: 33, width: 30, height: 36, cost: 180, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 444, map_id: 34, width: 24, height: 36, cost: 150, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 445, map_id: 34, width: 30, height: 36, cost: 180, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 596, map_id: 98, width: 30, height: 30, cost: 180, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 597, map_id: 98, width: 30, height: 36, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 604, map_id: 102, width: 30, height: 30, cost: 180, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 605, map_id: 102, width: 30, height: 36, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 947, map_id: 72, width: 30, height: 30, cost: 225, on_side_cost: 0, vertical_side_cost: 50, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 982, map_id: 68, width: 30, height: 30, cost: 225, on_side_cost: 0, vertical_side_cost: 50, frameout_cost_side: 0, frameout_cost_end: 0, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 1813, map_id: 105, width: 30, height: 30, cost: 180, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
      { id: 1814, map_id: 105, width: 30, height: 36, cost: 200, on_side_cost: 0, vertical_side_cost: 0, frameout_cost_side: 70, frameout_cost_end: 70, type: 0, door_type: 'standard_window', door_category: 'Standard', is_default: null },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("windows_old", null, {});
  }
};
