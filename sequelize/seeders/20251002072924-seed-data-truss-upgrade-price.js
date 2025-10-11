"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_truss_upgrade_price", [
      {
        id: 1,
        manufacturer_id: 11,
        region_id: 28,
        building_id: 1,
        sizes: "4,6",
        min_width: 12,
        max_width: 24,
        min_length: 20,
        max_length: 50,
        distance_on_width: 2,
        distance_on_length: 5,
        truss_upgrade_row: Buffer.from("5b7b223230223a2231323522,...5d", "hex"), // truncated for readability
        created_at: "2021-12-02 12:03:53",
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 2,
        manufacturer_id: 11,
        region_id: 28,
        building_id: 2,
        sizes: "4,6",
        min_width: 6,
        max_width: 24,
        min_length: 20,
        max_length: 50,
        distance_on_width: 2,
        distance_on_length: 5,
        truss_upgrade_row: Buffer.from("5b7b223230223a2236322e3522,...5d", "hex"), // truncated
        created_at: "2021-12-02 12:05:08",
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 3,
        manufacturer_id: 11,
        region_id: 31,
        building_id: 1,
        sizes: "4,6",
        min_width: 12,
        max_width: 24,
        min_length: 20,
        max_length: 50,
        distance_on_width: 2,
        distance_on_length: 5,
        truss_upgrade_row: Buffer.from("5b7b223230223a2231323522,...5d", "hex"), // truncated
        created_at: "2022-12-02 13:14:33",
        updated_at: null,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_truss_upgrade_price", null, {});
  },
};
