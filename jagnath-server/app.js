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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global middleware to sanitize companyId from headers, query, and body to prevent "undefined" or "null" string errors
app.use((req, res, next) => {
    const sanitize = (val) => {
        if (val === "undefined" || val === "null" || val === "") {
            return undefined;
        }
        return val;
    };

    if (req.headers && req.headers["x-company-id"]) {
        req.headers["x-company-id"] = sanitize(req.headers["x-company-id"]);
    }
    if (req.query) {
        if (req.query.companyId) req.query.companyId = sanitize(req.query.companyId);
        if (req.query.company_id) req.query.company_id = sanitize(req.query.company_id);
    }
    if (req.body) {
        if (req.body.companyId) req.body.companyId = sanitize(req.body.companyId);
        if (req.body.company_id) req.body.company_id = sanitize(req.body.company_id);
    }
    next();
});

// Enables Cross-Origin Resource Sharing (CORS) to allow requests from external domains/frontends
app.use(cors());

// Enhances application security by setting various HTTP headers (guards against XSS, clickjacking, etc.)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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