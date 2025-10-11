"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_truss_name", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        trussname_row: JSON.stringify([
          { id: 4996, name: "ECT1", label: null, min_width: 12, max_width: 24, min_height: 0, max_height: 0, is_default: "1", is_show: "0", cost: "0", price_type: "$", price_of: null },
          { id: 0, name: "HSST", label: "Premier Truss", min_width: "12", max_width: "24", min_height: 0, max_height: 0, is_default: "0", is_show: "1", cost: "5", price_type: "$", price_of: ["full_building_price"] }
        ])
      },
      {
        id: 2,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 3,
        trussname_row: JSON.stringify([
          { id: 0, name: "RBT", label: "Standard Truss", min_width: "25", max_width: "30", min_height: "0", max_height: "0", is_default: "0", is_show: "0", cost: 0, price_type: "$", price_of: null },
          { id: 0, name: "CMT", label: "High Truss", min_width: "25", max_width: "30", min_height: "0", max_height: "0", is_default: "0", is_show: "1", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 3,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 8,
        trussname_row: JSON.stringify([
          { id: 301, name: "RBT", label: null, min_width: "32", max_width: "40", min_height: 0, max_height: 0, is_default: "1", is_show: "0", cost: 0, price_type: "$", price_of: null },
          { id: 0, name: "LST", label: null, min_width: "32", max_width: "40", min_height: "0", max_height: "0", is_default: "0", is_show: "1", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 4,
        manufacturer_id: 8,
        region_id: 24,
        building_id: 9,
        trussname_row: JSON.stringify([
          { id: 4471, name: "SBST3", label: null, min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: "1", is_show: "0", cost: 0, price_type: "$", price_of: null },
          { id: 4472, name: "SBST3", label: null, min_width: 42, max_width: 50, min_height: 0, max_height: 0, is_default: "1", is_show: "0", cost: 0, price_type: "$", price_of: null },
          { id: 4473, name: "ECT3", label: "High Truss", min_width: 32, max_width: 40, min_height: 0, max_height: 0, is_default: "0", is_show: "1", cost: 0, price_type: "$", price_of: null },
          { id: 4474, name: "ECT3", label: "High Truss", min_width: 42, max_width: 50, min_height: 0, max_height: 0, is_default: "0", is_show: "1", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 5,
        manufacturer_id: 121,
        region_id: 233,
        building_id: 7,
        trussname_row: JSON.stringify([
          { id: 0, name: "ECT3", label: "Standard Truss", min_width: "32", max_width: "60", min_height: "8", max_height: "16", is_default: "1", is_show: "1", cost: "500", price_type: "$", price_of: null },
          { id: 0, name: "SBST3", label: "High Truss", min_width: "32", max_width: "60", min_height: "8", max_height: "16", is_default: "0", is_show: "1", cost: "5", price_type: "%", price_of: ["full_building_price"] },
          { id: 0, name: "LST3", label: "Secondary Truss", min_width: "32", max_width: "60", min_height: "17", max_height: "20", is_default: "0", is_show: "1", cost: "2", price_type: "sqft", price_of: ["full_building_price"] }
        ])
      },
      {
        id: 6,
        manufacturer_id: 67,
        region_id: 141,
        building_id: 1,
        trussname_row: JSON.stringify([
          { id: 269, name: "SBST1", min_width: 12, max_width: 24, is_default: "0", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 7,
        manufacturer_id: 67,
        region_id: 141,
        building_id: 27,
        trussname_row: JSON.stringify([
          { id: 1323, name: "SBST1", min_width: 6, max_width: 24, is_default: "0", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 8,
        manufacturer_id: 67,
        region_id: 141,
        building_id: 3,
        trussname_row: JSON.stringify([
          { id: 270, name: "SBST2", min_width: 26, max_width: 30, is_default: "0", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 9,
        manufacturer_id: 67,
        region_id: 141,
        building_id: 8,
        trussname_row: JSON.stringify([
          { id: 271, name: "SBST3", min_width: 32, max_width: 40, is_default: "0", cost: 0, price_type: "$", price_of: null },
          { id: 272, name: "SBST4", min_width: 42, max_width: 60, is_default: "0", cost: 0, price_type: "$", price_of: null }
        ])
      },
      {
        id: 10,
        manufacturer_id: 67,
        region_id: 141,
        building_id: 10,
        trussname_row: JSON.stringify([
          { id: 274, name: "SBST5", min_width: 62, max_width: 70, is_default: "0", cost: 0, price_type: "$", price_of: null }
        ])
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_truss_name", { id: { [Sequelize.Op.lte]: 10 } });
  }
};
