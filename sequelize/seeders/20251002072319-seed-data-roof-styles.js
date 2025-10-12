"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_roof_styles", [
      { id: 1, name: "Regular" },
      { id: 2, name: "A Frame" },
      { id: 3, name: "Vertical" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_roof_styles", null, {});
  },
};
