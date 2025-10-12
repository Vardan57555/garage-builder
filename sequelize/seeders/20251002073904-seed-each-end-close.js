"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("each_end_close", [
      { id: 31089, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 18, height: 13, end_close_cost: 950, certified_end_cost: 0, vertical_ends_cost: 250, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31090, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 19, height: 13, end_close_cost: 1100, certified_end_cost: 0, vertical_ends_cost: 275, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31091, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 20, height: 13, end_close_cost: 1100, certified_end_cost: 0, vertical_ends_cost: 275, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31092, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 21, height: 13, end_close_cost: 1250, certified_end_cost: 0, vertical_ends_cost: 300, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31093, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 22, height: 13, end_close_cost: 1250, certified_end_cost: 0, vertical_ends_cost: 300, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31094, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 23, height: 13, end_close_cost: 1400, certified_end_cost: 0, vertical_ends_cost: 325, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31095, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 24, height: 13, end_close_cost: 1400, certified_end_cost: 0, vertical_ends_cost: 325, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31096, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 18, height: 14, end_close_cost: 1040, certified_end_cost: 0, vertical_ends_cost: 250, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31097, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 19, height: 14, end_close_cost: 1205, certified_end_cost: 0, vertical_ends_cost: 275, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31098, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 20, height: 14, end_close_cost: 1205, certified_end_cost: 0, vertical_ends_cost: 275, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31099, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 21, height: 14, end_close_cost: 1370, certified_end_cost: 0, vertical_ends_cost: 300, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31100, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 22, height: 14, end_close_cost: 1370, certified_end_cost: 0, vertical_ends_cost: 300, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31101, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 23, height: 14, end_close_cost: 1535, certified_end_cost: 0, vertical_ends_cost: 325, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
      { id: 31102, map_id: 33, price_type: "$", price_of: null, label: "Metal", name: "metal", width: 24, height: 14, end_close_cost: 1535, certified_end_cost: 0, vertical_ends_cost: 325, end_close_cost_12: 0, vertical_ends_cost_12: 0, end_close_cost_other: 0, vertical_ends_cost_other: 0, end_close_cost_12_other: 0, vertical_ends_cost_12_other: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("each_end_close", null, {});
  }
};
