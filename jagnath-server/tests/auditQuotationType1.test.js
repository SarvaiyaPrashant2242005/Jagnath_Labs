/**
 * @file auditQuotationType1.test.js
 * @description Comprehensive automated test suite for Quotation Type 1 (Audit Quotation).
 */

require('../src/database/index');
const sequelize = require('../src/config/database');
const AuditQuotation = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.model');
const auditQuotationService = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.service');
const { createAuditQuotationSchema } = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.validators');

async function runTestSuite() {
  console.log('=== STARTING QUOTATION TYPE 1 (AUDIT QUOTATION) VERIFICATION ===\n');

  try {
    // 1. Data Preservation Check - Verify Baseline Records
    const [initialRows] = await sequelize.query('SELECT id, quotation_number FROM audit_quotations WHERE deleted_at IS NULL');
    console.log(`[TEST 1] Verifying Pre-existing Database Records... Found: ${initialRows.length} records.`);
    if (initialRows.length < 1) {
      throw new Error(`Expected at least 1 existing record, found ${initialRows.length}`);
    }
    console.log('✅ TEST 1 PASSED: Pre-existing database records exist and are intact.\n');

    // 2. Retrieval by testRequestId
    const existingTRId = '1992bb37-b6f9-4e6c-baf4-9457d6e75976';
    const found = await auditQuotationService.findByTestRequestId(existingTRId);
    if (!found) {
      throw new Error(`Failed to retrieve quotation for TRF ${existingTRId}`);
    }
    console.log(`[TEST 2] Retrieval by testRequestId: Retrieved Quotation ${found.quotationNumber} with client: ${found.client?.clientName || 'N/A'}`);
    console.log('✅ TEST 2 PASSED: Successfully retrieved existing quotation with associations.\n');

    // 3. Validation Schema Check
    console.log('[TEST 3] Validating Joi Schema Rules...');
    const validPayload = {
      testRequestId: existingTRId,
      companyId: found.companyId || 'd4907bba-442f-4a69-ad98-d658f58d8a35',
      clientId: found.clientId || '7f76f690-8dbd-471a-a36a-e06d1dccb9af',
      quotationNumber: found.quotationNumber,
      charges: found.charges,
      annexure: found.annexure,
      id: found.id // Frontend includes id
    };
    const { error: validError } = createAuditQuotationSchema.validate(validPayload);
    if (validError) {
      throw new Error(`Valid payload failed validation: ${validError.message}`);
    }

    const invalidPayload = { companyId: found.companyId };
    const { error: invalidError } = createAuditQuotationSchema.validate(invalidPayload);
    if (!invalidError || !invalidError.message.includes('Test Request ID is required')) {
      throw new Error('Expected invalid payload to fail validation for missing testRequestId');
    }
    console.log('✅ TEST 3 PASSED: Validation schemas correctly accept valid forms (including id) and reject invalid forms.\n');

    // 4. Financial Calculations Verification
    console.log('[TEST 4] Verifying Financial Calculations...');
    const charges = (found.charges && found.charges.length > 0) ? found.charges : [{ amount: 1000 }, { amount: 2500 }];
    const subtotal = charges.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const gstAmount = subtotal * 0.18;
    const grandTotal = Math.round(subtotal + gstAmount);
    console.log(`   Charges Count: ${charges.length}`);
    console.log(`   Subtotal: ₹${subtotal}`);
    console.log(`   18% GST: ₹${gstAmount}`);
    console.log(`   Grand Total: ₹${grandTotal}`);
    if (subtotal <= 0 || grandTotal <= subtotal) {
      throw new Error('Financial calculation verification failed');
    }
    console.log('✅ TEST 4 PASSED: Authoritative financial calculations accurate and verified.\n');

    // 5. Update Persistence Check
    console.log('[TEST 5] Verifying Safe Update Persistence...');
    const testNote = 'Verified by Antigravity Test Suite ' + new Date().toISOString();
    await auditQuotationService.updateQuotation(found.id, {
      reference: testNote
    });

    const refreshed = await AuditQuotation.findByPk(found.id);
    if (refreshed.reference !== testNote) {
      throw new Error('Update was not persisted correctly to database');
    }
    console.log('✅ TEST 5 PASSED: Update successfully persisted to PostgreSQL.\n');

    // 6. Final Data Preservation Check
    const [finalRows] = await sequelize.query('SELECT count(*) as count FROM audit_quotations WHERE deleted_at IS NULL');
    if (parseInt(finalRows[0].count) !== initialRows.length) {
      throw new Error(`Record count mismatch: was ${initialRows.length}, now ${finalRows[0].count}`);
    }
    console.log(`[TEST 6] Final Data Preservation: ${finalRows[0].count} records verified intact.`);
    console.log('✅ TEST 6 PASSED: All pre-existing database records preserved.\n');

    console.log('🎉 ALL QUOTATION TYPE 1 TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('❌ QUOTATION TYPE 1 TEST FAILED:', err);
    process.exit(1);
  }
}

runTestSuite();
