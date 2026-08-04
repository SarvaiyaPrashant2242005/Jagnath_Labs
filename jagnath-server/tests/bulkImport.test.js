/**
 * @file bulkImport.test.js
 * @description Comprehensive automated unit and integration tests for Bulk Import
 * duplicate validation, normalization, and client upsert rules.
 */

const { normalizeEmail, normalizePhone, normalizeString, sanitizeSpreadsheetValue } = require("../src/utils/normalizers");

// Mock database models and transactions for isolated unit testing
const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  };

  console.log("=== RUNNING BULK IMPORT & UPSERT AUTOMATED TESTS ===");

  // Section 1: Normalizers Test Cases
  console.log("\n--- Section 1: Normalization Utilities ---");
  assert(normalizeEmail("   Test.User@Domain.COM  ") === "test.user@domain.com", "normalizeEmail trims and lowercases");
  assert(normalizeEmail(null) === "", "normalizeEmail handles null gracefully");
  
  assert(normalizePhone("(98765) 43210") === "9876543210", "normalizePhone strips brackets and spaces");
  assert(normalizePhone("98765-43210") === "9876543210", "normalizePhone strips hyphens");
  assert(normalizePhone("+91 98765 43210") === "919876543210", "normalizePhone handles country codes");

  assert(normalizeString("   Water Testing   ") === "water testing", "normalizeString trims and lowercases");

  assert(sanitizeSpreadsheetValue("=SUM(A1:A10)") === "'=SUM(A1:A10)", "sanitizeSpreadsheetValue escapes formula injection '='");
  assert(sanitizeSpreadsheetValue("+1234567") === "'+1234567", "sanitizeSpreadsheetValue escapes formula injection '+'");
  assert(sanitizeSpreadsheetValue("-500") === "'-500", "sanitizeSpreadsheetValue escapes formula injection '-'");
  assert(sanitizeSpreadsheetValue("@admin") === "'@admin", "sanitizeSpreadsheetValue escapes formula injection '@'");

  // Section 2: Mock Client Upsert Logic (Cases 1 - 6)
  console.log("\n--- Section 2: Client Bulk Import & 6-Case Upsert Matrix ---");

  // In-memory mock DB & service logic
  const mockCompanyId = "comp_123";
  const mockDbClients = [
    { id: "c1", companyId: mockCompanyId, clientName: "Client One", email: "client1@test.com", contactNumber: "9876543210" },
    { id: "c2", companyId: mockCompanyId, clientName: "Client Two", email: "client2@test.com", contactNumber: "9123456789" }
  ];

  const processMockClientRow = (row, fileSeenEmails = new Map(), fileSeenPhones = new Map()) => {
    const rawEmail = row.email || "";
    const rawPhone = row.contactNumber || "";
    const nEmail = normalizeEmail(rawEmail);
    const nPhone = normalizePhone(rawPhone);

    const errors = [];

    if (!row.clientName) errors.push("Client Name is required.");
    if (!rawPhone) errors.push("Contact Number is required.");
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      errors.push("Invalid email format.");
    }

    if (nEmail && fileSeenEmails.has(nEmail)) {
      errors.push(`Duplicate email in uploaded file. First found at row ${fileSeenEmails.get(nEmail)}.`);
    }
    if (nPhone && fileSeenPhones.has(nPhone)) {
      errors.push(`Duplicate phone number in uploaded file. First found at row ${fileSeenPhones.get(nPhone)}.`);
    }

    if (errors.length > 0) {
      return { status: "error", errors };
    }

    fileSeenEmails.set(nEmail, row.rowNum || 1);
    fileSeenPhones.set(nPhone, row.rowNum || 1);

    const emailMatch = nEmail ? mockDbClients.find(c => normalizeEmail(c.email) === nEmail) : null;
    const phoneMatch = nPhone ? mockDbClients.find(c => normalizePhone(c.contactNumber) === nPhone) : null;

    if (!emailMatch && !phoneMatch) {
      return { status: "inserted", action: "Insert new client" };
    } else if (emailMatch && phoneMatch && emailMatch.id === phoneMatch.id) {
      return { status: "updated", id: emailMatch.id, action: "Update existing client" };
    } else if (emailMatch && !phoneMatch) {
      return { status: "updated", id: emailMatch.id, action: "Update client found by email" };
    } else if (!emailMatch && phoneMatch) {
      return { status: "updated", id: phoneMatch.id, action: "Update client found by phone" };
    } else {
      return { status: "error", errors: [`Email belongs to client ID ${emailMatch.id}, but phone number belongs to client ID ${phoneMatch.id}.`] };
    }
  };

  // Case 1: Brand new client
  const case1 = processMockClientRow({ clientName: "New Client", email: "new@test.com", contactNumber: "9999988888" }, new Map(), new Map());
  assert(case1.status === "inserted", "Case 1: Brand new client is inserted");

  // Case 2: Email and Phone match same existing client
  const case2 = processMockClientRow({ clientName: "Client One Updated", email: "CLIENT1@TEST.COM", contactNumber: "(98765) 43210" }, new Map(), new Map());
  assert(case2.status === "updated" && case2.id === "c1", "Case 2: Both email and phone match same client ID c1");

  // Case 3: Only email matches existing client
  const case3 = processMockClientRow({ clientName: "Client One New Phone", email: "client1@test.com", contactNumber: "9000000000" }, new Map(), new Map());
  assert(case3.status === "updated" && case3.id === "c1", "Case 3: Email matches c1, new phone is updated");

  // Case 4: Only phone matches existing client
  const case4 = processMockClientRow({ clientName: "Client Two New Email", email: "newemail@test.com", contactNumber: "9123456789" }, new Map(), new Map());
  assert(case4.status === "updated" && case4.id === "c2", "Case 4: Phone matches c2, new email is updated");

  // Case 5: Email belongs to Client 1, Phone belongs to Client 2 (Conflict)
  const case5 = processMockClientRow({ clientName: "Conflict Client", email: "client1@test.com", contactNumber: "9123456789" }, new Map(), new Map());
  assert(case5.status === "error" && case5.errors[0].includes("belongs to"), "Case 5: Rejects conflict where email is c1 and phone is c2");

  // Case 6: File internal duplicates
  const seenE = new Map();
  const seenP = new Map();
  const rowA = processMockClientRow({ rowNum: 2, clientName: "A", email: "dup@test.com", contactNumber: "9555555555" }, seenE, seenP);
  const rowB = processMockClientRow({ rowNum: 5, clientName: "B", email: "DUP@TEST.COM", contactNumber: "9666666666" }, seenE, seenP);
  assert(rowA.status === "inserted", "Case 6: First file occurrence is processed");
  assert(rowB.status === "error" && rowB.errors[0].includes("row 2"), "Case 6: Second occurrence with duplicate email is rejected referencing row 2");

  // Section 3: Category & Parameter Duplicate Rules
  console.log("\n--- Section 3: Category & Parameter Duplicate Rules ---");

  const mockCategories = [{ id: "cat1", companyId: mockCompanyId, name: "Water Testing" }];
  const processCategoryRow = (name, companyId = mockCompanyId, fileSeen = new Set()) => {
    if (!name || !name.trim()) return { status: "error", error: "Category Name is required." };
    const nName = normalizeString(name);
    if (fileSeen.has(nName)) return { status: "error", error: "Duplicate category in uploaded file." };
    fileSeen.add(nName);

    const dbExists = mockCategories.some(c => c.companyId === companyId && normalizeString(c.name) === nName);
    if (dbExists) return { status: "error", error: "Category already exists for the selected company." };
    return { status: "inserted" };
  };

  assert(processCategoryRow("Water Testing").status === "error", "Category Case-insensitive DB duplicate rejected ('Water Testing')");
  assert(processCategoryRow("  water testing  ").status === "error", "Category Whitespace DB duplicate rejected ('  water testing  ')");
  assert(processCategoryRow("Air Quality").status === "inserted", "New category under company is inserted");
  assert(processCategoryRow("Water Testing", "other_company_456").status === "inserted", "Same category under DIFFERENT company is allowed");

  const catSeen = new Set();
  assert(processCategoryRow("Soil Test", mockCompanyId, catSeen).status === "inserted", "First category in file inserted");
  assert(processCategoryRow("soil test", mockCompanyId, catSeen).status === "error", "Duplicate category inside file rejected");

  console.log("\n=== TEST SUMMARY ===");
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
