/**
 * @file quotationRequirement.test.js
 * @description Automated unit tests for Test Request Quotation Requirement feature.
 */

const { createTestRequestSchema, updateTestRequestSchema } = require("../src/modules/Forms/TestRequestForm/testRequest.validators");

console.log("=== RUNNING TEST REQUEST QUOTATION REQUIREMENT VALIDATION TESTS ===");

const runTests = () => {
    // Test Case 1: Yes without selecting type must fail validation
    const case1 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        quotationRequired: "Yes"
    });
    if (case1.error && case1.error.message.includes("Quotation Type is required")) {
        console.log("✅ PASSED: Yes without selecting type fails validation");
    } else {
        console.error("❌ FAILED: Yes without selecting type should fail validation", case1.error);
    }

    // Test Case 2: Yes with valid type passes validation
    const case2 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        quotationRequired: "Yes",
        quotationType: "Audit"
    });
    if (!case2.error) {
        console.log("✅ PASSED: Yes with valid type (Audit) passes validation");
    } else {
        console.error("❌ FAILED: Yes with valid type should pass validation", case2.error);
    }

    // Test Case 3: No without selecting type passes validation
    const case3 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        quotationRequired: "No"
    });
    if (!case3.error) {
        console.log("✅ PASSED: No without selecting type passes validation");
    } else {
        console.error("❌ FAILED: No without selecting type should pass validation", case3.error);
    }

    // Test Case 4: No with invalid type fails validation
    const case4 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123",
        quotationRequired: "No",
        quotationType: "InvalidType"
    });
    if (case4.error) {
        console.log("✅ PASSED: No with invalid type fails validation");
    } else {
        console.error("❌ FAILED: No with invalid type should fail validation");
    }

    // Test Case 5: Default quotationRequired is 'No'
    const case5 = createTestRequestSchema.validate({
        companyId: "comp-123",
        clientId: "client-123"
    });
    if (case5.value.quotationRequired === "No") {
        console.log("✅ PASSED: Default value for quotationRequired is 'No'");
    } else {
        console.error("❌ FAILED: Default value for quotationRequired should be 'No'", case5.value);
    }

    console.log("=== ALL VALIDATION TESTS COMPLETED ===");
};

runTests();
