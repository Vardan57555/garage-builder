"use strict";

/** @type {import("sequelize-cli").Migration} */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("colors", {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: uuidv4()
      },
      sheet_name: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "metal"
      },
      sheet_label: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "Metal"
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      image_name: {
        type: Sequelize.STRING,
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
      manufacturer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      hex_value: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      percentage_of_cost: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      price_of: {
        type: Sequelize.STRING,
        allowNull: true
      },
      applicable_on: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      color_add_ons: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      applied_on: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: Date.now()
      },
      updated_at: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: Date.now()
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("colors");
  }
};
