"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("manufacturers", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      logo: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      side_lean_to: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      end_lean_to: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      gable_lean_to: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      wrap_around: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      free_standing_lean_to: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      gable_building_without_pricing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allow_storage_movement: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("manufacturers");
  },
};
