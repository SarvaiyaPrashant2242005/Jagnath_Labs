/**
 * @file provisionalQuotationStorage.service.js
 * @description Frontend service for Provisional Estimated Quotations.
 * Interacts with real existing APIs for Master data (Clients, Parameters, Users, Company)
 * and manages local snapshot persistence, versions, and drafts in localStorage.
 */

import { apiService } from '../../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  PARAMETER_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  SUB_CATEGORY_ENDPOINTS,
  PRICE_MASTER_ENDPOINTS,
  USER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
} from '../../../../shared/services/apiEndpoints';
import { generateQuotationNumber } from '../utils/quotationCalculation.utils';

const STORAGE_KEY = 'jagnath_provisional_quotations';

export const DEFAULT_INTRO_TEXT = `With reference to above subject, we are herewith sending our offer.

JLTs - A state of art laboratory facility and an independent company offering high quality technical services in the chemical and biological sciences. Services are provided in the disciplines of environmental consulting, Water and Waste water treatment, field sampling and environmental monitoring. The firm is a privately held corporation and is not a subsidiary of another company. With adequate expertise, trained manpower and dedicated teamwork, its product is accurate and timely technical information provided confidentially at a reasonable cost.

Also It is our proud privilege to inform you that--

We are accredited by NABL ; ISO17025:2017 and also recognized by Gujarat Pollution Control Board, Government of Gujarat - Gandhinagar, along with the recognition as Schedule - II Environmental Auditors wide letter no. GPCB/EAC/SCH-II/124/852220 under the Honorable High Court; Gujarat orders.`;

export const DEFAULT_SCOPE_ITEMS = [
  'Method of collection and analysis must be approved / recognized by GPCB / CPCB / MoEF&CC.',
  'Collection of sample and preservation of sample be made as per GPCB/CPCB or IS/APHA guidelines.',
  'Mode of Transportation for instruments and Dearness Allowance for Audit Officers to your Unit.',
  'If any one of above is provided by you to the auditors, which are arranged by you then charges for same as mentioned below is not to be considered.',
  'For the audit fee, Rs. 15,000/- for small scale, Rs. 20,000/- for medium scale and Rs. 25,000/- for large scale shall be considered.',
  'Final Quote is to be submitted at a time after our first visit to your UNIT. Below Quote is just a Provisional Estimated Quote that is made as per your unit\'s Consent by GPCB.'
];

export const DEFAULT_TERMS_ITEMS = [
  'The unit shall supply all the data as and when required by Environment Auditor.',
  'The sample collection will be made in each visit.',
  'During our visit to your site, our vehicle shall be allowed in your premises and one skilled male labour to be provided by you for our assistance.',
  'Charges for sampling & analysis of various samples including water, wastewater, air, stack, hazardous waste, solid waste & noise level etc. will be paid extra as actual as per GPCB guidelines after completion of each visit work.',
  'Payment shall be made as per the actual works completed after each visit.',
  'The payments should be made by RTGS/NEFT drawn in favour of "JAGNATH LAB TECHNOLOGIES" payable at GONDAL.',
  '100% payment in advance (Including 18% GST) or 50% of the payments + Applicable GST 18% at the time of awarding the job is to be given, balance of the payment remaining from your side is to be submitted after our draft report procedure BUT BEFORE the final (FAR) report submission.',
  'Our Environment Audit Team members are highly qualified professional degree holders of Class-1 cadre, deserving "A" Grade residential, travelling and hospitality.',
  'For any late payment charges penalty is to be raised at 24% of invoice. (Payment Terms - 30 Days)',
  'Dearness Allowance is to be provided by your unit.'
];

