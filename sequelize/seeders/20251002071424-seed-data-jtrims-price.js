"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("data_jtrims_price", [
      {
        id: 34,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 1,
        jtrims_row: Buffer.from(
            "5b7b226c656e677468223a32312c22636f7374223a35307d2c7b226c656e677468223a32362c22636f7374223a36307d2c7b226c656e677468223a33312c22636f7374223a37307d2c7b226c656e677468223a33362c22636f7374223a38307d2c7b226c656e677468223a34312c22636f7374223a39307d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 35,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 2,
        jtrims_row: Buffer.from(
            "5b7b226c656e677468223a32312c22636f7374223a35307d2c7b226c656e677468223a32362c22636f7374223a36307d2c7b226c656e677468223a33312c22636f7374223a37307d2c7b226c656e677468223a33362c22636f7374223a38307d2c7b226c656e677468223a34312c22636f7374223a39307d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 36,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 3,
        jtrims_row: Buffer.from(
            "5b7b226c656e677468223a32312c22636f7374223a35307d2c7b226c656e677468223a32362c22636f7374223a36307d2c7b226c656e677468223a33312c22636f7374223a37307d2c7b226c656e677468223a33362c22636f7374223a38307d2c7b226c656e677468223a34312c22636f7374223a39307d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 37,
        manufacturer_id: 3,
        region_id: 8,
        building_id: 7,
        jtrims_row: Buffer.from(
            "5b7b226c656e677468223a32312c22636f7374223a35307d2c7b226c656e677468223a32362c22636f7374223a36357d2c7b226c656e677468223a33312c22636f7374223a37357d2c7b226c656e677468223a33362c22636f7374223a38307d2c7b226c656e677468223a34312c22636f7374223a39307d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 38,
        manufacturer_id: 3,
        region_id: 9,
        building_id: 1,
        jtrims_row: Buffer.from(
            "5b7b226c656e677468223a32312c22636f7374223a35307d2c7b226c656e677468223a32362c22636f7374223a36307d2c7b226c656e677468223a33312c22636f7374223a37307d2c7b226c656e677468223a33362c22636f7374223a38307d2c7b226c656e677468223a34312c22636f7374223a39307d5d",
            "hex"
        ),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_jtrims_price", null, {});
  },
};
