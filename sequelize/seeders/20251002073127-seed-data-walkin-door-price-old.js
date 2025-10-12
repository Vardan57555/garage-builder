"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_walkin_door_price_old", [
      {
        id: 1,
        manufacturer_id: 12,
        region_id: 32,
        building_id: 1,
        walkin_door_row: '[{"width":"36","height":"80","door_type":"standard_walkin","door_category":"Man Door","cost":"330","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"48","height":"72","door_type":"standard_walkin","door_category":"Man Door","cost":"440","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"60","height":"72","door_type":"double_door_walkin","door_category":"Double Door","cost":"880","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"250","frameout_cost_side":"250"},{"width":"36","height":"80","door_type":"9_lite_walkin","door_category":"9 Lite","cost":"480","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"48","height":"72","door_type":"9_lite_walkin","door_category":"9 Lite","cost":"590","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"60","height":"72","door_type":"9_lite_double_door_walkin","door_category":"9-Lite Double Door","cost":"1030","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"250","frameout_cost_side":"250"},{"width":"36","height":"80","door_type":"standard_walkin","door_category":"Plyco Regular","cost":"1175","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"36","height":"80","door_type":"9_lite_walkin","door_category":"Plyco 9-Lite Door","cost":"1345","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"150","frameout_cost_side":"150"},{"width":"60","height":"72","door_type":"double_door_walkin","door_category":"Plyco Double Door","cost":"2350","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"250","frameout_cost_side":"250"},{"width":"60","height":"72","door_type":"9_lite_double_door_walkin","door_category":"Plyco 9-Lite Double Door","cost":"2690","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"250","frameout_cost_side":"250"},{"width":"60","height":"72","door_type":"standard_walkin","door_category":"Man Door","cost":"880","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"250","frameout_cost_side":"250"}]',
        created_at: null,
        updated_at: '2022-11-29 12:59:05',
        deleted_at: null
      },
      {
        id: 27,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 3,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Solid Door","cost":"350","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"9_lite_walkin","door_category":"9 Lite","cost":"450","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"diamond_window_walkin","door_category":"Diamond Window","cost":"400","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"},{"width":72,"height":80,"door_type":"french_door_walkin","door_category":"French","cost":"850","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"},{"width":72,"height":80,"door_type":"9_lite_double_door_walkin","door_category":"9-Lite French","cost":"950","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"}]',
        created_at: null,
        updated_at: '2023-06-30 13:56:53',
        deleted_at: null
      },
      {
        id: 112,
        manufacturer_id: 9,
        region_id: 25,
        building_id: 1,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"330","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"9_lite_walkin","door_category":"9 Lite","cost":"420","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"}]',
        created_at: null,
        updated_at: '2023-11-06 07:23:06',
        deleted_at: null
      },
      {
        id: 113,
        manufacturer_id: 9,
        region_id: 25,
        building_id: 2,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"330","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"9_lite_walkin","door_category":"9 Lite","cost":"420","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"}]',
        created_at: null,
        updated_at: '2023-11-06 08:47:13',
        deleted_at: null
      },
      {
        id: 114,
        manufacturer_id: 9,
        region_id: 25,
        building_id: 3,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"330","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"9_lite_walkin","door_category":"9 Lite","cost":"420","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"}]',
        created_at: null,
        updated_at: '2023-11-06 10:43:13',
        deleted_at: null
      },
      {
        id: 115,
        manufacturer_id: 9,
        region_id: 25,
        building_id: 7,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"330","on_side_cost":"0","vertical_side_cost":"0","frameout_cost_end":"105","frameout_cost_side":"105"},{"width":36,"height":80,"door_type":"9_lite_walkin","door_category":"9 Lite","cost":"420","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"105","frameout_cost_side":"105"}]',
        created_at: null,
        updated_at: '2023-11-06 12:32:23',
        deleted_at: null
      },
      {
        id: 116,
        manufacturer_id: 10,
        region_id: 26,
        building_id: 1,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"380","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":36,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1300","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":48,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1475","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-02-13 12:32:44',
        deleted_at: null
      },
      {
        id: 117,
        manufacturer_id: 10,
        region_id: 26,
        building_id: 2,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"380","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":36,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1300","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":48,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1475","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-02-14 06:12:30',
        deleted_at: null
      },
      {
        id: 118,
        manufacturer_id: 10,
        region_id: 26,
        building_id: 3,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"325","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":36,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1300","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":48,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1475","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-02-13 12:33:15',
        deleted_at: null
      },
      {
        id: 119,
        manufacturer_id: 10,
        region_id: 27,
        building_id: 1,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"380","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":36,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1375","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":48,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1535","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-01-13 07:46:07',
        deleted_at: null
      },
      {
        id: 120,
        manufacturer_id: 10,
        region_id: 27,
        building_id: 2,
        walkin_door_row: '[{"width":36,"height":80,"door_type":"standard_walkin","door_category":"Man Door","cost":"380","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":36,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1375","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":48,"height":84,"door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1535","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-01-13 10:09:30',
        deleted_at: null
      },
      {
        id: 121,
        manufacturer_id: 10,
        region_id: 27,
        building_id: 3,
        walkin_door_row: '[{"width":"36","height":"80","door_type":"standard_walkin","door_category":"Man Door","cost":"325","on_side_cost":"0","vertical_side_cost":"75","frameout_cost_end":"115","frameout_cost_side":"115"},{"width":"36","height":"80","door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1375","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"},{"width":"36","height":"80","door_type":"solid_walkin","door_category":"Heavy Duty","cost":"1535","on_side_cost":0,"vertical_side_cost":0,"frameout_cost_end":"115","frameout_cost_side":"115"}]',
        created_at: null,
        updated_at: '2023-01-13 05:44:21',
        deleted_at: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkDelete("data_walkin_door_price_old", null, {});
  }
};
