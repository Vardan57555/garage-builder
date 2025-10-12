"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("walkin_doors_old", [
      { id: 618, map_id: 33, width: 36, height: 80, cost: 200, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 619, map_id: 34, width: 36, height: 80, cost: 200, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 795, map_id: 98, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 799, map_id: 102, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 1143, map_id: 72, width: 36, height: 80, cost: 295, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 1208, map_id: 68, width: 36, height: 72, cost: 250, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 1209, map_id: 68, width: 36, height: 80, cost: 300, vertical_side_cost: 75, on_side_cost: 0, frameout_cost_side: 0, frameout_cost_end: 0, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 2044, map_id: 105, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 2045, map_id: 105, width: 36, height: 80, cost: 680, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 2455, map_id: 106, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 2456, map_id: 106, width: 36, height: 80, cost: 680, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 5541, map_id: 244, width: 36, height: 80, cost: 225, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 7821, map_id: 51, width: 36, height: 84, cost: 770, vertical_side_cost: 150, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 7822, map_id: 51, width: 48, height: 84, cost: 795, vertical_side_cost: 150, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 9600, map_id: 18, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 9610, map_id: 24, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 9615, map_id: 96, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 9634, map_id: 32, width: 36, height: 80, cost: 275, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 10952, map_id: 155, width: 36, height: 84, cost: 795, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
      { id: 10953, map_id: 155, width: 48, height: 84, cost: 895, vertical_side_cost: 0, on_side_cost: 0, frameout_cost_side: 85, frameout_cost_end: 85, door_type: 'standard_walkin', door_category: 'Man Door', is_default: null },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("walkin_doors_old", null, {});
  }
};
