"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_braces_price", [
      {
        id: 3,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        braces_row: Buffer.from(
            "5b7b226c656e677468223a32302c22636f7374223a223735222c2262726163696e675f66656574223a327d2c7b226c656e677468223a32352c22636f7374223a22313030222c2262726163696e675f66656574223a327d2c7b226c656e677468223a33302c22636f7374223a22313230222c2262726163696e675f66656574223a327d2c7b226c656e677468223a33352c22636f7374223a22313435222c2262726163696e675f66656574223a327d2c7b226c656e677468223a34302c22636f7374223a22313730222c2262726163696e675f66656574223a327d5d",
            "hex"
        ),
        created_at: null,
        updated_at: new Date("2021-07-20 07:34:50"),
        deleted_at: null,
      },
      {
        id: 4,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        braces_row: Buffer.from(
            "5b7b226c656e677468223a32302c22636f7374223a223735222c2262726163696e675f66656574223a327d2c7b226c656e677468223a32352c22636f7374223a22313030222c2262726163696e675f66656574223a327d2c7b226c656e677468223a33302c22636f7374223a22313230222c2262726163696e675f66656574223a327d2c7b226c656e677468223a33352c22636f7374223a22313435222c2262726163696e675f66656574223a327d2c7b226c656e677468223a34302c22636f7374223a22313730222c2262726163696e675f66656574223a327d5d",
            "hex"
        ),
        created_at: null,
        updated_at: new Date("2021-07-21 17:11:26"),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_braces_price", null, {});
  },
};
