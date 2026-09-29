/**
 * @file GeneralTestingDocument.jsx
 * @description Renders the 3-Page General Testing / Consulting Quotation document matching
 * the reference document layout and styling with Jagnath Lab branding, dynamic pagination,
 * watermarking, editable meta, and 2-column info boxes.
 */

import React from 'react';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  return `${num.toLocaleString('en-IN')}/-`;
};

const replacePlaceholders = (text, data = {}) => {
  if (!text) return '';
  return text
    .replace(/{validityDays}/g, data.validityDays || 30)
    .replace(/{overdueInterestPercent}/g, data.overdueInterestPercent || 24);
};

const renderLines = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => (
    <p key={idx} style={{ margin: '0 0 3px 0', lineHeight: 1.35 }}>
      {line}
    </p>
  ));
};

const renderBulletList = (text, data = {}) => {
  if (!text) return null;
  const processed = replacePlaceholders(text, data);
  const lines = processed.split('\n').filter(l => l.trim().length > 0);
  
  return (
    <ul style={{ margin: '1px 0 5px 0', paddingLeft: '14px', listStyleType: 'disc' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isNested = trimmed.startsWith('o ') || trimmed.startsWith('- ') || trimmed.startsWith('▪ ') || line.startsWith('  ') || line.startsWith('\t');
        const cleanText = trimmed.replace(/^[•\-\*o▪]\s*/, '');
        
        if (isNested) {
          return (
            <li
              key={idx}
              style={{
                marginLeft: '14px',
                listStyleType: 'circle',
                marginBottom: '1.5px',
                lineHeight: 1.35,
                fontSize: '10.5px'
              }}
            >
              {cleanText}
            </li>
          );
        }
        
        return (
          <li key={idx} style={{ marginBottom: '1.5px', lineHeight: 1.35, fontSize: '10.5px' }}>
            {cleanText}
          </li>
        );
      })}
    </ul>
  );
};

