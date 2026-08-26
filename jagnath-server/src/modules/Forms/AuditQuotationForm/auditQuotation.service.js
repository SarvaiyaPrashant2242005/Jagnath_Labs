/**
 * @file auditQuotation.service.js
 * @description Service layer for Audit Quotation business logic.
 */

const AuditQuotation = require("./auditQuotation.model");
const TestRequest = require("../TestRequestForm/testRequest.model");
const Client = require("../../Masters/ClientMasters/client.model");
const Company = require("../../Masters/CompanyMasters/company.model");

// Standard defaults constants
const DEFAULT_INTRO_TEXT = `With the reference to above subject we are herewith sending our offer.

JLTs - A state of art laboratory facility and an independent company offering high quality technical services in the chemical and biological sciences. Services are provided in the disciplines of environmental consulting, Water and Waste water treatment, field sampling and environmental monitoring. The firm is a privately held corporation and is not a subsidiary of another company. With adequate expertise, trained man power and dedicated team work, its product is accurate and timely technical information provided confidentially at a reasonable cost.

Also It is our proud privilege to inform you that--

We are accredited by NABL ; ISO17025:2017 and also recognized by Gujarat Pollution Control Board, Government of Gujarat - Gandhinagar, along with the recognition as Schedule - II Environmental Auditors wide letter no. GPCB/EAC/SCH-II/124/852220 under the Honorable High Court; Gujarat orders.`;

const DEFAULT_SCOPE_TEXT = `• Method of collection and analysis must be approved / recognized by GPCB / CPCB / MoEF&CC.
• Collection of sample and preservation of sample be made as per GPCB/CPCB or IS/APHA guidelines.
• Mode of Transportation for instruments and Dearness Allowance for Audit Officers to your Unit.
• If any one of above is provided by you to the auditors, which are arranged by you then charges for same as mentioned below is not to be considered.
• For the audit fee, Rs. 15,000/- for small scale, Rs. 20,000/- for medium scale and Rs. 25,000/- for large scale shall be considered.
• Final Quote is to be submitted at a time after our first visit to your UNIT, Below Quote is just a Provisional Estimated Quote that is made as per your units Consent by GPCB.`;

const DEFAULT_TERMS_TEXT = `1. The unit shall supply all the data as and when required by Environment Auditor.
2. The sample collection will be made in each visit.
3. During our visit to your site, our vehicle shall be allowed in your premises and one skilled male labour to be provided by you for our assistance.
4. Charges for sampling & analysis of various samples including water, wastewater, air, stack, hazardous waste, solid waste & noise level etc. will be paid extra as actual as per GPCB guidelines after completion of each visit work.
5. Payment shall be made as per the actual works completed after each visit.
6. The payments should be made by RTGS/NEFT drawn in favours of "JAGNATH LAB TECHNOLOGIES" payable at GONDAL. (Refer - As docs submitted by our side (JLTs) at a time of vendor Registration)
7. 100% payment in advance (Including 18% GST) or 50% of the payments + Applicable GST 18% at the time of awarding the job is to be given, balance of the payment remaining from your side is to be submitted after our draft report procedure BUT BEFORE the final (FAR) report submission.
8. Our Environment Audit Team members are highly qualified. They are of professional degree holder and class -1 cadre so, they deserve "A" Grade residential, travelling and other hospitality.
9. For any late payment charges penalty is to be raised at 24% of invoice. (Payment Terms - 30 Days)
10. Dearness Allowance is to be provided by your unit.`;

const DEFAULT_CHARGES = [
  { srNo: 1, description: "Environment audit report charges (As per GPCB Guidelines)", qty: 1, unit: "No.", rate: 25000, amount: 25000 },
  { srNo: 2, description: "Transportation charges for monitoring instrument/material for six days. (3 visits per year (3 X 3 Days/Visit))", qty: 3, unit: "Visit", rate: 15000, amount: 45000 },
  { srNo: 3, description: "Dearness allowance for audit team members. (4 persons per day X 9 days per year). (520 rate per person per day)", qty: 3, unit: "Visit", rate: 6240, amount: 18720 },
  { srNo: 4, description: "Accommodation For Auditors (4 persons per day X 9 days per year). (Stay in Hotel as 3000/- x 2 Rooms per day = 6000*2Nights i.e. 12000 Per Visit)", qty: 3, unit: "Visit", rate: 12000, amount: 36000 },
  { srNo: 5, description: "Charges for sampling & analysis of various samples including Water, Wastewater, Stack Emission, and Ambient air quality, Solid waste & Noise level etc. (See Annexure A)", qty: 1, unit: "L.S.", rate: 629490, amount: 629490 }
];

