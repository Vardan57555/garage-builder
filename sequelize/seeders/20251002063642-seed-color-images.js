"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("color_images", [
      { id: 1, image_name: "stackstone_ash_siding.svg", created_at: now, updated_at: now },
      { id: 2, image_name: "stackstone_shadow_siding.svg",  created_at: now, updated_at: now  },
      { id: 3, image_name: "stackstone_smoke_siding.svg", created_at: now, updated_at: now  },
      { id: 4, image_name: "stone_siding.svg", created_at: now, updated_at: now  },
      { id: 5, image_name: "stackstone_ash_siding_horizontal.svg", created_at: now, updated_at: now  },
      { id: 6, image_name: "stackstone_ash_siding_vertical.svg", created_at: now, updated_at: now  },
      { id: 7, image_name: "stackstone_shadow_siding_horizontal.svg", created_at: now, updated_at: now },
      { id: 8, image_name: "stackstone_shadow_siding_vertical.svg", created_at: now, updated_at: now  },
      { id: 9, image_name: "stackstone_smoke_siding_horizontal.svg", created_at: now, updated_at: now  },
      { id: 10, image_name: "stackstone_smoke_siding_vertical.svg", created_at: now, updated_at: now  },
      { id: 11, image_name: "stone_siding_horizontal.svg", created_at: now, updated_at: now  },
      { id: 12, image_name: "stone_siding_vertical.svg", created_at: now, updated_at: now  },
      { id: 13, image_name: "wood_siding_horizontal.svg", created_at: now, updated_at: now  },
      { id: 14, image_name: "wood_siding_vertical.svg", created_at: now, updated_at: now  },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("color_images", null, {});
  },
};
