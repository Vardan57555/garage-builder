"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("smaller_side_heights", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      smaller_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      leg_height_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      side_close_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      vertical_side_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      side_close_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_side_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      double_leg_baserail_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      leg_height_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      double_leg_baserail_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      lifttype: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lifttype_price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ladder_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      ladder_cost_12: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      side_close_cost_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_side_cost_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      side_close_cost_12_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_side_cost_12_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("smaller_side_heights");
  },
};
