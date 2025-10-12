"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("colored_screw", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      start_width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      end_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      start_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      end_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      start_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      end_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      start_price: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      end_price: {
        type: Sequelize.DOUBLE(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      cost_type: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      cost: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false
      },
      percentage_of: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: "1 => Total Building Amount 2 => Base Price 3 => Wall Price"
      },
      is_cumulative: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("colored_screw");
  }
};
