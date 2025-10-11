"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("additional_features", [
      { id: 355, map_id: 155, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 399, map_id: 54, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 461, map_id: 70, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 540, map_id: 67, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 541, map_id: 67, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 10, percentage_of: '2,3', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 542, map_id: 69, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 543, map_id: 69, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 10, percentage_of: '2,3', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 603, map_id: 52, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 604, map_id: 52, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 10, percentage_of: '2,3', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 621, map_id: 53, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 622, map_id: 53, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 10, percentage_of: '2,3', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 1861, map_id: 439, additional_feature: 'Colored Screws', cost_type: '%', cost: 0, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 1862, map_id: 440, additional_feature: 'Colored Screws', cost_type: '%', cost: 0, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 1863, map_id: 441, additional_feature: 'Colored Screws', cost_type: '%', cost: 0, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 2023, map_id: 470, additional_feature: 'Colored Screws', cost_type: '%', cost: 0, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 2898, map_id: 442, additional_feature: 'Colored Screws', cost_type: '%', cost: 0, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10700, map_id: 239, additional_feature: 'Colored Match Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10701, map_id: 239, additional_feature: '26 Gauge Panel Upgrade', cost_type: '%', cost: 20, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10796, map_id: 540, additional_feature: 'Colored Match Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10797, map_id: 540, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 20, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10800, map_id: 541, additional_feature: 'Colored Screw', cost_type: '%', cost: 5, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
      { id: 10801, map_id: 541, additional_feature: '26 Ga Panel Upgrade', cost_type: '%', cost: 20, percentage_of: '1', is_cumulative: 0, feature_type: 'additional_feature', is_outside_extra_item: 0 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("additional_features", null, {});
  }
};
