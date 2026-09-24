/**
 * @file 08_update_parameter_unique_index_with_test_method.js
 * @description Migration script to update Parameter unique index to include testMethod column,
 * allowing parameters with same name/subcategory/location to exist if they use different test methods.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Updating Parameter Unique index to include testMethod...");

    // Drop the old index
    await sequelize.query(`
      DROP INDEX IF EXISTS idx_parameters_company_subcat_loc_lower_name;
    `, { transaction });

    // Create the new index that includes testMethod coalesced
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_parameters_company_subcat_loc_method_lower_name
      ON parameters (
        "companyId", 
        COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'), 
        COALESCE("location_sample_id", '00000000-0000-0000-0000-000000000000'), 
        COALESCE(LOWER(TRIM("testMethod")), ''), 
        LOWER(TRIM("parameterName"))
      )
      WHERE deleted_at IS NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Parameter unique index migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Parameter unique index migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
