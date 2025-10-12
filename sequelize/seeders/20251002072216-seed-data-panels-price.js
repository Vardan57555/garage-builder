"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_panels_price", [
      {
        id: 28,
        manufacturer_id: 4,
        region_id: 10,
        building_id: 1,
        panels_row: Buffer.from(
            "5b7b226c656e677468223a32302c22636f7374223a22313330222c226375745f70616e656c5f636f7374223a2230222c22686f72697a6f6e74616c5f726f6f665f70616e656c5f636f7374223a302c22766572746963616c5f70616e656c5f636f7374223a223333372e35222c22766572746963616c5f726f6f665f70616e656c5f636f7374223a302c2270616e656c5f6a7472696d223a223330222c2269735f70616e656c5f6a7472696d223a22796573222c226375745f70616e656c5f6a7472696d223a302c2269735f6375745f70616e656c5f6a7472696d223a226e6f227d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 29,
        manufacturer_id: 4,
        region_id: 10,
        building_id: 2,
        panels_row: Buffer.from(
            "5b7b226c656e677468223a223130222c22636f7374223a2231333022...",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_panels_price", null, {});
  },
};
