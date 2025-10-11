"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("certificate_lengths", [
      { id: 802948, certificate_id: 16, map_id: 33, length: 21, height: 13, certification_concrete_cost: 0, cost: 0, has_double_leg: true, has_ladder_leg: false, has_other_leg: false, created_at: now, updated_at: now },
      { id: 802949, certificate_id: 16, map_id: 33, length: 22, height: 13, certification_concrete_cost: 0, cost: 0, has_double_leg: true, has_ladder_leg: false, has_other_leg: false, created_at: now, updated_at: now  },
      { id: 802950, certificate_id: 16, map_id: 33, length: 23, height: 13, certification_concrete_cost: 0, cost: 0, has_double_leg: true, has_ladder_leg: false, has_other_leg: false, created_at: now, updated_at: now  },
      { id: 802951, certificate_id: 16, map_id: 33, length: 24, height: 13, certification_concrete_cost: 0, cost: 0, has_double_leg: true, has_ladder_leg: false, has_other_leg: false, created_at: now, updated_at: now  },
      { id: 802952, certificate_id: 16, map_id: 33, length: 25, height: 13, certification_concrete_cost: 0, cost: 0, has_double_leg: true, has_ladder_leg: false, has_other_leg: false, created_at: now, updated_at: now  },
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("certificate_lengths", {
      id: {
        [Sequelize.Op.between]: [802948, 803083]
      }
    });
  }
};
