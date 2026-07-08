/**
 * @file response.js
 * @description Centralized response formatters to ensure consistent API responses.
 */

/**
 * Formats a successful API response.
 * @param {string} code - The application-specific success code (e.g., "USER_REGISTERED").
 * @param {string} message - Technical or general success message.
 * @param {string} messageToShow - User-friendly message to be shown on the frontend.
 * @param {any} [data] - The actual payload/data of the response.
 * @returns {object} The formatted success response object.
 */
const successResponse = (code, message, messageToShow, data = null) => {
    return {
        success: true,
        message: messageToShow || message || "Operation successful.",
        data,
        code,
        messageToShow,
    };
};

/**
 * Formats an error API response.
 * @param {string} errorCode - The application-specific error code.
 * @param {string} errorMessage - Technical error message (useful for debugging).
 * @param {string} messageToShow - User-friendly error message to be shown on the frontend.
 * @returns {object} The formatted error response object.
 */
const errorResponse = (errorCode, errorMessage, messageToShow) => {
    return {
        success: false,
        message: messageToShow || errorMessage || "An error occurred.",
        errorCode,
        errorMessage,
        messageToShow,
    };
};

module.exports = {
    successResponse,
    errorResponse,
};
