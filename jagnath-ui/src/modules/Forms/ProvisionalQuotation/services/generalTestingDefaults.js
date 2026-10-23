/**
 * @file generalTestingDefaults.js
 * @description Master default templates and initial state factory for
 * General Testing / Consulting Quotations.
 */

import { generateGTQuotationNumber } from '../utils/gtCalculation.utils';

export const DEFAULT_GENERAL_TESTING_SECTIONS = [
  {
    id: 'sec_1',
    presetKey: 'sample_requirements',
    pageNumber: 1,
    title: '',
    content: `<p><strong>NOTE- GIVEN ARE FOR PER SAMPLE CHARGES.</strong><br/>
REQUIRED 2-5 LTRS OF SAMPLE FOR WATER ANALYSIS<br/>
REQUIRED 500G- 1KG OF SAMPLE FOR FOOD ANALYSIS</p>
<p><strong><u>TAT – 6-8 Working Days for Chemical &amp; Micro analysis.</u></strong></p>`
  },
  {
    id: 'sec_2',
    presetKey: 'validity',
    pageNumber: 1,
    title: '1. Validity of Quotation',
    content: `<ul>
  <li>Collection and testing of samples will commence only after receipt of a clear purchase order.</li>
  <li>This quotation is valid for <strong>30 days</strong> from the date of issue.</li>
</ul>`
  },
  {
    id: 'sec_3',
    presetKey: 'payment_terms',
    pageNumber: 1,
    title: '2. Payment Terms',
    content: `<ul>
  <li>Overdue payments will attract <strong>24% annual interest</strong>.</li>
  <li>Priority services may incur fast-track charges.</li>
  <li>Online payments must be confirmed via email.</li>
  <li>GST will be charged extra, as applicable, at the time of billing.</li>
  <li>TDS Certificates, where applicable, must be provided within 30 days from the end of each quarter.</li>
  <li>Statutory deductions (e.g., ESIC, PF) do not apply to our representatives, who visit customer premises solely for sampling.</li>
</ul>`
  },
  {
    id: 'sec_4',
    presetKey: 'sampling_conditions',
    pageNumber: 1,
    title: '3. Sampling Conditions',
    content: `<ul>
  <li>If the sampling team is unable to proceed due to lack of infrastructure or customer cooperation, sampling fees will be charged again.</li>
  <li>Customers must ensure adequate arrangements (platforms, ports, power supply, etc.), safety/security, and cooperation for sampling.</li>
</ul>`
  },
  {
    id: 'sec_5',
    presetKey: 'sample_handling',
    pageNumber: 1,
    title: '4. Sample Handling & Disposal',
    content: `<ul>
  <li>Leftover samples requiring special or legal disposal will be billed extra or must be collected back by the customer.</li>
  <li>Cancelled or unaccepted project samples will be returned at the customer's expense.</li>
  <li>Perishable samples are disposed within <strong>7 days</strong> of reporting.</li>
  <li>Non-perishable samples are disposed within <strong>15 days</strong>, unless otherwise requested.</li>
  <li>Storage beyond the laboratory's retention period may be chargeable.</li>
</ul>`
  },
  {
    id: 'sec_6',
    presetKey: 'suspension_of_work',
    pageNumber: 1,
    title: '5. Suspension of Work',
    content: `<ul>
  <li>Customers may request suspension of work by written notice.</li>
  <li>Charges apply for all work completed up to the suspension date.</li>
  <li>Unfinished analysis will be billed on a prorated basis.</li>
</ul>`
  },
  {
    id: 'sec_7',
    presetKey: 'invoicing_reports',
    pageNumber: 1,
    title: '6. Invoicing & Reports',
    content: `<ul>
  <li>If no payment advice is received, invoices will be adjusted on a <strong>FIFO basis</strong> within 2 working days.</li>
  <li>Customers are liable to pay for all services rendered, irrespective of disputes regarding results.</li>
  <li>One original test report is provided free of charge; additional copies are available on request at extra cost.</li>
  <li>As our endeavor towards caring for environment, all test reports will be issued as soft copies.</li>
</ul>`
  },
  {
    id: 'sec_8',
    presetKey: 'compliance_requirements',
    pageNumber: 2,
    title: 'Management System Compliance Requirements',
    content: `<p><strong>1. Confidentiality &amp; Impartiality</strong></p>
<ul>
  <li>Both the laboratory and customer must treat shared information as confidential.</li>
  <li>Disclosure will only occur where legally required, with prior intimation (unless prohibited by law).</li>
  <li>Both parties must notify each other of any potential conflicts affecting confidentiality or impartiality.</li>
  <li>Test reports, once issued, enter the public domain.</li>
</ul>
<p><strong>2. Test Methods</strong></p>
<ul>
  <li>Accredited parameters are tested as per the laboratory's NABL scope (available on request).</li>
  <li>For non-accredited parameters, or where methods are outdated/inappropriate, the laboratory will select suitable methods and inform the customer.</li>
</ul>
<p><strong>3. Use of External Service Providers</strong></p>
<ul>
  <li>If internal resources are unavailable, the laboratory may—upon customer approval—engage a competent external service provider.</li>
</ul>
<p><strong>4. Statement of Conformity</strong></p>
<ul>
  <li>Any decision rule applied to specifications/standards will be agreed upon with the customer in advance.</li>
  <li>The applied decision rule will be explicitly mentioned in the report.</li>
  <li>Opinions/interpretations will only be provided with documented evidence.</li>
</ul>
<p><strong>5. Customer Cooperation</strong></p>
<ul>
  <li>Customers may witness tests or request performance monitoring, subject to compliance with requirements.</li>
  <li>Such arrangements should be made through the Customer Support Team.</li>
</ul>
<p><strong>6. Sample Delivery &amp; Acceptance</strong></p>
<ul>
  <li>Samples are accepted only if:
    <ul style="list-style-type: circle; padding-left: 18px;">
      <li>Quantity is sufficient,</li>
      <li>They do not pose health, safety, environmental, or legal risks,</li>
      <li>Holding times have not compromised integrity, and</li>
      <li>They do not affect laboratory operations.</li>
    </ul>
  </li>
  <li>Non-conforming samples may still be tested at customer's insistence but under <strong>disclaimer</strong>, clearly noted in the report.</li>
  <li>All samples must be marked: <strong>"Samples for testing purposes – No commercial value."</strong></li>
  <li>Customers bear the risk of damage/loss until samples are accepted by the laboratory (unless sampling is done by the laboratory).</li>
</ul>
<p><strong>7. Sample Disposal</strong></p>
<ul>
  <li>Perishable: within <strong>7 days</strong> of reporting.</li>
  <li>Non-perishable: within <strong>15 days</strong>, unless otherwise instructed.</li>
</ul>
<p><strong>8. Decision Rule Application</strong></p>
<ul>
  <li>If measurement uncertainty impacts results, the sample will be reported as <strong>Fail</strong>.</li>
  <li>The <strong>ILAC G8</strong> model will be applied where relevant.</li>
</ul>
<p><em>If the decision rule is defined by customer, regulation, or normative documents, no further risk assessment will be undertaken.</em></p>`
  }
];

