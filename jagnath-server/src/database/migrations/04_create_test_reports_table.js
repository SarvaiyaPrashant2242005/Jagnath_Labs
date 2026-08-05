/**
 * @file 04_create_test_reports_table.js
 * @description Migration script to create test_reports table if it does not exist.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Creating test_reports table if not exists...");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        test_request_id UUID,
        report_number VARCHAR(255) NOT NULL,
        reference_no VARCHAR(255),
        report_issued_to VARCHAR(255) NOT NULL,
        agency_name VARCHAR(255),
        agency_address TEXT,
        details_of_sample VARCHAR(255),
        packing_details VARCHAR(255),
        date_of_receipt DATE,
        sample_quantity VARCHAR(255),
        sampling_location VARCHAR(255),
        condition_on_receipt VARCHAR(255),
        sample_collected_by VARCHAR(255),
        name_of_work TEXT,
        starting_date_of_test DATE,
        completion_date_of_test DATE,
        section_header VARCHAR(255),
        parameters_list JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `, { transaction });

    await transaction.commit();
    console.log("✅ test_reports table migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ test_reports table migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
