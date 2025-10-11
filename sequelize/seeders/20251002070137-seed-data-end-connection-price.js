"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_end_connection_price", [
      {
        id: 308,
        manufacturer_id: 19,
        region_id: 40,
        building_id: 3,
        end_connection_row: Buffer.from("5b7b227769647468223a223236222c22656e645f636f7374223a22343530227d2c7b227769647468223a223238222c22656e645f636f7374223a22343530227d2c7b227769647468223a223330222c22656e645f636f7374223a22343530227d5d", "hex"),
        end_lean_tos_fees_row: null,
        l_and_t_fees_row: null,
        created_at: new Date("2021-02-02 14:06:27"),
        updated_at: new Date("2021-04-07 07:25:06"),
        deleted_at: null
      },
      {
        id: 309,
        manufacturer_id: 19,
        region_id: 40,
        building_id: 1,
        end_connection_row: Buffer.from("5b7b227769647468223a223132222c22656e645f636f7374223a22343530227d2c7b227769647468223a223138222c22656e645f636f7374223a22343530227d2c7b227769647468223a223230222c22656e645f636f7374223a22343530227d2c7b227769647468223a223232222c22656e645f636f7374223a22343530227d2c7b227769647468223a223234222c22656e645f636f7374223a22343530227d5d", "hex"),
        end_lean_tos_fees_row: null,
        l_and_t_fees_row: null,
        created_at: new Date("2021-02-02 14:09:21"),
        updated_at: new Date("2021-04-06 09:46:43"),
        deleted_at: null
      },
      {
        id: 310,
        manufacturer_id: 19,
        region_id: 40,
        building_id: 4,
        end_connection_row: Buffer.from("5b7b227769647468223a223332222c22656e645f636f7374223a22323735227d2c7b227769647468223a223334222c22656e645f636f7374223a22323735227d2c7b227769647468223a223336222c22656e645f636f7374223a22323735227d2c7b227769647468223a223338222c22656e645f636f7374223a22323735227d2c7b227769647468223a223430222c22656e645f636f7374223a22323735227d2c7b227769647468223a223432222c22656e645f636f7374223a22333530227d2c7b227769647468223a223434222c22656e645f636f7374223a22333530227d2c7b227769647468223a223436222c22656e645f636f7374223a22333530227d2c7b227769647468223a223438222c22656e645f636f7374223a22333530227d2c7b227769647468223a223530222c22656e645f636f7374223a22333530227d2c7b227769647468223a223532222c22656e645f636f7374223a22343030227d2c7b227769647468223a223534222c22656e645f636f7374223a22343030227d2c7b227769647468223a223536222c22656e645f636f7374223a22343030227d2c7b227769647468223a223538222c22656e645f636f7374223a22343030227d2c7b227769647468223a223630222c22656e645f636f7374223a22343030227d5d", "hex"),
        end_lean_tos_fees_row: null,
        l_and_t_fees_row: null,
        created_at: new Date("2021-02-02 14:21:10"),
        updated_at: new Date("2021-02-02 14:21:10"),
        deleted_at: null
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_end_connection_price", null, {});
  }
};
