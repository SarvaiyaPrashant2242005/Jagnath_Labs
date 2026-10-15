/**
 * @file 12_add_acceptable_requirement_to_parameters.js
 * @description Migration script to add acceptable_limit column to parameters table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding acceptable_limit column to parameters table...");

    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS acceptable_limit VARCHAR(255);
    `, { transaction });

    await transaction.commit();
    console.log("✅ Acceptable / Requirement column migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Acceptable / Requirement column migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
