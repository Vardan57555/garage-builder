"use strict";

/** @type {import("sequelize-cli").Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("additional_features", {
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
      additional_feature: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      cost_type: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      cost: {
        type: Sequelize.FLOAT.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      percentage_of: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: "1 => Total Building Amount 2 => Base Price 3 => Wall Price"
      },
      is_cumulative: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      feature_type: {
        type: Sequelize.ENUM('additional_feature', 'parts_drop_off'),
        allowNull: false,
        defaultValue: 'additional_feature'
      },
      is_outside_extra_item: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "0:hide,1:show"
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
    await queryInterface.dropTable("additional_features");
  }
};
