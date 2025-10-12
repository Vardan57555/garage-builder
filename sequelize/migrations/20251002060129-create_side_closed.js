"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("side_closed", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
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
      price_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      price_of: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      length: {
        type: Sequelize.SMALLINT.UNSIGNED,
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
    await queryInterface.dropTable("side_closed");
  },
};
