"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_crossbracing_price", [
      {
        id: 1,
        manufacturer_id: 25,
        region_id: 59,
        building_id: 17,
        min_height: 6,
        max_height: 18,
        length_commas_values: "4,5,10,15,21,26,31,36,41,46,51",
        crossbracings_row: Buffer.from(
            "5b7b2273686565745f6e616d65223a2022646961676f6e616c5f627261636573222c2273686565745f6c6162656c223a2022446961676f6e616c20427261636573222c22726f775f64617461223a205b7b2234223a2230222c2235223a2230222c223130223a2230222c223135223a2230222c223230223a2230222c223235223a2230222c223330223a2230222c223335223a2230222c223430223a2230222c223435223a2230222c223530223a2230222c22686569676874223a362c2269735f64656661756c74223a226e6f227d5d7d5d",
            "hex"
        ),
        created_at: new Date("2020-07-13 12:22:06"),
        updated_at: new Date("2021-11-19 07:00:23"),
        deleted_at: null,
      },
      {
        id: 2,
        manufacturer_id: 25,
        region_id: 59,
        building_id: 18,
        min_height: 6,
        max_height: 18,
        length_commas_values: "4,5,10,15,21,26,31,36,41,46,51",
        crossbracings_row: Buffer.from(
            "5b7b2273686565745f6e616d65223a2022646961676f6e616c5f627261636573222c2273686565745f6c6162656c223a2022446961676f6e616c20427261636573222c22726f775f64617461223a205b7b2234223a2230222c2235223a2230222c223130223a2230222c223135223a2230222c223230223a2230222c223235223a2230222c223330223a2230222c223335223a2230222c223430223a2230222c223435223a2230222c223530223a2230222c22686569676874223a362c2269735f64656661756c74223a226e6f227d5d7d5d",
            "hex"
        ),
        created_at: new Date("2020-07-21 05:56:54"),
        updated_at: new Date("2021-11-19 07:01:12"),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_crossbracing_price", null, {});
  },
};
