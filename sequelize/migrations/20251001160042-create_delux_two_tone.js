"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("delux_two_tone", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "metal",
      },
      label: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "Metal",
      },
      length: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      on_end_horizontal: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      on_end_vertical: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      on_side_horizontal: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      on_side_vertical: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      width: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
      },
      horizontal_cost_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      vertical_cost_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      horizontal_price_of: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      vertical_price_of: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("delux_two_tone");
  },
};
