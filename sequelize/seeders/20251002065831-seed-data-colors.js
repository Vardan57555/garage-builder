"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_colors", [
      { id: 1, name: 'B.red', red_value: 144, green_value: 59, blue_value: 38, hex_value: '#903b26' },
      { id: 2, name: 'Black', red_value: 49, green_value: 50, blue_value: 50, hex_value: '#313232' },
      { id: 3, name: 'V.Burgundy', red_value: 57, green_value: 25, blue_value: 39, hex_value: '#391927' },
      { id: 4, name: 'Clay', red_value: 154, green_value: 143, blue_value: 130, hex_value: '#9a8f82' },
      { id: 5, name: 'E.Brown', red_value: 92, green_value: 68, blue_value: 43, hex_value: '#5c442b' },
      { id: 6, name: 'E.Green', red_value: 39, green_value: 89, blue_value: 73, hex_value: '#275949' },
      { id: 7, name: 'P.Beige', red_value: 222, green_value: 208, blue_value: 183, hex_value: '#ded0b7' },
      { id: 8, name: 'P.Gray', red_value: 139, green_value: 139, blue_value: 138, hex_value: '#8b8b8a' },
      { id: 9, name: 'Q.Gray', red_value: 92, green_value: 92, blue_value: 92, hex_value: '#5c5c5c' },
      { id: 10, name: 'S.stone', red_value: 201, green_value: 188, blue_value: 163, hex_value: '#c9bca3' },
      { id: 11, name: 'S.Blue', red_value: 69, green_value: 105, blue_value: 135, hex_value: '#456987' },
      { id: 12, name: 'Tan', red_value: 187, green_value: 161, blue_value: 122, hex_value: '#bba17a' },
      { id: 13, name: 'White', red_value: 255, green_value: 255, blue_value: 255, hex_value: '#ffffff' },
      { id: 14, name: 'C.Red', red_value: 140, green_value: 29, blue_value: 26, hex_value: '#8c1d1a' },
      { id: 15, name: 'T.Burgundy', red_value: 113, green_value: 30, blue_value: 44, hex_value: '#711e2c' },
      { id: 16, name: 'King Blue', red_value: 39, green_value: 135, blue_value: 183, hex_value: '#2787b7' },
      { id: 17, name: 'Pewter Gray', red_value: 151, green_value: 146, blue_value: 144, hex_value: '#979290' },
      { id: 18, name: 'Quaker Gray', red_value: 103, green_value: 101, blue_value: 98, hex_value: '#676562' },
      { id: 19, name: 'Rawhide', red_value: 199, green_value: 150, blue_value: 106, hex_value: '#C7966A' },
      { id: 20, name: 'Royal Blue', red_value: 29, green_value: 84, blue_value: 139, hex_value: '#1D548B' },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_colors", null, {});
  }
};
