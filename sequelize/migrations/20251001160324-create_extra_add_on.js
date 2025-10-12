"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("extra_add_on", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      sheet_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sheet_label: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sheet_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      height: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      width: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      length: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      start_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      start_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      start_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      start_price: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      end_price: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      cost_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
      },
      price_of: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_taxable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_checkbox: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      is_cumulative: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_always_checked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      distance_on_center: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("extra_add_on");
  },
};
