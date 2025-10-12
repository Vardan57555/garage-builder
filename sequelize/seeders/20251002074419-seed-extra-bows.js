"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("extra_bows", [
      { id: 7514, map_id: 33, width: 18, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7515, map_id: 33, width: 19, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7516, map_id: 33, width: 20, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7517, map_id: 33, width: 21, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7518, map_id: 33, width: 22, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7519, map_id: 33, width: 23, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7520, map_id: 33, width: 24, height: 13, cost: 205, single_leg: 205.0, double_leg: 205.0, ladder_leg: 205.0 },
      { id: 7521, map_id: 33, width: 18, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7522, map_id: 33, width: 19, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7523, map_id: 33, width: 20, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7524, map_id: 33, width: 21, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7525, map_id: 33, width: 22, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7526, map_id: 33, width: 23, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7527, map_id: 33, width: 24, height: 14, cost: 225, single_leg: 225.0, double_leg: 225.0, ladder_leg: 225.0 },
      { id: 7528, map_id: 33, width: 18, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7529, map_id: 33, width: 19, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7530, map_id: 33, width: 20, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7531, map_id: 33, width: 21, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7532, map_id: 33, width: 22, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7533, map_id: 33, width: 23, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7534, map_id: 33, width: 24, height: 15, cost: 245, single_leg: 245.0, double_leg: 245.0, ladder_leg: 245.0 },
      { id: 7535, map_id: 33, width: 18, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7536, map_id: 33, width: 19, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7537, map_id: 33, width: 20, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7538, map_id: 33, width: 21, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7539, map_id: 33, width: 22, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7540, map_id: 33, width: 23, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7541, map_id: 33, width: 24, height: 16, cost: 265, single_leg: 265.0, double_leg: 265.0, ladder_leg: 265.0 },
      { id: 7542, map_id: 34, width: 26, height: 13, cost: 375, single_leg: 375.0, double_leg: 375.0, ladder_leg: 375.0 },
      { id: 7543, map_id: 34, width: 27, height: 13, cost: 375, single_leg: 375.0, double_leg: 375.0, ladder_leg: 375.0 },
      { id: 7544, map_id: 34, width: 28, height: 13, cost: 375, single_leg: 375.0, double_leg: 375.0, ladder_leg: 375.0 },
      { id: 7545, map_id: 34, width: 29, height: 13, cost: 375, single_leg: 375.0, double_leg: 375.0, ladder_leg: 375.0 },
      { id: 7546, map_id: 34, width: 30, height: 13, cost: 375, single_leg: 375.0, double_leg: 375.0, ladder_leg: 375.0 },
      { id: 7547, map_id: 34, width: 26, height: 14, cost: 395, single_leg: 395.0, double_leg: 395.0, ladder_leg: 395.0 },
      { id: 7548, map_id: 34, width: 27, height: 14, cost: 395, single_leg: 395.0, double_leg: 395.0, ladder_leg: 395.0 },
      { id: 7549, map_id: 34, width: 28, height: 14, cost: 395, single_leg: 395.0, double_leg: 395.0, ladder_leg: 395.0 },
      { id: 7550, map_id: 34, width: 29, height: 14, cost: 395, single_leg: 395.0, double_leg: 395.0, ladder_leg: 395.0 },
      { id: 7551, map_id: 34, width: 30, height: 14, cost: 395, single_leg: 395.0, double_leg: 395.0, ladder_leg: 395.0 },
      { id: 7552, map_id: 34, width: 26, height: 15, cost: 415, single_leg: 415.0, double_leg: 415.0, ladder_leg: 415.0 },
      { id: 7553, map_id: 34, width: 27, height: 15, cost: 415, single_leg: 415.0, double_leg: 415.0, ladder_leg: 415.0 },
      { id: 7554, map_id: 34, width: 28, height: 15, cost: 415, single_leg: 415.0, double_leg: 415.0, ladder_leg: 415.0 },
      { id: 7555, map_id: 34, width: 29, height: 15, cost: 415, single_leg: 415.0, double_leg: 415.0, ladder_leg: 415.0 },
      { id: 7556, map_id: 34, width: 30, height: 15, cost: 415, single_leg: 415.0, double_leg: 415.0, ladder_leg: 415.0 }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("extra_bows", null, {});
  }
};
