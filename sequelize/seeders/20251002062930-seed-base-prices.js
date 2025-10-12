"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("base_prices", [
      { id: 1271153, structure: "18x21", map_id: 33, regular_cost: 0, box_style_cost: 2295, vertical_roof_cost: 2495, gauge: 14 },
      { id: 1271154, structure: "18x22", map_id: 33, regular_cost: 0, box_style_cost: 2695, vertical_roof_cost: 2995, gauge: 14 },
      { id: 1271155, structure: "18x23", map_id: 33, regular_cost: 0, box_style_cost: 2695, vertical_roof_cost: 2995, gauge: 14 },
      { id: 1271156, structure: "18x24", map_id: 33, regular_cost: 0, box_style_cost: 2695, vertical_roof_cost: 2995, gauge: 14 },
      { id: 1271157, structure: "18x25", map_id: 33, regular_cost: 0, box_style_cost: 2695, vertical_roof_cost: 2995, gauge: 14 },
      { id: 1271158, structure: "18x26", map_id: 33, regular_cost: 0, box_style_cost: 2695, vertical_roof_cost: 2995, gauge: 14 },
      { id: 1271159, structure: "18x27", map_id: 33, regular_cost: 0, box_style_cost: 3195, vertical_roof_cost: 3595, gauge: 14 },
      { id: 1271160, structure: "18x28", map_id: 33, regular_cost: 0, box_style_cost: 3195, vertical_roof_cost: 3595, gauge: 14 },
      { id: 1271161, structure: "18x29", map_id: 33, regular_cost: 0, box_style_cost: 3195, vertical_roof_cost: 3595, gauge: 14 },
      { id: 1271162, structure: "18x30", map_id: 33, regular_cost: 0, box_style_cost: 3195, vertical_roof_cost: 3595, gauge: 14 },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("base_prices", null, {});
  }
};
