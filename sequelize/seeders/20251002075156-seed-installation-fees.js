"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkInsert("installation_fees", [
      { id: 137, map_id: 1470, start_width: 6, end_width: 12, start_length: 20, end_length: 50, start_height: 6, end_height: 18, end_wall: "85.00", is_end_wall: "yes", side_wall: "110.00", is_side_wall: "yes", type: "garage_door" },
      { id: 138, map_id: 1470, start_width: 12, end_width: 24, start_length: 20, end_length: 50, start_height: 6, end_height: 18, end_wall: "170.00", is_end_wall: "yes", side_wall: "220.00", is_side_wall: "yes", type: "garage_door" },
      { id: 139, map_id: 1471, start_width: 26, end_width: 30, start_length: 20, end_length: 50, start_height: 6, end_height: 18, end_wall: "170.00", is_end_wall: "yes", side_wall: "220.00", is_side_wall: "yes", type: "garage_door" },
      { id: 140, map_id: 1472, start_width: 6, end_width: 12, start_length: 20, end_length: 50, start_height: 6, end_height: 18, end_wall: "85.00", is_end_wall: "yes", side_wall: "110.00", is_side_wall: "yes", type: "garage_door" },
      { id: 141, map_id: 1472, start_width: 13, end_width: 24, start_length: 20, end_length: 50, start_height: 6, end_height: 18, end_wall: "170.00", is_end_wall: "yes", side_wall: "220.00", is_side_wall: "yes", type: "garage_door" },
      { id: 902, map_id: 1469, start_width: 12, end_width: 24, start_length: 0, end_length: 0, start_height: 6, end_height: 18, end_wall: "170.00", is_end_wall: "yes", side_wall: "220.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1316, map_id: 142, start_width: 6, end_width: 12, start_length: 0, end_length: 0, start_height: 8, end_height: 14, end_wall: "475.00", is_end_wall: "yes", side_wall: "800.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1317, map_id: 142, start_width: 13, end_width: 14, start_length: 0, end_length: 0, start_height: 8, end_height: 14, end_wall: "525.00", is_end_wall: "yes", side_wall: "800.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1318, map_id: 142, start_width: 15, end_width: 20, start_length: 0, end_length: 0, start_height: 8, end_height: 14, end_wall: "625.00", is_end_wall: "yes", side_wall: "950.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1319, map_id: 142, start_width: 6, end_width: 12, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "525.00", is_end_wall: "yes", side_wall: "800.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1320, map_id: 142, start_width: 13, end_width: 14, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "550.00", is_end_wall: "yes", side_wall: "800.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1321, map_id: 142, start_width: 15, end_width: 20, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "650.00", is_end_wall: "yes", side_wall: "950.00", is_side_wall: "yes", type: "garage_door" },
      { id: 1322, map_id: 128, start_width: 6, end_width: 12, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "50.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1323, map_id: 128, start_width: 13, end_width: 14, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "25.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1324, map_id: 128, start_width: 15, end_width: 20, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "25.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1325, map_id: 128, start_width: 6, end_width: 12, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "75.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1326, map_id: 128, start_width: 13, end_width: 14, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "75.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1327, map_id: 128, start_width: 15, end_width: 20, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "75.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1328, map_id: 128, start_width: 6, end_width: 12, start_length: 0, end_length: 0, start_height: 19, end_height: 20, end_wall: "100.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1329, map_id: 128, start_width: 13, end_width: 14, start_length: 0, end_length: 0, start_height: 19, end_height: 20, end_wall: "100.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 1330, map_id: 128, start_width: 15, end_width: 20, start_length: 0, end_length: 0, start_height: 19, end_height: 20, end_wall: "100.00", is_end_wall: "yes", side_wall: "0.00", is_side_wall: "no", type: "garage_door" },
      { id: 2007, map_id: 651, start_width: 6, end_width: 10, start_length: 0, end_length: 0, start_height: 6, end_height: 12, end_wall: "225.00", is_end_wall: "yes", side_wall: "375.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2008, map_id: 651, start_width: 6, end_width: 10, start_length: 0, end_length: 0, start_height: 13, end_height: 14, end_wall: "225.00", is_end_wall: "yes", side_wall: "525.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2009, map_id: 651, start_width: 6, end_width: 10, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "225.00", is_end_wall: "yes", side_wall: "675.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2010, map_id: 651, start_width: 6, end_width: 10, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "225.00", is_end_wall: "yes", side_wall: "825.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2011, map_id: 651, start_width: 11, end_width: 13, start_length: 0, end_length: 0, start_height: 6, end_height: 12, end_wall: "300.00", is_end_wall: "yes", side_wall: "525.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2012, map_id: 651, start_width: 11, end_width: 13, start_length: 0, end_length: 0, start_height: 13, end_height: 14, end_wall: "300.00", is_end_wall: "yes", side_wall: "675.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2013, map_id: 651, start_width: 11, end_width: 13, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "300.00", is_end_wall: "yes", side_wall: "825.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2014, map_id: 651, start_width: 11, end_width: 13, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "300.00", is_end_wall: "yes", side_wall: "975.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2015, map_id: 651, start_width: 14, end_width: 16, start_length: 0, end_length: 0, start_height: 6, end_height: 12, end_wall: "375.00", is_end_wall: "yes", side_wall: "675.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2016, map_id: 651, start_width: 14, end_width: 16, start_length: 0, end_length: 0, start_height: 13, end_height: 14, end_wall: "375.00", is_end_wall: "yes", side_wall: "825.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2017, map_id: 651, start_width: 14, end_width: 16, start_length: 0, end_length: 0, start_height: 15, end_height: 16, end_wall: "375.00", is_end_wall: "yes", side_wall: "975.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2018, map_id: 651, start_width: 14, end_width: 16, start_length: 0, end_length: 0, start_height: 17, end_height: 18, end_wall: "375.00", is_end_wall: "yes", side_wall: "1125.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2019, map_id: 651, start_width: 17, end_width: 18, start_length: 0, end_length: 0, start_height: 6, end_height: 12, end_wall: "487.00", is_end_wall: "yes", side_wall: "825.00", is_side_wall: "yes", type: "garage_door" },
      { id: 2020, map_id: 651, start_width: 17, end_width: 18, start_length: 0, end_length: 0, start_height: 13, end_height: 14, end_wall: "487.00", is_end_wall: "yes", side_wall: "975.00", is_side_wall: "yes", type: "garage_door" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("installation_fees", null, {});
  },
};
