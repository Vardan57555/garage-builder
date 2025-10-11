"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_leg_price", {
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
      min_height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      length_commas_values: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      gauge_prices_12: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      side_prices_gauge_12: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      side_other_leg: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      building_structre_row: {
        type: Sequelize.TEXT("long"),
        allowNull: true
      },
      side_row: {
        type: Sequelize.TEXT("long"),
        allowNull: true
      },
      leg_height_width_structure_row: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
        comment: "New structure with width"
      },
      applicable_wainscot_horizontal: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      applicable_wainscot_vertical: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_leg_price");
  }
};
