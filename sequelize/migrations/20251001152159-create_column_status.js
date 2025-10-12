"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("column_status", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      module: {
        type: Sequelize.ENUM('length_add_on', 'width_add_on'),
        allowNull: false
      },
      column_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("column_status");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_column_status_module";'); // Clean up ENUM type
  }
};
