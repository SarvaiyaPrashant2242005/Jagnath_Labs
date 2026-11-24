/**
 * @file 17_create_blogs_table.js
 * @description Migration script to create blogs table if it does not exist.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🛠️ Creating blogs table if not exists...");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        short_description TEXT,
        content TEXT NOT NULL,
        featured_image VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'Draft',
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
      CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
      CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
      CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    `, { transaction });

    await transaction.commit();
    console.log("✅ blogs table created successfully!");
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error("❌ blogs table migration failed:", error.message);
    throw error;
  }
};

module.exports = { runMigration };

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

