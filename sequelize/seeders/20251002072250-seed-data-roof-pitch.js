"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_roof_pitch", [
      {
        id: 2,
        manufacturer_id: 17,
        region_id: 35,
        building_id: 1,
        roofpitch_row: Buffer.from("5b7b223230223a2230222c223235223a2230222c223330223a2230222c223335223a2230222c223430223a2230222c22726f6f665f7069746368223a22335c2f3132222c227769647468223a2231322d3234222c22636f73745f74797065223a2224222c22636f7374223a2230222c2269735f64656661756c74223a22796573222c2270657263656e746167655f6f66223a6e756c6c2c22726f6f665f696473223a6e756c6c2c22637573746f6d5f6e616d65223a6e756c6c7d5d", "hex"),
        created_at: "2020-06-17 09:00:20",
        updated_at: "2025-01-21 08:48:51",
        deleted_at: null
      },
      {
        id: 3,
        manufacturer_id: 17,
        region_id: 35,
        building_id: 3,
        roofpitch_row: Buffer.from("5b7b223230223a2230222c223235223a2230222c223330223a2230222c223335223a2230222c223430223a2230222c22726f6f665f7069746368223a22335c2f3132222c227769647468223a2232362d3330222c22636f73745f74797065223a2224222c22636f7374223a2230222c2269735f64656661756c74223a22796573222c2270657263656e746167655f6f66223a6e756c6c2c22726f6f665f696473223a6e756c6c2c22637573746f6d5f6e616d65223a6e756c6c7d5d", "hex"),
        created_at: "2020-06-17 09:12:09",
        updated_at: "2025-01-03 11:30:02",
        deleted_at: null
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_roof_pitch", null, {});
  }
};
