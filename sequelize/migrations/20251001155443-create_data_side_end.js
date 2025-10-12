"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_sides_ends", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      side_closed_rows: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      end_closed_rows: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      extra_panels_rows: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gable_ends_rows: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      wainscot_rows: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_sides_ends");
  },
};
