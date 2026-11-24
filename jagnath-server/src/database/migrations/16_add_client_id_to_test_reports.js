/**
 * @file 16_add_client_id_to_test_reports.js
 * @description Migration script to add client_id column to test_reports table if it does not exist.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding client_id column to test_reports table...");

    await sequelize.query(`
      ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ client_id column migration for test_reports completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ client_id column migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