export const DEFAULT_TERMS_TEXT = `<ol style="padding-left: 20px; margin-bottom: 12px; line-height: 1.5; font-size: 11px;">
  <li style="margin-bottom: 5px;"><strong>The unit shall supply all the data as and when required by Environment Auditor.</strong></li>
  <li style="margin-bottom: 5px;"><strong>The sample collection will be made in each visit.</strong></li>
  <li style="margin-bottom: 5px;"><strong>During our visit to your site, our vehicle shall be allowed in your premises and one skilled male labour to be provided by you for our assistance.</strong></li>
  <li style="margin-bottom: 5px;"><strong>Charges for sampling &amp; analysis of various samples including water, wastewater, air, stack, hazardous waste, solid waste &amp; noise level etc. will be paid extra as actual as per GPCB guidelines after completion of each visit work.</strong></li>
  <li style="margin-bottom: 5px;"><strong>Payment shall be made as per the actual works completed after each visit.</strong></li>
  <li style="margin-bottom: 5px;"><strong>The payments should be made by RTGS/NEFT drawn in favours of "JAGNATH LAB TECHNOLOGIES" payable at GONDAL. (Refer – As docs submitted by our side (JLTs) at a time of vendor Registration)</strong></li>
  <li style="margin-bottom: 5px;"><strong>100%payment in advance (Including 18% GST) or 50% of the payments + Applicable GST 18% at the time of awarding the job is to be given, balance of the payment remaining from your side is to be submitted after our draft report procedure BUT BEFORE the final (EAR) report submission.</strong></li>
  <li style="margin-bottom: 5px;"><strong>Our Environment Audit Team members are highly qualified. They are of professional degree holder and class -I cadre so, they deserve “A” Grade residential, travelling and other hospitality.</strong></li>
  <li style="margin-bottom: 5px;"><strong>For any late payment charges penalty is to be raised at 24% of invoice. (Payment Terms – 30 Days)</strong></li>
  <li style="margin-bottom: 5px;"><strong>Dearness Allowance is to be provided by your unit.</strong></li>
</ol>
<p style="font-size: 10.5px; margin-top: 14px; margin-bottom: 10px; line-height: 1.45; color: #1e293b;">(Note: - We have briefly studied all your scope of work and accordingly we are tied and committed to uphold highest standards of honesty &amp; integrity for accuracy to the work order.)</p>`;

