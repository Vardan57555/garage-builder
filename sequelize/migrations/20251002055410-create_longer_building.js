"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("longer_buildings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ft_type: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      length: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      type: {
        type: Sequelize.ENUM("length", "height", "width"),
        allowNull: true,
        defaultValue: "length",
      },
      rp_3_12: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Roof pitch 3/12",
      },
      rp_4_12: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Roof pitch 4/12",
      },
      rp_5_12: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Roof pitch 5/12",
      },
      rp_6_12: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Roof pitch 6/12",
      },
      combinations: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      map_ids: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("longer_buildings");
  },
};
