"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_side_connection_price", {
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
      side_connection_row: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_side_connection_price");
  },
};
