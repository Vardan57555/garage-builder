"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("windows", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      is_custom_size: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      height: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      width_range: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      height_range: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      on_side_cost: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      vertical_side_cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      frameout_cost_side: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      frameout_cost_end: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      door_type: {
        type: Sequelize.STRING(128),
        allowNull: false,
        defaultValue: 'standard_windows',
      },
      door_category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_default: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('window','framout','frameout','custom_window','custom_frameout'),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("windows");
  },
};
