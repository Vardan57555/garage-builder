"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_wrap_around_connection_price", {
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
      min_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      min_height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      distance_on_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      wrap_connection_row: {
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
    await queryInterface.dropTable("data_wrap_around_connection_price");
  },
};
