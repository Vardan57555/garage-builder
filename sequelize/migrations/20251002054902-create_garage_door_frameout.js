"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("garage_door_frameout", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_fixed: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      is_custom_size: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      on_end: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      on_side: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      dutch_cost: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      height: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      frame_out_length: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      frame_out_height: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      building_height: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      building_width: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      building_length: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      dutch_cost_side: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      is_header_bar: {
        type: Sequelize.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      header_bar: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      end_clearance: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      side_clearance: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      legs_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("garage_door_frameout");
  },
};
