/**
 * @file loggerService.js
 * @description Provides general utility logging services, including file output operations.
 * @module services/loggerService
 * @requires fs
 * @requires path
 */

const fs = require("fs");
const path = require("path");

/**
 * Appends a log message cleanly to a specified file.
 * Automatically ensures that the destination directory structure exists before writing.
 * 
 * @function writeLogToFile
 * @param {string} logMessage - The exact string content of the log to write.
 * @param {string} filePath - Absolute or relative filesystem path of the destination log file.
 * @returns {void}
 * @throws {Error} Throws filesystem errors if write permissions or disk space issues occur.
 */
const writeLogToFile = (logMessage, filePath) => {
    try {
        const resolvedPath = path.resolve(filePath);
        const directory = path.dirname(resolvedPath);

        // Ensure parent directories exist (recursive flag ensures multi-level folder creation if needed)
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        // Clean up message spacing - ensure it ends with exactly one newline if not already present
        const formattedMessage = logMessage.endsWith("\n") ? logMessage : `${logMessage}\n`;

        // Append log entry synchronously or in an async-friendly stream. Here, appendFileSync is safe for server request streams.
        fs.appendFileSync(resolvedPath, formattedMessage, "utf8");
    } catch (error) {
        console.error(`❌ Failed to write log to file: ${filePath}`);
        console.error(error.stack || error.message);
    }
};

module.exports = {
    writeLogToFile
};
