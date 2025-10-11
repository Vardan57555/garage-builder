"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roof_styles", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      manu_1: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_2: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_3: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_4: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_5: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_6: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_7: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_8: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_9: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_10: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_11: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      manu_12: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      manu_13: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      manu_14: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      manu_15: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      manu_16: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      manu_17: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("roof_styles");
  },
};
