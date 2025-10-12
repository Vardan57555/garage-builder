"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("addons_width", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      },
      width: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      peak_braces: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      overhang: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      end_cross_bracing: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      jtrim: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      fourth_center_end_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.dropTable("addons_width");
  }
};
