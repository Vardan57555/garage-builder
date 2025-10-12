"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("manufacturer_buildings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      building_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      building_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      roof_ids: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("manufacturer_buildings");
  },
};
