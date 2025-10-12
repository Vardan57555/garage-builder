"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("extra_panels", {
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
      length: {
        type: Sequelize.SMALLINT.UNSIGNED,
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
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      cut_panel_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_panel_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      horizontal_roof_panel_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      vertical_roof_panel_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      panel_jtrim: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      is_panel_jtrim: {
        type: Sequelize.ENUM("yes", "no", "included"),
        allowNull: false,
        defaultValue: "no",
      },
      cut_panel_jtrim: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      is_cut_panel_jtrim: {
        type: Sequelize.ENUM("yes", "no", "included"),
        allowNull: false,
        defaultValue: "no",
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("extra_panels");
  },
};
