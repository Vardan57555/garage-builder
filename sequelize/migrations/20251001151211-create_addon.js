"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("addons", {
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
      length: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      fourth_center_cost: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: '0'
      },
      risk_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      cert_pac_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      ground_certificate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      overhang: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      jtrim: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      interior_anchor: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      baserail_caulk: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      cut_leg_on_site_cost: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.dropTable("addons");
  }
};
