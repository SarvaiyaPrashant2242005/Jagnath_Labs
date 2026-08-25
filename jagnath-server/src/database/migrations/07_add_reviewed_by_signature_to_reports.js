/**
 * @file 07_add_reviewed_by_signature_to_reports.js
 * @description Migration script to add reviewed_by_signature column to test_reports table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding reviewed_by_signature column to test_reports table...");

    await sequelize.query(`
      ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS reviewed_by_signature TEXT;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Reviewed By signature column migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Reviewed By signature column migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