export const GeneralTestingDocument = ({
  data = {},
  logoUrl = '/Images/Navbar_Logo.png',
  isPrintMode = false,
}) => {
  const {
    categoryLabel = 'General Testing/Consulting',
    quotationNo = 'JLT/Q/00000001/2026-27',
    quotationNumber,
    revNo = '00',
    quotationDate = new Date().toISOString().split('T')[0],
    validTillText = '1 Month from quotation date',
    validTillMonths = 1,
    client = {},
    labProfile = {},
    lineItems = [],
    notes = {},
    termsAndConditions = {},
    signatureRequired = false,
    signatureDisclaimer = 'As the enquiry is system generated, signature is not required.',
    watermarkEnabled = true,
  } = data;

  const activeQuotationNo = quotationNo || quotationNumber || 'JLT/Q/00000001/2026-27';
  const computedValidTill = validTillText || `${validTillMonths || 1} Month from quotation date`;

  // Lab profile defaults
  const lab = {
    companyName: labProfile.companyName || 'JAGNATH LAB TECHNOLOGIES PVT. LTD.',
    labAddress: labProfile.labAddress || '4TH FLOOR, PARAMOUNT PLAZA, KISHANPARA CHOWK, RAJKOT-360001 (GUJARAT) INDIA.',
    email: labProfile.email || 'info.jagnathlabs@gmail.com',
    contactPerson: labProfile.contactPerson || 'Mr. HITARTH',
    contactPhone: labProfile.contactPhone || '+91 8140-555515',
    serviceTaxNo: labProfile.serviceTaxNo || '24AAZCA8021D1ZO',
    panNo: labProfile.panNo || 'AAZCA8021D',
    bankDetails: {
      bankName: labProfile.bankDetails?.bankName || 'KOTAK MAHINDRA BANK LTD',
      accountName: labProfile.bankDetails?.accountName || 'M/S. JAGNATH LAB TECHNOLOGIES PVT LTD',
      accountType: labProfile.bankDetails?.accountType || 'Current Account',
      accountNo: labProfile.bankDetails?.accountNo || '1112336699',
      ifsc: labProfile.bankDetails?.ifsc || 'KKBK0002789',
      bankAddress: labProfile.bankDetails?.bankAddress || 'KOTAK MAHINDRA BANK Ltd The Imperial Heights, Rajkot- 360005',
    }
  };

  const totalChargesPerSample = lineItems.reduce((sum, row) => sum + (Number(row.chargesPerSample) || 0), 0);
  const totalDiscountedCharges = lineItems.reduce((sum, row) => sum + (Number(row.discountedChargesPerSample) || 0), 0);

  const renderWatermark = () => {
    if (!watermarkEnabled) return null;
    return (
      <div
        className="general-doc-watermark"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.045,
          zIndex: 0,
          pointerEvents: 'none',
          width: '70%',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        <img
          src={logoUrl || '/Images/Navbar_Logo.png'}
          alt="Watermark"
          style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', filter: 'grayscale(100%)' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  };

  const pageContainerStyle = {
    background: '#ffffff',
    width: '210mm',
    minHeight: '297mm',
    padding: '14mm 16mm 12mm 16mm',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontFamily: '"Times New Roman", Times, serif, system-ui',
    color: '#000000',
    fontSize: '11px',
    lineHeight: 1.35,
    margin: isPrintMode ? '0 auto' : '0 auto 20px auto',
    boxShadow: isPrintMode ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.12)',
    borderRadius: isPrintMode ? '0' : '4px',
    pageBreakAfter: 'always',
    breakAfter: 'page',
  };

  const tableHeaderStyle = {
    border: '1px solid #000000',
    padding: '4px 6px',
    fontWeight: 'bold',
    fontSize: '10.5px',
    textAlign: 'center',
    background: '#f8fafc',
    color: '#000000',
  };

  const tableCellStyle = {
    border: '1px solid #000000',
    padding: '4px 6px',
    fontSize: '10.5px',
    verticalAlign: 'top',
    color: '#000000',
  };

  return (
    <div className="general-testing-quotation-root">
      {/* =========================================================================
          PAGE 1 OF 3
          ========================================================================= */}
      <div id="gt-page-1" className="a4-sheet general-testing-page" style={pageContainerStyle}>
        {renderWatermark()}

        {/* Content Box with Outer Border */}
        <div style={{ border: '1px solid #000000', padding: '12px 14px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          
          {/* 1. COMPANY HEADER / LOGO BLOCK */}
          <div style={{ textAlign: 'center', marginBottom: '8px', marginTop: '2px' }}>
            <img
              src={logoUrl || '/Images/Navbar_Logo.png'}
              alt={lab.companyName}
              style={{ maxHeight: '70px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
            />
          </div>

          {/* 2. QUOTATION TITLE */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.04em', marginBottom: '8px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '3px 0' }}>
            QUOTATION
          </div>

          {/* 3. QUOTATION META ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold', marginBottom: '8px' }}>
            <div>
              <div>QUOTATION NO.: {activeQuotationNo}</div>
              <div>QUOTATION DATE: {formatDisplayDate(quotationDate)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Rev No: {revNo || '00'}</div>
              <div>Valid Till: {computedValidTill}</div>
            </div>
          </div>

          {/* 4. TWO-COLUMN INFO BOX */}
          <div style={{ border: '1px solid #000000', display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '8px', fontSize: '10px' }}>
            {/* Left Box: Direct To */}
            <div style={{ borderRight: '1px solid #000000', padding: '6px 8px' }}>
              <div style={{ textDecoration: 'underline', fontWeight: 'bold', marginBottom: '4px' }}>Direct To:</div>
              <div style={{ fontWeight: 'bold' }}>Company Name: {client.companyName || '-'}</div>
              {client.contactPerson && <div>Contact Person: {client.contactPerson}</div>}
              {client.contactNo && <div>Contact No.: {client.contactNo}</div>}
              {client.email && <div>Email: {client.email}</div>}
              {client.address && <div>Address: {client.address}</div>}
              {client.serviceName && <div style={{ marginTop: '3px', fontWeight: 'bold' }}>Service name: {client.serviceName}</div>}
            </div>

            {/* Right Box: Direct Enquiries To */}
            <div style={{ padding: '6px 8px' }}>
              <div style={{ textDecoration: 'underline', fontWeight: 'bold', marginBottom: '4px' }}>Direct Enquiries To:</div>
              <div style={{ fontWeight: 'bold' }}>{lab.companyName}</div>
              <div>HO & Central Laboratory:</div>
              <div>{lab.labAddress}</div>
              {lab.email && <div>Email id: {lab.email}</div>}
              {lab.contactPerson && <div>Contact Person: {lab.contactPerson} {lab.contactPhone ? `(${lab.contactPhone})` : ''}</div>}
            </div>
          </div>

          {/* 6. PRICING / SAMPLE TABLE */}
          <div style={{ fontStyle: 'italic', fontSize: '10.5px', marginBottom: '4px' }}>
            As per your requirement, please find below quote for:
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, width: '40px' }}>Sr. No</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Sample Name/ Test/ Parameter</th>
                <th style={{ ...tableHeaderStyle, width: '70px' }}>No. of sample</th>
                <th style={{ ...tableHeaderStyle, width: '110px' }}>charges as per Sample</th>
                <th style={{ ...tableHeaderStyle, width: '130px' }}>Discounted Total charges as per sample</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                    {item.srNo || idx + 1}
                  </td>
                  <td style={{ ...tableCellStyle, whiteSpace: 'pre-line', textTransform: 'uppercase' }}>
                    {item.sampleName || '-'}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    {item.noOfSamples || 1}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(item.chargesPerSample)}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(item.discountedChargesPerSample)}
                  </td>
                </tr>
              ))}
              {notes.showSubtotal && (
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ ...tableCellStyle, textAlign: 'right' }}>Total:</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(totalChargesPerSample)}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'right', color: '#0369a1' }}>{formatCurrency(totalDiscountedCharges)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 7. SAMPLE REQUIREMENT NOTES */}
          <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {renderLines(notes.sampleRequirement || `NOTE- GIVEN ARE FOR PER SAMPLE CHARGES.
TRQUIRED 2-5 LTRS OF SAMPLE FOR WATER ANALYSIS
TRQUIRED 500G- 1KG OF SAMPLE FOR WATER ANALYSIS`)}
          </div>

          {/* 8. TAT NOTE */}
          <div style={{ fontWeight: 'bold', fontSize: '10.5px', textDecoration: 'underline', marginBottom: '6px' }}>
            TAT – {notes.tat || '6-8 Working Days for Chemical & Micro analysis.'}
          </div>

          {/* 9. GST NOTE */}
          <div style={{ fontSize: '10.5px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold' }}>NOTE:</span>
            <div style={{ paddingLeft: '16px', fontWeight: 'bold' }}>
              A. {notes.gstNote || `${notes.gstPercent || 18}% GST will be charged as applicable (extra).`}
            </div>
          </div>

          {/* 10. GENERAL TERMS & CONDITIONS — SECTIONS 1 & 2 */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '11px', marginBottom: '4px' }}>
              General Terms & Conditions
            </div>

            {/* 1. Validity */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>1. Validity of Quotation</div>
              {renderBulletList(termsAndConditions.p1_validity, { validityDays: termsAndConditions.validityDays || 30 })}
            </div>

            {/* 2. Payment Terms */}
            <div style={{ marginBottom: '2px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>2. Payment Terms</div>
              {renderBulletList(termsAndConditions.p1_payment, { overdueInterestPercent: termsAndConditions.overdueInterestPercent || 24 })}
            </div>
          </div>

          {/* PAGE FOOTER */}
          <div style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', fontWeight: 'bold' }}>
            Page 1 of 3
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2 OF 3
          ========================================================================= */}
      <div id="gt-page-2" className="a4-sheet general-testing-page" style={pageContainerStyle}>
        {renderWatermark()}

        {/* Content Box with Outer Border */}
        <div style={{ border: '1px solid #000000', padding: '12px 14px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          
          {/* 3. Sampling Conditions */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>3. Sampling Conditions</div>
            {renderBulletList(termsAndConditions.p2_samplingConditions)}
          </div>

          {/* 4. Sample Handling & Disposal */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>4. Sample Handling & Disposal</div>
            {renderBulletList(termsAndConditions.p2_sampleHandling)}
          </div>

          {/* 5. Suspension of Work */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>5. Suspension of Work</div>
            {renderBulletList(termsAndConditions.p2_suspensionOfWork)}
          </div>

          {/* 6. Invoicing & Reports */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>6. Invoicing & Reports</div>
            {renderBulletList(termsAndConditions.p2_invoicingReports)}
          </div>

          {/* Section Heading: Management System Compliance Requirements */}
          <div style={{ fontWeight: 'bold', fontSize: '11px', textDecoration: 'underline', margin: '4px 0 4px 0' }}>
            Management System Compliance Requirements
          </div>

          {/* 1. Confidentiality & Impartiality */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>1. Confidentiality & Impartiality</div>
            {renderBulletList(termsAndConditions.p2_compliance_confidentiality)}
          </div>

          {/* 2. Test Methods */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>2. Test Methods</div>
            {renderBulletList(termsAndConditions.p2_compliance_testMethods)}
          </div>

          {/* 3. Use of External Service Providers */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>3. Use of External Service Providers</div>
            {renderBulletList(termsAndConditions.p2_compliance_externalProviders)}
          </div>

          {/* 4. Statement of Conformity */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>4. Statement of Conformity</div>
            {renderBulletList(termsAndConditions.p2_compliance_conformity)}
          </div>

          {/* 5. Customer Cooperation */}
          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>5. Customer Cooperation</div>
            {renderBulletList(termsAndConditions.p2_compliance_customerCooperation)}
          </div>

          {/* 6. Sample Delivery & Acceptance */}
          <div style={{ marginBottom: '2px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>6. Sample Delivery & Acceptance</div>
            {renderBulletList(termsAndConditions.p2_compliance_deliveryAcceptance)}
          </div>

          {/* PAGE FOOTER */}
          <div style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', fontWeight: 'bold' }}>
            Page 2 of 3
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 3 OF 3
          ========================================================================= */}
      <div id="gt-page-3" className="a4-sheet general-testing-page" style={pageContainerStyle}>
        {renderWatermark()}

        {/* Content Box with Outer Border */}
        <div style={{ border: '1px solid #000000', padding: '12px 14px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          
          {/* Continuation clause from Page 2 */}
          <div style={{ marginBottom: '6px' }}>
            {renderBulletList(termsAndConditions.p3_continuationClause)}
          </div>

          {/* 7. Sample Disposal */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>7. Sample Disposal</div>
            {renderBulletList(termsAndConditions.p3_sampleDisposal)}
          </div>

          {/* 8. Decision Rule Application */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>8. Decision Rule Application</div>
            {renderBulletList(termsAndConditions.p3_decisionRule)}
          </div>

          <div style={{ fontSize: '10px', fontStyle: 'italic', marginBottom: '12px' }}>
            If the decision rule is defined by customer, regulation, or normative documents, no further risk assessment will be undertaken.
          </div>

          {/* QUOTATION PREPARED BY & BANK DETAILS 2-COLUMN TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '10.5px' }}>
            <tbody>
              <tr>
                <td style={{ ...tableHeaderStyle, width: '42%', textAlign: 'left' }}>
                  Quotation Prepared By:
                </td>
                <td style={{ ...tableHeaderStyle, width: '58%', textAlign: 'left' }}>
                  Bank Details:
                </td>
              </tr>
              <tr>
                {/* Left Side: Tax & PAN */}
                <td style={{ ...tableCellStyle, padding: '8px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Service Tax No.:</strong> {lab.serviceTaxNo || '-'}
                  </div>
                  <div>
                    <strong>PAN No.:</strong> {lab.panNo || '-'}
                  </div>
                </td>
                {/* Right Side: Bank Information */}
                <td style={{ ...tableCellStyle, padding: '8px' }}>
                  <div style={{ marginBottom: '2px' }}><strong>Bank Name:</strong> {lab.bankDetails.bankName}</div>
                  <div style={{ marginBottom: '2px' }}><strong>Account Name:</strong> {lab.bankDetails.accountName}</div>
                  <div style={{ marginBottom: '2px' }}><strong>Type of Account:</strong> {lab.bankDetails.accountType}</div>
                  <div style={{ marginBottom: '2px' }}><strong>Bank A/c No:</strong> {lab.bankDetails.accountNo}</div>
                  <div style={{ marginBottom: '2px' }}><strong>IFSC:</strong> {lab.bankDetails.ifsc}</div>
                  <div><strong>Bank Address:</strong> {lab.bankDetails.bankAddress}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* System Generated Signature Disclaimer */}
          <div style={{ fontSize: '10.5px', fontStyle: 'italic', marginBottom: '8px' }}>
            {signatureRequired ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', textAlign: 'center' }}>
                <div style={{ minWidth: '180px', borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>
                  Authorized Signatory
                </div>
              </div>
            ) : (
              <div>{signatureDisclaimer}</div>
            )}
          </div>

          {/* PAGE FOOTER */}
          <div style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', fontWeight: 'bold' }}>
            Page 3 of 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTestingDocument;
