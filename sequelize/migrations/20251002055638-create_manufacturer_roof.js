"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("manufacturer_roofs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      roof_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      roof_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("manufacturer_roofs");
  },
};
