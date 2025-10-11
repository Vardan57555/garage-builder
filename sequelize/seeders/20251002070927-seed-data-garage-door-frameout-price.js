"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_garage_door_frameout_price", [
      {
        id: 42,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        garage_door_frameout_row: Buffer.from("5b7b2269735f6669786564223a302c2269735f637573746f6d5f73697a65223a66616c73652c22...","hex"),
        custom_frameout_row: '{"show_custom_size":"false","clearance_option":null,"is_checked":true,"end":"20","side":"20"}',
        created_at: '2025-06-19 11:33:27',
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 43,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        garage_door_frameout_row: Buffer.from("5b7b2269735f6669786564223a302c226f6e5f656e64223a2231355022...","hex"),
        custom_frameout_row: '{"is_checked":true,"end":"20","side":"20"}',
        created_at: '2024-08-13 11:28:30',
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 44,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 3,
        garage_door_frameout_row: Buffer.from("5b7b2269735f6669786564223a302c226f6e5f656e64223a2231355022...","hex"),
        custom_frameout_row: '{"is_checked":true,"end":"20","side":"20"}',
        created_at: '2025-01-29 07:32:42',
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 45,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 7,
        garage_door_frameout_row: Buffer.from("5b7b2269735f6669786564223a302c226f6e5f656e64223a2231323522...","hex"),
        custom_frameout_row: null,
        created_at: '2021-05-20 19:16:25',
        updated_at: null,
        deleted_at: null,
      },
      {
        id: 46,
        manufacturer_id: 3,
        region_id: 9,
        building_id: 1,
        garage_door_frameout_row: Buffer.from("5b7b2269735f6669786564223a302c226f6e5f656e64223a2231355022...","hex"),
        custom_frameout_row: '{"is_checked":true,"end":"20","side":"20"}',
        created_at: '2025-01-29 07:46:33',
        updated_at: null,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_garage_door_frameout_price", null, {});
  },
};
