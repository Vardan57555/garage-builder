"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert(
        "custom_frameout_range",
        [
          { id: 186, map_id: 447, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 328, map_id: 40, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 366, map_id: 2464, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 370, map_id: 2465, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 371, map_id: 2466, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 373, map_id: 2467, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 427, map_id: 2162, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 429, map_id: 2163, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 435, map_id: 2164, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 439, map_id: 2166, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 441, map_id: 2165, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 442, map_id: 2167, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 460, map_id: 41, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 462, map_id: 42, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 464, map_id: 614, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 465, map_id: 724, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 471, map_id: 2658, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 476, map_id: 2659, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 479, map_id: 2663, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 480, map_id: 2662, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 481, map_id: 2661, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 483, map_id: 2660, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 484, map_id: 2657, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 493, map_id: 39, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 499, map_id: 99, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"30"}' },
          { id: 564, map_id: 2517, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 603, map_id: 2656, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 612, map_id: 2840, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":0,"side":0}' },
          { id: 625, map_id: 108, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 628, map_id: 109, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 629, map_id: 110, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 630, map_id: 459, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 631, map_id: 655, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 636, map_id: 2665, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 637, map_id: 107, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 641, map_id: 2664, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 642, map_id: 1261, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 643, map_id: 1262, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 644, map_id: 1263, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 645, map_id: 1264, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 646, map_id: 1265, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 648, map_id: 1266, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 668, map_id: 383, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 669, map_id: 384, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 671, map_id: 518, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 674, map_id: 532, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 675, map_id: 633, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 676, map_id: 1568, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 677, map_id: 2617, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 678, map_id: 386, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 680, map_id: 388, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 681, map_id: 519, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 682, map_id: 533, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 684, map_id: 634, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 686, map_id: 2618, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 687, map_id: 387, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 688, map_id: 2838, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":0,"side":0}' },
          { id: 717, map_id: 2150, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 718, map_id: 2154, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 720, map_id: 2155, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 721, map_id: 2156, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 722, map_id: 2157, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 724, map_id: 2629, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 725, map_id: 2149, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 759, map_id: 723, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 760, map_id: 35, type: "garage_door_frame_outs", row_data: '{"clearance_option":null,"is_checked":true,"end":"20","side":"20"}' },
          { id: 761, map_id: 36, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 762, map_id: 613, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 763, map_id: 446, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 764, map_id: 38, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' },
          { id: 765, map_id: 37, type: "garage_door_frame_outs", row_data: '{"is_checked":true,"end":"20","side":"20"}' }
        ],
        {}
    );
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    await queryInterface.bulkDelete("custom_frameout_range", null, {});
  }
};
