"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_installation_fees_price", [
      {
        id: 2,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 1,
        installation_fees_data: '{"garage_door":[],"walkin_door":[],"window":[]}',
        created_at: "2023-03-29 07:30:21",
        updated_at: "2023-06-30 06:40:20",
        deleted_at: null
      },
      {
        id: 3,
        manufacturer_id: 25,
        region_id: 59,
        building_id: 19,
        installation_fees_data: '{"garage_door":[{"start_width":"6","end_width":"10","start_height":"6","end_height":"12","end_wall":"225","is_end_wall":"yes","side_wall":"375","is_side_wall":"yes"},{"start_width":"6","end_width":"10","start_height":"13","end_height":"14","end_wall":"225","is_end_wall":"yes","side_wall":"525","is_side_wall":"yes"},{"start_width":"6","end_width":"10","start_height":"15","end_height":"16","end_wall":"225","is_end_wall":"yes","side_wall":"675","is_side_wall":"yes"},{"start_width":"6","end_width":"10","start_height":"17","end_height":"18","end_wall":"225","is_end_wall":"yes","side_wall":"825","is_side_wall":"yes"},{"start_width":"11","end_width":"13","start_height":"6","end_height":"12","end_wall":"300","is_end_wall":"yes","side_wall":"525","is_side_wall":"yes"},{"start_width":"11","end_width":"13","start_height":"13","end_height":"14","end_wall":"300","is_end_wall":"yes","side_wall":"675","is_side_wall":"yes"},{"start_width":"11","end_width":"13","start_height":"15","end_height":"16","end_wall":"300","is_end_wall":"yes","side_wall":"825","is_side_wall":"yes"},{"start_width":"11","end_width":"13","start_height":"17","end_height":"18","end_wall":"300","is_end_wall":"yes","side_wall":"975","is_side_wall":"yes"},{"start_width":"14","end_width":"16","start_height":"6","end_height":"12","end_wall":"375","is_end_wall":"yes","side_wall":"675","is_side_wall":"yes"},{"start_width":"14","end_width":"16","start_height":"13","end_height":"14","end_wall":"375","is_end_wall":"yes","side_wall":"825","is_side_wall":"yes"},{"start_width":"14","end_width":"16","start_height":"15","end_height":"16","end_wall":"375","is_end_wall":"yes","side_wall":"975","is_side_wall":"yes"},{"start_width":"14","end_width":"16","start_height":"17","end_height":"18","end_wall":"375","is_end_wall":"yes","side_wall":"1125","is_side_wall":"yes"},{"start_width":"17","end_width":"18","start_height":"6","end_height":"12","end_wall":"487","is_end_wall":"yes","side_wall":"825","is_side_wall":"yes"},{"start_width":"17","end_width":"18","start_height":"13","end_height":"14","end_wall":"487","is_end_wall":"yes","side_wall":"975","is_side_wall":"yes"},{"start_width":"17","end_width":"18","start_height":"15","end_height":"16","end_wall":"487","is_end_wall":"yes","side_wall":"1125","is_side_wall":"yes"},{"start_width":"17","end_width":"18","start_height":"17","end_height":"18","end_wall":"487","is_end_wall":"yes","side_wall":"1275","is_side_wall":"yes"}],"walkin_door":[],"window":[]}',
        created_at: "2023-03-29 09:23:36",
        updated_at: "2024-06-24 08:01:42",
        deleted_at: null
      },
      {
        id: 4,
        manufacturer_id: 1,
        region_id: 1,
        building_id: 3,
        installation_fees_data: '{"garage_door":[],"walkin_door":[],"window":[]}',
        created_at: "2023-03-31 14:27:41",
        updated_at: "2023-04-04 09:36:53",
        deleted_at: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_installation_fees_price", null, {});
  }
};
