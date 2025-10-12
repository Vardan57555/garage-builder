"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("base_prices", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      structure: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      regular_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      box_style_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      vertical_roof_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      gauge: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    await queryInterface.dropTable("base_prices");
  }
};
