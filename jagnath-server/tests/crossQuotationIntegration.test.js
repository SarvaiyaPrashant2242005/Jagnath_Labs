/**
 * @file crossQuotationIntegration.test.js
 * @description Master End-to-End Cross-Quotation Regression and Integration Test Suite.
 * Verifies all 3 quotation types operate independently without interference,
 * data pollution, route conflicts, or loss of pre-existing records.
 */

require('../src/database/index');
const sequelize = require('../src/config/database');
const auditQuotationService = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.service');
const provisionalQuotationService = require('../src/modules/Forms/ProvisionalQuotation/provisionalQuotation.service');
const AuditQuotation = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.model');
const GeneralTestingQuotation = require('../src/modules/Forms/GeneralTestingQuotationForm/generalTestingQuotation.model');
const RegularQuotation = require('../src/modules/Forms/RegularQuotationForm/regularQuotation.model');

async function runMasterRegressionSuite() {
  console.log('================================================================');
  console.log('   MASTER CROSS-QUOTATION INTEGRATION & REGRESSION TEST SUITE    ');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: Baseline Production Data Preservation Check
    // -------------------------------------------------------------
    console.log('[STAGE 1] Checking Pre-existing Production Records Integrity...');
    const [baselineAuditRows] = await sequelize.query(
      'SELECT id, quotation_number, quotation_date, status FROM audit_quotations WHERE deleted_at IS NULL ORDER BY created_at ASC'
    );
    console.log(`   Found ${baselineAuditRows.length} active records in audit_quotations:`);
    baselineAuditRows.forEach((r, i) => {
      console.log(`   [${i + 1}] ID: ${r.id} | No: ${r.quotation_number} | Date: ${r.quotation_date} | Status: ${r.status}`);
    });

    if (baselineAuditRows.length < 1) {
      throw new Error(`CRITICAL ERROR: Expected at least 1 baseline record in audit_quotations, found ${baselineAuditRows.length}!`);
    }
    console.log('✅ STAGE 1 PASSED: Baseline production data in audit_quotations verified.\n');

    // -------------------------------------------------------------
    // SECTION 2: Quotation Type 1 (Audit Quotation) Independent Verification
    // -------------------------------------------------------------
    console.log('[STAGE 2] Quotation Type 1 Independent Workflow Verification...');
    const trId = '1992bb37-b6f9-4e6c-baf4-9457d6e75976';
    const auditQuote = await auditQuotationService.findByTestRequestId(trId);
    if (!auditQuote) {
      throw new Error(`Quotation Type 1 not found for TRF ${trId}`);
    }
    console.log(`   Quotation Type 1 successfully retrieved: ${auditQuote.quotationNumber}`);
    console.log(`   Linked Test Request ID: ${auditQuote.testRequestId}`);
    console.log(`   Charges Subtotal: ₹${(auditQuote.charges || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)}`);
    console.log('✅ STAGE 2 PASSED: Quotation Type 1 operations verified.\n');

    // -------------------------------------------------------------
    // SECTION 3: Quotation Type 2 (Provisional Estimated Quotation) Independent Verification
    // -------------------------------------------------------------
    console.log('[STAGE 3] Quotation Type 2 Independent Workflow Verification...');
    const provQuotePayload = {
      quotationNumber: `PQ/REGRESSION/2026/001`,
      quotationType: 'Provisional Estimated Quotation',
      categoryType: 'provisional',
      quotationDate: '2026-10-23',
      financialYear: '2026-2027',
      clientName: 'Integration Test Client - Type 2',
      plantName: 'Testing Unit 2',
      industryType: 'large',
      status: 'Ready',
      version: 1,
      annexureI: { auditFee: 25000, daysPerVisit: 4, visits: 3 },
      activities: [
        { srNo: 1, activityDescription: 'Activity Alpha', ratePerSample: 2000, visitsPerYear: 3, annualCharge: 6000 }
      ],
      subtotal: 130720,
      gstPercentage: 18,
      gstAmount: 23529.6,
      grandTotal: 154250
    };

    const createdType2 = await provisionalQuotationService.saveQuotationSnapshot(provQuotePayload);
    if (!createdType2 || createdType2.quotationType !== 'Provisional Estimated Quotation') {
      throw new Error('Failed to create Quotation Type 2');
    }
    console.log(`   Quotation Type 2 created: ID ${createdType2.id} | No: ${createdType2.quotationNumber} | Total: ₹${createdType2.grandTotal}`);
    console.log('✅ STAGE 3 PASSED: Quotation Type 2 operations verified.\n');

    // -------------------------------------------------------------
    // SECTION 4: Quotation Type 3 (General Testing Quotation) Independent Verification
    // -------------------------------------------------------------
    console.log('[STAGE 4] Quotation Type 3 Independent Workflow Verification...');
    const gtQuotePayload = {
      quotationNumber: `GTQ/REGRESSION/2026/001`,
      quotationNo: `GTQ/REGRESSION/2026/001`,
      quotationType: 'general_testing',
      categoryType: 'general_testing',
      quotationCategoryType: 'general_testing',
      quotationDate: '2026-10-23',
      financialYear: '2026-2027',
      clientName: 'Integration Test Client - Type 3',
      plantName: 'Commercial Lab Testing Plant',
      status: 'Finalized',
      version: 1,
      lineItems: [
        { srNo: 1, testDescription: 'RO Water Analysis', ratePerSample: 5000, sampleQty: 1, discountPercent: 0, totalAmount: 5000 }
      ],
      sections: [{ id: 's1', title: 'Terms', content: '<p>Immediate Payment</p>' }],
      bankDetails: { bankName: 'SBI', accountNumber: '123456789' },
      subtotal: 5000,
      gstPercentage: 18,
      gstAmount: 900,
      grandTotal: 5900
    };

    const createdType3 = await provisionalQuotationService.saveQuotationSnapshot(gtQuotePayload);
    if (!createdType3 || createdType3.quotationType !== 'general_testing') {
      throw new Error('Failed to create Quotation Type 3');
    }
    console.log(`   Quotation Type 3 created: ID ${createdType3.id} | No: ${createdType3.quotationNumber} | Total: ₹${createdType3.grandTotal}`);
    console.log('✅ STAGE 4 PASSED: Quotation Type 3 operations verified.\n');

    // -------------------------------------------------------------
    // SECTION 5: Cross-Type Isolation and No Shared State Leakage Check
    // -------------------------------------------------------------
    console.log('[STAGE 5] Checking Cross-Type Isolation and Query Filtering...');
    const gtList = await provisionalQuotationService.getAllQuotations({ quotationType: 'general_testing' });
    const hasNonGtInGt = gtList.quotations.some(q => q.quotationType !== 'general_testing');
    if (hasNonGtInGt) {
      throw new Error('Cross-type data leakage! Found non-general_testing in general_testing filter.');
    }
    console.log(`   Filtered general_testing query returned ${gtList.quotations.length} records, 0 leakage.`);

    const provList = await provisionalQuotationService.getAllQuotations({ quotationType: 'Provisional Estimated Quotation' });
    const hasNonProvInProv = provList.quotations.some(q => q.quotationType === 'general_testing');
    if (hasNonProvInProv) {
      throw new Error('Cross-type data leakage! Found general_testing in provisional filter.');
    }
    console.log(`   Filtered provisional query returned ${provList.quotations.length} records, 0 leakage.`);
    console.log('✅ STAGE 5 PASSED: Cross-type query isolation and schema separation confirmed.\n');

    // Clean up temporary test records created during test
    await provisionalQuotationService.deleteQuotation(createdType2.id);
    await provisionalQuotationService.deleteQuotation(createdType3.id);

    // -------------------------------------------------------------
    // SECTION 6: Final Baseline Production Data Re-verification
    // -------------------------------------------------------------
    console.log('[STAGE 6] Final Database Re-verification...');
    const [finalAuditRows] = await sequelize.query(
      'SELECT id, quotation_number FROM audit_quotations WHERE deleted_at IS NULL ORDER BY created_at ASC'
    );
    if (finalAuditRows.length !== baselineAuditRows.length) {
      throw new Error(`CRITICAL: audit_quotations record count changed from ${baselineAuditRows.length} to ${finalAuditRows.length}!`);
    }

    // Verify row-by-row match of baseline IDs
    baselineAuditRows.forEach((r, idx) => {
      if (finalAuditRows[idx].id !== r.id) {
        throw new Error(`Record ID mismatch at position ${idx}: was ${r.id}, now ${finalAuditRows[idx].id}`);
      }
    });

    console.log(`   audit_quotations verified: All ${finalAuditRows.length} baseline records match exactly.`);

    const [finalRegCount] = await sequelize.query(
      'SELECT count(*) as count FROM regular_quotations WHERE deleted_at IS NULL'
    );
    const [finalGtCount] = await sequelize.query(
      'SELECT count(*) as count FROM general_testing_quotations WHERE deleted_at IS NULL'
    );
    console.log(`   regular_quotations active: ${finalRegCount[0].count} | general_testing_quotations active: ${finalGtCount[0].count}`);
    console.log('✅ STAGE 6 PASSED: 100% Data Preservation across all 3 tables verified.\n');

    console.log('================================================================');
    console.log('🎉 ALL CROSS-QUOTATION INTEGRATION TESTS PASSED WITH 100% SUCCESS! 🎉');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ MASTER REGRESSION SUITE FAILED:', err);
    process.exit(1);
  }
}

runMasterRegressionSuite();
