"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_end_deluxe_two_tone_price", [
      {
        id: 49,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        end_deluxe_two_tone_row: Buffer.from("5b7b227769647468223a223132222c226f6e5f656e645f686f72697a6f6e74616c223a2230222c226f6e5f656e645f766572746963616c223a22323030222c226f6e5f656e645f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f656e645f766572746963616c5f74797065223a2224227d2c7b227769647468223a223134222c226f6e5f656e645f686f72697a6f6e74616c223a302c226f6e5f656e645f766572746963616c223a22323530222c226f6e5f656e645f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f656e645f766572746963616c5f74797065223a2224227d5d", "hex"),
        created_at: new Date('2023-08-25 06:43:14'),
        updated_at: null,
        deleted_at: null
      },
      {
        id: 50,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 2,
        end_deluxe_two_tone_row: Buffer.from("5b7b227769647468223a2236222c226f6e5f656e645f686f72697a6f6e74616c223a302c226f6e5f656e645f766572746963616c223a22313030222c226f6e5f656e645f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f656e645f766572746963616c5f74797065223a2224227d2c7b227769647468223a2237222c226f6e5f656e645f686f72697a6f6e74616c223a302c226f6e5f656e645f766572746963616c223a22313235222c226f6e5f656e645f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f656e645f766572746963616c5f74797065223a2224227d5d", "hex"),
        created_at: new Date('2023-08-29 12:23:00'),
        updated_at: null,
        deleted_at: null
      },
      {
        id: 51,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 3,
        end_deluxe_two_tone_row: Buffer.from("5b7b227769647468223a223236222c226f6e5f656e645f686f72697a6f6e74616c223a302c226f6e5f656e645f766572746963616c223a22343530227d2c7b227769647468223a223238222c226f6e5f656e645f686f72697a6f6e74616c223a302c226f6e5f656e645f766572746963616c223a22353030227d5d", "hex"),
        created_at: new Date('2021-07-13 16:49:38'),
        updated_at: null,
        deleted_at: null
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_end_deluxe_two_tone_price", null, {});
  }
};
