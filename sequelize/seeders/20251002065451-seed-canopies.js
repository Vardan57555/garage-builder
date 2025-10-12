"use strict";

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("canopies", [
      {
        id: 10,
        map_id: 1944,
        structure: "4x4",
        cost: 100.0,
        created_at: now,
        updated_at: now
      },
      {
        id: 12,
        map_id: 1944,
        structure: "4x4",
        cost: 520.0,
        created_at: now,
        updated_at: now
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("canopies", null, {});
  },
};
