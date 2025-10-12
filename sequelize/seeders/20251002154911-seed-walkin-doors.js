"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("walkin_doors", [
      { id: 147, map_id: 296, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 1400, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 100, frameout_cost_end: 100, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'walkin' },
      { id: 148, map_id: 296, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 1400, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 100, frameout_cost_end: 100, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'frameout' },
      { id: 1410, map_id: 248, is_custom_size: 0, width: 32, height: 72, width_range: null, height_range: null, cost: 250, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'walkin' },
      { id: 1411, map_id: 248, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 300, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'walkin' },
      { id: 1412, map_id: 248, is_custom_size: 0, width: 32, height: 72, width_range: null, height_range: null, cost: 0, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 75, frameout_cost_end: 75, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'frameout' },
      { id: 1413, map_id: 248, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 0, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 75, frameout_cost_end: 75, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'frameout' },
      { id: 1432, map_id: 250, is_custom_size: 0, width: 32, height: 72, width_range: null, height_range: null, cost: 250, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'walkin' },
      { id: 1433, map_id: 250, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 300, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'walkin' },
      { id: 1434, map_id: 250, is_custom_size: 0, width: 32, height: 72, width_range: null, height_range: null, cost: 0, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 75, frameout_cost_end: 75, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'frameout' },
      { id: 1435, map_id: 250, is_custom_size: 0, width: 36, height: 80, width_range: null, height_range: null, cost: 0, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 75, frameout_cost_end: 75, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null, type: 'frameout' },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("walkin_doors", null, {});
  }
};
