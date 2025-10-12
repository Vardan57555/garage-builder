"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("garage_door_colors", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(25),
        allowNull: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      red_value: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      green_value: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      blue_value: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hex_value: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      percentage_of_cost: {
        type: Sequelize.TINYINT,
        allowNull: true,
      },
    }, {
      charset: "utf8mb3",
      engine: "InnoDB",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("garage_door_colors");
  }
};
