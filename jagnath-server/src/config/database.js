/**
 * @file database.js
 * @description Database connection configuration and Sequelize initialization.
 * Configures the Sequelize instance to establish connection pools with PostgreSQL.
 * @module config/database
 * @requires sequelize
 * @requires dotenv
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Sequelize instance configured for PostgreSQL.
 * Utilizes environment variables for DB credentials and connection parameters.
 * Implements connection pooling to optimize database connectivity and resource usage.
 * 
 * @type {import('sequelize').Sequelize}
 */
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",

        // Disables SQL query execution logging in console to prevent cluttering production logs.
        logging: false,

        // Connection pool configuration to manage concurrent database connections efficiently.
        pool: {
            max: 10,      // Maximum number of active connections allowed in the pool
            min: 0,       // Minimum number of active connections in the pool
            acquire: 30000, // Maximum time (ms) Sequelize will try to get a connection before throwing an error
            idle: 10000   // Maximum time (ms) a connection can be idle before being released
        }
    }
);

module.exports = sequelize;