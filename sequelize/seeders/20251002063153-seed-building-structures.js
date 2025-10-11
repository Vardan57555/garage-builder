"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("building_structures", [
      {
        id: 1,
        map_id: 1,
        building_id: 1,
        roof_id: 1,
        frame_length: 1,
        min_start_length: 20,
        start_length: 20,
        end_length: 35,
        distance_on_length: 5,
        start_height: 6,
        min_height: 6,
        max_height: 16,
        min_start_width: 12,
        min_width: 12,
        max_width: 24,
        fixed_width: null,
        distance_on_width: 2,
        building_max_length: 35,
        conditions: JSON.stringify({
          condition: [
            {
              name: "Double Legs & Baserails",
              legs_type: "double",
              is_default: "Y",
              min_height: "15",
              max_height: "16",
              min_width: "0",
              max_width: "0",
            },
          ],
        }),
        distance_on_center: 5,
        default_gauge: 14,
      },
      {
        id: 2,
        map_id: 1,
        building_id: 1,
        roof_id: 2,
        frame_length: 1,
        min_start_length: 20,
        start_length: 20,
        end_length: 35,
        distance_on_length: 5,
        start_height: 6,
        min_height: 6,
        max_height: 16,
        min_start_width: 12,
        min_width: 12,
        max_width: 24,
        fixed_width: null,
        distance_on_width: 2,
        building_max_length: 35,
        conditions: JSON.stringify({
          condition: [
            {
              name: "Double Legs & Baserails",
              legs_type: "double",
              is_default: "Y",
              min_height: "15",
              max_height: "16",
              min_width: "0",
              max_width: "0",
            },
          ],
        }),
        distance_on_center: 5,
        default_gauge: 14,
      },
      {
        id: 3,
        map_id: 1,
        building_id: 1,
        roof_id: 3,
        frame_length: 1,
        min_start_length: 20,
        start_length: 20,
        end_length: 50,
        distance_on_length: 5,
        start_height: 6,
        min_height: 6,
        max_height: 16,
        min_start_width: 12,
        min_width: 12,
        max_width: 24,
        fixed_width: null,
        distance_on_width: 2,
        building_max_length: 300,
        conditions: JSON.stringify({
          condition: [
            {
              name: "Double Legs & Baserails",
              legs_type: "double",
              is_default: "Y",
              min_height: "15",
              max_height: "16",
              min_width: "0",
              max_width: "0",
            },
          ],
        }),
        distance_on_center: 5,
        default_gauge: 14,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("building_structures", null, {});
  },
};
