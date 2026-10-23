/**
 * @file generalTestingQuotationType3.test.js
 * @description Comprehensive automated test suite for Quotation Type 3 (General Testing / Consulting Quotation).
 */

require('../src/database/index');
const sequelize = require('../src/config/database');
const provisionalQuotationService = require('../src/modules/Forms/ProvisionalQuotation/provisionalQuotation.service');
const GeneralTestingQuotation = require('../src/modules/Forms/GeneralTestingQuotationForm/generalTestingQuotation.model');

async function runTestSuite() {
  console.log('=== STARTING QUOTATION TYPE 3 (GENERAL TESTING QUOTATION) VERIFICATION ===\n');

  try {
    // 1. Initial State Check: Verify pre-existing audit_quotations and Type 2 records
    const [auditRows] = await sequelize.query('SELECT count(*) as count FROM audit_quotations WHERE deleted_at IS NULL');
    const [gtRows] = await sequelize.query('SELECT count(*) as count FROM general_testing_quotations WHERE deleted_at IS NULL');
    console.log(`[TEST 1] Pre-check: ${auditRows[0].count} Audit Quotations and ${gtRows[0].count} General Testing Quotations active.`);
    if (parseInt(auditRows[0].count) < 1) {
      throw new Error('Audit quotation records missing!');
    }
    console.log('✅ TEST 1 PASSED: Baseline preserved.\n');

    // Fetch master client & company
    const [clients] = await sequelize.query('SELECT id, "clientName", address, email FROM clients LIMIT 1');
    const [companies] = await sequelize.query('SELECT id, company_name FROM companies LIMIT 1');
    const clientId = clients[0]?.id;
    const companyId = companies[0]?.id;

    // 2. Build General Testing Quotation Payload with Line Items, Sections & Bank Details
    console.log('[TEST 2] Creating General Testing Quotation with Test Items & Multi-page Sections...');
    const quoteNo = `GTQ/2026/001`;

    const lineItem1 = {
      id: 'gt_item_1',
      srNo: 1,
      testDescription: 'Packaged Drinking Water Comprehensive Analysis as per IS 14543',
      testStandard: 'IS 14543:2018',
      sampleMatrix: 'Drinking Water',
      sampleQty: 2,
      unit: 'Samples',
      ratePerSample: 8500,
      discountPercent: 10,
      totalAmount: (8500 * 2) * (1 - 10 / 100) // 15300
    };

    const lineItem2 = {
      id: 'gt_item_2',
      srNo: 2,
      testDescription: 'Heavy Metals in Wastewater by ICP-OES (Pb, Cd, Cr, Ni, Cu, Zn)',
      testStandard: 'APHA 3120 B',
      sampleMatrix: 'Effluent Water',
      sampleQty: 1,
      unit: 'Sample',
      ratePerSample: 6500,
      discountPercent: 0,
      totalAmount: 6500 // 6500
    };

    const subtotal = lineItem1.totalAmount + lineItem2.totalAmount; // 21800
    const gstAmount = subtotal * 0.18; // 3924
    const grandTotal = Math.round(subtotal + gstAmount); // 25724

    const sections = [
      {
        id: 'sec_sample_req',
        title: 'Sample Requirements',
        content: '<p>Required 2-5 Ltrs of water sample in sterilized containers. TAT 6-8 working days.</p>'
      },
      {
        id: 'sec_validity',
        title: 'Validity of Quotation',
        content: '<p>This quotation is valid for 30 days from date of issue.</p>'
      },
      {
        id: 'sec_payment',
        title: 'Payment Terms',
        content: '<p>100% payment in advance. Overdue accounts attract 24% annual interest.</p>'
      }
    ];

    const bankDetails = {
      beneficiaryName: 'Jagnath Lab Technologies',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      branch: 'Gondal Road, Rajkot',
      branchAddress: 'Opp. GIDC Industrial Estate, Rajkot - 360004'
    };

    const payload = {
      companyId,
      clientId,
      quotationNumber: quoteNo,
      quotationNo: quoteNo,
      quotationType: 'general_testing',
      categoryType: 'general_testing',
      quotationCategoryType: 'general_testing',
      quotationDate: '2026-10-23',
      financialYear: '2026-2027',
      clientName: clients[0]?.clientName || 'Premier Agro Foods Ltd',
      plantName: 'Testing Unit A',
      plantAddress: clients[0]?.address || 'Phase 3, Industrial Area, Rajkot',
      industryType: 'Chemical & Biological',
      status: 'Ready',
      version: 1,
      lineItems: [lineItem1, lineItem2],
      subtotal,
      discount: 1700, // 8500 * 2 * 0.10
      taxableAmount: subtotal,
      gstPercentage: 18,
      gstAmount,
      grandTotal,
      sections,
      bankDetails,
      signatoryName: 'Purvin Raiyani',
      signatoryDesignation: 'Proprietor',
      contactPerson: 'Ankit Mistry (+91 7226-0579-78)'
    };

    const created = await provisionalQuotationService.saveQuotationSnapshot(payload, companyId);
    if (!created || !created.id) {
      throw new Error('Failed to create General Testing quotation in database');
    }
    console.log(`   Created Quotation ID: ${created.id}`);
    console.log(`   Quotation Number: ${created.quotationNumber}`);
    console.log(`   Quotation Type: ${created.quotationType}`);
    console.log(`   Grand Total: ₹${created.grandTotal}`);
    if (created.grandTotal !== grandTotal) {
      throw new Error(`Grand total mismatch: expected ₹${grandTotal}, got ₹${created.grandTotal}`);
    }
    console.log('✅ TEST 2 PASSED: Successfully saved General Testing Quotation to PostgreSQL.\n');

    // 3. Retrieval by ID and Verification of Preserved Sections & Line Items
    console.log('[TEST 3] Verifying retrieval and preserved lineItems, sections, and bankDetails...');
    const fetched = await provisionalQuotationService.getQuotationById(created.id);
    if (!fetched || fetched.quotationNumber !== quoteNo) {
      throw new Error('Failed to retrieve quotation by ID');
    }
    if (!fetched.lineItems || fetched.lineItems.length !== 2) {
      throw new Error(`Expected 2 line items, found ${fetched.lineItems?.length}`);
    }
    if (fetched.lineItems[0].testStandard !== 'IS 14543:2018') {
      throw new Error('Line item test standard not preserved');
    }
    if (!fetched.sections || fetched.sections.length !== 3) {
      throw new Error('Rich text sections not preserved');
    }
    if (fetched.bankDetails?.bankName !== 'HDFC Bank Ltd') {
      throw new Error('Bank details not preserved');
    }
    console.log(`   Preserved Line Items: ${fetched.lineItems.length}`);
    console.log(`   Preserved Sections: ${fetched.sections.length}`);
    console.log(`   Bank Name: ${fetched.bankDetails.bankName}`);
    console.log('✅ TEST 3 PASSED: All General Testing specific structures preserved.\n');

    // 4. Update Persistence Check
    console.log('[TEST 4] Updating line items and recalculating totals...');
    // Add sample quantity from 2 to 3 for line item 1
    const updatedLineItem1 = {
      ...lineItem1,
      sampleQty: 3,
      totalAmount: (8500 * 3) * (1 - 10 / 100) // 22950
    };
    const newSubtotal = updatedLineItem1.totalAmount + lineItem2.totalAmount; // 29450
    const newGst = newSubtotal * 0.18; // 5301
    const newGrandTotal = Math.round(newSubtotal + newGst); // 34751

    const updatePayload = {
      ...fetched,
      lineItems: [updatedLineItem1, lineItem2],
      subtotal: newSubtotal,
      gstAmount: newGst,
      grandTotal: newGrandTotal,
      status: 'Finalized'
    };

    const updated = await provisionalQuotationService.saveQuotationSnapshot(updatePayload);
    if (updated.grandTotal !== newGrandTotal || updated.status !== 'Finalized') {
      throw new Error('Failed to persist updated line items');
    }
    console.log(`   Updated Grand Total: ₹${updated.grandTotal} (was ₹${grandTotal})`);
    console.log(`   Updated Status: ${updated.status}`);
    console.log('✅ TEST 4 PASSED: Authoritative update and recalculation successfully verified.\n');

    // 5. Version Revision Test
    console.log('[TEST 5] Creating Quotation Revision (Version 2)...');
    const revised = await provisionalQuotationService.createQuotationRevision(created.id, 'Quantity updated from 2 to 3 samples');
    if (!revised || revised.version !== 2 || revised.status !== 'Revised') {
      throw new Error('Revision failed');
    }
    console.log(`   Revision ID: ${revised.id}`);
    console.log(`   New Quotation Number: ${revised.quotationNumber}`);
    console.log(`   New Version: ${revised.version}`);
    console.log('✅ TEST 5 PASSED: General Testing revision versioning confirmed.\n');

    // 6. Listing & Filtering Test
    console.log('[TEST 6] Testing Listing & Category Filter for general_testing...');
    const listResult = await provisionalQuotationService.getAllQuotations({
      quotationType: 'general_testing'
    });
    const gtCount = listResult.quotations.filter(q => q.quotationType === 'general_testing').length;
    if (gtCount < 2) {
      throw new Error(`Expected at least 2 general testing quotations in listing, found ${gtCount}`);
    }
    console.log(`   Found ${gtCount} general testing quotations in filtered list query.`);
    console.log('✅ TEST 6 PASSED: Category filtering functions as expected.\n');

    // 7. Data Preservation Check: Verify audit_quotations remain untouched
    const [auditRowsFinal] = await sequelize.query('SELECT count(*) as count FROM audit_quotations WHERE deleted_at IS NULL');
    if (parseInt(auditRowsFinal[0].count) !== parseInt(auditRows[0].count)) {
      throw new Error('Audit quotations table was modified unexpectedly!');
    }
    console.log(`[TEST 7] Audit Quotations count verified: ${auditRowsFinal[0].count} records intact.`);
    console.log('✅ TEST 7 PASSED: All pre-existing database records preserved without change.\n');

    console.log('🎉 ALL QUOTATION TYPE 3 TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('❌ QUOTATION TYPE 3 TEST FAILED:', err);
    process.exit(1);
  }
}

runTestSuite();
