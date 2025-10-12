"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("manufacturer_default_buildings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      is_breezeway_building: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      image_name: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      region_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      state_ids: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      other_building_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      roof_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      size: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      wall: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      utility: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      utility_front: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      leanto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      leanto_size: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      leanto_wall: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      roof_color: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      trim_color: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      wall_color: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      wainscot_color: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      default_doors: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      leanto_data: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      central_roof_pitch: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      leanto_roof_pitch: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("manufacturer_default_buildings");
  },
};
