"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    const now = new Date();

    return queryInterface.bulkInsert("data_overhang", [
      {
        id: 1,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 1,
        row_data: '{"end":[{"sheet_name":"1\' End Overhang (whole Building)","sheet_data":[{"width":"12","cost":"122","price_of":[]},{"width":"18","cost":"200","price_of":[]},{"width":"20","cost":"300","price_of":[]},{"width":"22","cost":"400","price_of":[]},{"width":"24","cost":"500","price_of":[]}],"cost_type":"$"}],"side":[{"sheet_name":"1\' Side Overhang (Whole Building)","sheet_data":[{"length":"20","cost":"200","price_of":[]},{"length":"25","cost":"250","price_of":[]},{"length":"30","cost":"300","price_of":[]},{"length":"35","cost":"350","price_of":[]},{"length":"40","cost":"400","price_of":[]},{"length":"45","cost":"450","price_of":[]},{"length":"50","cost":"500","price_of":[]}],"cost_type":"$"}],"both":[{"sheet_name":"End","sheet_data":[],"cost_type":"$","sheet_type":"both"},{"sheet_name":"Side","sheet_data":[],"cost_type":"$","sheet_type":"both"}]}',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        manufacturer_id: 8,
        region_id: 23,
        building_id: 3,
        row_data: '{"end":[{"sheet_name":null,"sheet_data":[],"cost_type":"$"}],"side":[{"sheet_name":null,"sheet_data":[],"cost_type":"$","sheet_type":"side"}],"both":[{"sheet_name":"End","sheet_data":[{"width":"26","cost":"520","price_of":[]},{"width":"28","cost":"560","price_of":[]},{"width":"30","cost":"600","price_of":[]}],"cost_type":"$","sheet_type":"both"},{"sheet_name":"Side","sheet_data":[{"length":"20","cost":"400","price_of":[]},{"length":"25","cost":"500","price_of":[]},{"length":"30","cost":"600","price_of":[]},{"length":"35","cost":"700","price_of":[]},{"length":"40","cost":"800","price_of":[]},{"length":"45","cost":"900","price_of":[]},{"length":"50","cost":"1000","price_of":[]}],"cost_type":"$","sheet_type":"both"}]}',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 1,
        row_data: '{"both":[{"sheet_name":"End","sheet_data":[{"width":"12","cost":"336","price_of":[]},{"width":"14","cost":"480","price_of":[]},{"width":"16","cost":"480","price_of":[]},{"width":"18","cost":"480","price_of":[]},{"width":"20","cost":"528","price_of":[]},{"width":"22","cost":"576","price_of":[]},{"width":"24","cost":"624","price_of":[]}],"cost_type":"$","sheet_type":"both"},{"sheet_name":"Side","sheet_data":[{"length":"20","cost":"480","price_of":[]},{"length":"25","cost":"600","price_of":[]},{"length":"30","cost":"720","price_of":[]},{"length":"35","cost":"840","price_of":[]},{"length":"40","cost":"960","price_of":[]}],"cost_type":"$"}],"end":[{"sheet_name":null,"sheet_data":[],"cost_type":"$"}],"side":[{"sheet_name":null,"sheet_data":[],"cost_type":"$"}]}',
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        manufacturer_id: 13,
        region_id: 33,
        building_id: 2,
        row_data: '{"both":[{"sheet_name":"End","sheet_data":[{"width":"6","cost":"168","price_of":[]},{"width":"7","cost":"192","price_of":[]},{"width":"8","cost":"216","price_of":[]},{"width":"9","cost":"240","price_of":[]},{"width":"10","cost":"264","price_of":[]},{"width":"11","cost":"288","price_of":[]},{"width":"12","cost":"312","price_of":[]},{"width":"13","cost":"336","price_of":[]},{"width":"14","cost":"360","price_of":[]},{"width":"15","cost":"384","price_of":[]},{"width":"16","cost":"408","price_of":[]},{"width":"17","cost":"432","price_of":[]},{"width":"18","cost":"456","price_of":[]},{"width":"19","cost":"480","price_of":[]},{"width":"20","cost":"504","price_of":[]}],"cost_type":"$","sheet_type":"both"},{"sheet_name":"Side","sheet_data":[{"length":"20","cost":"240","price_of":[]},{"length":"25","cost":"300","price_of":[]},{"length":"30","cost":"360","price_of":[]},{"length":"35","cost":"420","price_of":[]},{"length":"40","cost":"480","price_of":[]}],"cost_type":"$","sheet_type":"both"}],"side":[{"sheet_name":null,"sheet_data":[],"cost_type":"$"}],"end":[{"sheet_name":null,"sheet_data":[],"cost_type":"$"}]}',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("data_overhang", null, {});
  },
};
