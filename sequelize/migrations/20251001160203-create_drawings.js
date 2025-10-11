"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("drawings", {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      cost_type: {
        type: Sequelize.ENUM("$", "%"),
        allowNull: false,
        defaultValue: "$",
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      is_cost: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      is_default: {
        type: Sequelize.ENUM("yes", "no"),
        allowNull: false,
        defaultValue: "no",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("drawings");
  },
};
