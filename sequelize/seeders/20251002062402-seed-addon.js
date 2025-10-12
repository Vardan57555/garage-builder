"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("addons", [
      { id: 218, map_id: 98, length: 21, fourth_center_cost: 200, risk_cost: 1150, cert_pac_cost: 250, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 219, map_id: 98, length: 22, fourth_center_cost: 250, risk_cost: 1250, cert_pac_cost: 350, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 220, map_id: 98, length: 23, fourth_center_cost: 250, risk_cost: 1250, cert_pac_cost: 350, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 221, map_id: 98, length: 24, fourth_center_cost: 250, risk_cost: 1250, cert_pac_cost: 350, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 222, map_id: 98, length: 25, fourth_center_cost: 250, risk_cost: 1250, cert_pac_cost: 350, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 223, map_id: 98, length: 26, fourth_center_cost: 250, risk_cost: 1250, cert_pac_cost: 350, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 224, map_id: 98, length: 27, fourth_center_cost: 300, risk_cost: 1450, cert_pac_cost: 450, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 225, map_id: 98, length: 28, fourth_center_cost: 300, risk_cost: 1450, cert_pac_cost: 450, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 226, map_id: 98, length: 29, fourth_center_cost: 300, risk_cost: 1450, cert_pac_cost: 450, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 227, map_id: 98, length: 30, fourth_center_cost: 300, risk_cost: 1450, cert_pac_cost: 450, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 },
      { id: 13025, map_id: 244, length: 41, fourth_center_cost: 195, risk_cost: 0, cert_pac_cost: 0, ground_certificate: 0, overhang: 0, jtrim: 0, interior_anchor: 0, baserail_caulk: 0, cut_leg_on_site_cost: 0 }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("addons", null, {});
  }
};
