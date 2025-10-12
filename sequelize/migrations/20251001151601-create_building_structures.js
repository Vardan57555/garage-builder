"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("building_structures", {
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
      building_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      roof_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      frame_length: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      min_start_length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      start_length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      end_length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      distance_on_length: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 5
      },
      start_height: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      min_height: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      max_height: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      min_start_width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      min_width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      max_width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      fixed_width: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      distance_on_width: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 2
      },
      building_max_length: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false
      },
      conditions: {
        type: Sequelize.TEXT("long"),
        allowNull: true
      },
      distance_on_center: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      default_gauge: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 14
      },
      created_at: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: Date.now()
      },
      updated_at: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: Date.now()
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("building_structures");
  }
};
