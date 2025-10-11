"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert("door_types", [
      {
        id: 1,
        type: "garage",
        name: "Standard",
        slug: "standard_door",
        category: "Roll-Up,Commercial,Overhead,Insulated,Non-Insulated,Garage Door, Certified,Wind Rated,Motorized,Windlock,Impact-Rated,Moisture B.,Frame-Outs,Special order",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 2,
        type: "walk-in",
        name: "Standard",
        slug: "standard_walkin",
        category: "Man Door,Standard (No Window),Standard (Left Swing),Steel Insulated House Door,Solid Fiberglass,Home Door,Commercial Steel Door,Upgraded Solid Door,Solid Door,Commercial,Wind-Rated,Plyco Regular,Solid Steel Door,Heavy Duty,Mobile Home Door,Steel Exterior,MHD Sunburst Panel,Steel Screen Door,Steel,MHD Solid Panel,Right Hand Doors,Walking Door,MHD Wind-Rated,Solid Aluminum Door,Steel Insulated,Standard Door,Residential steel,Entry door,Steel Commercial Door,Commercial Steel,34\"x72\"Door,Man Door (High Wind Rated),Upgraded Solid Door Deadbolt,Commercial steel door RH in swing,Mobile Home Door (W/o Window),Solid Door (White),Commercial Solid Door Deadbolt,Commercial Solid Door,Premium Steel prehung,Economy,Economy Plus,Premium Solid,Fiberglass,Outswing,Right Outswing",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 3,
        type: "windows",
        name: "Standard",
        slug: "standard_window",
        category: "Standard,36’’x36’’ Insulated,36’’x36’’,24’’x36’’,Steel Window,Wind-Rated,Single Pane,White Grid,24\" Premium,36\" Premium,Aluminum,Grid Windows,White with Grid,Vinyl Windows,Window,Single Pane with Grid,Double Pane,6 Grid Window,Grid Window,Insulated Window,White Vinyl Window,Black Vinyl,Double Pane 30\"x36\",Bronze,Double Pane 36\"x36\",Single Pane 36\"x36\",Transom Window,30\"x30\"Window,6 Grid Window (High Wind Rated),Black With Grids,Standard 24”x36” white,Standard 36”x36” white,Premium 24”x36” white,Premium 36”x36” white,6 Grid (White),Double Pane With Grid",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 5,
        type: "garage",
        name: "Sectional",
        slug: "sectional_door",
        category: "Sectional,Panel Door",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 6,
        type: "garage",
        name: "Sectional with Window",
        slug: "sectional_with_window_door",
        category: "Sectional with Window,Gallery Door",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 7,
        type: "walk-in",
        name: "Solid",
        slug: "solid_walkin",
        category: "Solid,Heavy Duty,Premium,Steel 6 Panel Door,Cottage,6 Panel,Deluxe,Solid White MH Door,MH Metal 6 Panel,Residential 6 Panel,Solid Panel Door,Primed White,Colonial Door,Deluxe(6 PANEL),Steel W/o Window-outward,Aluminum 6 Panel,6 Panel Solid Steel Door(Concrete),Fire Proof Steel Door,Standard 6-Panel Door,Upgraded 6-Panel door,6-Panel Metal Door,Prehung Wood Frame *Threshold,Residential Door,Primed White Wood-Core Steel,Solid Steel,Solid Fiberglass Door,Concrete Installation,Heavy Duty Concrete Installation,Ground Installation,3/0 Upgraded 1 3/4\" Solid Panel,34\" MHD Solid Panel,Premium 6 Panel,Standard 6 Panel,Primed White Solid,Steel,Standard 6 panel white RH out swing,Premium 6 panel white RH in swing,6 Panel Steel,6 Panel (White),Better,Concrete Installation:Inward Opening (Right or Left),Ground Installation:Outward Opening (Right only),Deluxe-6 PANEL (Left Hand IN Swing),Solid with Threshold",
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        id: 90,
        type: "walk-in",
        name: "15 Lite Door With Center Right Knob",
        slug: "15_lite_door_with_center_right_knob_walkin",
        category: "15 Lite Door with Center Right Knob,15 Lite Double Door",
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("door_types", null, {});
  }
};
