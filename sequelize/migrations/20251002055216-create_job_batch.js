"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("job_batches", {
      id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      total_jobs: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      pending_jobs: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      failed_jobs: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      failed_job_ids: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      options: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      finished_at: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("job_batches");
  },
};
