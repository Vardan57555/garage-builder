"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("siding_materials", [
      { id: 1, name: "Metal", slug: "metal", category: "Metal", created_at: now, updated_at: now, deleted_at: null },
      { id: 2, name: "Lap Siding", slug: "lap_siding", category: "Lap Siding,Gray Lap Siding", created_at: now, updated_at: now, deleted_at: null },
      { id: 3, name: "Wood Siding", slug: "wood_siding", category: "Wood Siding,Rustic Wood Siding,Wood Grain Designer Panels,Engineer Wood,Grey Wood", created_at: now, updated_at: now, deleted_at: null },
      { id: 6, name: "Metal - Horizontal", slug: "metal___horizontal", category: "Metal Horizontal", created_at: now, updated_at: now, deleted_at: null },
      { id: 7, name: "Metal - Vertical", slug: "metal___vertical", category: "Metal Vertical", created_at: now, updated_at: now, deleted_at: null },
      { id: 8, name: "Board and Batten Siding", slug: "board_and_batten_siding", category: "Board and Batten,Blue Board,Board and Batten (8\" Ribs),Board and Batten (10\" Ribs),Board and Batten (12\" Ribs)", created_at: now, updated_at: now, deleted_at: null },
      { id: 10, name: "Stackstone Ash Siding", slug: "stackstone", category: "Stackstone,Rock Sheet,Stackstone Horizontal,Stackstone Vertical,Light Rock,Stone Siding", created_at: now, updated_at: now, deleted_at: null },
      { id: 11, name: "Stone Siding", slug: "stone_siding", category: "Stone Wall,Stone Horizontal,Stone Vertical", created_at: now, updated_at: now, deleted_at: null },
      { id: 12, name: "Stackstone Horizontal", slug: "stackstone_horizontal", category: "Stackstone Horizontal", created_at: now, updated_at: now, deleted_at: null },
      { id: 13, name: "Stackstone Vertical", slug: "stackstone_vertical", category: "Stackstone Vertical,Light Rock,Stone Siding", created_at: now, updated_at: now, deleted_at: null },
      { id: 14, name: "Stone Horizontal", slug: "stone_horizontal", category: "Stone Horizontal", created_at: now, updated_at: now, deleted_at: null },
      { id: 15, name: "Stone Vertical", slug: "stone_vertical", category: "Stone Vertical,Stone Wall", created_at: now, updated_at: now, deleted_at: null },
      { id: 18, name: "Wood Siding Horizontal", slug: "wood_siding_horizontal", category: "Wood Horizontal", created_at: now, updated_at: now, deleted_at: null },
      { id: 19, name: "Wood Siding Vertical", slug: "wood_siding_vertical", category: "Wood Vertical,Wood Grain Designer Panels,Wood Siding", created_at: now, updated_at: now, deleted_at: null },
      { id: 20, name: "Board and Batten Metal Siding", slug: "board_and_batten_metal_siding", category: "Board and Batten (Flat)", created_at: now, updated_at: now, deleted_at: null },
      { id: 26, name: "Board and Batten Siding (8\" Ribs)", slug: "board_and_batten_siding_8_ribs", category: "Board and Batten (8\" Ribs)", created_at: now, updated_at: now, deleted_at: null },
      { id: 27, name: "Board and Batten Siding (10\" Ribs)", slug: "board_and_batten_siding_10_ribs", category: "Board and Batten (10\" Ribs)", created_at: now, updated_at: now, deleted_at: null },
      { id: 28, name: "Board and Batten Siding (12\" Ribs)", slug: "board_and_batten_siding_12_ribs", category: "Board and Batten (12\" Ribs)", created_at: now, updated_at: now, deleted_at: null },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("siding_materials", null, {});
  }
};
