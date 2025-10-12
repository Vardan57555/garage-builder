"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("overhang", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      sheet_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sheet_type: {
        type: Sequelize.ENUM("end", "side", "both_end", "both_side"),
        allowNull: true,
      },
      width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      cost_type: {
        type: Sequelize.ENUM("$", "%", "sqft"),
        allowNull: false,
        defaultValue: "$",
      },
      price_of: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("overhang");
  },
};
