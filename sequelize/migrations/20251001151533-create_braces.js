"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("braces", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      length: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      bracing_feet: {
        type: Sequelize.SMALLINT.UNSIGNED,
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
    await queryInterface.dropTable("braces");
  }
};
