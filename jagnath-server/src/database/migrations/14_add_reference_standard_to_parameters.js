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

    // Deduplicate any exact duplicates on (companyId, subCategoryId, testMethod, reference_standard, parameterName) before creating unique index
    const [parameterDuplicates] = await sequelize.query(`
      SELECT "companyId",
             COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000') as subcat,
             COALESCE(LOWER(TRIM("testMethod")), '') as norm_method,
             COALESCE(LOWER(TRIM("reference_standard")), '') as norm_ref_std,
             LOWER(TRIM("parameterName")) as norm_name,
             COUNT(*) as count,
             ARRAY_AGG(id ORDER BY created_at ASC) as ids
      FROM parameters
      WHERE deleted_at IS NULL
      GROUP BY "companyId",
               COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'),
               COALESCE(LOWER(TRIM("testMethod")), ''),
               COALESCE(LOWER(TRIM("reference_standard")), ''),
               LOWER(TRIM("parameterName"))
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (parameterDuplicates && parameterDuplicates.length > 0) {
      console.warn(`⚠️ [Migration 14] Found ${parameterDuplicates.length} parameter duplicate groups. Cleaning up...`);
      for (const dup of parameterDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        await sequelize.query(`
          UPDATE category_parameter_mapping
          SET "parameterId" = :keeperId
          WHERE "parameterId" IN (:removeIds);
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE price_master
          SET "parameter_id" = :keeperId
          WHERE "parameter_id" IN (:removeIds);
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE test_request_parameters
          SET "parameterId" = :keeperId
          WHERE "parameterId" IN (:removeIds);
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE parameters
          SET deleted_at = NOW()
          WHERE id IN (:removeIds);
        `, { replacements: { removeIds }, transaction });
      }
    }

    // Drop all legacy indexes
    await sequelize.query(`
      DROP INDEX IF EXISTS idx_parameters_company_lower_name;
      DROP INDEX IF EXISTS idx_parameters_company_subcat_lower_name;
      DROP INDEX IF EXISTS idx_parameters_company_subcat_loc_lower_name;
      DROP INDEX IF EXISTS idx_parameters_company_subcat_loc_method_lower_name;
      DROP INDEX IF EXISTS idx_parameters_company_subcat_method_lower_name;
      DROP INDEX IF EXISTS idx_parameters_company_subcat_method_standard_lower_name;
    `, { transaction });

    // Create unique index including company, subcategory, testMethod, reference_standard, and parameterName
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_parameters_company_subcat_method_standard_lower_name
      ON parameters (
        "companyId", 
        COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'), 
        COALESCE(LOWER(TRIM("testMethod")), ''), 
        COALESCE(LOWER(TRIM("reference_standard")), ''), 
        LOWER(TRIM("parameterName"))
      )
      WHERE deleted_at IS NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Reference Standard column and Unique Index migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Reference Standard column & Index migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
