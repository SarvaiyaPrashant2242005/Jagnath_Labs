/**
 * @file index.js
 * @description Main entry point for the FreightFlow backend server.
 * Loads environment variables, connects to the database, and boots up the HTTP listener.
 * @requires dotenv
 * @requires app
 * @requires config/dbConnection
 */

require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/dbConnection");

// Default to port 5000 if not specified in environment configuration
const PORT = process.env.PORT || 5000;

/**
 * Boots the backend application by verifying the database connection
 * and binding the Express server to the designated port.
 * 
 * @async
 * @function startServer
 * @returns {Promise<void>} Resolves when the server is listening
 */
const startServer = async () => {
    // Wait for a successful connection to database before launching HTTP server
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server Running On Port ${PORT}`);
        console.debug(`http://localhost:5000/freightflow/test`);
    });
};

startServer();