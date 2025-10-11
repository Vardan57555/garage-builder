"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("delux_two_tone", [
      {
        id: 8046, name: "metal", label: "Metal", length: 21, cost: 0, map_id: 98,
        on_end_horizontal: 0, on_end_vertical: 0, on_side_horizontal: 15, on_side_vertical: 63,
        width: 0, horizontal_cost_type: "$", vertical_cost_type: "$", horizontal_price_of: null, vertical_price_of: null
      },
      {
        id: 8047, name: "metal", label: "Metal", length: 22, cost: 0, map_id: 98,
        on_end_horizontal: 0, on_end_vertical: 0, on_side_horizontal: 20, on_side_vertical: 75,
        width: 0, horizontal_cost_type: "$", vertical_cost_type: "$", horizontal_price_of: null, vertical_price_of: null
      },
      {
        id: 8048, name: "metal", label: "Metal", length: 23, cost: 0, map_id: 98,
        on_end_horizontal: 0, on_end_vertical: 0, on_side_horizontal: 20, on_side_vertical: 75,
        width: 0, horizontal_cost_type: "$", vertical_cost_type: "$", horizontal_price_of: null, vertical_price_of: null
      },
      {
        id: 8091, name: "metal", label: "Metal", length: 35, cost: 0, map_id: 102,
        on_end_horizontal: 0, on_end_vertical: 0, on_side_horizontal: 30, on_side_vertical: 100,
        width: 0, horizontal_cost_type: "$", vertical_cost_type: "$", horizontal_price_of: null, vertical_price_of: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("delux_two_tone", null, {});
  }
};
