"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_four_feet_mapping", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        row_data: '[{"certificate_id":7277,"gauge":"0","doc":"4","siding_material":"wood_siding","is_4_feet_cost":"no","is_bow_cost":"no","min_width":"0","max_width":"0","min_height":"2","max_height":"10","roof_pitch":null}]',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_four_feet_mapping", null, {});
  },
};