const DEFAULT_ANNEXURE = [
  // 1. Effluent Water Analysis (Inlet)
  { category: "1. Effluent Water Analysis (Inlet)", description: "Sample Preparation Charges to send fri", ratePerSample: 700, samplePerVisit: 1, chargesPerVisit: 700, total: 2100 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Temperature", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Colour (pt.co.scale)", ratePerSample: 175, samplePerVisit: 1, chargesPerVisit: 175, total: 525 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Oil And Grease", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "COD", ratePerSample: 420, samplePerVisit: 1, chargesPerVisit: 420, total: 1260 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "BOD (3 days at 27 C)", ratePerSample: 560, samplePerVisit: 1, chargesPerVisit: 560, total: 1680 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Chloride", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Sulphate", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Total Dissolved Solids", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },

  // 2. Treatment plant stage wise sampling
  { category: "2. Treatment plant stage wise sampling", description: "pH", ratePerSample: 110, samplePerVisit: 4, chargesPerVisit: 440, total: 1320 },
  { category: "2. Treatment plant stage wise sampling", description: "TSS", ratePerSample: 180, samplePerVisit: 4, chargesPerVisit: 720, total: 2160 },
  { category: "2. Treatment plant stage wise sampling", description: "TDS", ratePerSample: 270, samplePerVisit: 4, chargesPerVisit: 1080, total: 3240 },
  { category: "2. Treatment plant stage wise sampling", description: "COD", ratePerSample: 420, samplePerVisit: 4, chargesPerVisit: 1680, total: 5040 },
  { category: "2. Treatment plant stage wise sampling", description: "BOD", ratePerSample: 560, samplePerVisit: 4, chargesPerVisit: 2240, total: 6720 },
  { category: "2. Treatment plant stage wise sampling", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },

  // 3. Effluent Water Analysis (Outlet)
  { category: "3. Effluent Water Analysis (Outlet)", description: "A. Integrated Sample Collection Charges (For Physical & Chemical Parameters)", ratePerSample: 1500, samplePerVisit: 1, chargesPerVisit: 1500, total: 4500 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Temperature", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Colour (pt.co.scale)", ratePerSample: 175, samplePerVisit: 1, chargesPerVisit: 175, total: 525 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Oil And Grease", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Phenolic Compound", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Ammonical Nitrogen", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "BOD (3days at 27 C)", ratePerSample: 560, samplePerVisit: 1, chargesPerVisit: 560, total: 1680 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "COD", ratePerSample: 420, samplePerVisit: 1, chargesPerVisit: 420, total: 1260 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Chlorides", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sulphates", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Total dissolved solids", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sodium Absorption Ratio", ratePerSample: 1850, samplePerVisit: 1, chargesPerVisit: 1850, total: 5550 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Percent Sodium", ratePerSample: 1850, samplePerVisit: 1, chargesPerVisit: 1850, total: 5550 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sulphides", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },

  // 3-B. STP Water Analysis
  { category: "3-B. STP Water Analysis", description: "BOD", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "3-B. STP Water Analysis", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3-B. STP Water Analysis", description: "Fecal Coliform", ratePerSample: 700, samplePerVisit: 1, chargesPerVisit: 700, total: 2100 },
  { category: "3-B. STP Water Analysis", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3-B. STP Water Analysis", description: "TSS", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3-B. STP Water Analysis", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },

  // 4. Ambient Air Quality Monitoring (24 hrs)
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Sampling 24 hrs", ratePerSample: 11500, samplePerVisit: 1, chargesPerVisit: 11500, total: 34500 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for SO2", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for NOx", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for PM 10", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for PM 2.5", ratePerSample: 1800, samplePerVisit: 1, chargesPerVisit: 1800, total: 5400 },

  // 5. Stack Emission Monitoring
  { category: "5. Stack Emission Monitoring", description: "Sampling/ Measurements charges for stack", ratePerSample: 9600, samplePerVisit: 1, chargesPerVisit: 9600, total: 28800 },
  { category: "5. Stack Emission Monitoring", description: "Sampling of SO2/NOx", ratePerSample: 3500, samplePerVisit: 1, chargesPerVisit: 3500, total: 10500 },
  { category: "5. Stack Emission Monitoring", description: "Analysis SPM", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "5. Stack Emission Monitoring", description: "Analysis of SO2", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "5. Stack Emission Monitoring", description: "Analysis of NOx", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },

  // 6. Process Stack Emission
  { category: "6. Process Stack Emission", description: "Sampling/ Measurements charges for stack", ratePerSample: 9600, samplePerVisit: 1, chargesPerVisit: 9600, total: 28800 },
  { category: "6. Process Stack Emission", description: "Analysis SPM", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },

  // 7. Noise
  { category: "7. Noise", description: "For 08 Hours continuous monitoring", ratePerSample: 18000, samplePerVisit: 1, chargesPerVisit: 18000, total: 54000 }
];

/**
 * Get or initialize Audit Quotation by TestRequest ID.
 */
const getOrInitializeQuotation = async (testRequestId) => {
  const existing = await AuditQuotation.findOne({
    where: { testRequestId },
    include: [
      { model: Client, as: "client" },
      { model: Company, as: "company" }
    ]
  });

  if (existing) {
    return existing;
  }

  // If not found, fetch associated TestRequest to populate client and defaults
  const tr = await TestRequest.findByPk(testRequestId, {
    include: [
      { model: Client, as: "client" },
      { model: Company, as: "company" }
    ]
  });

  if (!tr) {
    throw new Error("Test Request not found.");
  }

  // Pre-fill fields from client master plant address if available
  const client = tr.client || {};
  const company = tr.company || {};
  const plantAddress = client.plantAddress || client.address || "";
  const clientName = client.clientName || "";
  
  // Format standard dynamic subject
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const finYear = `YEAR ${currentYear}-${nextYearShort}`;
  const subject = `PROVISIONAL ESTIMATED QUOTATION FOR CARRYING OUT ENVIRONMENTAL AUDIT OF YOUR UNIT [PCBID- ] FOR ${finYear}.`;

  // Autogenerate a next quotation ref no.
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const yy = String(new Date().getFullYear()).slice(-2);
  const count = await AuditQuotation.count({ where: { companyId: tr.companyId } });
  const quotationNumber = `Q-P.I :- JLT/EAC/${mm}${yy}/AH${String(count + 111).padStart(3, '0')}`;

  const defaultQuotation = {
    testRequestId: tr.id,
    companyId: tr.companyId,
    clientId: tr.clientId,
    quotationNumber,
    quotationDate: formatDate(new Date()),
    revisedDate: "",
    financialYear: finYear,
    reference: "GPCB - ENVIRONMENT AUDIT CELL (As per order of Hon'ble High Court of Gujarat)",
    subject,
    introText: DEFAULT_INTRO_TEXT,
    accreditationText: "",
    scopeText: DEFAULT_SCOPE_TEXT,
    termsText: DEFAULT_TERMS_TEXT,
    charges: DEFAULT_CHARGES,
    annexure: DEFAULT_ANNEXURE,
    contactPerson: "Ankit Mistry (+91 72260-57978)",
    signatoryName: "Purvin Raiyani",
    signatoryDesignation: "Proprietor",
    status: "Active"
  };

  const created = await AuditQuotation.create(defaultQuotation);
  return await AuditQuotation.findByPk(created.id, {
    include: [
      { model: Client, as: "client" },
      { model: Company, as: "company" }
    ]
  });
};

const formatDate = (date) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/**
 * Save / Update an existing Audit Quotation.
 */
const updateQuotation = async (id, data) => {
  const quotation = await AuditQuotation.findByPk(id);
  if (!quotation) {
    throw new Error("Audit Quotation not found.");
  }
  return await quotation.update(data);
};

module.exports = {
  getOrInitializeQuotation,
  updateQuotation
};