export const DEFAULT_ANNEXURE_B_GROUPS = [
  {
    id: 'grp_1',
    srNo: '1',
    category: 'Effluent Water Analysis (Inlet)',
    parameters: [
      { id: 'p_1_1', description: 'Sample Preparation Charges to and fro', rate: 700 },
      { id: 'p_1_2', description: 'pH', rate: 110 },
      { id: 'p_1_3', description: 'Temperature', rate: 110 },
      { id: 'p_1_4', description: 'Colour (pt.co.scale)', rate: 175 },
      { id: 'p_1_5', description: 'Suspended Solids', rate: 180 },
      { id: 'p_1_6', description: 'Oil And Grease', rate: 350 },
      { id: 'p_1_7', description: 'Chloride', rate: 350 },
      { id: 'p_1_8', description: 'Sulphate', rate: 270 },
      { id: 'p_1_9', description: 'BOD (5 days at 20°C)', rate: 1050 },
      { id: 'p_1_10', description: 'COD', rate: 620 },
      { id: 'p_1_11', description: 'Grab Sampling', rate: 960 },
      { id: 'p_1_12', description: 'Total Dissolved Solids', rate: 180 },
    ]
  },
  {
    id: 'grp_2',
    srNo: '2',
    category: 'Treatment plant stage wise sampling',
    parameters: [
      { id: 'p_2_1', description: 'pH', rate: 110 },
      { id: 'p_2_2', description: 'TSS', rate: 180 },
      { id: 'p_2_3', description: 'TDS', rate: 180 },
      { id: 'p_2_4', description: 'COD', rate: 620 },
      { id: 'p_2_5', description: 'BOD', rate: 1050 },
      { id: 'p_2_6', description: 'Grab Sampling', rate: 960 },
    ]
  },
  {
    id: 'grp_3',
    srNo: '3',
    category: 'Effluent Water Analysis (outlet)',
    parameters: [
      { id: 'p_3_1', description: 'Integrated Sample Collection Charges (For Physical & Chemical Parameters)', rate: 1800 },
      { id: 'p_3_2', description: 'Grab Sampling', rate: 960 },
      { id: 'p_3_3', description: 'pH', rate: 110 },
      { id: 'p_3_4', description: 'Temperature', rate: 110 },
      { id: 'p_3_5', description: 'Colour (pt.co.scale)', rate: 175 },
      { id: 'p_3_6', description: 'Suspended Solids', rate: 180 },
      { id: 'p_3_7', description: 'Oil And Grease', rate: 350 },
      { id: 'p_3_8', description: 'Phenolic Compound', rate: 350 },
      { id: 'p_3_9', description: 'Ammonical Nitrogen', rate: 350 },
      { id: 'p_3_10', description: 'BOD (3days at 27°C)', rate: 1050 },
      { id: 'p_3_11', description: 'COD', rate: 620 },
      { id: 'p_3_12', description: 'Chlorides', rate: 180 },
      { id: 'p_3_13', description: 'Sulphates', rate: 270 },
      { id: 'p_3_14', description: 'Total dissolved solids', rate: 180 },
      { id: 'p_3_15', description: 'Sodium Absorption Ratio', rate: 1050 },
      { id: 'p_3_16', description: 'Percent Sodium', rate: 1050 },
      { id: 'p_3_17', description: 'Sulphides', rate: 350 },
    ]
  },
  {
    id: 'grp_3b',
    srNo: '3-B',
    category: 'STP Water Analysis',
    parameters: [
      { id: 'p_3b_1', description: 'BOD', rate: 1050 },
      { id: 'p_3b_2', description: 'Suspended Solids', rate: 110 },
      { id: 'p_3b_3', description: 'Fecal Coliform', rate: 700 },
      { id: 'p_3b_4', description: 'PH', rate: 110 },
      { id: 'p_3b_5', description: 'TSS', rate: 180 },
      { id: 'p_3b_6', description: 'Grab Sampling', rate: 960 },
    ]
  },
  {
    id: 'grp_4',
    srNo: '4',
    category: 'Ambient Air Quality Monitoring (24 hrs.)',
    parameters: [
      { id: 'p_4_1', description: 'Sampling 24 hrs', rate: 10500 },
      { id: 'p_4_2', description: 'Analysis for SO₂', rate: 1050 },
      { id: 'p_4_3', description: 'Analysis for NO₂', rate: 1050 },
      { id: 'p_4_4', description: 'Analysis for PM 10', rate: 1050 },
      { id: 'p_4_5', description: 'Analysis for PM 2.5', rate: 1800 },
    ]
  },
  {
    id: 'grp_5',
    srNo: '5',
    category: 'Stack Emission Monitoring',
    parameters: [
      { id: 'p_5_1', description: 'Sampling/ Measurements charges for stack', rate: 9600 },
      { id: 'p_5_2', description: 'Sampling of SO2/NOx', rate: 3500 },
      { id: 'p_5_3', description: 'Analysis SPM', rate: 1050 },
      { id: 'p_5_4', description: 'Analysis of SO2', rate: 1050 },
      { id: 'p_5_5', description: 'Analysis of NOx', rate: 1050 },
    ]
  },
  {
    id: 'grp_6',
    srNo: '6',
    category: 'Process Stack Emission',
    parameters: [
      { id: 'p_6_1', description: 'Sampling/ Measurements charges for stack', rate: 9600 },
      { id: 'p_6_2', description: 'Analysis SPM', rate: 1050 },
    ]
  },
  {
    id: 'grp_7',
    srNo: '7',
    category: 'Noise',
    parameters: [
      { id: 'p_7_1', description: 'For 08 Hours continuous monitoring', rate: 18000 },
    ]
  }
];

