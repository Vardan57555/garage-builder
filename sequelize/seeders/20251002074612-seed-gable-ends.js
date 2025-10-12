"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("gable_ends", [
      {
        id: 5453,
        map_id: 33,
        price_type: "$",
        price_of: null,
        width: 18,
        name: "metal",
        label: "Metal",
        uncertified: 0,
        certified: 175,
        vertical: 50,
        extended: 350,
        vertical_extended: 375,
        vertical_certified: 0,
        jtrim: 0,
        is_jtrim: "no",
      },
      {
        id: 5454,
        map_id: 33,
        price_type: "$",
        price_of: null,
        width: 19,
        name: "metal",
        label: "Metal",
        uncertified: 0,
        certified: 175,
        vertical: 50,
        extended: 350,
        vertical_extended: 375,
        vertical_certified: 0,
        jtrim: 0,
        is_jtrim: "no",
      },
      {
        id: 5455,
        map_id: 33,
        price_type: "$",
        price_of: null,
        width: 20,
        name: "metal",
        label: "Metal",
        uncertified: 0,
        certified: 175,
        vertical: 50,
        extended: 350,
        vertical_extended: 375,
        vertical_certified: 0,
        jtrim: 0,
        is_jtrim: "no",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("gable_ends", null, {});
  },
};
