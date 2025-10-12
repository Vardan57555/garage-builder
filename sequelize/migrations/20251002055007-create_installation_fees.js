"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("installation_fees", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      start_width: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      end_width: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      start_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_length: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      start_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_height: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      end_wall: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      is_end_wall: {
        type: Sequelize.ENUM("yes", "no", "included"),
        allowNull: false,
        defaultValue: "no",
      },
      side_wall: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      is_side_wall: {
        type: Sequelize.ENUM("yes", "no", "included"),
        allowNull: false,
        defaultValue: "no",
      },
      type: {
        type: Sequelize.ENUM("garage_door", "walkin_door", "window"),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("installation_fees");
  },
};
