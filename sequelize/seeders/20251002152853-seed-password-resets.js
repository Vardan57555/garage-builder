"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("password_resets", [
      { email: "harish@cibirix.com", token: "qrHYHMLn0L2L9mJVFj6iskBfEm1xn4QcGpjZIkuX487JlTvmckIrTvvxP6ttK1Ym" },
      { email: "amita@cibirix.com", token: "lOL0ks9JBI8cNTAAXZOzmeqKgeOpBzHLKBjApmIrJeO9kOAS7CtqxlPuluYmqFg0" },
      { email: "Krishna.dwivedi@cibirix.com", token: "OvCGHg1Oy95VvakyLWQbnQVZnxq7IhPh6PEp81SMFAPHJXgGV94KIJsTr3SsNhQH" },
      { email: "aayushi.gupta@cibirix.com", token: "ljlHZH873ORj7ETB50uRGElRfUSV4k0Kr7ezKxoin25T0R9Wp5axNmWjyDdtaC90" },
      { email: "soumya.jaiswal@cibirix.com", token: "Px2iQoDZb7mLUK5MTmZ42zvYa23a7YE6j6XnGg92r06kF5ADCaiacFJkJVPVvPcV" },
      { email: "pratiksha.jain@cibirix.com", token: "En3zAopeAH0CnpN7cRiB3QpeBbaxnmMjcUbp8yUddLatsxZ50ZsjSw35SOWHWeQ0" },
      { email: "shruti.tripathi@cibirix.com", token: "zk6BKkGuDdzeWX3EAOEAwsuZ4ohaU6z1Yky0bI7PUtNbPCkOEK1WrdwieXWkoMi2" },
      { email: "harsh.raj@cibirix.com", token: "xnSQAQ36aE6e7t2UqXQeKLBR9Wlx6ACz8NQrJLZJ3PTy4NTpCrPejvFd0huKl0Fm" },
      { email: "anil.gothi@cibirix.com", token: "Fpnf94HdTAzLDwmzHCzwYzqLEbUV4WYYHyHgTwHCj797qii9eylI6ajJf72fdS7D" },
      { email: "swapnil.paliwal@senseidigital.com", token: "xprPwcMQYnJYzmod2Vh5BrojaDJiInK9nUtyd59JZh5klmYJpRLHrLFT0c4pSEcF" },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("password_resets", null, {});
  },
};
