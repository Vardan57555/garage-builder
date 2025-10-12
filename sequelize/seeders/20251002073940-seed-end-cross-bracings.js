"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("end_cross_bracings", [
      { id: 8798, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 7, width: 26, cost: 0 },
      { id: 8799, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 7, width: 27, cost: 0 },
      { id: 8800, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 7, width: 28, cost: 0 },
      { id: 8801, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 7, width: 29, cost: 0 },
      { id: 8802, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 7, width: 30, cost: 0 },
      { id: 8803, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 8, width: 26, cost: 0 },
      { id: 8804, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 8, width: 27, cost: 0 },
      { id: 8805, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 8, width: 28, cost: 0 },
      { id: 8806, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 8, width: 29, cost: 0 },
      { id: 8807, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 8, width: 30, cost: 0 },
      { id: 8808, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 9, width: 26, cost: 0 },
      { id: 8809, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 9, width: 27, cost: 0 },
      { id: 8810, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 9, width: 28, cost: 0 },
      { id: 8811, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 9, width: 29, cost: 0 },
      { id: 8812, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 9, width: 30, cost: 0 },
      { id: 8813, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 10, width: 26, cost: 0 },
      { id: 8814, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 10, width: 27, cost: 0 },
      { id: 8815, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 10, width: 28, cost: 0 },
      { id: 8816, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 10, width: 29, cost: 0 },
      { id: 8817, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 10, width: 30, cost: 0 },
      { id: 8818, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 11, width: 26, cost: 0 },
      { id: 8819, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 11, width: 27, cost: 0 },
      { id: 8820, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 11, width: 28, cost: 0 },
      { id: 8821, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 11, width: 29, cost: 0 },
      { id: 8822, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 11, width: 30, cost: 0 },
      { id: 8823, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 12, width: 26, cost: 0 },
      { id: 8824, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 12, width: 27, cost: 0 },
      { id: 8825, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 12, width: 28, cost: 0 },
      { id: 8826, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 12, width: 29, cost: 0 },
      { id: 8827, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 12, width: 30, cost: 0 },
      { id: 8828, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 13, width: 26, cost: 0 },
      { id: 8829, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 13, width: 27, cost: 0 },
      { id: 8830, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 13, width: 28, cost: 0 },
      { id: 8831, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 13, width: 29, cost: 0 },
      { id: 8832, map_id: 348, sheet_name: "diagonal_braces", sheet_label: "Diagonal Braces", is_default: "no", height: 13, width: 30, cost: 0 }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("end_cross_bracings", null, {});
  }
};
