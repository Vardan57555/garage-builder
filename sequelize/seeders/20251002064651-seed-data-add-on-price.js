"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("data_add_on_price", [
      {
        id: 2,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 1,
        add_on_row: Buffer.from(
            "5b7b226c656e677468223a32302c22666f757274685f63656e7465725f636f7374223a223525222c227269736b5f636f7374223a2230222c22636572745f7061635f636f7374223a302c2267726f756e645f6365727469666963617465223a302c226f76657268616e67223a2230222c226a7472696d223a2230222c22696e746572696f725f616e63686f72223a2230222c22626173657261696c5f6361756c6b223a302c226375745f6c65675f6f6e5f736974655f636f7374223a307d2c7b226c656e677468223a32352c22666f757274685f63656e7465725f636f7374223a223525222c227269736b5f636f7374223a302c22636572745f7061635f636f7374223a302c2267726f756e645f6365727469666963617465223a302c226f76657268616e67223a2230222c226a7472696d223a302c22696e746572696f725f616e63686f72223a302c22626173657261696c5f6361756c6b223a302c226375745f6c65675f6f6e5f736974655f636f7374223a307d...",
            "hex"
        ),
        columns_status:
            '{"fourth_center_cost":true,"risk_cost":false,"cert_pac_cost":false,"ground_certificate":false,"overhang":false,"jtrim":false,"interior_anchor":false,"baserail_caulk":false,"cut_leg_on_site_cost":false}',
        created_at: new Date("2019-05-30 10:21:40"),
        updated_at: new Date("2025-04-18 12:40:21"),
        deleted_at: null,
      },
      {
        id: 3,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 2,
        add_on_row: Buffer.from("5b7b226c656e677468223a32302c22666f757274685f63656e7465725f636f7374223a223525222c...", "hex"),
        columns_status:
            '{"fourth_center_cost":true,"risk_cost":false,"cert_pac_cost":false,"ground_certificate":false,"overhang":false,"jtrim":false,"interior_anchor":false}',
        created_at: new Date("2019-05-30 10:22:19"),
        updated_at: new Date("2024-02-14 11:04:12"),
        deleted_at: null,
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_add_on_price", null, {});
  },
};
