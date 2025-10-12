"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("state_manufacturer_building_mapping", [
      { map_id: 1, manufacturer_id: 1, state_ids: "1,3,9,14,15,16,21,22,29,32,35,37,38,40,41", building_id: 1, lean_to_building_id: 2, region_id: 1, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 2, manufacturer_id: 1, state_ids: "1,3,9,14,15,16,21,22,29,32,35,37,38,40,41", building_id: 2, lean_to_building_id: null, region_id: 1, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 3, manufacturer_id: 1, state_ids: "1,3,9,14,15,16,21,22,29,32,35,37,38,40,41", building_id: 3, lean_to_building_id: 2, region_id: 1, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 4, manufacturer_id: 1, state_ids: "1,3,9,14,15,16,21,22,29,32,35,37,38,40,41", building_id: 4, lean_to_building_id: 87, region_id: 1, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 5, manufacturer_id: 1, state_ids: "12,17,26,31,34", building_id: 1, lean_to_building_id: 2, region_id: 2, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 6, manufacturer_id: 1, state_ids: "12,17,26,31,34", building_id: 2, lean_to_building_id: null, region_id: 2, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 7, manufacturer_id: 1, state_ids: "12,17,26,31,34", building_id: 25, lean_to_building_id: 2, region_id: 2, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 8, manufacturer_id: 1, state_ids: "12,17,26,31,34", building_id: 4, lean_to_building_id: 2, region_id: 2, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 9, manufacturer_id: 1, state_ids: "8", building_id: 1, lean_to_building_id: 2, region_id: 3, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 10, manufacturer_id: 1, state_ids: "8", building_id: 2, lean_to_building_id: null, region_id: 3, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 11, manufacturer_id: 1, state_ids: "8", building_id: 3, lean_to_building_id: 87, region_id: 3, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 12, manufacturer_id: 1, state_ids: "8", building_id: 4, lean_to_building_id: 87, region_id: 3, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 13, manufacturer_id: 2, state_ids: "1,3,9,11,12,15,16,21,22,29,32,35,37,38,40", building_id: 1, lean_to_building_id: 2, region_id: 4, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 14, manufacturer_id: 2, state_ids: "1,3,9,11,12,15,16,21,22,29,32,35,37,38,40", building_id: 2, lean_to_building_id: null, region_id: 4, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 15, manufacturer_id: 2, state_ids: "1,3,9,11,12,15,16,21,22,29,32,35,37,38,40", building_id: 3, lean_to_building_id: 2, region_id: 4, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 16, manufacturer_id: 2, state_ids: "1,3,9,11,12,15,16,21,22,29,32,35,37,38,40", building_id: 8, lean_to_building_id: 2, region_id: 4, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 17, manufacturer_id: 2, state_ids: "1,3,9,11,12,15,16,21,22,29,32,35,37,38,40", building_id: 5, lean_to_building_id: 2, region_id: 4, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 19, manufacturer_id: 2, state_ids: "5,14,27", building_id: 1, lean_to_building_id: 2, region_id: 5, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 20, manufacturer_id: 2, state_ids: "5,14,27", building_id: 2, lean_to_building_id: null, region_id: 5, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 21, manufacturer_id: 2, state_ids: "5,14,27", building_id: 3, lean_to_building_id: 2, region_id: 5, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 22, manufacturer_id: 2, state_ids: "5,14,27", building_id: 8, lean_to_building_id: 2, region_id: 5, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 23, manufacturer_id: 2, state_ids: "5,14,27", building_id: 5, lean_to_building_id: 2, region_id: 5, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 25, manufacturer_id: 2, state_ids: "5,14,27", building_id: 1, lean_to_building_id: 2, region_id: 6, heavy_snow: 1, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 26, manufacturer_id: 2, state_ids: "5,14,27", building_id: 2, lean_to_building_id: null, region_id: 6, heavy_snow: 1, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 27, manufacturer_id: 2, state_ids: "5,14,27", building_id: 3, lean_to_building_id: 2, region_id: 6, heavy_snow: 1, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 28, manufacturer_id: 2, state_ids: "5,14,27", building_id: 8, lean_to_building_id: 2, region_id: 6, heavy_snow: 1, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 29, manufacturer_id: 2, state_ids: "1,9,16,21,29,35,38", building_id: 1, lean_to_building_id: 2, region_id: 7, heavy_snow: 1, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 30, manufacturer_id: 2, state_ids: "1,9,16,21,29,35,38", building_id: 2, lean_to_building_id: null, region_id: 7, heavy_snow: 1, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 31, manufacturer_id: 2, state_ids: "1,9,16,21,29,35,38", building_id: 3, lean_to_building_id: 2, region_id: 7, heavy_snow: 1, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 35, manufacturer_id: 3, state_ids: "1,9,15,29,35,37,40,41", building_id: 1, lean_to_building_id: 2, region_id: 8, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 36, manufacturer_id: 3, state_ids: "1,9,15,29,35,37,40,41", building_id: 2, lean_to_building_id: null, region_id: 8, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 37, manufacturer_id: 3, state_ids: "1,9,15,29,35,37,40,41", building_id: 3, lean_to_building_id: 2, region_id: 8, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 38, manufacturer_id: 3, state_ids: "1,9,15,29,35,37,40,41", building_id: 9, lean_to_building_id: 2, region_id: 8, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 39, manufacturer_id: 3, state_ids: "8", building_id: 1, lean_to_building_id: 2, region_id: 9, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 40, manufacturer_id: 3, state_ids: "8", building_id: 2, lean_to_building_id: null, region_id: 9, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 41, manufacturer_id: 3, state_ids: "8", building_id: 3, lean_to_building_id: 2, region_id: 9, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 42, manufacturer_id: 3, state_ids: "8", building_id: 9, lean_to_building_id: 2, region_id: 9, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 43, manufacturer_id: 4, state_ids: "2,5,39", building_id: 1, lean_to_building_id: 2, region_id: 10, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 44, manufacturer_id: 4, state_ids: "2,5,39", building_id: 2, lean_to_building_id: null, region_id: 10, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 45, manufacturer_id: 4, state_ids: "2,5,39", building_id: 3, lean_to_building_id: 2, region_id: 10, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 46, manufacturer_id: 4, state_ids: "2,5,39", building_id: 9, lean_to_building_id: 2, region_id: 10, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 47, manufacturer_id: 4, state_ids: "3,27,32,38", building_id: 1, lean_to_building_id: 2, region_id: 11, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 48, manufacturer_id: 4, state_ids: "3,27,32,38", building_id: 2, lean_to_building_id: null, region_id: 11, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 49, manufacturer_id: 4, state_ids: "3,27,32,38", building_id: 3, lean_to_building_id: 2, region_id: 11, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 50, manufacturer_id: 4, state_ids: "3,27,32,38", building_id: 9, lean_to_building_id: 2, region_id: 11, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 55, manufacturer_id: 4, state_ids: "17,18,26,28,34,37,40,41", building_id: 1, lean_to_building_id: 2, region_id: 13, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 56, manufacturer_id: 4, state_ids: "17,18,26,28,34,37,40,41", building_id: 2, lean_to_building_id: null, region_id: 13, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 57, manufacturer_id: 4, state_ids: "17,18,26,28,34,37,40,41", building_id: 3, lean_to_building_id: 2, region_id: 13, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 58, manufacturer_id: 4, state_ids: "17,18,26,28,34,37,40,41", building_id: 9, lean_to_building_id: 2, region_id: 13, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 59, manufacturer_id: 4, state_ids: "11,12,15,22,31", building_id: 1, lean_to_building_id: 2, region_id: 14, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 60, manufacturer_id: 4, state_ids: "11,12,15,22,31", building_id: 2, lean_to_building_id: null, region_id: 14, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 61, manufacturer_id: 4, state_ids: "11,12,15,22,31", building_id: 3, lean_to_building_id: 2, region_id: 14, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 62, manufacturer_id: 4, state_ids: "11,12,15,22,31", building_id: 9, lean_to_building_id: 2, region_id: 14, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 63, manufacturer_id: 4, state_ids: "13,19,20,42", building_id: 1, lean_to_building_id: 2, region_id: 15, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 64, manufacturer_id: 4, state_ids: "13,19,20,42", building_id: 2, lean_to_building_id: null, region_id: 15, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 65, manufacturer_id: 4, state_ids: "13,19,20,42", building_id: 3, lean_to_building_id: 2, region_id: 15, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 66, manufacturer_id: 4, state_ids: "13,19,20,42", building_id: 9, lean_to_building_id: 2, region_id: 15, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 75, manufacturer_id: 5, state_ids: "4", building_id: 1, lean_to_building_id: 2, region_id: 18, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 76, manufacturer_id: 5, state_ids: "4", building_id: 2, lean_to_building_id: null, region_id: 18, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 77, manufacturer_id: 5, state_ids: "4", building_id: 3, lean_to_building_id: 2, region_id: 18, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 78, manufacturer_id: 5, state_ids: "4", building_id: 9, lean_to_building_id: 2, region_id: 18, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 },
      { map_id: 79, manufacturer_id: 6, state_ids: "4", building_id: 1, lean_to_building_id: 2, region_id: 19, heavy_snow: 0, default_building: 1, is_new_leg_height_structure: 0 },
      { map_id: 80, manufacturer_id: 6, state_ids: "4", building_id: 2, lean_to_building_id: null, region_id: 19, heavy_snow: 0, default_building: 0, is_new_leg_height_structure: 0 }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("state_manufacturer_building_mapping", null, {});
  }
};
