"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("connection_end_fees", {
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
      width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0
      },
      end_cost: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0
      },
      length: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      end_leanto_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      added_building_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      is_l_and_t_fee: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("connection_end_fees");
  }
};
