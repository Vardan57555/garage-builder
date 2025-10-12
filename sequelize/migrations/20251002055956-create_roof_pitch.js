"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roof_pitch", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      roof_ids: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: "1,2,3",
      },
      custom_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      roof_pitch: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      width: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      cost_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
      },
      is_default: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: "no",
      },
      length: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      percentage_of: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("roof_pitch");
  },
};
