/**
 * @file 10_create_audit_quotations_table.js
 * @description Migration script to create the audit_quotations table.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Creating audit_quotations table...");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_quotations (
        id UUID PRIMARY KEY,
        test_request_id UUID,
        company_id UUID,
        client_id UUID,
        quotation_number VARCHAR(255),
        quotation_date VARCHAR(255),
        revised_date VARCHAR(255),
        financial_year VARCHAR(255),
        reference VARCHAR(255),
        subject VARCHAR(255),
        intro_text TEXT,
        accreditation_text TEXT,
        scope_text TEXT,
        terms_text TEXT,
        charges TEXT,
        annexure TEXT,
        contact_person VARCHAR(255),
        signatory_name VARCHAR(255),
        signatory_designation VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `, { transaction });

    await transaction.commit();
    console.log("✅ Audit Quotations table migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Audit Quotations table migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
