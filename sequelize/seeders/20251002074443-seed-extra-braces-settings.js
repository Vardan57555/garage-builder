"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("extra_braces_settings", [
      {
        id: 1,
        name: "Diagonal Braces",
        slug: "diagonal_braces",
        labels: "Diagonal Braces",
        is_default: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 2,
        name: "X Bracings",
        slug: "x_bracings",
        labels: "X Bracings",
        is_default: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 3,
        name: "V Bracings",
        slug: "v_bracings",
        labels: "V Bracings",
        is_default: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 4,
        name: "K/Bay Bracings",
        slug: "k_bay_bracings",
        labels: "K/Bay Bracings",
        is_default: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 7,
        name: "Invert V Bracings",
        slug: "invert_v_bracings",
        labels: "A  Bracings",
        is_default: 0,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("extra_braces_settings", null, {});
  },
};
