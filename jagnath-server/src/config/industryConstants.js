/**
 * @file industryConstants.js
 * @description Centralized configurations for industry types and pricing.
 */

const INDUSTRY_TYPES = {
    SMALL: "small",
    MEDIUM: "medium",
    LARGE: "large"
};

const INDUSTRY_PRICES = {
    [INDUSTRY_TYPES.SMALL]: 15000,
    [INDUSTRY_TYPES.MEDIUM]: 20000,
    [INDUSTRY_TYPES.LARGE]: 25000
};

module.exports = {
    INDUSTRY_TYPES,
    INDUSTRY_PRICES
};
