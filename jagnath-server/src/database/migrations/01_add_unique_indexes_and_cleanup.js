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
      console.warn("⚠️ [Migration Alert] Duplicate Client Emails found:");
      console.warn(JSON.stringify(clientEmailDuplicates, null, 2));
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
      console.warn("⚠️ [Migration Alert] Duplicate Client Contact Numbers found:");
      console.warn(JSON.stringify(clientPhoneDuplicates, null, 2));
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
      console.warn("⚠️ [Migration Alert] Duplicate Categories found:");
      console.warn(JSON.stringify(categoryDuplicates, null, 2));
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
      console.warn("⚠️ [Migration Alert] Duplicate Parameters found:");
      console.warn(JSON.stringify(parameterDuplicates, null, 2));
    }

    // Create unique indexes if no duplicate conflicts or IF NOT EXISTS
    console.log("🛠️ Creating Unique PostgreSQL Indexes...");

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_company_lower_email
      ON clients ("companyId", LOWER(TRIM(email)))
      WHERE deleted_at IS NULL AND email IS NOT NULL AND TRIM(email) <> '';
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_company_lower_name
      ON categories ("companyId", LOWER(TRIM(name)))
      WHERE deleted_at IS NULL;
    `, { transaction });

    await sequelize.query(`
      DROP INDEX IF EXISTS idx_parameters_company_lower_name;
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_parameters_company_subcat_lower_name
      ON parameters ("companyId", COALESCE("subCategoryId", '00000000-0000-0000-0000-000000000000'), LOWER(TRIM("parameterName")))
      WHERE deleted_at IS NULL;
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
