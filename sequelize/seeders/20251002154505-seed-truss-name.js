"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("truss_name", [
      { id: 1, map_id: 6, name: "SBST1", label: null, min_width: 6, max_width: 15, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 2, map_id: 2, name: "SBST1", label: null, min_width: 6, max_width: 15, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 3, map_id: 3, name: "SBST2", label: null, min_width: 26, max_width: 30, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 4, map_id: 4, name: "SBST3", label: null, min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 5, map_id: 4, name: "SBST3", label: null, min_width: 42, max_width: 50, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 6, map_id: 4, name: "SBST4", label: null, min_width: 52, max_width: 60, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 9, map_id: 7, name: "SBST2", label: null, min_width: 26, max_width: 30, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 10, map_id: 8, name: "SBST3", label: null, min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 11, map_id: 8, name: "SBST3", label: null, min_width: 42, max_width: 50, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 12, map_id: 8, name: "SBST4", label: null, min_width: 52, max_width: 60, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 13, map_id: 9, name: "SBST1", label: null, min_width: 12, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 14, map_id: 10, name: "SBST1", label: null, min_width: 6, max_width: 15, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 15, map_id: 11, name: "SBST2", label: null, min_width: 26, max_width: 30, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 16, map_id: 12, name: "SBST3", label: null, min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 17, map_id: 12, name: "SBST3", label: null, min_width: 42, max_width: 50, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 18, map_id: 12, name: "SBST4", label: null, min_width: 52, max_width: 60, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 19, map_id: 13, name: "ECT1", label: null, min_width: 12, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 20, map_id: 14, name: "ECT1", label: null, min_width: 6, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 21, map_id: 15, name: "ECT2", label: null, min_width: 26, max_width: 30, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 22, map_id: 16, name: "ECT3", label: null, min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 23, map_id: 17, name: "ECT1", label: null, min_width: 12, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 24, map_id: 18, name: "ECT2", label: null, min_width: 26, max_width: 30, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 25, map_id: 19, name: "ECT1", label: null, min_width: 12, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null },
      { id: 26, map_id: 20, name: "ECT1", label: null, min_width: 6, max_width: 24, min_height: 0, max_height: 0, is_default: 0, is_show: 0, cost: 0.00, price_type: "$", price_of: null }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("truss_name", null, {});
  }
};
