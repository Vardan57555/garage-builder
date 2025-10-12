"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("four_feet_center", {
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
      sheet_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sheet_type: {
        type: Sequelize.ENUM(
            "end",
            "side",
            "both_end",
            "both_side",
            "height_width",
            "height_length"
        ),
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
        type: Sequelize.ENUM("$", "%", "sqft", "ft"),
        allowNull: false,
        defaultValue: "$",
      },
      price_of_add_ons: {
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
    await queryInterface.dropTable("four_feet_center");
  },
};
