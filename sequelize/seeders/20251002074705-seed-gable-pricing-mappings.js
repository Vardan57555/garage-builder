"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("gable_pricing_mappings", [
      {
        id: 33,
        map_id: 236,
        gable_map_id: 400,
        min_width: 6,
        max_width: 10,
        distance_on_width: 2,
        min_height: 6,
        max_height: 10,
        distance_on_height: 1,
        min_length: 20,
        max_length: 100,
        distance_on_length: 5,
      },
      {
        id: 34,
        map_id: 236,
        gable_map_id: 99,
        min_width: 25,
        max_width: 30,
        distance_on_width: 2,
        min_height: 6,
        max_height: 16,
        distance_on_height: 1,
        min_length: 20,
        max_length: 100,
        distance_on_length: 5,
      },
      {
        id: 35,
        map_id: 236,
        gable_map_id: 558,
        min_width: 32,
        max_width: 40,
        distance_on_width: 2,
        min_height: 8,
        max_height: 16,
        distance_on_height: 1,
        min_length: 20,
        max_length: 100,
        distance_on_length: 5,
      },
      {
        id: 36,
        map_id: 236,
        gable_map_id: 100,
        min_width: 42,
        max_width: 60,
        distance_on_width: 2,
        min_height: 8,
        max_height: 16,
        distance_on_height: 1,
        min_length: 20,
        max_length: 100,
        distance_on_length: 5,
      },
      {
        id: 37,
        map_id: 236,
        gable_map_id: 97,
        min_width: 12,
        max_width: 24,
        distance_on_width: 2,
        min_height: 6,
        max_height: 16,
        distance_on_height: 1,
        min_length: 20,
        max_length: 100,
        distance_on_length: 5,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("gable_pricing_mappings", null, {});
  },
};
