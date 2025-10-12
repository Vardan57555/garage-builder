"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("states", [
      { id: 1, name: "Alabama", code: "AL", region_id: 0 },
      { id: 2, name: "Arizona", code: "AZ", region_id: 0 },
      { id: 3, name: "Arkansas", code: "AR", region_id: 0 },
      { id: 4, name: "California", code: "CA", region_id: 0 },
      { id: 5, name: "Colorado", code: "CO", region_id: 0 },
      { id: 6, name: "Connecticut", code: "CT", region_id: 0 },
      { id: 7, name: "Delaware", code: "DE", region_id: 0 },
      { id: 8, name: "Florida", code: "FL", region_id: 0 },
      { id: 9, name: "Georgia", code: "GA", region_id: 0 },
      { id: 10, name: "Idaho", code: "ID", region_id: 0 },
      { id: 11, name: "Illinois", code: "IL", region_id: 0 },
      { id: 12, name: "Indiana", code: "IN", region_id: 0 },
      { id: 13, name: "Iowa", code: "IA", region_id: 0 },
      { id: 14, name: "Kansas", code: "KS", region_id: 0 },
      { id: 15, name: "Kentucky", code: "KY", region_id: 0 },
      { id: 16, name: "Louisiana", code: "LA", region_id: 0 },
      { id: 17, name: "Maryland", code: "MD", region_id: 0 },
      { id: 18, name: "Massachusetts", code: "MA", region_id: 0 },
      { id: 19, name: "Michigan", code: "MI", region_id: 0 },
      { id: 20, name: "Minnesota", code: "MN", region_id: 0 },
      { id: 21, name: "Mississippi", code: "MS", region_id: 0 },
      { id: 22, name: "Missouri", code: "MO", region_id: 0 },
      { id: 23, name: "Montana", code: "MT", region_id: 0 },
      { id: 24, name: "Nebraska", code: "NE", region_id: 0 },
      { id: 25, name: "Nevada", code: "NV", region_id: 0 },
      { id: 26, name: "New Jersey", code: "NJ", region_id: 0 },
      { id: 27, name: "New Mexico", code: "NM", region_id: 0 },
      { id: 28, name: "New York", code: "NY", region_id: 0 },
      { id: 29, name: "North Carolina", code: "NC", region_id: 0 },
      { id: 30, name: "North Dakota", code: "ND", region_id: 0 },
      { id: 31, name: "Ohio", code: "OH", region_id: 0 },
      { id: 32, name: "Oklahoma", code: "OK", region_id: 0 },
      { id: 33, name: "Oregon", code: "OR", region_id: 0 },
      { id: 34, name: "Pennsylvania", code: "PA", region_id: 0 },
      { id: 35, name: "South Carolina", code: "SC", region_id: 0 },
      { id: 36, name: "South Dakota", code: "SD", region_id: 0 },
      { id: 37, name: "Tennessee", code: "TN", region_id: 0 },
      { id: 38, name: "Texas", code: "TX", region_id: 0 },
      { id: 39, name: "Utah", code: "UT", region_id: 0 },
      { id: 40, name: "Virginia", code: "VA", region_id: 0 },
      { id: 41, name: "West Virginia", code: "WV", region_id: 0 },
      { id: 42, name: "Wisconsin", code: "WI", region_id: 0 },
      { id: 43, name: "Wyoming", code: "WY", region_id: 0 },
      { id: 44, name: "Washington", code: "WA", region_id: 0 },
      { id: 45, name: "Maine", code: "ME", region_id: 0 },
      { id: 46, name: "New Hampshire", code: "NH", region_id: 0 },
      { id: 47, name: "Rhode Island", code: "RI", region_id: 0 },
      { id: 48, name: "Vermont", code: "VT", region_id: 0 },
      { id: 49, name: "Alaska", code: "AK", region_id: 0 },
      { id: 50, name: "Hawaii", code: "HI", region_id: 0 },
      { id: 51, name: "Washington DC", code: "DC", region_id: 0 }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("states", null, {});
  }
};
