"use strict";

const bracesData = [
  { id: 5026, map_id: 106, length: 21, cost: 0, bracing_feet: 0 },
  { id: 5027, map_id: 106, length: 22, cost: 0, bracing_feet: 0 },
  { id: 5028, map_id: 106, length: 23, cost: 0, bracing_feet: 0 },
  { id: 5029, map_id: 106, length: 24, cost: 0, bracing_feet: 0 },
  { id: 5030, map_id: 106, length: 25, cost: 0, bracing_feet: 0 },
  { id: 5031, map_id: 106, length: 26, cost: 0, bracing_feet: 0 },
  { id: 5032, map_id: 106, length: 27, cost: 0, bracing_feet: 0 },
  { id: 5033, map_id: 106, length: 28, cost: 0, bracing_feet: 0 },
  { id: 5034, map_id: 106, length: 29, cost: 0, bracing_feet: 0 },
  { id: 5035, map_id: 106, length: 30, cost: 0, bracing_feet: 0 },
  { id: 5036, map_id: 106, length: 31, cost: 0, bracing_feet: 0 },
  { id: 5037, map_id: 106, length: 32, cost: 0, bracing_feet: 0 },
  { id: 5038, map_id: 106, length: 33, cost: 0, bracing_feet: 0 },
  { id: 5039, map_id: 106, length: 34, cost: 0, bracing_feet: 0 },
  { id: 5040, map_id: 106, length: 35, cost: 0, bracing_feet: 0 },
  { id: 5041, map_id: 106, length: 36, cost: 0, bracing_feet: 0 },
  { id: 5042, map_id: 106, length: 37, cost: 0, bracing_feet: 0 },
  { id: 5043, map_id: 106, length: 38, cost: 0, bracing_feet: 0 },
  { id: 5044, map_id: 106, length: 39, cost: 0, bracing_feet: 0 },
  { id: 5045, map_id: 106, length: 40, cost: 0, bracing_feet: 0 },
  { id: 5046, map_id: 106, length: 41, cost: 0, bracing_feet: 0 },
  { id: 5047, map_id: 106, length: 42, cost: 0, bracing_feet: 0 },
  { id: 5048, map_id: 106, length: 43, cost: 0, bracing_feet: 0 },
  { id: 5049, map_id: 106, length: 44, cost: 0, bracing_feet: 0 },
  { id: 5050, map_id: 106, length: 45, cost: 0, bracing_feet: 0 },
  { id: 5051, map_id: 106, length: 46, cost: 0, bracing_feet: 0 },
  { id: 5052, map_id: 106, length: 47, cost: 0, bracing_feet: 0 },
  { id: 5053, map_id: 106, length: 48, cost: 0, bracing_feet: 0 },
  { id: 5054, map_id: 106, length: 49, cost: 0, bracing_feet: 0 },
  { id: 5055, map_id: 106, length: 50, cost: 0, bracing_feet: 0 },
  { id: 5056, map_id: 106, length: 51, cost: 0, bracing_feet: 0 },
  { id: 15230, map_id: 244, length: 21, cost: 22, bracing_feet: 2 },
  { id: 15231, map_id: 244, length: 22, cost: 29, bracing_feet: 2 },
  { id: 15232, map_id: 244, length: 23, cost: 29, bracing_feet: 2 },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;
    await queryInterface.bulkInsert("braces", bracesData);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;
    await queryInterface.bulkDelete("braces", null);
  },
};
