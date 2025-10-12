"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("connection_end_fees", [
      { id: 3624, map_id: 102, width: 12, cost: 0, end_cost: 160, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3625, map_id: 102, width: 13, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3626, map_id: 102, width: 14, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3627, map_id: 102, width: 15, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3628, map_id: 102, width: 16, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3629, map_id: 102, width: 17, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3630, map_id: 102, width: 18, cost: 0, end_cost: 180, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3631, map_id: 102, width: 19, cost: 0, end_cost: 200, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3632, map_id: 102, width: 20, cost: 0, end_cost: 200, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
      { id: 3633, map_id: 102, width: 21, cost: 0, end_cost: 220, length: 0, end_leanto_cost: 0, added_building_cost: 0, is_l_and_t_fee: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("connection_end_fees", null, {});
  },
};
