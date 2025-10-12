"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("garage_door_addons", [
      {
        id: 1,
        name: "Window Option",
        slug: "window_option",
        category: "No Glass,Sherwood,Williamsburg,Cascade,Cathedral,Stockton,Stockbridge,Waterton,Prairie,Plain Glass",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 2,
        name: "Motor",
        slug: "motor",
        category: "Liftmaster,Belt drive,Jackshaft",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 3,
        name: "Insulated",
        slug: "insulated",
        category: "Insulated",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 6,
        name: "Add On Options",
        slug: "add_on_options",
        category: "Inserts,Outside Keypad,Remote,Frame Out,Header Bar,Header Seal,Insulated",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("garage_door_addons", null, {});
  },
};
