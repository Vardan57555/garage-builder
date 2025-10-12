"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const now = new Date();

    await queryInterface.bulkInsert("colors", [
      { id: 1, sheet_name: "metal", sheet_label: "Metal", name: "Barn red", image_name: null, red_value: 150, green_value: 59, blue_value: 36, manufacturer_id: 1, hex_value: "#963b24", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null},
      { id: 2, sheet_name: "metal", sheet_label: "Metal", name: "Black", image_name: null, red_value: 49, green_value: 50, blue_value: 50, manufacturer_id: 1, hex_value: "#313232", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 4, sheet_name: "metal", sheet_label: "Metal", name: "Clay", image_name: null, red_value: 165, green_value: 149, blue_value: 134, manufacturer_id: 1, hex_value: "#a59586", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 5, sheet_name: "metal", sheet_label: "Metal", name: "Brown", image_name: null, red_value: 96, green_value: 69, blue_value: 58, manufacturer_id: 1, hex_value: "#60453a", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 6, sheet_name: "metal", sheet_label: "Metal", name: "Evergreen", image_name: null, red_value: 57, green_value: 85, blue_value: 66, manufacturer_id: 1, hex_value: "#395542", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 7, sheet_name: "metal", sheet_label: "Metal", name: "Beige", image_name: null, red_value: 235, green_value: 205, blue_value: 179, manufacturer_id: 1, hex_value: "#ebcdb3", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 8, sheet_name: "metal", sheet_label: "Metal", name: "Pewter Gray", image_name: null, red_value: 142, green_value: 143, blue_value: 138, manufacturer_id: 1, hex_value: "#8e8f8a", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 9, sheet_name: "metal", sheet_label: "Metal", name: "Quaker Gray", image_name: null, red_value: 107, green_value: 102, blue_value: 99, manufacturer_id: 1, hex_value: "#6b6663", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 10, sheet_name: "metal", sheet_label: "Metal", name: "Sandstone", image_name: null, red_value: 192, green_value: 184, blue_value: 159, manufacturer_id: 1, hex_value: "#c2b89f", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
      { id: 11, sheet_name: "metal", sheet_label: "Metal", name: "Slate Blue", image_name: null, red_value: 76, green_value: 113, blue_value: 135, manufacturer_id: 1, hex_value: "#4C7184", percentage_of_cost: 0, price_of: null, applicable_on: null, cost: 0, color_add_ons: null, applied_on: null },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("colors", null, {});
  },
};
