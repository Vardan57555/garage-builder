"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_base_price", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      min_width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      min_length: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_length: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      min_height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      distance_on_width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      distance_on_length: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      building_structre_row: {
        type: Sequelize.TEXT("long"),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_base_price");
  }
};
