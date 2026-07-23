/**
 * @file auth.middleware.js
 * @description Middleware to validate JWT tokens and protect routes.
 */

const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");

/**
 * Middleware to authenticate requests using JWT.
 * Expects the token in the Authorization header as a Bearer token.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json(errorResponse(
            "UNAUTHORIZED",
            "Missing or invalid Authorization header",
            "You must be logged in to perform this action."
        ));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json(errorResponse(
            "UNAUTHORIZED",
            "No token provided",
            "You must be logged in to perform this action."
        ));
    }

    try {
        const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "fallback_secret";
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json(errorResponse(
            "FORBIDDEN",
            err.message,
            "Your session has expired or is invalid. Please log in again."
        ));
    }
};

module.exports = {
    authenticateToken,
};
