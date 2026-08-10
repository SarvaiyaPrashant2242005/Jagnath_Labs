/**
 * @file app.js
 * @description Configures the Express application instance, integrating essential security,
 * utility middleware, and initial routing.
 * @module app
 * @requires express
 * @requires cors
 * @requires helmet
 * @requires cookie-parser
 * @requires morgan
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const path = require("path");
const { writeLogToFile } = require("./src/services/loggerService");
const masterRouter = require("./src/routes.index");

// Initialize Express application instance
const app = express();

// Parses incoming requests with JSON payloads (adds parsed data to req.body)
app.use(express.json());

// Enables Cross-Origin Resource Sharing (CORS) to allow requests from external domains/frontends
app.use(cors());

// Enhances application security by setting various HTTP headers (guards against XSS, clickjacking, etc.)
app.use(helmet());

// Parses cookie headers and populates req.cookies with an object keyed by the cookie names
app.use(cookieParser());

// Define destination path for the HTTP request log file
const logFilePath = path.join(__dirname, "logs/request.txt");

// Custom stream object for Morgan middleware to pipe log output through the logger service
// Prepend an ISO timestamp to each request log entry for traceability
const requestLogStream = {
    write: (message) => {
        const timestamp = new Date().toISOString();
        writeLogToFile(`[${timestamp}] ${message.trim()}`, logFilePath);
    }
};

// HTTP request logger configured to print logs into request.txt using custom plain text formatting
app.use(morgan(":method :url :status :response-time ms - :res[content-length]", {
    stream: requestLogStream
}));

/**
 * Diagnostic / Health Check Endpoint
 * Simple endpoint to verify the server status and API availability.
 * 
 * @name GET/jagnath/test
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
app.get("/jagnath/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Jagnath Labs API Running"
    });
});

// Mount the master router
app.use("/api", masterRouter);

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;