"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("four_feet_mapping", {
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
      certificate_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      gauge: {
        type: Sequelize.ENUM("0", "12", "14"),
        allowNull: false,
        defaultValue: "0",
      },
      doc: {
        type: Sequelize.ENUM("4", "5"),
        allowNull: false,
        defaultValue: "4",
      },
      siding_material: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_4_feet_cost: {
        type: Sequelize.ENUM("no", "yes", "included", "include_with_price"),
        allowNull: false,
      },
      is_bow_cost: {
        type: Sequelize.ENUM("no", "yes", "included", "include_with_price"),
        allowNull: false,
      },
      min_width: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      max_width: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      roof_pitch: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("four_feet_mapping");
  },
};