export const createInitialGeneralTestingData = (company = {}, existingCount = 1) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const runningSeq = 2305000000 + existingCount;
  const quoteNo = generateGTQuotationNumber(runningSeq, now);

  const sectionsCopy = DEFAULT_GENERAL_TESTING_SECTIONS.map((sec, idx) => ({
    ...sec,
    id: `sec_${Date.now()}_${idx + 1}`
  }));

  return {
    id: 'gtq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    quotationType: 'general_testing',
    quotationCategoryType: 'general_testing',
    categoryType: 'general_testing',
    quotationNo: quoteNo,
    quotationNumber: quoteNo,
    revNo: '00',
    quotationDate: dateStr,
    validTillText: '1 Month from quotation date',
    status: 'Draft',
    version: 1,
    watermarkEnabled: true,

    // Direct To (Client Side)
    client: {
      companyName: '',
      contactPerson: '',
      contactNo: '',
      email: '',
      address: '',
      serviceName: '',
    },

    // Direct Enquiries To (Lab Profile)
    labProfile: {
      companyName: company.companyName || company.name || 'AKSHAAR ANALYTICAL LABORATORIES PRIVATE LTD.',
      labAddress: company.address || company.labAddress || '4TH FLOOR, PARAMOUNT PLAZA, KISHANPARA CHOWK, RAJKOT-360001 (GUJARAT) INDIA.',
      email: company.email || 'info.akshaarlabs@gmail.com',
      contactPerson: company.contactPerson || 'Mr. HITARTH',
      contactPhone: company.contactPhone || company.phone || '9537766446',
      serviceTaxNo: company.serviceTaxNo || company.gstNo || '24AAZCA8021D1ZO',
      panNo: company.panNo || 'AAZCA8021D',
      bankDetails: {
        bankName: company.bankDetails?.bankName || 'KOTAK MAHINDRA BANK LTD',
        accountName: company.bankDetails?.accountName || 'M/S. AKSHAAR ANALYTICAL LABORATORIES PVT LTD',
        accountType: company.bankDetails?.accountType || 'Current Account',
        accountNo: company.bankDetails?.accountNo || '1112336699',
        ifsc: company.bankDetails?.ifsc || 'KKBK0002789',
        bankAddress: company.bankDetails?.bankAddress || 'KOTAK MAHINDRA BANK Ltd The Imperial Heights, Rajkot- 360005',
      }
    },

    // Default Line Items (Matching reference photo row 1 & row 2)
    lineItems: [
      {
        id: 'li_1',
        sampleName: 'pH, COD, BOD, SUSPENDED SOLID, TOTALL NITROGEN, KJELDAL NITROGEN, AMMONICAL NITROGEN, OIL & GREASE, FECAL COLIFORM,',
        noOfSamples: 1,
        chargesPerSample: 5500,
        discountPercent: Math.round(((5500 - 3500) / 5500) * 10000) / 100, // ~36.36% -> 3,500/-
        total: 3500
      },
      {
        id: 'li_2',
        sampleName: 'STP SLUDGE',
        noOfSamples: 1,
        chargesPerSample: 3000,
        discountPercent: Math.round(((3000 - 2000) / 3000) * 10000) / 100, // ~33.33% -> 2,000/-
        total: 2000
      }
    ],

    // Notes & GST Configuration
    notes: {
      showSubtotal: true,
      gstEnabled: true,
      gstPercent: 18,
      gstNote: '18% GST will be charged as applicable (extra).'
    },

    // Sections
    sections: sectionsCopy,

    // Signature Settings
    signature: {
      required: false,
      name: 'Mr. HITARTH',
      designation: 'Authorized Signatory',
      signatureImage: '',
      disclaimer: 'As the enquiry is system generated signature is not required.'
    }
  };
};
