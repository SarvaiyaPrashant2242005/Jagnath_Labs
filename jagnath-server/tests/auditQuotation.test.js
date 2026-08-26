/**
 * @file auditQuotation.test.js
 * @description Automated unit tests for Audit Quotation Joi validation schemas.
 */

const { createAuditQuotationSchema } = require("../src/modules/Forms/AuditQuotationForm/auditQuotation.validators");

console.log("=== RUNNING AUDIT QUOTATION Joi VALIDATION TESTS ===");

const runTests = () => {
    // Case 1: Missing testRequestId must fail
    const case1 = createAuditQuotationSchema.validate({
        companyId: "comp-123",
        clientId: "client-123"
    });
    if (case1.error && case1.error.message.includes("Test Request ID is required")) {
        console.log("✅ PASSED: Missing testRequestId fails validation");
    } else {
        console.error("❌ FAILED: Missing testRequestId should fail validation", case1.error);
    }

    // Case 2: Full valid payload passes
    const case2 = createAuditQuotationSchema.validate({
        testRequestId: "tr-123",
        companyId: "comp-123",
        clientId: "client-123",
        quotationNumber: "Q-123",
        quotationDate: "20/05/2026",
        charges: [
            { srNo: 1, description: "Audit Charges", qty: 1, unit: "No.", rate: 25000, amount: 25000 }
        ],
        annexure: [
            { category: "1. Inlet", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 }
        ]
    });
    if (!case2.error) {
        console.log("✅ PASSED: Full valid payload passes validation");
    } else {
        console.error("❌ FAILED: Full valid payload should pass validation", case2.error);
    }

    console.log("=== ALL AUDIT QUOTATION VALIDATION TESTS COMPLETED ===");
};

runTests();
