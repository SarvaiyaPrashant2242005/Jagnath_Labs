/**
 * @file 09_add_quotation_required_and_type_to_test_requests.js
 * @description Migration script to add quotation_required and quotation_type columns to test_requests table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding quotation_required and quotation_type columns to test_requests table...");

    await sequelize.query(`
      ALTER TABLE test_requests ADD COLUMN IF NOT EXISTS quotation_required VARCHAR(50) DEFAULT 'No';
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE test_requests ADD COLUMN IF NOT EXISTS quotation_type VARCHAR(255);
    `, { transaction });

    await transaction.commit();
    console.log("✅ Quotation columns migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Quotation columns migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
