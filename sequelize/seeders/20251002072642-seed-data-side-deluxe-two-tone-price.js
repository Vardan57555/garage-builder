"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("data_side_deluxe_two_tone_price", [
      {
        id: 49,
        manufacturer_id: 4,
        region_id: 10,
        building_id: 9,
        side_deluxe_two_tone_row: Buffer.from(
            "5b7b226c656e677468223a32302c226f6e5f736964655f686f72697a6f6e74616c223a2230222c226f6e5f736964655f766572746963616c223a223233372e35222c226f6e5f736964655f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f736964655f766572746963616c5f74797065223a2224227d2c7b226c656e677468223a32352c226f6e5f736964655f686f72697a6f6e74616c223a2230222c226f6e5f736964655f766572746963616c223a223238322e35222c226f6e5f736964655f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f736964655f766572746963616c5f74797065223a2224227d2c7b226c656e677468223a33302c226f6e5f736964655f686f72697a6f6e74616c223a2230222c226f6e5f736964655f766572746963616c223a223332372e35222c226f6e5f736964655f686f72697a6f6e74616c5f74797065223a2224222c226f6e5f736964655f766572746963616c5f74797065223a2224227d5d",
            "hex"
        ),
        created_at: null,
        updated_at: "2024-01-22 13:16:28",
        deleted_at: null,
      },
      {
        id: 50,
        manufacturer_id: 4,
        region_id: 10,
        building_id: 14,
        side_deluxe_two_tone_row: Buffer.from(
            "5b7b226c656e677468223a32302c226f6e5f736964655f686f72697a6f6e74616c223a2230222c226f6e5f736964655f766572746963616c223a223132372e35227d2c7b226c656e677468223a32352c226f6e5f736964655f686f72697a6f6e74616c223a2230222c226f6e5f736964655f766572746963616c223a22313630227d5d",
            "hex"
        ),
        created_at: null,
        updated_at: "2019-12-12 06:29:52",
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("data_side_deluxe_two_tone_price", {
      id: { [Sequelize.Op.in]: [49, 50, 51, 52, 53, 54, 55, 56, 57] },
    });
  },
};
