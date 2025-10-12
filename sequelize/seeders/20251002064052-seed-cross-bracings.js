"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("cross_bracings", [
      { id: 68909, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 12, cost: 0 },
      { id: 68910, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 13, cost: 0 },
      { id: 68911, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 14, cost: 0 },
      { id: 68912, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 15, cost: 0 },
      { id: 68913, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 16, cost: 0 },
      { id: 68914, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 17, cost: 0 },
      { id: 68915, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 18, cost: 0 },
      { id: 68916, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 19, cost: 0 },
      { id: 68917, map_id: 408, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 6, length: 20, cost: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("cross_bracings", null, {});
  },
};
