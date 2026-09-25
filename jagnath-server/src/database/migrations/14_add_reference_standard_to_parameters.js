/**
 * @file 14_add_reference_standard_to_parameters.js
 * @description Migration script to add reference_standard column to parameters table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding reference_standard column to parameters table...");

    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS reference_standard VARCHAR(255);
    `, { transaction });

    await transaction.commit();
    console.log("✅ Reference Standard column migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Reference Standard column migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
