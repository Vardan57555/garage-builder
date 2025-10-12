"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("garage_doors", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      is_custom_size: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      height: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      width_range: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      height_range: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      color_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      color_cost_combination: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      certified_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      chain_hoist: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      is_45_degree_angle: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      "45_degree_angle": {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      vertical_side_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      side_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      is_certified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_chain_hoist: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_header_seal: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      header_seal: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      is_automatic_openers: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      automatic_openers: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      end_clearance: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      side_clearance: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      door_type: {
        type: Sequelize.STRING(128),
        allowNull: false,
        defaultValue: "roll_up_garage_doors",
      },
      door_category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_default: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      show_custom_size: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      door_add_ons: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("garage_doors");
  },
};
