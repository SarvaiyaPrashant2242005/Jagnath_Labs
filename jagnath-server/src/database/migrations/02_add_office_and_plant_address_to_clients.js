/**
 * @file 02_add_office_and_plant_address_to_clients.js
 * @description Migration script to add office_address and plant_address columns to clients table,
 * copy existing legacy address data to both columns so no data is lost, and make address nullable.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Checking and adding office_address & plant_address columns to clients table...");

    // 1. Add office_address column if not exists
    await sequelize.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS office_address TEXT;
    `, { transaction });

    // 2. Add plant_address column if not exists
    await sequelize.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS plant_address TEXT;
    `, { transaction });

    // 3. Make legacy address column nullable if it isn't already
    await sequelize.query(`
      ALTER TABLE clients ALTER COLUMN address DROP NOT NULL;
    `, { transaction });

    // 4. Preserve/copy legacy address data into office_address and plant_address if null
    await sequelize.query(`
      UPDATE clients
      SET 
        office_address = COALESCE(office_address, address, 'N/A'),
        plant_address = COALESCE(plant_address, address, 'N/A')
      WHERE office_address IS NULL OR plant_address IS NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✅ Client dual-address migration completed successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Client dual-address migration failed:", error.message);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
