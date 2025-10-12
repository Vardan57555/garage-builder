"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_insulation_price", [
      {
        id: 1,
        manufacturer_id: 12,
        region_id: 32,
        building_id: 1,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a223234222c22636f7374223a22322e3635227d5d",
            "hex"
        ),
        created_at: "2019-05-13 13:29:45",
        updated_at: "2022-11-03 05:42:23",
        deleted_at: null,
      },
      {
        id: 2,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2232222c22636f7374223a22312e35227d2c7b22696e73756c6174696f6e5f6964223a2237222c22636f7374223a2233227d5d",
            "hex"
        ),
        created_at: "2019-05-29 09:54:46",
        updated_at: "2021-07-12 13:36:17",
        deleted_at: null,
      },
      {
        id: 3,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 1,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2231222c22636f7374223a22312e3530227d5d",
            "hex"
        ),
        created_at: "2019-05-30 10:44:57",
        updated_at: "2021-03-04 10:21:20",
        deleted_at: null,
      },
      {
        id: 4,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 3,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2231222c22636f7374223a22312e3530227d5d",
            "hex"
        ),
        created_at: "2019-05-30 11:17:08",
        updated_at: "2021-03-04 12:41:55",
        deleted_at: null,
      },
      {
        id: 5,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 1,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2232222c22636f7374223a22312e3235227d5d",
            "hex"
        ),
        created_at: "2019-06-05 17:08:34",
        updated_at: "2021-07-14 14:52:17",
        deleted_at: null,
      },
      {
        id: 6,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 2,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2232222c22636f7374223a22312e3235227d5d",
            "hex"
        ),
        created_at: "2019-06-05 17:08:34",
        updated_at: "2021-07-14 14:53:16",
        deleted_at: null,
      },
      {
        id: 7,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 3,
        insulations_row: Buffer.from(
            "5b7b22696e73756c6174696f6e5f6964223a2232222c22636f7374223a22312e3235227d5d",
            "hex"
        ),
        created_at: "2019-06-05 17:08:34",
        updated_at: "2021-07-14 14:54:28",
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_insulation_price", null, {});
  },
};
