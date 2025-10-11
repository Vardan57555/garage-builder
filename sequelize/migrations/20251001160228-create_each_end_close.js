"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("each_end_close", {
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
      price_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      price_of: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "Metal",
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "metal",
      },
      width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      end_close_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      certified_end_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_ends_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      end_close_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_ends_cost_12: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      end_close_cost_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_ends_cost_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      end_close_cost_12_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_ends_cost_12_other: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("each_end_close");
  },
};
