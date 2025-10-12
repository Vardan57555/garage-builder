"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("data_endcrossbracing_price", [
      {
        id: 3,
        manufacturer_id: 6,
        region_id: 19,
        building_id: 7,
        min_width: 32,
        max_width: 60,
        min_height: 8,
        max_height: 18,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from(
            "5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...",
            "hex"
        ),
        created_at: new Date("2021-02-08 11:45:32"),
        updated_at: new Date("2025-02-12 05:28:43"),
        deleted_at: null
      },
      {
        id: 4,
        manufacturer_id: 6,
        region_id: 20,
        building_id: 7,
        min_width: 32,
        max_width: 60,
        min_height: 8,
        max_height: 18,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from(
            "5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...",
            "hex"
        ),
        created_at: new Date("2021-02-08 13:27:06"),
        updated_at: new Date("2025-02-12 05:31:53"),
        deleted_at: null
      },
      {
        id: 5,
        manufacturer_id: 6,
        region_id: 19,
        building_id: 1,
        min_width: 12,
        max_width: 24,
        min_height: 6,
        max_height: 14,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from(
            "5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...",
            "hex"
        ),
        created_at: new Date("2021-02-09 07:40:27"),
        updated_at: new Date("2025-02-12 05:26:07"),
        deleted_at: null
      },
      {
        id: 6,
        manufacturer_id: 6,
        region_id: 19,
        building_id: 2,
        min_width: 6,
        max_width: 24,
        min_height: 6,
        max_height: 14,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from("5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...", "hex"),
        created_at: new Date("2021-02-09 07:57:39"),
        updated_at: new Date("2025-02-12 05:32:31"),
        deleted_at: null
      },
      {
        id: 7,
        manufacturer_id: 6,
        region_id: 19,
        building_id: 3,
        min_width: 26,
        max_width: 30,
        min_height: 6,
        max_height: 14,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from("5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...", "hex"),
        created_at: new Date("2021-02-09 08:01:26"),
        updated_at: new Date("2025-02-12 05:28:03"),
        deleted_at: null
      },
      {
        id: 8,
        manufacturer_id: 6,
        region_id: 20,
        building_id: 1,
        min_width: 12,
        max_width: 24,
        min_height: 6,
        max_height: 14,
        distance_on_width: 2,
        end_crossbracing_row: Buffer.from("5b7b2273686565745f6e616d65223a2022646961676f6e616c5f62726163657322...", "hex"),
        created_at: new Date("2021-02-09 07:57:39"),
        updated_at: new Date("2025-02-12 05:32:31"),
        deleted_at: null
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_endcrossbracing_price", null, {});
  }
};
