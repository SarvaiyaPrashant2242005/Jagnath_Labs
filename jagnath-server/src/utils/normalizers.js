/**
 * @file normalizers.js
 * @description Utility functions for normalizing string fields (email, phone, names) and sanitizing spreadsheet values.
 */

/**
 * Normalizes email address by trimming and converting to lowercase.
 * @param {string} email 
 * @returns {string}
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

/**
 * Normalizes phone numbers by trimming spaces, removing spaces between digits, hyphens, and brackets.
 * Retains meaningful numeric digits.
 * @param {string|number} phone 
 * @returns {string}
 */
const normalizePhone = (phone) => {
  if (phone === null || phone === undefined) return "";
  const str = String(phone).trim();
  // Remove whitespace, hyphens, brackets, and non-digit characters except numeric sequence
  return str.replace(/[\s\-\(\)\+]/g, "");
};

/**
 * Normalizes general text names (e.g., category name, parameter name, client name) for case-insensitive comparisons.
 * @param {string} str 
 * @returns {string}
 */
const normalizeString = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).trim().toLowerCase();
};

/**
 * Sanitizes values when generating CSV/Excel output to prevent formula injection.
 * Escapes leading =, +, -, @ with a single quote.
 * @param {any} val 
 * @returns {any}
 */
const sanitizeSpreadsheetValue = (val) => {
  if (typeof val === "string" && /^[=\+\-@]/.test(val)) {
    return `'${val}`;
  }
  return val;
};

module.exports = {
  normalizeEmail,
  normalizePhone,
  normalizeString,
  sanitizeSpreadsheetValue,
};
