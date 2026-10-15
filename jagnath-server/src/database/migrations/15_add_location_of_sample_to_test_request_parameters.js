/**
 * @file 15_add_location_of_sample_to_test_request_parameters.js
 * @description Migration script to add location_of_sample column to test_request_parameters table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding location_of_sample column to test_request_parameters table...");

    await sequelize.query(`
      ALTER TABLE test_request_parameters ADD COLUMN IF NOT EXISTS location_of_sample VARCHAR(255);
    `, { transaction });

    await transaction.commit();
    console.log("✅ [Migration 15] Successfully added location_of_sample column to test_request_parameters.");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ [Migration 15] Migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };
