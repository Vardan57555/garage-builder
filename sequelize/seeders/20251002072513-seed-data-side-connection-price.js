"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_side_connection_price", [
      {
        id: 1,
        manufacturer_id: 12,
        region_id: 32,
        building_id: 1,
        side_connection_row: '[{"length":20,"cost":"100","end_cost":0},{"length":25,"cost":"125","end_cost":0},{"length":30,"cost":"150","end_cost":0},{"length":35,"cost":"175","end_cost":0},{"length":40,"cost":"200","end_cost":0}]',
        created_at: '2019-05-13 13:36:38',
        updated_at: '2019-07-23 15:20:48',
        deleted_at: null
      },
      {
        id: 2,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 1,
        side_connection_row: '[{"length":20,"cost":"100","end_cost":0},{"length":25,"cost":"125","end_cost":0},{"length":30,"cost":"150","end_cost":0},{"length":35,"cost":"175","end_cost":0},{"length":40,"cost":"200","end_cost":0}]',
        created_at: '2019-05-30 10:37:46',
        updated_at: '2021-03-04 10:06:55',
        deleted_at: null
      },
      {
        id: 3,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 3,
        side_connection_row: '[{"length":20,"cost":"100","end_cost":0},{"length":25,"cost":"125","end_cost":0},{"length":30,"cost":"150","end_cost":0},{"length":35,"cost":"175","end_cost":0},{"length":40,"cost":"200","end_cost":0}]',
        created_at: '2019-05-30 11:16:01',
        updated_at: '2021-03-04 12:36:04',
        deleted_at: null
      },
      {
        id: 10,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 1,
        side_connection_row: '[{"length":20,"cost":100,"end_cost":0},{"length":25,"cost":125,"end_cost":0},{"length":30,"cost":150,"end_cost":0},{"length":35,"cost":175,"end_cost":0},{"length":40,"cost":200,"end_cost":0}]',
        created_at: null,
        updated_at: '2021-04-12 09:06:49',
        deleted_at: null
      },
      {
        id: 11,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 2,
        side_connection_row: '[{"length":20,"cost":100,"end_cost":0},{"length":25,"cost":125,"end_cost":0},{"length":30,"cost":150,"end_cost":0},{"length":35,"cost":175,"end_cost":0},{"length":40,"cost":200,"end_cost":0}]',
        created_at: null,
        updated_at: '2021-04-12 09:07:18',
        deleted_at: null
      },
      {
        id: 12,
        manufacturer_id: 16,
        region_id: 34,
        building_id: 3,
        side_connection_row: '[{"length":20,"cost":100,"end_cost":0},{"length":25,"cost":125,"end_cost":0},{"length":30,"cost":150,"end_cost":0},{"length":35,"cost":175,"end_cost":0},{"length":40,"cost":200,"end_cost":0}]',
        created_at: null,
        updated_at: '2021-07-08 09:28:52',
        deleted_at: null
      },
      {
        id: 13,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 4,
        side_connection_row: '[{"length":21,"cost":"100","end_cost":0},{"length":26,"cost":"125","end_cost":0},{"length":31,"cost":"150","end_cost":0},{"length":36,"cost":"175","end_cost":0},{"length":41,"cost":"200","end_cost":0}]',
        created_at: '2019-06-18 09:42:17',
        updated_at: '2021-03-05 15:36:10',
        deleted_at: null
      },
      {
        id: 696,
        manufacturer_id: 2,
        region_id: 13,
        building_id: 21,
        side_connection_row: '[{"length":120,"cost":0,"end_cost":0}]',
        created_at: null,
        updated_at: null,
        deleted_at: null
      },
      {
        id: 697,
        manufacturer_id: 2,
        region_id: 13,
        building_id: 22,
        side_connection_row: '[{"length":140,"cost":0,"end_cost":0}]',
        created_at: null,
        updated_at: null,
        deleted_at: null
      },
      {
        id: 698,
        manufacturer_id: 2,
        region_id: 13,
        building_id: 23,
        side_connection_row: '[{"length":140,"cost":0,"end_cost":0}]',
        created_at: null,
        updated_at: null,
        deleted_at: null
      },
      {
        id: 699,
        manufacturer_id: 2,
        region_id: 13,
        building_id: 24,
        side_connection_row: '[]',
        created_at: null,
        updated_at: '2021-11-19 06:17:41',
        deleted_at: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    await queryInterface.bulkDelete("data_side_connection_price", null, {});
  },
};
