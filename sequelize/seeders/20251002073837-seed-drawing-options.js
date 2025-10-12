"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("drawing_options", [
      { id: 1, name: "Generic Drawing", ordering: 1 },
      { id: 2, name: "Generic Drawings (Generic plans only available for buildings under 31' wide)", ordering: 2 },
      { id: 3, name: "Risk 1 Generic", ordering: 3 },
      { id: 4, name: "Risk 2 Generic", ordering: 4 },
      { id: 5, name: "Engineered Drawing", ordering: 5 },
      { id: 6, name: "Engineered Drawings (Additional cost not shown here)", ordering: 6 },
      { id: 7, name: "Generic Drawings Risk I", ordering: 7 },
      { id: 8, name: "Engineered Drawings Risk II", ordering: 8 },
      { id: 9, name: "Site Specific", ordering: 9 },
      { id: 10, name: "Site Specific (Call For Pricing)", ordering: 10 },
      { id: 11, name: "Wet Seals (2 Copies)", ordering: 11 },
      { id: 12, name: "Generic Engineer Drawing", ordering: 12 },
      { id: 13, name: "Seismic Zone D", ordering: 13 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("drawing_options", null, {});
  }
};
