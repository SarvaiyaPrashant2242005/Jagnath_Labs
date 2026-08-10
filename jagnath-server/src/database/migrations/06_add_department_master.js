/**
 * @file 06_add_department_master.js
 * @description Migration script to create departments table, link category/testRequest/locations, and seed initial departments.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Creating departments table if not exists...");

    // Drop departments table if status column is character varying (varchar) from previous attempt
    await sequelize.query(`
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'departments' AND column_name = 'status' AND data_type = 'character varying'
          ) THEN
              DROP TABLE IF EXISTS departments CASCADE;
          END IF;
      END $$;
    `, { transaction });

    // Create enum type if it does not exist
    await sequelize.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_departments_status') THEN
              CREATE TYPE enum_departments_status AS ENUM ('Active', 'Inactive');
          END IF;
      END $$;
    `, { transaction });

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status enum_departments_status DEFAULT 'Active'::enum_departments_status NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `, { transaction });

    console.log("🛠️ Creating Unique PostgreSQL Indexes for departments...");
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_company_lower_name
      ON departments ("companyId", LOWER(TRIM(name)))
      WHERE deleted_at IS NULL;
    `, { transaction });

    console.log("🛠️ Adding departmentId column to categories...");
    await sequelize.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS "departmentId" UUID REFERENCES departments(id) ON DELETE SET NULL;
    `, { transaction });

    console.log("🛠️ Adding departmentId column to test_requests...");
    await sequelize.query(`
      ALTER TABLE test_requests ADD COLUMN IF NOT EXISTS "departmentId" UUID REFERENCES departments(id) ON DELETE SET NULL;
    `, { transaction });

    console.log("🛠️ Adding subCategoryId & description columns to location_of_samples...");
    await sequelize.query(`
      ALTER TABLE location_of_samples ADD COLUMN IF NOT EXISTS "subCategoryId" UUID REFERENCES sub_categories(id) ON DELETE SET NULL;
    `, { transaction });

    await sequelize.query(`
      ALTER TABLE location_of_samples ADD COLUMN IF NOT EXISTS description TEXT;
    `, { transaction });

    console.log("🌱 Seeding initial departments for each active company...");
    const [companies] = await sequelize.query(`
      SELECT id FROM companies WHERE deleted_at IS NULL;
    `, { transaction });

    const initialDepartments = [
      "Environment",
      "Agriculture",
      "Food",
      "Clinical (Pathology)",
      "Consulting"
    ];

    for (const comp of companies) {
      for (const deptName of initialDepartments) {
        // Safe find or create
        const [existing] = await sequelize.query(`
          SELECT id FROM departments 
          WHERE "companyId" = :companyId AND LOWER(TRIM(name)) = :deptNameClean AND deleted_at IS NULL;
        `, {
          replacements: { companyId: comp.id, deptNameClean: deptName.trim().toLowerCase() },
          transaction
        });

        if (existing.length === 0) {
          await sequelize.query(`
            INSERT INTO departments (id, "companyId", name, status, created_at, updated_at)
            VALUES (gen_random_uuid(), :companyId, :deptName, 'Active', NOW(), NOW());
          `, {
            replacements: { companyId: comp.id, deptName },
            transaction
          });
        }
      }
    }

    console.log("🛠️ Re-creating Category Unique PostgreSQL Index to include departmentId...");
    await sequelize.query(`
      DROP INDEX IF EXISTS idx_categories_company_lower_name;
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_company_dept_lower_name
      ON categories ("companyId", COALESCE("departmentId", '00000000-0000-0000-0000-000000000000'), LOWER(TRIM(name)))
      WHERE deleted_at IS NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Department Master migration 06 completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Department Master migration 06 failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
