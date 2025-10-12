"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("extra_bows", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      single_leg: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      double_leg: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      ladder_leg: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("extra_bows");
  },
};
