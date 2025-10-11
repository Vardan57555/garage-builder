"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_garage_door_price", [
      {
        id: 119,
        manufacturer_id: 4,
        region_id: 10,
        building_id: 1,
        garage_door_row: Buffer.from(
            "5b7b2269735f637573746f6d5f73697a65223a66616c7365,...",
            "hex"
        ),
        column_status: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_garage_door_price", null, {});
  },
};
