/**
 * @file parameterDisplayUtils.js
 * @description Display-level utilities for formatting parameter names across modules.
 * Note: Does NOT modify database records.
 */

/**
 * Strips the standalone word "Sampling" (case-insensitive) from a parameter name.
 * Used exclusively for TRF and Test Report screens, PDF, and print outputs.
 * 
 * Rules:
 * - Match "Sampling" case-insensitively (Sampling, SAMPLING, sampling).
 * - Remove the complete standalone word only (\bword\b).
 * - Clean up extra spaces left after removing the word.
 * - Preserve all other words, characters, numbers, and symbols.
 * - Gracefully fallback if the result is empty.
 * 
 * Examples:
 * - "Sampling ABCD" -> "ABCD"
 * - "Sampling Method" -> "Method"
 * - "Sampling Charges" -> "Charges"
 * - "Sampling & Testing" -> "& Testing"
 * - "ABCD" -> "ABCD"
 * 
 * @param {string} name - Raw parameter name
 * @returns {string} Sanitized display name
 */
export const sanitizeSamplingParamName = (name) => {
  if (!name || typeof name !== 'string') return name || '';
  
  // Replace standalone word "sampling" case-insensitively
  const cleaned = name.replace(/\bSAMPLING\b/gi, '').replace(/\s+/g, ' ').trim();
  
  // If removing "sampling" leaves empty text or whitespace, return original or fallback
  return cleaned || name;
};

