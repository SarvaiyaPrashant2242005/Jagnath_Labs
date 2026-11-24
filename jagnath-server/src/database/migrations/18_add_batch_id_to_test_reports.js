/**
 * @file 18_add_batch_id_to_test_reports.js
 * @description Migration script to add batch_id column to test_reports table for grouping multiple test reports created in a single session.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding batch_id column to test_reports table...");

    await sequelize.query(`
      ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100) NULL;
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_test_reports_batch_id ON test_reports (batch_id);
    `, { transaction });

    await transaction.commit();
    console.log("✅ batch_id column migration for test_reports completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ batch_id column migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

