"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_additional_feature", [
      {
        id: 1,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        additionl_row: Buffer.from("5b7b226164646974696f6e616c5f66656174757265223a2232362047412050616e656c2055706772616465222c22636f73745f74797065223a2225222c22636f7374223a223130222c2270657263656e746167655f6f66223a5b315d2c22666561747572655f74797065223a226164646974696f6e616c5f66656174757265222c2269735f63756d756c6174697665223a66616c73657d5d", "hex"),
        created_at: "2020-01-07 08:40:04",
        updated_at: "2023-12-07 07:25:44",
        deleted_at: null,
      },
      {
        id: 2,
        manufacturer_id: 8,
        region_id: 24,
        building_id: 1,
        additionl_row: Buffer.from("5b7b226164646974696f6e616c5f66656174757265223a22436f6c6f726564204d6174636820536372657773222c22...", "hex"), // truncated for readability
        created_at: "2020-02-05 13:34:37",
        updated_at: "2025-05-28 07:04:23",
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_additional_feature", null, {});
  },
};
