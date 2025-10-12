"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("cupola_types", [
      { id: 1, name: "With Windows", slug: "with_windows" },
      { id: 2, name: "Without Windows", slug: "without_windows" },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("cupola_types", null, {});
  }
};
