"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("states_bk", [
      { id: 1, name: "Alabama", region_id: 0 },
      { id: 2, name: "Arizona", region_id: 0 },
      { id: 3, name: "Arkansas", region_id: 0 },
      { id: 4, name: "California", region_id: 0 },
      { id: 5, name: "Colorado", region_id: 0 },
      { id: 6, name: "Connecticut", region_id: 0 },
      { id: 7, name: "Delaware", region_id: 0 },
      { id: 8, name: "Florida", region_id: 0 },
      { id: 9, name: "Georgia", region_id: 0 },
      { id: 10, name: "Idaho", region_id: 0 },
      { id: 11, name: "Illinois", region_id: 0 },
      { id: 12, name: "Indiana", region_id: 0 },
      { id: 13, name: "Iowa", region_id: 0 },
      { id: 14, name: "Kansas", region_id: 0 },
      { id: 15, name: "Kentucky", region_id: 0 },
      { id: 16, name: "Louisiana", region_id: 0 },
      { id: 17, name: "Maryland", region_id: 0 },
      { id: 18, name: "Massachusetts", region_id: 0 },
      { id: 19, name: "Michigan", region_id: 0 },
      { id: 20, name: "Minnesota", region_id: 0 },
      { id: 21, name: "Mississippi", region_id: 0 },
      { id: 22, name: "Missouri", region_id: 0 },
      { id: 23, name: "Montana", region_id: 0 },
      { id: 24, name: "Nebraska", region_id: 0 },
      { id: 25, name: "Nevada", region_id: 0 },
      { id: 26, name: "New Jersey", region_id: 0 },
      { id: 27, name: "New Mexico", region_id: 0 },
      { id: 28, name: "New York", region_id: 0 },
      { id: 29, name: "North Carolina", region_id: 0 },
      { id: 30, name: "North Dakota", region_id: 0 },
      { id: 31, name: "Ohio", region_id: 0 },
      { id: 32, name: "Oklahoma", region_id: 0 },
      { id: 33, name: "Oregon", region_id: 0 },
      { id: 34, name: "Pennsylvania", region_id: 0 },
      { id: 35, name: "South Carolina", region_id: 0 },
      { id: 36, name: "South Dakota", region_id: 0 },
      { id: 37, name: "Tennessee", region_id: 0 },
      { id: 38, name: "Texas", region_id: 0 },
      { id: 39, name: "Utah", region_id: 0 },
      { id: 40, name: "Virginia", region_id: 0 },
      { id: 41, name: "West Virginia", region_id: 0 },
      { id: 42, name: "Wisconsin", region_id: 0 },
      { id: 43, name: "Wyoming", region_id: 0 },
      { id: 44, name: "Washington", region_id: 0 },
      { id: 45, name: "Maine", region_id: 0 },
      { id: 46, name: "New Hampshire", region_id: 0 },
      { id: 47, name: "Rhode Island", region_id: 0 },
      { id: 48, name: "Vermont", region_id: 0 },
      { id: 49, name: "Alaska", region_id: 0 },
      { id: 50, name: "Hawaii", region_id: 0 },
      { id: 51, name: "Washington DC", region_id: 0 }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("states_bk", null, {});
  }
};
