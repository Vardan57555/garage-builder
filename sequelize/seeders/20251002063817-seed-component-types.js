"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("component_types", [
      { id: 9, map_id: 149, type_name: "Roll-up", component_type_id: 1 },
      { id: 10, map_id: 149, type_name: "Sectional", component_type_id: 1 },
      { id: 11, map_id: 149, type_name: "Standard", component_type_id: 3 },
      { id: 12, map_id: 149, type_name: "9 Lite", component_type_id: 3 },
      { id: 14, map_id: 149, type_name: "Plain", component_type_id: 4 },
      { id: 15, map_id: 149, type_name: "With Grid", component_type_id: 4 },
      { id: 16, map_id: 149, type_name: "Faux", component_type_id: 4 },
      { id: 17, map_id: 150, type_name: "Roll-up", component_type_id: 1 },
      { id: 18, map_id: 150, type_name: "Sectional", component_type_id: 1 },
      { id: 19, map_id: 150, type_name: "Standard", component_type_id: 3 },
      { id: 20, map_id: 150, type_name: "9 Lite", component_type_id: 3 },
      { id: 22, map_id: 150, type_name: "Plain", component_type_id: 4 },
      { id: 23, map_id: 150, type_name: "With Grid", component_type_id: 4 },
      { id: 24, map_id: 150, type_name: "Faux", component_type_id: 4 },
      { id: 25, map_id: 151, type_name: "Roll-up", component_type_id: 1 },
      { id: 26, map_id: 151, type_name: "Sectional", component_type_id: 1 },
      { id: 27, map_id: 151, type_name: "Standard", component_type_id: 3 },
      { id: 28, map_id: 151, type_name: "9 Lite", component_type_id: 3 },
      { id: 30, map_id: 151, type_name: "Plain", component_type_id: 4 },
      { id: 31, map_id: 151, type_name: "With Grid", component_type_id: 4 },
      { id: 32, map_id: 151, type_name: "Faux", component_type_id: 4 },
      { id: 34, map_id: 149, type_name: "Roll-up", component_type_id: 2 },
      { id: 35, map_id: 150, type_name: "Roll-up", component_type_id: 2 },
      { id: 36, map_id: 151, type_name: "Roll-up", component_type_id: 2 },
      { id: 37, map_id: 148, type_name: "Roll-up", component_type_id: 1 },
      { id: 38, map_id: 148, type_name: "Sectional", component_type_id: 1 },
      { id: 39, map_id: 148, type_name: "Roll-up", component_type_id: 2 },
      { id: 40, map_id: 148, type_name: "Standard", component_type_id: 3 },
      { id: 41, map_id: 148, type_name: "9 Lite", component_type_id: 3 },
      { id: 42, map_id: 148, type_name: "Plain", component_type_id: 4 },
      { id: 43, map_id: 148, type_name: "With Grid", component_type_id: 4 },
      { id: 44, map_id: 148, type_name: "Faux", component_type_id: 4 },
      { id: 46, map_id: 1, type_name: "test", component_type_id: 1 },
      { id: 47, map_id: 1, type_name: "testasdf", component_type_id: 2 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("component_types", null, {});
  },
};
