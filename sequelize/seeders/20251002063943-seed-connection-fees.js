"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("connection_fees", [
      { id: 303, map_id: 68, length: 20, cost: 175, end_cost: 0 },
      { id: 304, map_id: 68, length: 21, cost: 200, end_cost: 0 },
      { id: 305, map_id: 68, length: 22, cost: 200, end_cost: 0 },
      { id: 306, map_id: 68, length: 23, cost: 200, end_cost: 0 },
      { id: 307, map_id: 68, length: 24, cost: 200, end_cost: 0 },
      { id: 308, map_id: 68, length: 25, cost: 200, end_cost: 0 },
      { id: 309, map_id: 68, length: 26, cost: 225, end_cost: 0 },
      { id: 310, map_id: 68, length: 27, cost: 225, end_cost: 0 },
      { id: 311, map_id: 68, length: 28, cost: 225, end_cost: 0 },
      { id: 312, map_id: 68, length: 29, cost: 225, end_cost: 0 },
      { id: 313, map_id: 68, length: 30, cost: 225, end_cost: 0 },
      { id: 314, map_id: 68, length: 31, cost: 250, end_cost: 0 },
      { id: 315, map_id: 68, length: 32, cost: 250, end_cost: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("connection_fees", null, {});
  },
};
