"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_colors", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(25),
        allowNull: true
      },
      red_value: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      green_value: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      blue_value: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      hex_value: {
        type: Sequelize.STRING(50),
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_colors");
  }
};
