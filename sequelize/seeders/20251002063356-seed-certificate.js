"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    const now = new Date();

    await queryInterface.bulkInsert("certificate", [
      {
        id: 188,
        certificate_id: 0,
        name: "40 LBS Snow Load Certified",
        gauge: 0,
        certified: 1,
        distance_on_center: 5.0,
        map_id: 251,
        is_default: "no",
        surface: 3,
        min_width: 0,
        max_width: 0,
        percentage_of_cost: 0,
        percentage_of: "building_amount",
        created_at: now,
        updated_at: now,
      },
      {
        id: 335,
        certificate_id: 0,
        name: "40 PSF Snow Load Certified",
        gauge: 14,
        certified: 1,
        distance_on_center: 0.0,
        map_id: 124,
        is_default: "no",
        surface: 3,
        min_width: 0,
        max_width: 0,
        percentage_of_cost: 0,
        percentage_of: "building_amount",
        created_at: now,
        updated_at: now,
      },
      {
        id: 371,
        certificate_id: 0,
        name: "105 MPH + 40 PSF Certified",
        gauge: 14,
        certified: 1,
        distance_on_center: 5.0,
        map_id: 129,
        is_default: "no",
        surface: 3,
        min_width: 0,
        max_width: 0,
        percentage_of_cost: 0,
        percentage_of: "building_amount",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkDelete("certificate", null, {});
  },
};
