"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("jobs", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      queue: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      payload: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      attempts: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },
      reserved_at: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      available_at: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("jobs");
  },
};
