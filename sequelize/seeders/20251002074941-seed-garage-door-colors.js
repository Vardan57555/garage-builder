"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("garage_door_colors", [
      { id: 1, name: "White", manufacturer_id: 1, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 5, name: "Brown", manufacturer_id: 1, red_value: 112, green_value: 63, blue_value: 42, hex_value: "#703F2A", cost: 100, percentage_of_cost: 0 },
      { id: 6, name: "Green", manufacturer_id: 1, red_value: 39, green_value: 89, blue_value: 73, hex_value: "#275949", cost: 100, percentage_of_cost: 0 },
      { id: 8, name: "P.Gray", manufacturer_id: 1, red_value: 139, green_value: 139, blue_value: 138, hex_value: "#8b8b8a", cost: 100, percentage_of_cost: 0 },
      { id: 13, name: "Barn Red", manufacturer_id: 1, red_value: 144, green_value: 59, blue_value: 38, hex_value: "#903b26", cost: 100, percentage_of_cost: 0 },
      { id: 22, name: "White", manufacturer_id: 2, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 42, name: "White", manufacturer_id: 4, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 54, name: "White", manufacturer_id: 5, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 69, name: "White", manufacturer_id: 6, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 75, name: "White", manufacturer_id: 7, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 96, name: "White", manufacturer_id: 9, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 112, name: "White", manufacturer_id: 3, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 126, name: "White", manufacturer_id: 10, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 144, name: "White", manufacturer_id: 12, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 171, name: "White", manufacturer_id: 8, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 176, name: "White", manufacturer_id: 13, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 200, name: "White", manufacturer_id: 16, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 1 },
      { id: 213, name: "Satin White", manufacturer_id: 17, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 214, name: "White", manufacturer_id: 18, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 218, name: "White", manufacturer_id: 20, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 220, name: "White", manufacturer_id: 21, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 230, name: "High Gloss", manufacturer_id: 24, red_value: 232, green_value: 235, blue_value: 235, hex_value: "#e8ebeb", cost: 0, percentage_of_cost: 0 },
      { id: 233, name: "White", manufacturer_id: 25, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 245, name: "White", manufacturer_id: 26, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 247, name: "High Gloss White", manufacturer_id: 27, red_value: 232, green_value: 235, blue_value: 235, hex_value: "#e8ebeb", cost: 0, percentage_of_cost: 0 },
      { id: 254, name: "Red", manufacturer_id: 16, red_value: 78, green_value: 17, blue_value: 22, hex_value: "#C8392C", cost: 10, percentage_of_cost: 1 },
      { id: 255, name: "Pewter Gray", manufacturer_id: 16, red_value: 174, green_value: 174, blue_value: 172, hex_value: "#aeaeac", cost: 10, percentage_of_cost: 1 },
      { id: 256, name: "Light Stone", manufacturer_id: 16, red_value: 208, green_value: 199, blue_value: 169, hex_value: "#d0c7a9", cost: 10, percentage_of_cost: 1 },
      { id: 257, name: "P. Beige", manufacturer_id: 16, red_value: 277, green_value: 210, blue_value: 180, hex_value: "#e3d2b4", cost: 10, percentage_of_cost: 1 },
      { id: 258, name: "Green", manufacturer_id: 16, red_value: 0, green_value: 80, blue_value: 48, hex_value: "#005030", cost: 10, percentage_of_cost: 1 },
      { id: 259, name: "Brown", manufacturer_id: 16, red_value: 162, green_value: 82, blue_value: 58, hex_value: "#a2523a", cost: 10, percentage_of_cost: 1 },
      { id: 260, name: "White", manufacturer_id: 29, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 266, name: "White", manufacturer_id: 28, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 273, name: "White", manufacturer_id: 30, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 284, name: "White", manufacturer_id: 31, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 285, name: "White", manufacturer_id: 32, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 286, name: "White", manufacturer_id: 33, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 292, name: "High Gloss White", manufacturer_id: 34, red_value: 232, green_value: 235, blue_value: 235, hex_value: "#e8ebeb", cost: 0, percentage_of_cost: 0 },
      { id: 293, name: "White", manufacturer_id: 23, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 294, name: "White", manufacturer_id: 35, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
      { id: 295, name: "White", manufacturer_id: 36, red_value: 255, green_value: 255, blue_value: 255, hex_value: "#ffffff", cost: 0, percentage_of_cost: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("garage_door_colors", null, {});
  },
};
