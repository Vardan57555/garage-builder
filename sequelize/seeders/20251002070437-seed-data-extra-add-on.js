"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_extra_add_on", [
      {
        id: 1,
        manufacturer_id: 121,
        region_id: 235,
        building_id: 1,
        row_data: JSON.stringify([
          {
            sheet_name: "Concrete Sealant",
            sheet_type: "width_length",
            dimension: {
              min_column: "20",
              max_column: "50",
              min_row: "12",
              max_row: "24",
              distance_column: "5",
              distance_row: "2"
            },
            row_data: [
              { row: 12, column_20: "474", column_25: "548", column_30: "622", column_35: "696", column_40: "770", column_45: "844", column_50: "918" },
              { row: 14, column_20: "562", column_25: "636", column_30: "710", column_35: "784", column_40: "858", column_45: "932", column_50: "1006" },
              { row: 16, column_20: "562", column_25: "636", column_30: "710", column_35: "784", column_40: "858", column_45: "932", column_50: "1006" },
              { row: 18, column_20: "562", column_25: "636", column_30: "710", column_35: "784", column_40: "858", column_45: "932", column_50: "1006" },
              { row: 20, column_20: "592", column_25: "666", column_30: "740", column_35: "814", column_40: "888", column_45: "962", column_50: "1036" },
              { row: 22, column_20: "621", column_25: "695", column_30: "769", column_35: "843", column_40: "917", column_45: "991", column_50: "1065" },
              { row: 24, column_20: "651", column_25: "725", column_30: "799", column_35: "873", column_40: "947", column_45: "1021", column_50: "1095" }
            ],
            price_type: "$",
            price_of: null,
            created_at: now,
            updated_at: now,
          },
          {
            sheet_name: "Black Foam on Corners",
            sheet_type: "height_length",
            dimension: {
              min_column: "20",
              max_column: "50",
              min_row: "6",
              max_row: "16",
              distance_column: "5",
              distance_row: "1"
            },
            row_data: [
              { row: 6, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 7, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 8, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 9, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 10, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 11, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 12, column_20: "230", column_25: "250", column_30: "270", column_35: "275", column_40: "295", column_45: "315", column_50: "320" },
              { row: 13, column_20: "305", column_25: "320", column_30: "340", column_35: "350", column_40: "365", column_45: "385", column_50: "395" },
              { row: 14, column_20: "305", column_25: "320", column_30: "340", column_35: "350", column_40: "365", column_45: "385", column_50: "395" },
              { row: 15, column_20: "305", column_25: "320", column_30: "340", column_35: "350", column_40: "365", column_45: "385", column_50: "395" },
              { row: 16, column_20: "305", column_25: "320", column_30: "340", column_35: "350", column_40: "365", column_45: "385", column_50: "395" }
            ],
            price_type: "$",
            price_of: null,
            created_at: now,
            updated_at: now,
          }
        ]),
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        manufacturer_id: 3,
        region_id: 9,
        building_id: 27,
        row_data: '[{"sheet_name":"50","sheet_type":"width_length","dimension":{"min_column":"20","max_column":"50","min_row":"12","max_row":"14","distance_column":"5","distance_row":"2"},"row_data":[{"row":12,"column_20":0,"column_25":0,"column_30":0,"column_35":0,"column_40":0,"column_45":0,"column_50":0},{"row":14,"column_20":0,"column_25":0,"column_30":0,"column_35":0,"column_40":0,"column_45":0,"column_50":0}],"price_type":"$","price_of":null}]',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        manufacturer_id: 121,
        region_id: 233,
        building_id: 1,
        row_data: '[{"sheet_name":"labour_fee","sheet_type":"width_length","dimension":{"min_column":"20","max_column":"25","min_row":"12","max_row":"12","distance_column":"5","distance_row":"1"},"row_data":[{"row":12,"column_20":0,"column_25":0}],"price_type":"$","price_of":null,"is_taxable":true}]',
        created_at: now,
        updated_at: now,
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_extra_add_on", null, {});
  }
};
