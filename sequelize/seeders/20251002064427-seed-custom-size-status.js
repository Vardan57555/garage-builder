"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("custom_size_status", [
      {
        id: 1,
        map_id: 97,
        row_data: '{"show_garage_door":true,"show_garage_door_frameout":false,"show_walk_in_door":true,"show_walk_in_door_frameout":null,"show_window":false,"show_window_frameout":true}',
        clearance_data: '{"garage_door":"","garage_door_frameout":"","walk_in_door":"","walk_in_door_frameout":"","window":"","window_frameout":""}'
      },
      {
        id: 2,
        map_id: 1959,
        row_data: '{"show_garage_door":null,"show_garage_door_frameout":false,"show_walk_in_door":false,"show_walk_in_door_frameout":false,"show_window":false,"show_window_frameout":true}',
        clearance_data: '{"garage_door":"","garage_door_frameout":"","walk_in_door":"","walk_in_door_frameout":"","window":"","window_frameout":""}'
      },
      {
        id: 3,
        map_id: 101,
        row_data: '{"show_garage_door":true,"show_garage_door_frameout":true,"show_walk_in_door":false,"show_walk_in_door_frameout":false,"show_window":false,"show_window_frameout":false}',
        clearance_data: '{"garage_door":"","garage_door_frameout":"","walk_in_door":"","walk_in_door_frameout":"","window":"","window_frameout":""}'
      },
      {
        id: 4,
        map_id: 1970,
        row_data: '{"show_garage_door":true,"show_garage_door_frameout":true,"show_walk_in_door":true,"show_walk_in_door_frameout":true,"show_window":true,"show_window_frameout":true}',
        clearance_data: '{"garage_door":"","garage_door_frameout":"","walk_in_door":"","walk_in_door_frameout":"","window":"","window_frameout":""}'
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("custom_size_status", null, {});
  }
};
