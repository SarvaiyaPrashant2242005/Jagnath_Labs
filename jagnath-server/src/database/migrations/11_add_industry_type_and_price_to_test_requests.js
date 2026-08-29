/**
 * @file 11_add_industry_type_and_price_to_test_requests.js
 * @description Migration script to add industry_type and industry_price columns to test_requests table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding industry_type and industry_price columns to test_requests table...");

    await sequelize.query(`
      ALTER TABLE test_requests ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50);
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE test_requests ADD COLUMN IF NOT EXISTS industry_price INTEGER;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Industry type & price columns migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Industry type & price columns migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
