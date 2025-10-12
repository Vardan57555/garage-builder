"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkInsert("lift_types", [
      { id: 1, name: "Forklift" },
      { id: 2, name: "Skylift" },
      { id: 3, name: "7K Lift" },
      { id: 4, name: "7K Lull Lift" },
      { id: 5, name: "Lift Required" },
      { id: 6, name: "Lift Required (Call for Pricing)" },
      { id: 7, name: "Scissor Lifts (Required Call for Pricing)" },
      { id: 8, name: "Forklift (Required Call for Pricing)" },
      { id: 9, name: "Telescopic Lift" },
      { id: 10, name: "6K Lull Lift" },
      { id: 11, name: "Scissor Lifts" },
      { id: 12, name: "Material Lifts" },
      { id: 13, name: "Telescopic Forklift" },
      { id: 14, name: "Telescopic Lull Lift" },
      { id: 15, name: "7K Lull Fork Lift" },
      { id: 16, name: "Lull Lift" },
      { id: 17, name: "2 Telescopic Forklift" },
      { id: 18, name: "Duct Lift" },
      { id: 19, name: "2 lull lift’s" },
      { id: 20, name: "Telescopic Boom Lift" },
      { id: 21, name: "7K Telescopic Lull Lift" },
      { id: 22, name: "Telescopic Lull Lift (With Forks)" },
      { id: 23, name: "Boom Lift" },
      { id: 24, name: "Telescopic Fork and Man Lift" },
      { id: 25, name: "Tele-Handler Lift" },
      { id: 26, name: "Tele-Handler & Articulating Lift" },
      { id: 27, name: "Lift/Labor charge" },
      { id: 28, name: "Telescopic/Lull Forklift" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("lift_types", null, {});
  },
};
