"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("popular_colors", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      sheet_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: "metal",
      },
      sheet_label: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: "Metal",
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      roof_hex_value: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      trim_hex_value: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      wall_hex_value: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("popular_colors");
  },
};
