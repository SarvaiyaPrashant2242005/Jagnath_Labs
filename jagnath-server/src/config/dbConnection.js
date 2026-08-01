/**
 * @file dbConnection.js
 * @description Manages database lifecycle connection, checking connectivity using Sequelize authentication.
 * @module config/dbConnection
 * @requires config/database
 */

const sequelize = require("./database");
require("../database/index");

/**
 * Authenticates the database connection asynchronously.
 * Logs success on connection or logs the failure and terminates the application with exit code 1.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when connection is successfully authenticated.
 * @throws {Error} Exits the process if authentication fails.
 */
const connectDB = async () => {
    try {
        // 1. Test if connection parameters are correct and database is reachable
        await sequelize.authenticate();
        console.log("✅ PostgreSQL Connected Successfully");

        // 2. Sync all models with the database (alter: false to prevent PostgreSQL alter conflict crashes)
        await sequelize.sync({ alter: false });
        console.log('📂 Database & tables synced!');

        // 3. Run unique index migration and duplicate report
        const { runMigration } = require("../database/migrations/01_add_unique_indexes_and_cleanup");
        await runMigration();

        // 4. Seed default data if needed
        const { seedDefaultUser } = require("../database/seeders");
        await seedDefaultUser();
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);

        // Terminate process with failure code (1) to prevent the web server from running in an unhealthy state
        process.exit(1);
    }
};

module.exports = connectDB;