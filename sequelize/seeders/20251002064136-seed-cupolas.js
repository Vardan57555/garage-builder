"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("cupolas", [
      { id: 11, map_id: 193, structure: "2x2", cost: 2885.0, cupola_type_id: 1, created_at: now, updated_at: now },
      { id: 12, map_id: 193, structure: "4x4", cost: 6130.0, cupola_type_id: 1, created_at: now, updated_at: now  },
      { id: 13, map_id: 193, structure: "3x3", cost: 4145.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 17, map_id: 195, structure: "2x2", cost: 2885.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 18, map_id: 195, structure: "3x3", cost: 4145.0, cupola_type_id: 1, created_at: now, updated_at: now  },
      { id: 19, map_id: 195, structure: "4x4", cost: 6130.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 20, map_id: 196, structure: "2x2", cost: 2885.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 21, map_id: 196, structure: "3x3", cost: 4145.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 22, map_id: 196, structure: "4x4", cost: 6130.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 23, map_id: 197, structure: "2x2", cost: 2885.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 24, map_id: 197, structure: "3x3", cost: 4145.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 25, map_id: 197, structure: "4x4", cost: 6130.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 26, map_id: 198, structure: "2x2", cost: 2885.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 27, map_id: 198, structure: "3x3", cost: 4145.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 28, map_id: 198, structure: "4x4", cost: 6130.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 32, map_id: 422, structure: "2x2", cost: 0.0, cupola_type_id: 1,  created_at: now, updated_at: now },
      { id: 33, map_id: 422, structure: "3x3", cost: 0.0, cupola_type_id: 1,  created_at: now, updated_at: now  },
      { id: 34, map_id: 422, structure: "4x4", cost: 0.0, cupola_type_id: 1,  created_at: now, updated_at: now  },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("cupolas", null, {});
  }
};
