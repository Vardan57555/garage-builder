"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("extra_panels", [
      {
        id: 30790,
        map_id: 33,
        price_type: "$",
        price_of: null,
        length: 21,
        name: "metal",
        label: "Metal",
        cost: 85,
        cut_panel_cost: 73,
        vertical_panel_cost: 0,
        horizontal_roof_panel_cost: 0,
        vertical_roof_panel_cost: 0,
        panel_jtrim: 0,
        is_panel_jtrim:  "no",
        cut_panel_jtrim:  0,
        is_cut_panel_jtrim: "no",
      },
      {
        id: 30791,
        map_id: 33,
        price_type: "$",
        price_of: null,
        length: 22,
        name: "metal",
        label: "Metal",
        cost: 100,
        cut_panel_cost: 85,
        vertical_panel_cost: 0,
        horizontal_roof_panel_cost: 0,
        vertical_roof_panel_cost: 0,
        panel_jtrim: 0,
        is_panel_jtrim:  "no",
        cut_panel_jtrim:  0,
        is_cut_panel_jtrim: "no",
      },
      {
        id: 30792,
        map_id: 33,
        price_type: "$",
        price_of: null,
        length: 23,
        name: "metal",
        label: "Metal",
        cost: 100,
        cut_panel_cost: 85,
        vertical_panel_cost: 0,
        horizontal_roof_panel_cost: 0,
        vertical_roof_panel_cost: 0,
        panel_jtrim: 0,
        is_panel_jtrim:  "no",
        cut_panel_jtrim:  0,
        is_cut_panel_jtrim: "no",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("extra_panels", null, {});
  },
};
