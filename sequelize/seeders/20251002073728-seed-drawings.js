"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("drawings", [
      { id: 1, map_id: 1, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 2, map_id: 1, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 3, map_id: 1, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 4, map_id: 2, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 5, map_id: 2, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 6, map_id: 2, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 7, map_id: 3, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 8, map_id: 3, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 9, map_id: 3, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 10, map_id: 4, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 11, map_id: 4, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 12, map_id: 4, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 13, map_id: 5, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 14, map_id: 5, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 15, map_id: 5, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 16, map_id: 6, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 17, map_id: 6, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 18, map_id: 6, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 19, map_id: 7, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 20, map_id: 7, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 21, map_id: 7, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 22, map_id: 8, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 23, map_id: 8, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 24, map_id: 8, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 25, map_id: 9, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 26, map_id: 9, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 27, map_id: 9, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 28, map_id: 10, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 29, map_id: 10, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 30, map_id: 10, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 31, map_id: 11, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 32, map_id: 11, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 33, map_id: 11, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 34, map_id: 12, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 35, map_id: 12, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 36, map_id: 12, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 85, map_id: 31, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 86, map_id: 31, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 87, map_id: 31, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 172, map_id: 75, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 173, map_id: 75, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 174, map_id: 75, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 175, map_id: 76, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 176, map_id: 76, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 177, map_id: 76, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 178, map_id: 77, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 179, map_id: 77, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 180, map_id: 77, name: "None", cost_type: "$", cost: 0, is_cost: 1, is_default: "yes" },
      { id: 181, map_id: 78, name: "Generic Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
      { id: 182, map_id: 78, name: "Engineered Drawing", cost_type: "$", cost: 0, is_cost: 1, is_default: "no" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("drawings", null, {});
  }
};
