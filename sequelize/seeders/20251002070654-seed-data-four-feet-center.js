"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_four_feet_center", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        row_data: '{"end":[{"sheet_name":"4\' Feet on Center","sheet_type":"end","sheet_data":[{"width":"10","cost":".","price_of_add_ons":[{"price_of":[],"cost":0}]},{"width":0,"cost":0,"price_of_add_ons":[{"price_of":[],"cost":0}]}],"cost_type":"$"}]}',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_four_feet_center", null, {});
  },
};
