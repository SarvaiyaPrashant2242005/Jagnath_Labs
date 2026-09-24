/**
 * @file industryPricing.test.js
 * @description Automated unit tests for Test Request Industry Type and Price calculation validation.
 */

const { createTestRequestSchema, updateTestRequestSchema } = require("../src/modules/Forms/TestRequestForm/testRequest.validators");
const { INDUSTRY_PRICES } = require("../src/config/industryConstants");

console.log("=== RUNNING TEST REQUEST INDUSTRY TYPE & PRICING VALIDATION TESTS ===");

const runTests = () => {
    // Test Case 1: Valid 'small' industry type passes validation
    const case1 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        industryType: "small"
    });
    if (!case1.error) {
        console.log("✅ PASSED: 'small' industry type passes validation");
    } else {
        console.error("❌ FAILED: 'small' industry type should pass validation", case1.error);
    }

    // Test Case 2: Valid 'medium' industry type passes validation
    const case2 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        industryType: "medium"
    });
    if (!case2.error) {
        console.log("✅ PASSED: 'medium' industry type passes validation");
    } else {
        console.error("❌ FAILED: 'medium' industry type should pass validation", case2.error);
    }

    // Test Case 3: Valid 'large' industry type passes validation
    const case3 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        industryType: "large"
    });
    if (!case3.error) {
        console.log("✅ PASSED: 'large' industry type passes validation");
    } else {
        console.error("❌ FAILED: 'large' industry type should pass validation", case3.error);
    }

    // Test Case 4: Invalid industry type fails validation
    const case4 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        industryType: "super-large"
    });
    if (case4.error && case4.error.message.includes("Industry Type must be")) {
        console.log("✅ PASSED: Invalid industry type fails validation as expected");
    } else {
        console.error("❌ FAILED: Invalid industry type should fail validation", case4.error);
    }

    // Test Case 5: Empty/Null industry type passes validation
    const case5 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        industryType: ""
    });
    if (!case5.error) {
        console.log("✅ PASSED: Empty industry type passes validation");
    } else {
        console.error("❌ FAILED: Empty industry type should pass validation", case5.error);
    }

    // Test Case 6: Centralized Price Constants Mapping Check
    if (INDUSTRY_PRICES.small === 15000 && INDUSTRY_PRICES.medium === 20000 && INDUSTRY_PRICES.large === 25000) {
        console.log("✅ PASSED: Centralized configuration price values match expectations");
    } else {
        console.error("❌ FAILED: Centralized configuration price values mismatch", INDUSTRY_PRICES);
    }

    console.log("=== ALL INDUSTRY TYPE VALIDATION TESTS COMPLETED ===");
};

runTests();
