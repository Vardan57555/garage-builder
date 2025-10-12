"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_component_type", [
      {
        id: 1,
        manufacturer_id: 12,
        region_id: 32,
        building_id: 1,
        component_type_row: Buffer.from(
            "5b7b22747970655f6e616d65223a22526f6c6c2d7570222c22636f6d706f6e656e745f747970655f6964223a2231227d2c7b22747970655f6e616d65223a2253656374696f6e616c222c22636f6d706f6e656e745f747970655f6964223a2231227d2c7b22747970655f6e616d65223a22526f6c6c2d7570222c22636f6d706f6e656e745f747970655f6964223a2232227d2c7b22747970655f6e616d65223a225374616e64617264222c22636f6d706f6e656e745f747970655f6964223a2233227d2c7b22747970655f6e616d65223a2239204c697465222c22636f6d706f6e656e745f747970655f6964223a2233227d2c7b22747970655f6e616d65223a22506c61696e222c22636f6d706f6e656e745f747970655f6964223a2234227d2c7b22747970655f6e616d65223a22576974682047726964222c22636f6d706f6e656e745f747970655f6964223a2234227d2c7b22747970655f6e616d65223a2246617578222c22636f6d706f6e656e745f747970655f6964223a2234227d5d",
            "hex"
        ),
        created_at: new Date("2019-06-11 10:50:20"),
        updated_at: new Date("2019-06-11 10:50:20"),
        deleted_at: null
      },
      {
        id: 2,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        component_type_row: Buffer.from(
            "5b7b22747970655f6e616d65223a2274657374222c22636f6d706f6e656e745f747970655f6964223a2231227d2c7b22747970655f6e616d65223a227465737461736466222c22636f6d706f6e656e745f747970655f6964223a2232227d5d",
            "hex"
        ),
        created_at: new Date("2019-06-11 10:58:48"),
        updated_at: new Date("2019-06-11 11:11:41"),
        deleted_at: null
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_component_type", null, {});
  }
};
