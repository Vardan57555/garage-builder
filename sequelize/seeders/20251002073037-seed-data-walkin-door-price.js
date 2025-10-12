"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_walkin_door_price", [
      {
        id: 1,
        manufacturer_id: 12,
        region_id: 32,
        building_id: 1,
        walkin_data: JSON.stringify({
          walkin: [
            { width: "36", height: "80", door_type: "standard_walkin", door_category: "Man Door", cost: "330", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "48", height: "72", door_type: "standard_walkin", door_category: "Man Door", cost: "440", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "60", height: "72", door_type: "double_door_walkin", door_category: "Double Door", cost: "880", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "36", height: "80", door_type: "9_lite_walkin", door_category: "9 Lite", cost: "480", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "48", height: "72", door_type: "9_lite_walkin", door_category: "9 Lite", cost: "590", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "60", height: "72", door_type: "9_lite_double_door_walkin", door_category: "9-Lite Double Door", cost: "1030", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "36", height: "80", door_type: "standard_walkin", door_category: "Plyco Regular", cost: "1175", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "36", height: "80", door_type: "9_lite_walkin", door_category: "Plyco 9-Lite Door", cost: "1345", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "60", height: "72", door_type: "double_door_walkin", door_category: "Plyco Double Door", cost: "2350", on_side_cost: 0, vertical_side_cost: 0 },
            { width: "60", height: "72", door_type: "9_lite_double_door_walkin", door_category: "Plyco 9-Lite Double Door", cost: "2690", on_side_cost: 0, vertical_side_cost: 0 }
          ],
          frameout: [
            { width: "36", height: "80", door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: "150", frameout_cost_side: "150" },
            { width: "48", height: "72", door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: "150", frameout_cost_side: "150" },
            { width: "60", height: "72", door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: "250", frameout_cost_side: "250" }
          ]
        }),
        created_at: new Date("2022-10-17 05:52:38"),
        updated_at: null,
        deleted_at: null
      },
      {
        id: 27,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 3,
        walkin_data: JSON.stringify({
          walkin: [
            { width: 36, height: 80, door_type: "standard_walkin", door_category: "Solid Door", cost: "350", on_side_cost: "0", vertical_side_cost: 0 },
            { width: 36, height: 80, door_type: "9_lite_walkin", door_category: "9 Lite", cost: "450", on_side_cost: "0", vertical_side_cost: 0 },
            { width: 36, height: 80, door_type: "diamond_window_walkin", door_category: "Diamond Window", cost: "400", on_side_cost: "0", vertical_side_cost: 0 },
            { width: 72, height: 80, door_type: "french_door_walkin", door_category: "French", cost: "850", on_side_cost: "200", vertical_side_cost: 0 },
            { width: 72, height: 80, door_type: "9_lite_double_door_walkin", door_category: "9-Lite French", cost: "950", on_side_cost: "200", vertical_side_cost: "0" }
          ],
          frameout: [
            { width: 36, height: 80, is_custom_size: null, door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: "105", frameout_cost_side: "105" },
            { width: 72, height: 80, is_custom_size: null, door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: "200", frameout_cost_side: "300" },
            { width: "24-72", height: "60-96", is_custom_size: true, door_type: "standard_walkin", door_category: "Man Door", frameout_cost_end: 0, frameout_cost_side: 0 }
          ],
          show_custom_size_frameout: "true",
          clearance_option_frameout: null
        }),
        created_at: new Date("2025-09-12 06:13:46"),
        updated_at: null,
        deleted_at: null
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_walkin_door_price", null, {});
  }
};
