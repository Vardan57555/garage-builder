"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("addons_width", [
      { id: 11601, map_id: 277, width: 12, peak_braces: 12, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11602, map_id: 277, width: 13, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11603, map_id: 277, width: 14, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11604, map_id: 277, width: 15, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11605, map_id: 277, width: 16, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11606, map_id: 277, width: 17, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11607, map_id: 277, width: 18, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11608, map_id: 277, width: 19, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11609, map_id: 277, width: 20, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11610, map_id: 277, width: 21, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11611, map_id: 277, width: 22, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11612, map_id: 277, width: 23, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11613, map_id: 277, width: 24, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11640, map_id: 279, width: 12, peak_braces: 12, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11641, map_id: 279, width: 13, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11642, map_id: 279, width: 14, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11643, map_id: 279, width: 15, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11644, map_id: 279, width: 16, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11645, map_id: 279, width: 17, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11646, map_id: 279, width: 18, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11647, map_id: 279, width: 19, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11648, map_id: 279, width: 20, peak_braces: 24, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11649, map_id: 279, width: 21, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11650, map_id: 279, width: 22, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11651, map_id: 279, width: 23, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
      { id: 11652, map_id: 279, width: 24, peak_braces: 48, overhang: 0, end_cross_bracing: 0, jtrim: 0, fourth_center_end_cost: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("addons_width", null, {});
  },
};
