/**
 * @file 15_add_sample_groups_to_test_requests.js
 * @description Migration to add sample_groups to test_requests and group_id / location_of_sample to test_request_parameters.
 */

const sequelize = require("../../config/database");

const runMigration = async () => {
    try {
        // 1. Add sample_groups column to test_requests if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_requests' AND column_name = 'sample_groups'
                ) THEN 
                    ALTER TABLE test_requests ADD COLUMN sample_groups JSONB DEFAULT '[]'::jsonb;
                END IF;
            END $$;
        `);

        // 2. Add group_id column to test_request_parameters if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_request_parameters' AND column_name = 'group_id'
                ) THEN 
                    ALTER TABLE test_request_parameters ADD COLUMN group_id VARCHAR(100);
                END IF;
            END $$;
        `);

        // 3. Add location_of_sample column to test_request_parameters if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_request_parameters' AND column_name = 'location_of_sample'
                ) THEN 
                    ALTER TABLE test_request_parameters ADD COLUMN location_of_sample VARCHAR(255);
                END IF;
            END $$;
        `);

        // 4. Add department_id column to test_request_parameters if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_request_parameters' AND column_name = 'department_id'
                ) THEN 
                    ALTER TABLE test_request_parameters ADD COLUMN department_id UUID;
                END IF;
            END $$;
        `);

        // 5. Add category_id column to test_request_parameters if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_request_parameters' AND column_name = 'category_id'
                ) THEN 
                    ALTER TABLE test_request_parameters ADD COLUMN category_id UUID;
                END IF;
            END $$;
        `);

        // 6. Add sub_category_id column to test_request_parameters if it doesn't exist
        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'test_request_parameters' AND column_name = 'sub_category_id'
                ) THEN 
                    ALTER TABLE test_request_parameters ADD COLUMN sub_category_id UUID;
                END IF;
            END $$;
        `);

        console.log("✅ Migration 15: sample_groups added to test_requests and test_request_parameters successfully.");
    } catch (error) {
        console.error("❌ Migration 15 failed:", error);
        throw error;
    }
};

module.exports = { runMigration };
