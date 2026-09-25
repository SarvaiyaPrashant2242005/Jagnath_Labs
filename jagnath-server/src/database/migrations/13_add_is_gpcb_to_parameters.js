/**
 * @file 13_add_is_gpcb_to_parameters.js
 * @description Migration script to add is_gpcb boolean flag to parameters table,
 * and backfill/import GPCB approved parameters from LIMS PARAMETERS SHEET.xlsx.
 */

const sequelize = require("../../config/database");
const path = require("path");
const fs = require("fs");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding is_gpcb column to parameters table...");

    // 1. Add is_gpcb column to parameters table if it doesn't exist
    await sequelize.query(`
      ALTER TABLE parameters ADD COLUMN IF NOT EXISTS is_gpcb BOOLEAN NOT NULL DEFAULT FALSE;
    `, { transaction });

    // 2. Add index for faster is_gpcb filtering
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_parameters_is_gpcb ON parameters ("companyId", is_gpcb) WHERE deleted_at IS NULL;
    `, { transaction });

    console.log("🌱 Importing / Backfilling GPCB parameters from Excel sheet...");

    // Find Excel file
    const possiblePaths = [
      "/home/jevin/Downloads/LIMS PARAMETERS SHEET.xlsx",
      path.join(__dirname, "../../../../Downloads/LIMS PARAMETERS SHEET.xlsx"),
      path.join(process.cwd(), "LIMS PARAMETERS SHEET.xlsx")
    ];

    let excelPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        excelPath = p;
        break;
      }
    }

    if (!excelPath) {
      console.warn("⚠️ LIMS PARAMETERS SHEET.xlsx not found on disk. Skipping GPCB parameter import (column is_gpcb added).");
      await transaction.commit();
      return { success: true };
    }

    // Load xlsx
    let xlsx;
    try {
      xlsx = require("xlsx");
    } catch {
      try {
        const uiXlsxPath = path.join(__dirname, "../../../../../jagnath-ui/node_modules/xlsx");
        xlsx = require(uiXlsxPath);
      } catch {
        const altPath = "/run/media/jevin/Box A/Jagnath_Labs/jagnath-ui/node_modules/xlsx";
        xlsx = require(altPath);
      }
    }

    const workbook = xlsx.readFile(excelPath);
    const gpcbSheet = workbook.Sheets["GPCB"];
    if (!gpcbSheet) {
      console.warn("⚠️ GPCB sheet not found in workbook. Skipping import.");
      await transaction.commit();
      return { success: true };
    }

    const gpcbRows = xlsx.utils.sheet_to_json(gpcbSheet);
    console.log(`📊 Found ${gpcbRows.length} rows in GPCB sheet.`);

    // Get active companies
    const [companies] = await sequelize.query(`
      SELECT id, company_name FROM companies WHERE deleted_at IS NULL;
    `, { transaction });

    for (const comp of companies) {
      const companyId = comp.id;

      for (const row of gpcbRows) {
        const rawDeptName = (row["Department"] || row["DEPARTMENT"] || "").toString().trim();
        const rawCatName = (row["Discipline Group *"] || row["Discipline Group"] || row["Category"] || "").toString().trim();
        const rawSubCatName = (row["Sub Category"] || row["SubCategory"] || "").toString().trim();
        const rawParamName = (row["Parameter Name *"] || row["Parameter Name"] || row["Name"] || "").toString().trim();
        const testMethod = (row["Test Method"] || row["Testing Method"] || "").toString().trim() || null;
        const unit = (row["Unit"] || "").toString().trim() || null;
        const rawPermApp = (row["Permissible Limit Applicable?"] || row["Permissible Limit Applicable"] || "").toString().trim().toLowerCase();
        const isPermissibleLimitApplicable = rawPermApp === "yes" || rawPermApp === "true" || rawPermApp === "1" || rawPermApp === "y";
        const permissibleLimit = (row["Permissible Limit"] || "").toString().trim() || null;
        const priceVal = row["Price (₹)"] !== undefined ? parseFloat(row["Price (₹)"]) : (row["Price"] !== undefined ? parseFloat(row["Price"]) : 0);
        const price = !isNaN(priceVal) ? priceVal : 0;
        const status = (row["Status"] || "Active").toString().trim();

        if (!rawParamName) continue;

        // 1. Resolve / Create Department
        let departmentId = null;
        if (rawDeptName) {
          const [deptRows] = await sequelize.query(`
            SELECT id FROM departments
            WHERE "companyId" = :companyId AND LOWER(TRIM(name)) = :name AND deleted_at IS NULL
            LIMIT 1;
          `, { replacements: { companyId, name: rawDeptName.toLowerCase() }, transaction });

          if (deptRows.length > 0) {
            departmentId = deptRows[0].id;
          } else {
            const [newDept] = await sequelize.query(`
              INSERT INTO departments (id, "companyId", name, status, created_at, updated_at)
              VALUES (gen_random_uuid(), :companyId, :name, 'Active', NOW(), NOW())
              RETURNING id;
            `, { replacements: { companyId, name: rawDeptName }, transaction });
            departmentId = newDept[0].id;
          }
        }

        // 2. Resolve / Create Category (Discipline Group)
        let categoryId = null;
        if (rawCatName) {
          const [catRows] = await sequelize.query(`
            SELECT id FROM categories
            WHERE "companyId" = :companyId AND LOWER(TRIM(name)) = :name AND deleted_at IS NULL
            LIMIT 1;
          `, { replacements: { companyId, name: rawCatName.toLowerCase() }, transaction });

          if (catRows.length > 0) {
            categoryId = catRows[0].id;
            // Link department if not linked
            if (departmentId) {
              await sequelize.query(`
                UPDATE categories SET "departmentId" = :departmentId WHERE id = :id AND "departmentId" IS NULL;
              `, { replacements: { departmentId, id: categoryId }, transaction });
            }
          } else {
            const [newCat] = await sequelize.query(`
              INSERT INTO categories (id, "companyId", "departmentId", name, status, created_at, updated_at)
              VALUES (gen_random_uuid(), :companyId, :departmentId, :name, 'Active', NOW(), NOW())
              RETURNING id;
            `, { replacements: { companyId, departmentId, name: rawCatName }, transaction });
            categoryId = newCat[0].id;
          }
        }

        // 3. Resolve / Create SubCategory
        let subCategoryId = null;
        if (rawSubCatName && categoryId) {
          const [subCatRows] = await sequelize.query(`
            SELECT id FROM sub_categories
            WHERE "companyId" = :companyId AND "categoryId" = :categoryId AND LOWER(TRIM(name)) = :name AND deleted_at IS NULL
            LIMIT 1;
          `, { replacements: { companyId, categoryId, name: rawSubCatName.toLowerCase() }, transaction });

          if (subCatRows.length > 0) {
            subCategoryId = subCatRows[0].id;
          } else {
            const [newSubCat] = await sequelize.query(`
              INSERT INTO sub_categories (id, "companyId", "categoryId", name, status, created_at, updated_at)
              VALUES (gen_random_uuid(), :companyId, :categoryId, :name, 'Active', NOW(), NOW())
              RETURNING id;
            `, { replacements: { companyId, categoryId, name: rawSubCatName }, transaction });
            subCategoryId = newSubCat[0].id;
          }
        }

        // 4. Resolve / Create / Update Parameter with is_gpcb = true
        let paramQuery = `
          SELECT id FROM parameters
          WHERE "companyId" = :companyId 
            AND LOWER(TRIM("parameterName")) = :paramName
            AND (
              ("subCategoryId" IS NULL AND :subCategoryId IS NULL) OR "subCategoryId" = :subCategoryId
            )
            AND (
              ("testMethod" IS NULL AND :testMethod IS NULL) OR LOWER(TRIM("testMethod")) = :normTestMethod
            )
            AND deleted_at IS NULL
          LIMIT 1;
        `;

        const [existingParams] = await sequelize.query(paramQuery, {
          replacements: {
            companyId,
            paramName: rawParamName.toLowerCase(),
            subCategoryId: subCategoryId || null,
            testMethod: testMethod || null,
            normTestMethod: testMethod ? testMethod.toLowerCase() : null
          },
          transaction
        });

        let paramId;
        if (existingParams.length > 0) {
          paramId = existingParams[0].id;
          // Update is_gpcb flag and any missing details
          await sequelize.query(`
            UPDATE parameters
            SET is_gpcb = TRUE,
                price = COALESCE(NULLIF(:price, 0), price),
                unit = COALESCE(:unit, unit),
                "testMethod" = COALESCE(:testMethod, "testMethod"),
                is_permissible_limit_applicable = :isPermissibleLimitApplicable,
                permissible_limit = COALESCE(:permissibleLimit, permissible_limit),
                updated_at = NOW()
            WHERE id = :paramId;
          `, {
            replacements: {
              paramId,
              price,
              unit,
              testMethod,
              isPermissibleLimitApplicable,
              permissibleLimit
            },
            transaction
          });
        } else {
          // Insert new parameter with is_gpcb = true
          const [newParam] = await sequelize.query(`
            INSERT INTO parameters (
              id, "companyId", "subCategoryId", "parameterName", "testMethod",
              unit, is_permissible_limit_applicable, permissible_limit, price,
              status, is_gpcb, created_at, updated_at
            )
            VALUES (
              gen_random_uuid(), :companyId, :subCategoryId, :paramName, :testMethod,
              :unit, :isPermissibleLimitApplicable, :permissibleLimit, :price,
              :status, TRUE, NOW(), NOW()
            )
            RETURNING id;
          `, {
            replacements: {
              companyId,
              subCategoryId: subCategoryId || null,
              paramName: rawParamName,
              testMethod: testMethod || null,
              unit: unit || null,
              isPermissibleLimitApplicable,
              permissibleLimit: permissibleLimit || null,
              price: price || 0,
              status: status === "Inactive" ? "Inactive" : "Active"
            },
            transaction
          });
          paramId = newParam[0].id;
        }

        // 5. Ensure CategoryParameter mapping exists if categoryId is present
        if (categoryId && paramId) {
          const [catParamRows] = await sequelize.query(`
            SELECT id FROM category_parameter_mapping
            WHERE "companyId" = :companyId AND "categoryId" = :categoryId AND "parameterId" = :paramId
            LIMIT 1;
          `, { replacements: { companyId, categoryId, paramId }, transaction });

          if (catParamRows.length === 0) {
            await sequelize.query(`
              INSERT INTO category_parameter_mapping (id, "companyId", "categoryId", "parameterId", status, created_at, updated_at)
              VALUES (gen_random_uuid(), :companyId, :categoryId, :paramId, 'Active', NOW(), NOW());
            `, { replacements: { companyId, categoryId, paramId }, transaction });
          }
        }
      }
    }

    await transaction.commit();
    console.log("✅ GPCB parameters flag & dataset import migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ GPCB parameters migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
