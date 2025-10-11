"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_extra_trusses_price_old", [
      { id: 1, manufacturer_id: 8, region_id: 24, building_id: 1, extra_trusses_row: "[]", created_at: "2019-06-28 17:37:13", updated_at: "2021-04-23 11:25:58", deleted_at: null },
      { id: 2, manufacturer_id: 8, region_id: 24, building_id: 3, extra_trusses_row: "[]", created_at: "2019-06-29 09:39:31", updated_at: "2021-04-23 11:43:51", deleted_at: null },
      { id: 3, manufacturer_id: 8, region_id: 24, building_id: 4, extra_trusses_row: '[{"height":8,"cost":"400"},{"height":9,"cost":"420"},{"height":10,"cost":"440"},{"height":11,"cost":"460"},{"height":12,"cost":"480"},{"height":13,"cost":"500"},{"height":14,"cost":"520"},{"height":15,"cost":"540"},{"height":16,"cost":"560"},{"height":17,"cost":"580"},{"height":18,"cost":"600"},{"height":19,"cost":"620"},{"height":20,"cost":"640"}]', created_at: "2019-06-29 10:41:39", updated_at: "2019-06-29 10:41:39", deleted_at: null },
      { id: 5, manufacturer_id: 8, region_id: 23, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-08 13:47:43", updated_at: "2021-04-24 10:48:55", deleted_at: null },
      { id: 6, manufacturer_id: 11, region_id: 28, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-09 14:55:13", updated_at: "2019-10-10 13:22:20", deleted_at: null },
      { id: 7, manufacturer_id: 8, region_id: 24, building_id: 10, extra_trusses_row: "[]", created_at: "2019-07-13 11:26:34", updated_at: "2021-04-24 07:34:47", deleted_at: null },
      { id: 8, manufacturer_id: 8, region_id: 23, building_id: 10, extra_trusses_row: "[]", created_at: "2019-07-13 13:29:46", updated_at: "2021-04-24 12:43:17", deleted_at: null },
      { id: 9, manufacturer_id: 8, region_id: 23, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-15 13:56:49", updated_at: "2021-04-23 11:48:08", deleted_at: null },
      { id: 10, manufacturer_id: 5, region_id: 17, building_id: 1, extra_trusses_row: '[{"height":6,"cost":"200"},{"height":7,"cost":"215"},{"height":8,"cost":"230"},{"height":9,"cost":"245"},{"height":10,"cost":"260"},{"height":11,"cost":"275"},{"height":12,"cost":"290"},{"height":13,"cost":"305"},{"height":14,"cost":"320"}]', created_at: "2019-07-16 12:55:46", updated_at: "2019-07-16 12:55:46", deleted_at: null },
      { id: 11, manufacturer_id: 5, region_id: 17, building_id: 3, extra_trusses_row: '[{"height":6,"cost":"290"},{"height":7,"cost":"305"},{"height":8,"cost":"320"},{"height":9,"cost":"335"},{"height":10,"cost":"350"},{"height":11,"cost":"365"},{"height":12,"cost":"380"}]', created_at: "2019-07-16 13:17:45", updated_at: "2019-10-07 18:08:19", deleted_at: null },
      { id: 12, manufacturer_id: 5, region_id: 18, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-16 15:05:19", updated_at: "2021-09-01 12:58:35", deleted_at: null },
      { id: 13, manufacturer_id: 5, region_id: 18, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-16 15:53:57", updated_at: "2021-09-02 09:00:42", deleted_at: null },
      { id: 14, manufacturer_id: 5, region_id: 17, building_id: 9, extra_trusses_row: "[]", created_at: "2019-07-17 15:22:58", updated_at: "2019-10-07 18:10:18", deleted_at: null },
      { id: 15, manufacturer_id: 5, region_id: 17, building_id: 14, extra_trusses_row: "[]", created_at: "2019-07-17 15:52:00", updated_at: "2019-10-07 18:19:07", deleted_at: null },
      { id: 16, manufacturer_id: 4, region_id: 10, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-18 11:54:44", updated_at: "2021-05-14 08:38:12", deleted_at: null },
      { id: 17, manufacturer_id: 4, region_id: 10, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-18 12:43:11", updated_at: "2021-05-14 08:47:58", deleted_at: null },
      { id: 18, manufacturer_id: 4, region_id: 11, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-18 14:37:59", updated_at: "2021-02-12 14:04:51", deleted_at: null },
      { id: 19, manufacturer_id: 4, region_id: 11, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-18 15:15:12", updated_at: "2023-01-23 06:40:15", deleted_at: null },
      { id: 20, manufacturer_id: 4, region_id: 13, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-18 17:17:16", updated_at: "2023-01-23 06:41:04", deleted_at: null },
      { id: 21, manufacturer_id: 4, region_id: 13, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-18 17:34:31", updated_at: "2023-01-23 06:41:54", deleted_at: null },
      { id: 22, manufacturer_id: 4, region_id: 14, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-19 13:05:01", updated_at: "2023-01-23 06:54:55", deleted_at: null },
      { id: 23, manufacturer_id: 4, region_id: 14, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-19 13:51:41", updated_at: "2023-01-23 06:55:41", deleted_at: null },
      { id: 24, manufacturer_id: 4, region_id: 15, building_id: 1, extra_trusses_row: "[]", created_at: "2019-07-19 16:39:38", updated_at: "2023-01-23 06:56:34", deleted_at: null },
      { id: 25, manufacturer_id: 4, region_id: 15, building_id: 3, extra_trusses_row: "[]", created_at: "2019-07-19 17:00:47", updated_at: "2023-01-23 06:57:18", deleted_at: null },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_extra_trusses_price_old", null, {});
  },
};
