/**
 * @file 03_add_unit_and_permissible_limit_to_parameters.js
 * @description Migration script to add unit, is_permissible_limit_applicable, and permissible_limit columns to parameters table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding unit, is_permissible_limit_applicable & permissible_limit columns to parameters table...");

    // 1. Add unit column if not exists
    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS unit VARCHAR(255);
    `, { transaction });

    // 2. Add is_permissible_limit_applicable column if not exists
    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS is_permissible_limit_applicable BOOLEAN DEFAULT FALSE;
    `, { transaction });

    // 3. Add permissible_limit column if not exists
    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS permissible_limit VARCHAR(255);
    `, { transaction });

    // 4. Add price column if not exists
    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Parameter unit & permissible limit migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Parameter unit & permissible limit migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
