"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") return;

    await queryInterface.bulkInsert("garage_door_frameout", [
      { id: 904, map_id: 98, is_fixed: 0, is_custom_size: 0, on_end: 140, on_side: 240, dutch_cost: 100, height: 0, frame_out_length: "6-12", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 905, map_id: 98, is_fixed: 0, is_custom_size: 0, on_end: 400, on_side: 500, dutch_cost: 100, height: 0, frame_out_length: "13-16", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 906, map_id: 98, is_fixed: 0, is_custom_size: 0, on_end: 900, on_side: 1000, dutch_cost: 100, height: 0, frame_out_length: "17-20", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 916, map_id: 102, is_fixed: 0, is_custom_size: 0, on_end: 140, on_side: 240, dutch_cost: 100, height: 0, frame_out_length: "6-12", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 917, map_id: 102, is_fixed: 0, is_custom_size: 0, on_end: 400, on_side: 500, dutch_cost: 100, height: 0, frame_out_length: "13-16", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 918, map_id: 102, is_fixed: 0, is_custom_size: 0, on_end: 900, on_side: 1000, dutch_cost: 100, height: 0, frame_out_length: "17-20", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 2781, map_id: 105, is_fixed: 0, is_custom_size: 0, on_end: 140, on_side: 240, dutch_cost: 100, height: 12, frame_out_length: "6", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 100, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 2782, map_id: 105, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 1800, dutch_cost: 100, height: 16, frame_out_length: "13", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 100, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 2783, map_id: 105, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 2400, dutch_cost: 100, height: 20, frame_out_length: "17", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 100, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 3565, map_id: 106, is_fixed: 0, is_custom_size: 0, on_end: 140, on_side: 240, dutch_cost: 100, height: 12, frame_out_length: "6", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 3566, map_id: 106, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 1800, dutch_cost: 100, height: 16, frame_out_length: "13", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 3567, map_id: 106, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 2400, dutch_cost: 100, height: 20, frame_out_length: "17", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 0, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 7770, map_id: 244, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 225, dutch_cost: 40, height: 0, frame_out_length: "6-12", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 40, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 7771, map_id: 244, is_fixed: 0, is_custom_size: 0, on_end: 0, on_side: 275, dutch_cost: 40, height: 0, frame_out_length: "13-15", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 40, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
      { id: 7772, map_id: 244, is_fixed: 0, is_custom_size: 0, on_end: 125, on_side: 0, dutch_cost: 40, height: 0, frame_out_length: "0", frame_out_height: null, building_height: "0", building_width: "0", building_length: "0", dutch_cost_side: 40, is_header_bar: 0, header_bar: 0, end_clearance: 0, side_clearance: 0, legs_type: null },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("garage_door_frameout", null, {});
  },
};
