"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("side_closed", [
      {
        id: 3852,
        map_id: 100,
        name: "board_and_batten_siding",
        label: "Board and Batten",
        price_type: "$",
        price_of: null,
        height: 6,
        length: 20,
        side_close_cost: 0,
        vertical_side_cost: 980,
        side_close_cost_12: 0,
        vertical_side_cost_12: 0,
        side_close_cost_other: 0,
        vertical_side_cost_other: 0,
        side_close_cost_12_other: 0,
        vertical_side_cost_12_other: 0
      },
      {
        id: 3853,
        map_id: 100,
        name: "board_and_batten_siding",
        label: "Board and Batten",
        price_type: "$",
        price_of: null,
        height: 6,
        length: 21,
        side_close_cost: 0,
        vertical_side_cost: 1199,
        side_close_cost_12: 0,
        vertical_side_cost_12: 0,
        side_close_cost_other: 0,
        vertical_side_cost_other: 0,
        side_close_cost_12_other: 0,
        vertical_side_cost_12_other: 0
      },
      {
        id: 3854,
        map_id: 100,
        name: "board_and_batten_siding",
        label: "Board and Batten",
        price_type: "$",
        price_of: null,
        height: 6,
        length: 22,
        side_close_cost: 0,
        vertical_side_cost: 1199,
        side_close_cost_12: 0,
        vertical_side_cost_12: 0,
        side_close_cost_other: 0,
        vertical_side_cost_other: 0,
        side_close_cost_12_other: 0,
        vertical_side_cost_12_other: 0
      },
      // ... continue adding all other rows following the same pattern
      {
        id: 3911,
        map_id: 100,
        name: "board_and_batten_siding",
        label: "Board and Batten",
        price_type: "$",
        price_of: null,
        height: 7,
        length: 48,
        side_close_cost: 0,
        vertical_side_cost: 2931,
        side_close_cost_12: 0,
        vertical_side_cost_12: 0,
        side_close_cost_other: 0,
        vertical_side_cost_other: 0,
        side_close_cost_12_other: 0,
        vertical_side_cost_12_other: 0
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("side_closed", null, {});
  }
};
