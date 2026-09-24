/**
 * @file 01_add_unique_indexes_and_cleanup.js
 * @description Migration script to inspect existing duplicates in clients, categories, and parameters,
 * report conflicts without destructive deletion, and create unique indexes in PostgreSQL.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔍 Checking for existing duplicates in Database...");

    // 1. Check duplicate Client emails within the same company
    const [clientEmailDuplicates] = await sequelize.query(`
      SELECT "companyId", LOWER(TRIM(email)) as norm_email, COUNT(*) as count, ARRAY_AGG(id) as ids
      FROM clients
      WHERE deleted_at IS NULL AND email IS NOT NULL AND TRIM(email) <> ''
      GROUP BY "companyId", LOWER(TRIM(email))
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (clientEmailDuplicates.length > 0) {
      console.warn("⚠️ [Migration Alert] Duplicate Client Emails found. Cleaning up duplicates...");
      for (const dup of clientEmailDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        await sequelize.query(`
          UPDATE test_requests
          SET "clientId" = :keeperId
          WHERE "clientId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE clients
          SET deleted_at = NOW()
          WHERE id IN (:removeIds)
        `, { replacements: { removeIds }, transaction });
      }
      console.log("✅ Duplicate Client Emails soft-deleted and references remapped.");
    }

    // 2. Check duplicate Client contact numbers within the same company
    const [clientPhoneDuplicates] = await sequelize.query(`
      SELECT "companyId", REGEXP_REPLACE("contactNumber", '[\\s\\-\\(\\)\\+]', '', 'g') as norm_phone, COUNT(*) as count, ARRAY_AGG(id) as ids
      FROM clients
      WHERE deleted_at IS NULL AND "contactNumber" IS NOT NULL AND TRIM("contactNumber") <> ''
      GROUP BY "companyId", REGEXP_REPLACE("contactNumber", '[\\s\\-\\(\\)\\+]', '', 'g')
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (clientPhoneDuplicates.length > 0) {
      console.warn("⚠️ [Migration Alert] Duplicate Client Contact Numbers found. Cleaning up duplicates...");
      for (const dup of clientPhoneDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        await sequelize.query(`
          UPDATE test_requests
          SET "clientId" = :keeperId
          WHERE "clientId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE clients
          SET deleted_at = NOW()
          WHERE id IN (:removeIds)
        `, { replacements: { removeIds }, transaction });
      }
      console.log("✅ Duplicate Client Contact Numbers soft-deleted and references remapped.");
    }

    // 3. Check duplicate Categories within the same company
    const [categoryDuplicates] = await sequelize.query(`
      SELECT "companyId", LOWER(TRIM(name)) as norm_name, COUNT(*) as count, ARRAY_AGG(id) as ids
      FROM categories
      WHERE deleted_at IS NULL
      GROUP BY "companyId", LOWER(TRIM(name))
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (categoryDuplicates.length > 0) {
      console.warn("⚠️ [Migration Alert] Duplicate Categories found. Cleaning up duplicates...");
      for (const dup of categoryDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        await sequelize.query(`
          UPDATE sub_categories
          SET "categoryId" = :keeperId
          WHERE "categoryId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE category_parameter_mapping
          SET "categoryId" = :keeperId
          WHERE "categoryId" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE price_master
          SET "category_id" = :keeperId
          WHERE "category_id" IN (:removeIds)
        `, { replacements: { keeperId, removeIds }, transaction });

        await sequelize.query(`
          UPDATE categories
          SET deleted_at = NOW()
          WHERE id IN (:removeIds)
        `, { replacements: { removeIds }, transaction });
      }
      console.log("✅ Duplicate Categories soft-deleted and references remapped.");
    }

    // 4. Check duplicate Parameters within the same company
    const [parameterDuplicates] = await sequelize.query(`
      SELECT "companyId", LOWER(TRIM("parameterName")) as norm_name, COUNT(*) as count, ARRAY_AGG(id) as ids
      FROM parameters
      WHERE deleted_at IS NULL
      GROUP BY "companyId", LOWER(TRIM("parameterName"))
      HAVING COUNT(*) > 1;
    `, { transaction });

    if (parameterDuplicates.length > 0) {
      console.warn("⚠️ [Migration Alert] Duplicate Parameters found. Cleaning up duplicates...");
      for (const dup of parameterDuplicates) {
        const ids = dup.ids;
        const keeperId = ids[0];
        const removeIds = ids.slice(1);

        // Remap category_parameter_mapping
        const [cpmRows] = await sequelize.query(`
          SELECT id, "companyId", "categoryId", "parameterId"
          FROM category_parameter_mapping
          WHERE "parameterId" IN (:removeIds) AND deleted_at IS NULL
        `, { replacements: { removeIds }, transaction });

        for (const row of cpmRows) {
          const [exists] = await sequelize.query(`
            SELECT 1 FROM category_parameter_mapping
            WHERE "parameterId" = :keeperId
              AND "companyId" = :companyId
              AND "categoryId" = :categoryId
              AND deleted_at IS NULL
            LIMIT 1
          `, { replacements: { keeperId, companyId: row.companyId, categoryId: row.categoryId }, transaction });

          if (exists.length > 0) {
            await sequelize.query(`
              UPDATE category_parameter_mapping
              SET deleted_at = NOW()
              WHERE id = :id
            `, { replacements: { id: row.id }, transaction });
          } else {
            await sequelize.query(`
              UPDATE category_parameter_mapping
              SET "parameterId" = :keeperId
              WHERE id = :id
            `, { replacements: { keeperId, id: row.id }, transaction });
          }
        }

        // Remap price_master
        const [pmRows] = await sequelize.query(`
          SELECT id, company_id, category_id, parameter_id
          FROM price_master
          WHERE "parameter_id" IN (:removeIds) AND deleted_at IS NULL
        `, { replacements: { removeIds }, transaction });

        for (const row of pmRows) {
          const [exists] = await sequelize.query(`
            SELECT 1 FROM price_master
            WHERE "parameter_id" = :keeperId
              AND company_id = :companyId
              AND category_id = :categoryId
              AND deleted_at IS NULL
            LIMIT 1
          `, { replacements: { keeperId, companyId: row.company_id, categoryId: row.category_id }, transaction });

          if (exists.length > 0) {
            await sequelize.query(`
              UPDATE price_master
              SET deleted_at = NOW()
              WHERE id = :id
            `, { replacements: { id: row.id }, transaction });
          } else {
            await sequelize.query(`
              UPDATE price_master
              SET "parameter_id" = :keeperId
              WHERE id = :id
            `, { replacements: { keeperId, id: row.id }, transaction });
          }
        }

        // Remap test_request_parameters
        const [trpRows] = await sequelize.query(`
          SELECT id, "testRequestId", "parameterId"
          FROM test_request_parameters
          WHERE "parameterId" IN (:removeIds) AND deleted_at IS NULL
        `, { replacements: { removeIds }, transaction });

        for (const row of trpRows) {
          const [exists] = await sequelize.query(`
            SELECT 1 FROM test_request_parameters
            WHERE "parameterId" = :keeperId
              AND "testRequestId" = :testRequestId
              AND deleted_at IS NULL
            LIMIT 1
          `, { replacements: { keeperId, testRequestId: row.testRequestId }, transaction });

          if (exists.length > 0) {
            await sequelize.query(`
              UPDATE test_request_parameters
              SET deleted_at = NOW()
              WHERE id = :id
            `, { replacements: { id: row.id }, transaction });
          } else {
            await sequelize.query(`
              UPDATE test_request_parameters
              SET "parameterId" = :keeperId
              WHERE id = :id
            `, { replacements: { keeperId, id: row.id }, transaction });
          }
        }

        // Soft delete duplicate parameters
        await sequelize.query(`
          UPDATE parameters
          SET deleted_at = NOW()
          WHERE id IN (:removeIds)
        `, { replacements: { removeIds }, transaction });
      }
      console.log("✅ Duplicate Parameters soft-deleted and references remapped.");
    }

    // Clean up duplicate entries in join tables created after parameter/category ID remapping
    await sequelize.query(`
      UPDATE category_parameter_mapping
      SET deleted_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY "companyId", "categoryId", "parameterId" ORDER BY created_at ASC) as rnum
          FROM category_parameter_mapping
          WHERE deleted_at IS NULL
        ) t WHERE t.rnum > 1
      );
    `, { transaction });

    await sequelize.query(`
      UPDATE price_master
      SET deleted_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY "company_id", "category_id", "parameter_id" ORDER BY created_at ASC) as rnum
          FROM price_master
          WHERE deleted_at IS NULL
        ) t WHERE t.rnum > 1
      );
    `, { transaction });

    // Create unique indexes if no duplicate conflicts or IF NOT EXISTS
    console.log("🛠️ Creating Unique PostgreSQL Indexes...");

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_company_lower_email
      ON clients ("companyId", LOWER(TRIM(email)))
      WHERE deleted_at IS NULL AND email IS NOT NULL AND TRIM(email) <> '';
    `, { transaction });

    await sequelize.query(`
      DROP INDEX IF EXISTS idx_categories_company_lower_name;
    `, { transaction });

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

    // Deduplicate reportNumber in test_requests if any duplicates exist
    await sequelize.query(`
      UPDATE test_requests
      SET deleted_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY "companyId", LOWER(TRIM("reportNumber")) ORDER BY created_at ASC) as rnum
          FROM test_requests
          WHERE deleted_at IS NULL AND "reportNumber" IS NOT NULL AND TRIM("reportNumber") <> ''
        ) t WHERE t.rnum > 1
      );
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_test_requests_company_lower_report_number
      ON test_requests ("companyId", LOWER(TRIM("reportNumber")))
      WHERE deleted_at IS NULL AND "reportNumber" IS NOT NULL AND TRIM("reportNumber") <> '';
    `, { transaction });

    await transaction.commit();
    console.log("✅ Migration completed successfully!");

    return {
      success: true,
      duplicatesReport: {
        clientEmailDuplicates,
        clientPhoneDuplicates,
        categoryDuplicates,
        parameterDuplicates,
      }
    };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
