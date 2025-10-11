"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("side_heights", [
      {
        id: 214587, map_id: 33, width: 0, height: 13, smaller_height: 0, length: 21,
        leg_height_cost: 0, side_close_cost: 338, vertical_side_cost: 200,
        side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0,
        leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0,
        ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0,
        side_close_cost_12_other: 0, vertical_side_cost_12_other: 0
      },
      {
        id: 214588, map_id: 33, width: 0, height: 13, smaller_height: 0, length: 22,
        leg_height_cost: 0, side_close_cost: 423, vertical_side_cost: 250,
        side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0,
        leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0,
        ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0,
        side_close_cost_12_other: 0, vertical_side_cost_12_other: 0
      },
      {
        id: 214589, map_id: 33, width: 0, height: 13, smaller_height: 0, length: 23,
        leg_height_cost: 0, side_close_cost: 423, vertical_side_cost: 250,
        side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0,
        leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0,
        ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0,
        side_close_cost_12_other: 0, vertical_side_cost_12_other: 0
      },
      {
        id: 214625, map_id: 33, width: 0, height: 14, smaller_height: 0, length: 28,
        leg_height_cost: 0, side_close_cost: 560, vertical_side_cost: 300,
        side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 140,
        leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0,
        ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0,
        side_close_cost_12_other: 0, vertical_side_cost_12_other: 0
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("side_heights", null, {});
  }
};
