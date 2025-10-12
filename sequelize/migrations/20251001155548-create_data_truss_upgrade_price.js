"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_truss_upgrade_price", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sizes: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      min_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      min_length: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_length: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      distance_on_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      distance_on_length: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      truss_upgrade_row: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_truss_upgrade_price");
  },
};
