"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cache_locks", {
      key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        primaryKey: true
      },
      owner: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      expiration: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cache_locks");
  }
};
