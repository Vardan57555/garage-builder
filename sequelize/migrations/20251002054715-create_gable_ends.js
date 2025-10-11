"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("gable_ends", {
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
      width: {
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
      uncertified: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      certified: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      vertical: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      extended: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      vertical_extended: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      vertical_certified: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      jtrim: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      is_jtrim: {
        type: Sequelize.ENUM("yes", "no", "included"),
        allowNull: false,
        defaultValue: "no",
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("gable_ends");
  },
};
