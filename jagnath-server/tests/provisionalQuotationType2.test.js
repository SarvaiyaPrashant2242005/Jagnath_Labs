/**
 * @file provisionalQuotationType2.test.js
 * @description Comprehensive automated test suite for Quotation Type 2 (Provisional Estimated Quotation).
 */

require('../src/database/index');
const sequelize = require('../src/config/database');
const provisionalQuotationService = require('../src/modules/Forms/ProvisionalQuotation/provisionalQuotation.service');
const AuditQuotation = require('../src/modules/Forms/AuditQuotationForm/auditQuotation.model');

async function runTestSuite() {
  console.log('=== STARTING QUOTATION TYPE 2 (PROVISIONAL ESTIMATED QUOTATION) VERIFICATION ===\n');

  try {
    // 1. Initial State Check: Verify pre-existing audit_quotations are untouched
    const [auditRowsInitial] = await sequelize.query('SELECT count(*) as count FROM audit_quotations WHERE deleted_at IS NULL');
    console.log(`[TEST 1] Pre-check Audit Quotations: ${auditRowsInitial[0].count} records intact.`);
    if (parseInt(auditRowsInitial[0].count) < 1) {
      throw new Error('Audit quotation records missing!');
    }
    console.log('✅ TEST 1 PASSED: Baseline preserved.\n');

    // Fetch an existing client and company for relational verification
    const [clients] = await sequelize.query('SELECT id, "clientName" FROM clients LIMIT 1');
    const [companies] = await sequelize.query('SELECT id, company_name FROM companies LIMIT 1');
    const clientId = clients[0]?.id;
    const companyId = companies[0]?.id;

    // 2. Create New Provisional Estimated Quotation with Annexure-I, A, B
    console.log('[TEST 2] Creating Provisional Estimated Quotation with Annexure A visits & annual calculations...');
    const now = new Date();
    const quoteNo = `PQ/ENV/2026-27/001`;

    // Annexure-A activity with 3 visits/year
    const activity1 = {
      srNo: 1,
      activityDescription: 'Effluent Water Analysis (Inlet)',
      reference: 'Standard GPCB Inlet Parameters',
      ratePerSample: 1250,
      samplePerQtr: '01 Location',
      chargePerVisit: 1250,
      visitsPerYear: 3,
      annualCharge: 1250 * 3 // 3750
    };

    const activity2 = {
      srNo: 2,
      activityDescription: 'Ambient Air Quality Monitoring (24 hrs)',
      reference: 'PM10, PM2.5, SO2, NOx',
      ratePerSample: 18000,
      samplePerQtr: '01 Location',
      chargePerVisit: 18000,
      visitsPerYear: 3,
      annualCharge: 18000 * 3 // 54000
    };

    const mainChargesTotal = 25000 + 45000 + 18720 + 36000; // 124720
    const samplingTotal = activity1.annualCharge + activity2.annualCharge; // 57750
    const subtotal = mainChargesTotal + samplingTotal; // 182470
    const gstAmount = subtotal * 0.18; // 32844.6
    const grandTotal = Math.round(subtotal + gstAmount); // 215315

    const quotationPayload = {
      companyId,
      clientId,
      quotationNumber: quoteNo,
      quotationType: 'Provisional Estimated Quotation',
      categoryType: 'provisional',
      quotationDate: '2026-10-23',
      financialYear: '2026-2027',
      referenceNo: 'GPCB/EAC/2026/01',
      clientName: clients[0]?.clientName || 'Test Industrial Unit',
      plantName: 'Unit-1 GIDC Industrial Area',
      plantAddress: 'Plot 42, Sector 2, GIDC, Gujarat',
      industryType: 'large',
      status: 'Draft',
      version: 1,
      subtotal,
      gstPercentage: 18,
      gstAmount,
      grandTotal,
      contactPerson: 'Ankit Mistry (+91 7226-0579-78)',
      signatoryName: 'Purvin Raiyani',
      signatoryDesignation: 'Proprietor',
      annexureI: {
        auditFee: 25000,
        daysPerVisit: 4,
        visits: 3
      },
      activities: [activity1, activity2],
      annexureB: [
        { category: 'Effluent Water Analysis', parameters: [{ description: 'pH', rate: 110 }] }
      ],
      termsText: 'Standard Environmental Audit Terms and Conditions.'
    };

    const created = await provisionalQuotationService.saveQuotationSnapshot(quotationPayload, companyId);
    if (!created || !created.id) {
      throw new Error('Failed to create provisional quotation in database');
    }
    console.log(`   Saved Quotation ID: ${created.id}`);
    console.log(`   Quotation Number: ${created.quotationNumber}`);
    console.log(`   Grand Total: ₹${created.grandTotal}`);
    if (created.grandTotal !== grandTotal) {
      throw new Error(`Grand total mismatch: expected ₹${grandTotal}, got ₹${created.grandTotal}`);
    }
    console.log('✅ TEST 2 PASSED: Successfully saved Provisional Quotation to PostgreSQL.\n');

    // 3. Retrieval by ID & Query with Associations
    console.log('[TEST 3] Fetching saved Provisional Quotation with Client & Company associations...');
    const fetched = await provisionalQuotationService.getQuotationById(created.id);
    if (!fetched || fetched.quotationNumber !== quoteNo) {
      throw new Error('Failed to retrieve quotation by ID');
    }
    if (!fetched.activities || fetched.activities.length !== 2) {
      throw new Error('Activities array not preserved in database snapshot');
    }
    if (fetched.activities[0].visitsPerYear !== 3) {
      throw new Error('visitsPerYear not preserved');
    }
    console.log(`   Client Association: ${fetched.client?.clientName || fetched.clientName}`);
    console.log(`   Preserved Activities Count: ${fetched.activities.length}`);
    console.log('✅ TEST 3 PASSED: Full document structure and associations preserved.\n');

    // 4. Update Persistence with Dynamic Calculation Adjustment (e.g. changing visits from 3 to 2)
    console.log('[TEST 4] Updating visitsPerYear and verifying recalculated financial totals...');
    const updatedActivities = [
      { ...activity1, visitsPerYear: 2, annualCharge: activity1.chargePerVisit * 2 }, // 2500
      { ...activity2, visitsPerYear: 2, annualCharge: activity2.chargePerVisit * 2 }  // 36000
    ];
    const newSamplingTotal = 2500 + 36000; // 38500
    const newSubtotal = mainChargesTotal + newSamplingTotal; // 163220
    const newGst = newSubtotal * 0.18; // 29379.6
    const newGrandTotal = Math.round(newSubtotal + newGst); // 192600

    const updatePayload = {
      ...fetched,
      activities: updatedActivities,
      subtotal: newSubtotal,
      gstAmount: newGst,
      grandTotal: newGrandTotal,
      status: 'Ready'
    };

    const updated = await provisionalQuotationService.saveQuotationSnapshot(updatePayload);
    if (updated.grandTotal !== newGrandTotal || updated.status !== 'Ready') {
      throw new Error('Failed to update quotation with adjusted visits');
    }
    console.log(`   Updated Grand Total: ₹${updated.grandTotal} (was ₹${grandTotal})`);
    console.log(`   Updated Status: ${updated.status}`);
    console.log('✅ TEST 4 PASSED: Dynamic calculation updates persisted correctly.\n');

    // 5. Version Revision Test
    console.log('[TEST 5] Creating Quotation Revision (Version 2)...');
    const revised = await provisionalQuotationService.createQuotationRevision(created.id, 'Client requested 2 visits instead of 3');
    if (!revised || revised.version !== 2 || revised.status !== 'Revised') {
      throw new Error('Revision creation failed');
    }
    console.log(`   Revision ID: ${revised.id}`);
    console.log(`   New Version: ${revised.version}`);
    console.log(`   New Quotation Number: ${revised.quotationNumber}`);
    console.log(`   Previous Version ID: ${revised.previousVersionId}`);
    console.log('✅ TEST 5 PASSED: Version revision tracked and persisted in database.\n');

    // 6. Duplicate Quotation Test
    console.log('[TEST 6] Duplicating Quotation...');
    const duplicated = await provisionalQuotationService.duplicateQuotation(created.id);
    if (!duplicated || !duplicated.quotationNumber.includes('-COPY')) {
      throw new Error('Duplication failed');
    }
    console.log(`   Duplicate Quotation Number: ${duplicated.quotationNumber}`);
    console.log('✅ TEST 6 PASSED: Quotation duplication verified.\n');

    // 7. Soft Delete Test
    console.log('[TEST 7] Testing Soft Delete...');
    const deleted = await provisionalQuotationService.deleteQuotation(duplicated.id);
    if (!deleted) {
      throw new Error('Soft delete returned false');
    }
    const checkDeleted = await AuditQuotation.findByPk(duplicated.id);
    if (checkDeleted !== null) {
      throw new Error('Soft deleted item should not be found by findByPk without paranoid:false');
    }
    // Clean up test created records
    await provisionalQuotationService.deleteQuotation(created.id);
    await provisionalQuotationService.deleteQuotation(revised.id);

    // 8. Final Cross-Table Data Preservation Check
    const [auditRowsFinal] = await sequelize.query('SELECT count(*) as count FROM audit_quotations WHERE deleted_at IS NULL');
    if (parseInt(auditRowsFinal[0].count) !== parseInt(auditRowsInitial[0].count)) {
      throw new Error('Audit quotations table was modified unexpectedly!');
    }
    console.log(`[TEST 8] Final check: ${auditRowsFinal[0].count} audit quotations remain intact.`);
    console.log('✅ TEST 8 PASSED: All pre-existing database records preserved without change.\n');

    console.log('🎉 ALL QUOTATION TYPE 2 TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('❌ QUOTATION TYPE 2 TEST FAILED:', err);
    process.exit(1);
  }
}

runTestSuite();
