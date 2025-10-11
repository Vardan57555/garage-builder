"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("certificate", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      certificate_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      gauge: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      certified: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      distance_on_center: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: true,
        defaultValue: 0.0
      },
      map_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      is_default: {
        type: Sequelize.STRING(5),
        allowNull: true,
        defaultValue: "no"
      },
      surface: {
        type: Sequelize.TINYINT,
        allowNull: true,
        defaultValue: 1,
        comment: "concrete 1 ground 2 all 3"
      },
      min_width: {
        type: Sequelize.SMALLINT,
        allowNull: true,
        defaultValue: 0
      },
      max_width: {
        type: Sequelize.SMALLINT,
        allowNull: true,
        defaultValue: 0
      },
      percentage_of_cost: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0
      },
      percentage_of: {
        type: Sequelize.ENUM('building_amount','base_price','dealer_deposit','base_height_price'),
        allowNull: true
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
    await queryInterface.dropTable("certificate");
  }
};
