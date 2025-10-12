"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkInsert("longer_buildings", [
      { id: 31, manufacturer_id: 18, ft_type: 5, length: 55, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "25,30", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 32, manufacturer_id: 18, ft_type: 5, length: 60, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "30,30", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 33, manufacturer_id: 18, ft_type: 5, length: 65, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "30,35", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 34, manufacturer_id: 18, ft_type: 5, length: 70, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "35,35", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 35, manufacturer_id: 18, ft_type: 5, length: 75, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "35,40", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 36, manufacturer_id: 18, ft_type: 5, length: 80, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "40,40", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 37, manufacturer_id: 18, ft_type: 5, length: 85, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "40,45", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 38, manufacturer_id: 18, ft_type: 5, length: 90, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "45,45", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 39, manufacturer_id: 18, ft_type: 5, length: 95, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "45,50", group_id: 1, map_ids: "170,172,471,635,1531" },
      { id: 40, manufacturer_id: 18, ft_type: 5, length: 100, height: 0, width: 0, type: "length", rp_3_12: 0, rp_4_12: 0, rp_5_12: 0, rp_6_12: 0, combinations: "50,50", group_id: 1, map_ids: "170,172,471,635,1531" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("longer_buildings", null, {});
  },
};
