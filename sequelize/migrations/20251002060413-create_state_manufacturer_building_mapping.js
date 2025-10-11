"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("state_manufacturer_building_mapping", {
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      state_ids: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      building_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      lean_to_building_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      region_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      heavy_snow: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      default_building: {
        type: Sequelize.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      is_new_leg_height_structure: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: "0:No,1:Yes",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("state_manufacturer_building_mapping");
  },
};
