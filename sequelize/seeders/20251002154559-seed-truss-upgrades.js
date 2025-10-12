"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("truss_upgrades", [
      { id: 631268, map_id: 98, truss: 0, width: 0, length: 0, cost: 200, height: 7 },
      { id: 631269, map_id: 98, truss: 0, width: 0, length: 0, cost: 215, height: 8 },
      { id: 631270, map_id: 98, truss: 0, width: 0, length: 0, cost: 230, height: 9 },
      { id: 631271, map_id: 98, truss: 0, width: 0, length: 0, cost: 245, height: 10 },
      { id: 631272, map_id: 98, truss: 0, width: 0, length: 0, cost: 260, height: 11 },
      { id: 631273, map_id: 98, truss: 0, width: 0, length: 0, cost: 275, height: 12 },
      { id: 631274, map_id: 98, truss: 0, width: 0, length: 0, cost: 290, height: 13 },
      { id: 631275, map_id: 98, truss: 0, width: 0, length: 0, cost: 305, height: 14 },
      { id: 631276, map_id: 98, truss: 0, width: 0, length: 0, cost: 320, height: 15 },
      { id: 631277, map_id: 98, truss: 0, width: 0, length: 0, cost: 335, height: 16 },
      { id: 631278, map_id: 98, truss: 0, width: 0, length: 0, cost: 350, height: 17 },
      { id: 631279, map_id: 98, truss: 0, width: 0, length: 0, cost: 365, height: 18 },
      { id: 631280, map_id: 98, truss: 0, width: 0, length: 0, cost: 380, height: 19 },
      { id: 631281, map_id: 98, truss: 0, width: 0, length: 0, cost: 395, height: 20 },
      { id: 631324, map_id: 102, truss: 0, width: 0, length: 0, cost: 200, height: 7 },
      { id: 631325, map_id: 102, truss: 0, width: 0, length: 0, cost: 215, height: 8 },
      { id: 631326, map_id: 102, truss: 0, width: 0, length: 0, cost: 230, height: 9 },
      { id: 631327, map_id: 102, truss: 0, width: 0, length: 0, cost: 245, height: 10 },
      { id: 631328, map_id: 102, truss: 0, width: 0, length: 0, cost: 260, height: 11 },
      { id: 631329, map_id: 102, truss: 0, width: 0, length: 0, cost: 275, height: 12 },
      { id: 631330, map_id: 102, truss: 0, width: 0, length: 0, cost: 290, height: 13 },
      { id: 631331, map_id: 102, truss: 0, width: 0, length: 0, cost: 305, height: 14 },
      { id: 631332, map_id: 102, truss: 0, width: 0, length: 0, cost: 320, height: 15 },
      { id: 631333, map_id: 102, truss: 0, width: 0, length: 0, cost: 335, height: 16 },
      { id: 631334, map_id: 102, truss: 0, width: 0, length: 0, cost: 350, height: 17 },
      { id: 631335, map_id: 102, truss: 0, width: 0, length: 0, cost: 365, height: 18 },
      { id: 631336, map_id: 102, truss: 0, width: 0, length: 0, cost: 380, height: 19 },
      { id: 631337, map_id: 102, truss: 0, width: 0, length: 0, cost: 395, height: 20 },
      { id: 635933, map_id: 72, truss: 0, width: 0, length: 0, cost: 200, height: 6 },
      { id: 635934, map_id: 72, truss: 0, width: 0, length: 0, cost: 215, height: 7 },
      { id: 635935, map_id: 72, truss: 0, width: 0, length: 0, cost: 230, height: 8 },
      { id: 635936, map_id: 72, truss: 0, width: 0, length: 0, cost: 245, height: 9 },
      { id: 635937, map_id: 72, truss: 0, width: 0, length: 0, cost: 260, height: 10 },
      { id: 635938, map_id: 72, truss: 0, width: 0, length: 0, cost: 275, height: 11 },
      { id: 635939, map_id: 72, truss: 0, width: 0, length: 0, cost: 290, height: 12 },
      { id: 635940, map_id: 72, truss: 0, width: 0, length: 0, cost: 305, height: 13 },
      { id: 635941, map_id: 72, truss: 0, width: 0, length: 0, cost: 320, height: 14 },
      { id: 784506, map_id: 155, truss: 0, width: 0, length: 0, cost: 845, height: 32 },
      { id: 784507, map_id: 155, truss: 0, width: 0, length: 0, cost: 885, height: 33 },
      { id: 784508, map_id: 155, truss: 0, width: 0, length: 0, cost: 925, height: 34 },
      { id: 784509, map_id: 155, truss: 0, width: 0, length: 0, cost: 965, height: 35 },
      { id: 784510, map_id: 155, truss: 0, width: 0, length: 0, cost: 1025, height: 36 },
      { id: 784511, map_id: 155, truss: 0, width: 0, length: 0, cost: 1065, height: 37 },
      { id: 784512, map_id: 155, truss: 0, width: 0, length: 0, cost: 1105, height: 38 },
      { id: 784513, map_id: 155, truss: 0, width: 0, length: 0, cost: 1145, height: 39 },
      { id: 784514, map_id: 155, truss: 0, width: 0, length: 0, cost: 1185, height: 40 },
      { id: 784515, map_id: 155, truss: 0, width: 0, length: 0, cost: 1275, height: 41 },
      { id: 784516, map_id: 155, truss: 0, width: 0, length: 0, cost: 1315, height: 42 },
      { id: 784517, map_id: 155, truss: 0, width: 0, length: 0, cost: 1355, height: 43 },
      { id: 784518, map_id: 155, truss: 0, width: 0, length: 0, cost: 1395, height: 44 },
      { id: 784519, map_id: 155, truss: 0, width: 0, length: 0, cost: 1435, height: 45 },
      { id: 784520, map_id: 155, truss: 0, width: 0, length: 0, cost: 1415, height: 46 },
      { id: 784521, map_id: 155, truss: 0, width: 0, length: 0, cost: 1455, height: 47 },
      { id: 784522, map_id: 155, truss: 0, width: 0, length: 0, cost: 1495, height: 48 },
      { id: 784523, map_id: 155, truss: 0, width: 0, length: 0, cost: 1535, height: 49 }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("truss_upgrades", null, {});
  }
};
