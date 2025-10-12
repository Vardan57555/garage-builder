"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    await queryInterface.bulkInsert("users", [
      { id: 2, name: 'Admin', email: 'amita@cibirix.com', password: '$2y$10$252omJoOx/WXE7MIul2CPOO/7GqrL6CH1MQWPCIj0EjOhaW9VMHfW', remember_token: null, created_at: new Date('2019-05-07 14:28:55'), updated_at: new Date('2021-03-26 10:20:28'), is_admin: 1, manufacturer_ids: null },
      { id: 3, name: 'Harish', email: 'harish@cibirix.com', password: '$2y$10$K4abA3K.HeyhHNL4RsbvpOY6rY3bU8H5Pyz0pzFxt6pstk6K2VR7m', remember_token: null, created_at: new Date('2021-01-28 15:58:37'), updated_at: new Date('2021-03-26 10:22:40'), is_admin: 0, manufacturer_ids: '8,121' },
      { id: 4, name: 'Soumya', email: 'soumya.jaiswal@cibirix.com', password: '$2y$10$MA6O4GdTU82cvCkWg9eBOuh5kc7FuNtKGlhdSoZdm0cxDK30nnTOW', remember_token: null, created_at: new Date('2021-01-28 15:58:37'), updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 5, name: 'Anvita', email: 'Anvita.Bangera12323@cibrix.com', password: '78898985585', remember_token: null, created_at: new Date('2021-03-26 15:22:50'), updated_at: new Date('2021-03-26 15:22:55'), is_admin: 0, manufacturer_ids: '8,121' },
      { id: 6, name: 'Apoorva', email: 'apoorvacbxqweer@gmail.com', password: '9658745412', remember_token: null, created_at: new Date('2021-03-26 15:40:35'), updated_at: new Date('2021-03-26 15:40:38'), is_admin: 0, manufacturer_ids: '8,121' },
      { id: 7, name: 'Krishna', email: 'Krishna.dwivedi@cibirix.com', password: '$2y$10$ksQ9uTpSyQa3B35u7WhYv.aZilP5aykn3xXyO3/PVniwnHzTlzpYC', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 8, name: 'Manaswi', email: 'manaswi.ramje787@cibirix.com', password: '85695887', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121' },
      { id: 10, name: 'Kunal', email: 'Kunal.sharma745@cibirix.com', password: '965412', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121' },
      { id: 11, name: 'Aayushi', email: 'aayushi.gupta789@cibirix.com', password: '9632548', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121' },
      { id: 12, name: 'Nishu', email: 'nishu.modi@cibirix.com', password: '98787985', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121' },
      { id: 13, name: 'Anil', email: 'anil.gothi@cibirix.com', password: '$2y$10$TzNd5Y.GYqtkakOoh4rp1.hykoAl/4n9ao3xFmHVML/9Ldu3biEjC', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 14, name: 'Shruti', email: 'shruti.tripathi@cibirix.com', password: '$2y$10$hO53kkqjnsxVqlc.e0JJSu.qqCeHXjJJskzAmziSv1cKp5JMx4itC', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 15, name: 'Elisha', email: 'elisha.masih@cibirix.com', password: '$2y$10$dxTtpZ/XK5vmNIGbF01UaunmBswlueHbyRzvlmaysLasgwAaHvG6W', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 17, name: 'Gourav', email: 'gourav.rathore@cibirix.com', password: '1775878787', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 18, name: 'Mayank ', email: 'mayank.borasi123@cibirix.com', password: '1478523690', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121' },
      { id: 19, name: 'Harsh', email: 'harsh.raj@cibirix.com', password: 'deactivatedon09apr2025onpranjalrequest', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 20, name: 'Yash Nandwal', email: 'Yash.nandwal@Senseidigital.com', password: '$2y$10$x3GXVyCjdbjIeN6kWvC/SuM1l/G0Tr5yKsPvlA4JUD9/zb3dNapAS', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 21, name: 'Swapnil Paliwal', email: 'Swapnil.Paliwal@Senseidigital.com', password: '$2y$10$LOLVuedypImJPaXfNcNKpezVCIC8FrGWd7zKThJg8RD77u6Tgkf3a', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121,194,181' },
      { id: 22, name: 'Rahul Raghuwanshi', email: 'rahul.raghuwanshi@Senseidigital.com', password: '$2y$10$LOLVuedypImJPaXfNcNKpezVCIC8FrGWd7zKThJg8RD77u6Tgkf3a', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: '8,121,194,181' },
      { id: 23, name: 'Harshi Sharma', email: 'harshi@Senseidigital.com', password: '$2y$10$oqZ8d.Zj1Hg.lvTEA1kmh.2BEdCY4uyOTzhq4CAYylZfp7sNZ7yxa', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null },
      { id: 24, name: 'Tejeshwar Solanki', email: 'Tejeshwar@Senseidigital.com', password: '$2y$10$8UpDvEe8QCA5xAMICNrNh.vWld65k1TpNyvypnYFEWmdSqh7hkUga', remember_token: null, created_at: null, updated_at: null, is_admin: 0, manufacturer_ids: null }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  }
};
