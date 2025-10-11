"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("truss_name", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      min_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      min_height: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      max_height: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_default: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      is_show: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      cost: {
        type: Sequelize.FLOAT(8, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      price_type: {
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      price_of: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("truss_name");
  },
};
