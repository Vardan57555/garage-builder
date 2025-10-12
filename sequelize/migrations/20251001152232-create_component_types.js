"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("component_types", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      type_name: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      component_type_id: {
        type: Sequelize.TINYINT,
        allowNull: true,
        comment: 'Garage Door - 1, Garage Door Frameout - 2, Walkin Door - 3, Window - 4'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("component_types");
  }
};
