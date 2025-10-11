"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("data_end_deluxe_two_tone_price", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      end_deluxe_two_tone_row: {
        type: Sequelize.BLOB("long"),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("data_end_deluxe_two_tone_price");
  }
};
