"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("gable_pricing_mappings", {
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
      gable_map_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      min_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      max_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      distance_on_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      min_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      max_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      distance_on_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      min_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      max_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      distance_on_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("gable_pricing_mappings");
  },
};
