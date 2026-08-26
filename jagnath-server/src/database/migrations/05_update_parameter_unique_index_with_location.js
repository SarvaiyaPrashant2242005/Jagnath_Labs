/**
 * @file 05_update_parameter_unique_index_with_location.js
 * @description Migration script to update Parameter unique index to include location_sample_id,
 * allowing parameters with the same name under the same subcategory/discipline group
 * if the Location of Sample is different.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔍 Checking for existing parameter duplicates considering Location of Sample...");

    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS location_sample_id UUID;
    `, { transaction });

    const [parameterDuplicates] = await sequelize.query(`
      SELECT "companyId",
             COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000') as subcat,
             COALESCE("location_sample_id", '00000000-0000-0000-0000-000000000000') as loc,
             LOWER(TRIM("parameterName")) as norm_name,
             COUNT(*) as count,
             ARRAY_AGG(id) as ids
      FROM parameters
      WHERE deleted_at IS NULL
      GROUP BY "companyId",
               COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'),
               COALESCE("location_sample_id", '00000000-0000-0000-0000-000000000000'),
               LOWER(TRIM("parameterName"))
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (parameterDuplicates.length > 0) {
      console.warn("⚠️ [Migration Alert] Duplicate Parameters found. Cleaning up duplicates...");
      for (const dup of parameterDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        await sequelize.query(`
          UPDATE category_parameter_mapping
          SET "parameterId" = :keeperId
          WHERE "parameterId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE price_master
          SET "parameter_id" = :keeperId
          WHERE "parameter_id" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE test_request_parameters
          SET "parameterId" = :keeperId
          WHERE "parameterId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE parameters
          SET deleted_at = NOW()
          WHERE id IN (:removeIds)
        `, { replacements: { removeIds }, transaction });
      }
      console.log("✅ Duplicate Parameters soft-deleted and references remapped.");
    }

    console.log("🛠️ Updating Parameter Unique PostgreSQL Index...");

    await sequelize.query(`
      DROP INDEX IF EXISTS idx_parameters_company_lower_name;
    `, { transaction });

    await sequelize.query(`
      DROP INDEX IF EXISTS idx_parameters_company_subcat_loc_lower_name;
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_parameters_company_subcat_lower_name
      ON parameters ("companyId", COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'), LOWER(TRIM("parameterName")))
      WHERE deleted_at IS NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Migration 05 completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration 05 failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
