"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("extra_addons_sheets", [
      { id: 3, name: "Built Over Fee", slug: "labour_fee", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 4, name: "Cut Leg on Site", slug: "cut_leg_on_site", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 5, name: "Install Over Existing", slug: "install_over_existing", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 6, name: "Install On Deck/Dock", slug: "install_on_deck/docl", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 7, name: "Install On wall (Up to 3')", slug: "install_on_wall_(up_to_3')", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 8, name: "Cut Legs to Level", slug: "cut_legs_to_level", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 9, name: "Side Connection Fee", slug: "connection_fee", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 10, name: "Colored Screws", slug: "colored_screws", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 11, name: "Foam Enclosure", slug: "foam_enclosure", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 12, name: "Risk 2 Category", slug: "risk_2_category", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 13, name: "26 GA Panel Upgrade (Roof)", slug: "26_ga_panel_upgrade_(roof)", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 14, name: "26 GA Panel Upgrade (Full Building)", slug: "26_ga_panel_upgrade_(full_building)", updated_at: "2024-06-05 07:41:47", deleted_at: null },
      { id: 15, name: "Long Life Colored Screws", slug: "long_life_colored_screws", updated_at: null, deleted_at: null }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("extra_addons_sheets", null, {});
  }
};
