"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cross_bracings", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      sheet_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "diagonal_braces"
      },
      sheet_label: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "Diagonal Braces"
      },
      is_default: {
        type: Sequelize.ENUM("included", "no", "yes"),
        allowNull: false,
        defaultValue: "no"
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      length: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("cross_bracings");
  }
};