export const DEFAULT_ANNEXURE_A_ACTIVITIES = [
  {
    id: 'act_1',
    groupId: 'grp_1',
    srNo: '1',
    description: 'Effluent Water Analysis (Inlet)',
    parametersMonitored: 'As per annexure- B, Sr. No. 1',
    ratePerSample: 4785,
    visits: 3,
    sampleQuarter: '01 Sample',
    sampleQty: 1,
    chargePerVisit: 4785,
    isChargeOverridden: false,
  },
  {
    id: 'act_2',
    groupId: 'grp_2',
    srNo: '2',
    description: 'Treatment plant stage wise sampling',
    parametersMonitored: 'As per annexure- B, Sr. No. 2',
    ratePerSample: 3100,
    visits: 3,
    sampleQuarter: '01 Sample',
    sampleQty: 1,
    chargePerVisit: 3100,
    isChargeOverridden: false,
  },
  {
    id: 'act_3',
    groupId: 'grp_3',
    srNo: '3',
    description: 'Effluent Water Analysis (outlet)',
    parametersMonitored: 'As per annexure- B, Sr. No. 3',
    ratePerSample: 9135,
    visits: 3,
    sampleQuarter: '01 Sample',
    sampleQty: 9135,
    chargePerVisit: 9135,
    isChargeOverridden: false,
  },
  {
    id: 'act_4',
    groupId: 'grp_3b',
    srNo: '3-B',
    description: 'STP Water Analysis',
    parametersMonitored: 'As per annexure- B, Sr. No. 3-B',
    ratePerSample: 3110,
    visits: 3,
    sampleQuarter: '01 Sample',
    sampleQty: 1,
    chargePerVisit: 3110,
    isChargeOverridden: false,
  },
  {
    id: 'act_5',
    groupId: 'grp_4',
    srNo: '4',
    description: 'Ambient Air Quality Monitoring (24 hrs.)',
    parametersMonitored: 'As per annexure- B, Sr. No. 4',
    ratePerSample: 15450,
    visits: 3,
    sampleQuarter: '04 Locations',
    sampleQty: 4,
    chargePerVisit: 61800,
    isChargeOverridden: false,
  },
  {
    id: 'act_6',
    groupId: 'grp_5',
    srNo: '5',
    description: 'Stack Emission Monitoring',
    parametersMonitored: 'As per annexure- B, Sr. No. 5',
    ratePerSample: 16250,
    visits: 3,
    sampleQuarter: '5 Locations',
    sampleQty: 5,
    chargePerVisit: 81250,
    isChargeOverridden: false,
  },
  {
    id: 'act_7',
    groupId: 'grp_6',
    srNo: '6',
    description: 'Process Stack Emission',
    parametersMonitored: 'As per annexure- B, Sr. No. 6',
    ratePerSample: 10650,
    visits: 3,
    sampleQuarter: '1 Locations',
    sampleQty: 1,
    chargePerVisit: 10650,
    isChargeOverridden: false,
  },
  {
    id: 'act_8',
    groupId: 'grp_7',
    srNo: '7',
    description: 'Noise',
    parametersMonitored: 'As per annexure- B, Sr. No. 7',
    ratePerSample: 18000,
    visits: 3,
    sampleQuarter: '02 Locations',
    sampleQty: 2,
    chargePerVisit: 36000,
    isChargeOverridden: false,
  },
];


/**
 * Fetches real master data and test requests from existing backend APIs
 */
export const fetchMasterData = async () => {
  try {
    const [clientsRes, paramsRes, catsRes, subCatsRes, usersRes, compRes, priceRes, trRes] = await Promise.allSettled([
      apiService.get(CLIENT_ENDPOINTS.GET_ALL),
      apiService.get(PARAMETER_ENDPOINTS.GET_ALL),
      apiService.get(CATEGORY_ENDPOINTS.GET_ALL),
      apiService.get(SUB_CATEGORY_ENDPOINTS.GET_ALL),
      apiService.get(USER_ENDPOINTS.GET_ALL),
      apiService.get(COMPANY_ENDPOINTS.GET_MY),
      apiService.get(PRICE_MASTER_ENDPOINTS.GET_ALL),
      apiService.get(TEST_REQUEST_ENDPOINTS.GET_ALL),
    ]);

    const extractData = (res) => {
      if (res.status === 'fulfilled' && res.value?.data) {
        return Array.isArray(res.value.data) ? res.value.data : res.value.data.data || res.value.data.rows || [];
      }
      return [];
    };

    const extractSingle = (res) => {
      if (res.status === 'fulfilled' && res.value?.data) {
        return Array.isArray(res.value.data) ? res.value.data[0] || {} : res.value.data.data || res.value.data || {};
      }
      return {};
    };

    return {
      clients: extractData(clientsRes),
      parameters: extractData(paramsRes),
      categories: extractData(catsRes),
      subCategories: extractData(subCatsRes),
      users: extractData(usersRes),
      company: extractSingle(compRes),
      priceMasters: extractData(priceRes),
      testRequests: extractData(trRes),
    };
  } catch (err) {
    console.error('Error fetching master data:', err);
    return {
      clients: [],
      parameters: [],
      categories: [],
      subCategories: [],
      users: [],
      company: {},
      priceMasters: [],
      testRequests: [],
    };
  }
};

/**
 * Gets all saved provisional quotations from localStorage
 */
export const getSavedQuotations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading saved quotations:', err);
    return [];
  }
};

/**
 * Saves or updates a provisional quotation in localStorage (Snapshot integrity)
 */
