"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("four_feet_mapping", [
      {
        id: 2,
        map_id: 97,
        certificate_id: 7277,
        gauge: "0",
        doc: "4",
        siding_material: "wood_siding",
        is_4_feet_cost: "no",
        is_bow_cost: "no",
        min_width: 0,
        max_width: 0,
        min_height: 2,
        max_height: 10,
        roof_pitch: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("four_feet_mapping", null, {});
  },
};
