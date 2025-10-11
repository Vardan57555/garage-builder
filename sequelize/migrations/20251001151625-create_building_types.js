"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("building_types", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      manu_1: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_2: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_3: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_4: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_5: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_6: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_7: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_8: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_9: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_10: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_11: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      manu_12: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      manu_13: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      manu_14: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      manu_15: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      manu_16: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      manu_17: {
        type: Sequelize.STRING(150),
        allowNull: true
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
    await queryInterface.dropTable("building_types");
  }
};