export const saveQuotationSnapshot = (quotation) => {
  const all = getSavedQuotations();
  const existingIdx = all.findIndex(q => q.id === quotation.id);

  const timestamp = new Date().toISOString();
  const snapshotData = {
    ...JSON.parse(JSON.stringify(quotation)),
    updatedAt: timestamp,
  };

  if (!snapshotData.createdAt) {
    snapshotData.createdAt = timestamp;
  }

  if (existingIdx >= 0) {
    all[existingIdx] = snapshotData;
  } else {
    all.unshift(snapshotData);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return snapshotData;
};

/**
 * Gets a single provisional quotation by ID
 */
export const getQuotationById = (id) => {
  const all = getSavedQuotations();
  return all.find(q => q.id === id) || null;
};

/**
 * Deletes a provisional quotation
 */
export const deleteQuotation = (id) => {
  const all = getSavedQuotations();
  const filtered = all.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

/**
 * Creates a duplicate of an existing quotation
 */
export const duplicateQuotation = (id) => {
  const source = getQuotationById(id);
  if (!source) return null;

  const copy = JSON.parse(JSON.stringify(source));
  copy.id = 'pq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  copy.quotationNumber = `${source.quotationNumber || 'PQ'}-COPY`;
  copy.version = 1;
  copy.status = 'Draft';
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();

  return saveQuotationSnapshot(copy);
};

/**
 * Creates a new revision (e.g., Version 2) of a quotation
 */
export const createQuotationRevision = (id, changeSummary = 'Revision created') => {
  const source = getQuotationById(id);
  if (!source) return null;

  const currentVersion = parseInt(source.version, 10) || 1;
  const newVersion = currentVersion + 1;

  const revised = JSON.parse(JSON.stringify(source));
  revised.id = 'pq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  revised.previousVersionId = source.id;
  revised.version = newVersion;
  revised.quotationNumber = source.quotationNumber ? `${source.quotationNumber.split('-R')[0]}-R${newVersion - 1}` : `PQ-R${newVersion - 1}`;
  revised.revisedDate = new Date().toISOString().split('T')[0];
  revised.status = 'Revised';
  revised.revisions = [
    ...(source.revisions || []),
    {
      version: currentVersion,
      quotationId: source.id,
      date: source.updatedAt || source.createdAt,
      changeSummary,
      amount: source.grandTotal || 0,
    }
  ];

  return saveQuotationSnapshot(revised);
};

export const getAllQuotations = getSavedQuotations;

/**
 * Generates an initial empty quotation structure with real defaults
 */
export const createInitialQuotation = (company = {}) => {
  const now = new Date();
  const year = now.getFullYear();
  const nextYearShort = String(year + 1).slice(-2);
  const finYear = `${year}-${nextYearShort}`;

  // Count existing to generate realistic serial number
  const existingList = getSavedQuotations();
  const srNo = existingList.length + 1;

  return {
    id: 'pq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    quotationNumber: generateQuotationNumber('ENVIRONMENTAL', now, srNo, 'JLT'),
    quotationDate: now.toISOString().split('T')[0],
    hasRevisedDate: false,
    revisedDate: '',
    financialYear: finYear,
    isQuotation: 'Yes',
    quotationType: 'Provisional Estimated Quotation',
    referenceNo: '',
    qpiNo: '',
    approvedBy: '',
    contactPerson: 'Ankit Mistry (+91 7226-0579-78)',
    status: 'Draft',
    version: 1,

    // Client & Plant
    clientId: '',
    clientName: '',
    registeredAddress: '',
    clientCity: '',
    clientState: '',
    clientEmail: '',
    clientPhone: '',
    plantType: 'EXISTING_PLANT', // 'EXISTING_PLANT' or 'CUSTOM'
    plantName: '',
    plantAddress: '',

    // Industry Scale / Type & PCB Details
    industryType: 'large', // 'small' (15K), 'medium' (20K), 'large' (25K)

    // Covering Letter
    introText: DEFAULT_INTRO_TEXT,
    subject: `Submission of Provisional Estimated Quotation for Environmental Audit (${finYear})`,

    // Scope of Work (Page 2)
    scopeMethodRecognition: 'GPCB / CPCB / MoEF&CC.',
    scopePreservationGuidelines: 'GPCB/CPCB or IS/APHA',
    scopeConsentAuthority: 'GPCB',
    scopeItems: [...DEFAULT_SCOPE_ITEMS],

    // Page 2: Detail of Charges Summary Table
    page2Charges: {
      tableTitle: 'Detail of Charges for carrying out environment audit as per GPCB',
      row1Description: 'Environment audit report charges (As per GPCB Guidelines)',
      // Transportation (Sr 2.1)
      transportDaysText: 'twelve days',
      transportDaysPerVisit: 4,
      transportRatePerVisit: 20000,
      // DA (Sr 2.2)
      daPersons: 4,
      daRatePerPerson: 520,
      daDaysPerYear: 12,
      daRatePerVisit: 8320,
      daTotalAmount: 24960,
      // Accommodation (Sr 2.3)
      hotelRoomRate: 3000,
      hotelRoomsCount: 2,
      hotelNightsPerVisit: 2,
      accomRatePerVisit: 12000,
      accomTotalAmount: 36000,
      // Row 3: Sampling & Analysis
      samplingDescription: 'Charges for sampling & analysis of various samples including Water, Wastewater, Stack Emission, and Ambient air quality, Solid waste & Noise level etc. (See Annexure A)',
      // Note below table
      bottomNoteText: 'Note: - Tax will be paid extra (GST 18%) apart from above rate / amount.',
    },

    // Terms & Conditions (Page 3)
    termsText: DEFAULT_TERMS_TEXT,
    termsItems: [...DEFAULT_TERMS_ITEMS],

    // Main Charges
    mainCharges: [
      {
        id: 'mc_1',
        srNo: 1,
        description: 'Environment audit report charges (As per GPCB Guidelines)',
        calculationType: 'FIXED',
        qty: 1,
        unit: 'No.',
        rate: 25000,
        amount: 25000,
      }
    ],

    // Annexure-I (Page 4 Logistics & Audit Charges - All A to Z Editable)
    annexureI: {
      industryType: 'large',
      auditFee: 25000,
      row1Title: 'Environment Audit Report charges',
      daysPerVisit: 4,
      visits: 3,
      jltVehicleRatePerDay: 5000,
      row2Title: 'Transportation charges for monitoring instrument/material. (per day) + Total {totalDays} Days. (For JLTs Vehicle)',
      option1Title: 'In Option 1 if transportation for both instruments and officers are provided by M/s. {clientName} then NILL charges.',
      option1Subtext: '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)',
      option2Title: 'In Option 2 if transportation for both instruments and officers are provided by JLTs then it may increase as per charges of agency.',
      option2Subtext: '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)',
      instrumentLabel: 'For Instruments,',
      instrumentKmRate: 12,
      instrumentKmPerDay: 300,
      auditorLabel: 'For Auditors,',
      auditorKmRate: 15,
      auditorKmPerDay: 300,
      decisionNote: 'It is to be decided by the Company. If Option 1 or Option 2 for TA is chosen, then JLTs Vehicle transportation would be removed. And actual DA billing is to be added at the time of billing.',
    },

    // Annexure-A Visits Multiplier & Activities (Page 4) - Empty until TRF selected
    annexureAVisits: 3,
    activities: [],
    annexureANoteTitle: `BREAK-UP OF ALL ANALYSIS CHARGES FOR AUDIT ${finYear || '2024-2025'}`,
    annexureANoteText: 'The rates are indicative and may vary as per actual visits/work undertaken: Nos. of Days spent on site: Sampling and testing requirements: revision of rates from GPCB and any additional visit undertaken for additional data collection.',

    // Annexure-B Parameters by Discipline Group (Page 6+) - Empty until TRF selected
    annexureB: [],

    // Annexure-B Parameter Rate Overrides (uniqueKey -> { isOverridden: true, rate: 1200 })
    rateOverrides: {},


    // Terms & Conditions
    termsItems: [...DEFAULT_TERMS_ITEMS],

    // Signatures & Company Seal
    signatoryName: company.signatory || 'Purvin Raiyani',
    signatoryDesignation: '(Proprietor)',
    signatorySignature: company.signature || '',
    stampImage: company.stamp || '',
    companyLogo: company.logo || company.quotation_logo || '',

    // Financial calculations
    discount: 0,
    gstPercentage: 18,
    mainChargesTotal: 25000,
    annexureITotal: 0,
    annexureATotal: 0,
    taxableAmount: 0,
    gstAmount: 0,
    grandTotal: 0,
  };
};
