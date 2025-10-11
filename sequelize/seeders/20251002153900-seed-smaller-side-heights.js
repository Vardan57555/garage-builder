"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("smaller_side_heights", [
      { id: 79116, map_id: 2018, width: 26, height: 6, smaller_height: 6, length: 20, leg_height_cost: 0, side_close_cost: 0, vertical_side_cost: 0, side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0, leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0, ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0, side_close_cost_12_other: 0, vertical_side_cost_12_other: 0 },
      { id: 79117, map_id: 2018, width: 26, height: 6, smaller_height: 6, length: 21, leg_height_cost: 0, side_close_cost: 0, vertical_side_cost: 0, side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0, leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0, ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0, side_close_cost_12_other: 0, vertical_side_cost_12_other: 0 },
      { id: 79118, map_id: 2018, width: 26, height: 6, smaller_height: 6, length: 22, leg_height_cost: 0, side_close_cost: 0, vertical_side_cost: 0, side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0, leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0, ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0, side_close_cost_12_other: 0, vertical_side_cost_12_other: 0 },
      { id: 79119, map_id: 2018, width: 26, height: 6, smaller_height: 6, length: 23, leg_height_cost: 0, side_close_cost: 0, vertical_side_cost: 0, side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0, leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0, ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0, side_close_cost_12_other: 0, vertical_side_cost_12_other: 0 },
      { id: 79120, map_id: 2018, width: 26, height: 6, smaller_height: 6, length: 24, leg_height_cost: 0, side_close_cost: 0, vertical_side_cost: 0, side_close_cost_12: 0, vertical_side_cost_12: 0, double_leg_baserail_cost: 0, leg_height_cost_12: 0, double_leg_baserail_cost_12: 0, lifttype: 0, lifttype_price: 0, ladder_cost: 0, ladder_cost_12: 0, side_close_cost_other: 0, vertical_side_cost_other: 0, side_close_cost_12_other: 0, vertical_side_cost_12_other: 0 },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("smaller_side_heights", null, {});
  }
};
