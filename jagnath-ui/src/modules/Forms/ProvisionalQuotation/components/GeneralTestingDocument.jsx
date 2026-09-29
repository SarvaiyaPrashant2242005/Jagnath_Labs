import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  formatIndianCurrency,
  sanitizeHtml,
  calculateGeneralTestingTotals
} from '../utils/quotationCalculation.utils';
import { ensureQuotationSections } from '../services/provisionalQuotationStorage.service';

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

/**
 * Individual A4 Page Wrapper (210mm x 297mm)
 */
const PageContainer = ({
  pageNumber,
  totalPages,
  watermarkEnabled,
  logoUrl,
  isPrintMode,
  children
}) => {
  return (
    <div
      className="gt-a4-page"
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '8mm 10mm',
        boxSizing: 'border-box',
        position: 'relative',
        background: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif',
        fontSize: '10.5pt',
        lineHeight: 1.35,
        color: '#000000',
        pageBreakAfter: pageNumber < totalPages ? 'always' : 'avoid',
        breakAfter: pageNumber < totalPages ? 'page' : 'avoid',
        boxShadow: isPrintMode ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.12)',
        margin: isPrintMode ? '0' : '0 auto 24px auto',
      }}
    >
      {/* Inset Thin 1px Black Border Frame */}
      <div
        className="gt-page-frame"
        style={{
          border: '1px solid #000000',
          padding: '8px 10px 22px 10px',
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {/* Centered Faded Watermark */}
        {watermarkEnabled && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.08,
              zIndex: 0,
              pointerEvents: 'none',
              width: '65%',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            <img
              src={logoUrl || '/Images/Navbar_Logo.png'}
              alt="Watermark"
              style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', filter: 'grayscale(100%)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Page Inner Content */}
        <div style={{ position: 'relative', zIndex: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>

        {/* Bottom-Right Page Number Inside Frame */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '10px',
            fontSize: '9.5pt',
            fontWeight: 'bold',
            color: '#000000',
            zIndex: 2,
          }}
        >
          Page {pageNumber} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export const GeneralTestingDocument = ({
  data = {},
  logoUrl = '/Images/Navbar_Logo.png',
  isPrintMode = false,
}) => {
  const {
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
    signature = {},
    signatureRequired = false,
    signatureDisclaimer = 'As the enquiry is system generated signature is not required.',
    watermarkEnabled = true,
  } = data;

  const activeQuotationNo = quotationNo || quotationNumber || 'AAPL/Q/2305000126/2026-27';
  const computedValidTill = validTillText || `${validTillMonths || 1} Month from quotation date`;

  // Lab profile defaults
  const lab = {
    companyName: labProfile.companyName || 'AKSHAAR ANALYTICAL LABORATORIES PRIVATE LTD.',
    labAddress: labProfile.labAddress || '4TH FLOOR, PARAMOUNT PLAZA, KISHANPARA CHOWK, RAJKOT-360001 (GUJARAT) INDIA.',
    email: labProfile.email || 'info.akshaarlabs@gmail.com',
    contactPerson: labProfile.contactPerson || 'Mr. HIITARTTH',
    contactPhone: labProfile.contactPhone || '9537766446',
    serviceTaxNo: labProfile.serviceTaxNo || '24AAZCA8021D1ZO',
    panNo: labProfile.panNo || 'AAZCA8021D',
    bankDetails: {
      bankName: labProfile.bankDetails?.bankName || 'KOTAK MAHINDRA BANKLTD',
      accountName: labProfile.bankDetails?.accountName || 'M/S. AKSHAAR ANALYTICAL LABORATORIES PVT LTD',
      accountType: labProfile.bankDetails?.accountType || 'Current Account',
      accountNo: labProfile.bankDetails?.accountNo || '1112336699',
      ifsc: labProfile.bankDetails?.ifsc || 'KKBK0002789',
      bankAddress: labProfile.bankDetails?.bankAddress || 'KOTAK MAHINDRA BANK Ltd The Imperial Heights, Rajkot- 360005',
    }
  };

  // Pricing calculations
  const gstConfig = {
    enabled: notes.gstEnabled ?? true,
    percent: notes.gstPercent ?? 18,
  };
  const pricingData = calculateGeneralTestingTotals(lineItems, gstConfig);

  // Sections
  const allSections = ensureQuotationSections(data);

  // Signature resolution
  const isSigRequired = signature.required || signatureRequired;
  const sigImage = signature.signatureImage || signature.image || data.signatorySignature;
  const sigName = signature.name || lab.contactPerson || 'Authorized Signatory';
  const sigDesignation = signature.designation || 'Authorized Signatory';

  // State for paginated pages of atomic blocks
  const [paginatedPages, setPaginatedPages] = useState(null);
  const measureContainerRef = useRef(null);

  // Decompose document into atomic blocks
  const blocks = [];

  // 1. Header & Pricing Block (Page 1 top)
  blocks.push({
    id: 'block_header_pricing',
    type: 'header_pricing',
    render: () => (
      <div key="block_header_pricing" style={{ marginBottom: '4px' }}>
        {/* Company Logo (Top Right ~23% width) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
          <img
            src={logoUrl || '/Images/Navbar_Logo.png'}
            alt={lab.companyName}
            style={{ width: '23%', maxWidth: '175px', maxHeight: '52px', objectFit: 'contain', display: 'block' }}
            onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
          />
        </div>

        {/* QUOTATION Title Centered with Rev No on Right */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderTop: '1px solid #000000',
          borderBottom: '1px solid #000000',
          padding: '2px 0',
          marginBottom: '4px'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '11.5pt', letterSpacing: '0.04em' }}>
            QUOTATION
          </span>
          <span style={{ position: 'absolute', right: 0, fontWeight: 'bold', fontSize: '9.5pt' }}>
            Rev No: {revNo || '00'}
          </span>
        </div>

        {/* Meta Info Rows */}
        <div style={{ fontSize: '9.5pt', fontWeight: 'bold', marginBottom: '5px', lineHeight: 1.35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>QUOTATION NO.: {activeQuotationNo}</div>
            <div>Valid Till: {computedValidTill}</div>
          </div>
          <div>QUOTATION DATE: {formatDisplayDate(quotationDate)}</div>
        </div>

        {/* 2-Column Info Boxes */}
        <div style={{
          border: '1px solid #000000',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          marginBottom: '6px',
          fontSize: '9.5pt',
          lineHeight: 1.32
        }}>
          {/* Left: Direct To */}
          <div style={{ borderRight: '1px solid #000000', padding: '5px 7px' }}>
            <div style={{ textDecoration: 'underline', fontWeight: 'bold', marginBottom: '2px' }}>Direct To:</div>
            <div><span style={{ fontWeight: 'bold' }}>Company Name:</span> {client.companyName || '-'}</div>
            {client.contactPerson && <div><span style={{ fontWeight: 'bold' }}>Contact Person:</span> {client.contactPerson}</div>}
            {client.contactNo && <div><span style={{ fontWeight: 'bold' }}>Contact No.:</span> {client.contactNo}</div>}
            {client.email && <div><span style={{ fontWeight: 'bold' }}>Email.:</span> {client.email}</div>}
            {client.address && <div><span style={{ fontWeight: 'bold' }}>Address:-</span> {client.address}</div>}
            {client.serviceName && <div style={{ marginTop: '2px' }}><span style={{ fontWeight: 'bold' }}>Service name:-</span> {client.serviceName}</div>}
          </div>

          {/* Right: Direct Enquiries To */}
          <div style={{ padding: '5px 7px' }}>
            <div style={{ textDecoration: 'underline', fontWeight: 'bold', marginBottom: '2px' }}>Direct Enquiries To:</div>
            <div style={{ fontWeight: 'bold' }}>{lab.companyName}</div>
            <div>HO &amp; Central Laboratory:</div>
            <div>{lab.labAddress}</div>
            {lab.email && <div><span style={{ fontWeight: 'bold' }}>Email id:</span> {lab.email}</div>}
            {lab.contactPerson && <div><span style={{ fontWeight: 'bold' }}>Contact Person:</span> {lab.contactPerson} {lab.contactPhone ? `(${lab.contactPhone})` : ''}</div>}
          </div>
        </div>

        {/* Intro text */}
        <div style={{ fontStyle: 'italic', fontSize: '9.5pt', marginBottom: '3px' }}>
          As per your requirement, please find below quote for:
        </div>

        {/* Pricing Table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #000000',
          marginBottom: '5px',
          fontSize: '9.5pt'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ border: '1px solid #000000', padding: '3px 4px', width: '6%', textAlign: 'center', fontWeight: 'bold' }}>Sr.<br/>No</th>
              <th style={{ border: '1px solid #000000', padding: '3px 6px', width: '48%', textAlign: 'center', fontWeight: 'bold' }}>Sample Name/ Test/ Parameter</th>
              <th style={{ border: '1px solid #000000', padding: '3px 4px', width: '12%', textAlign: 'center', fontWeight: 'bold' }}>No. of<br/>sample</th>
              <th style={{ border: '1px solid #000000', padding: '3px 4px', width: '17%', textAlign: 'center', fontWeight: 'bold' }}>charges as per<br/>Sample</th>
              <th style={{ border: '1px solid #000000', padding: '3px 4px', width: '17%', textAlign: 'center', fontWeight: 'bold' }}>Discounted Total charges<br/>as per sample</th>
            </tr>
          </thead>
          <tbody>
            {pricingData.rows.map((item, idx) => {
              const hasDiscount = item.discountPercent > 0;
              return (
                <tr key={item.id || idx}>
                  <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {item.srNo || idx + 1}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px 6px' }}>
                    {item.sampleName && /<[a-z][\s\S]*>/i.test(item.sampleName) ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.sampleName) }}
                        style={{ textTransform: 'uppercase', lineHeight: 1.3 }}
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-line', textTransform: 'uppercase', lineHeight: 1.3 }}>
                        {item.sampleName || '-'}
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center' }}>
                    {item.noOfSamples || 1}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {hasDiscount ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#64748b', fontSize: '8.5pt', marginRight: '4px' }}>
                          {formatIndianCurrency(item.chargesPerSample)}
                        </span>
                        <br />
                        <span>{formatIndianCurrency(item.chargesPerSample * (1 - item.discountPercent / 100))}</span>
                      </div>
                    ) : (
                      formatIndianCurrency(item.chargesPerSample)
                    )}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatIndianCurrency(item.total)}
                  </td>
                </tr>
              );
            })}

            {notes.showSubtotal !== false && (
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td colSpan={3} style={{ border: '1px solid #000000', padding: '3px 6px', textAlign: 'right' }}>Total:</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center' }}>{formatIndianCurrency(pricingData.rawSubtotal)}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'center', color: '#0369a1' }}>{formatIndianCurrency(pricingData.subtotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  });

  // 2. Process Sections & Decompose into Granular Atomic Blocks
  let hasRenderedGstNote = false;
  let hasRenderedGeneralTermsHeading = false;

  allSections.forEach((section, sIdx) => {
    if (!section) return;

    if (section.isPageBreak || section.presetKey === 'page_break') {
      blocks.push({ id: `break_${sIdx}`, type: 'page_break' });
      return;
    }

    if (!section.content) return;

    // Check if sample requirements note
    if (section.presetKey === 'sample_requirements') {
      blocks.push({
        id: `sec_sample_req_${sIdx}`,
        type: 'sample_requirements',
        render: () => (
          <div key={`sec_sample_req_${sIdx}`} style={{ marginBottom: '3px' }}>
            <div
              className="doc-section-rich-content"
              style={{ fontSize: '10pt', lineHeight: 1.32 }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
            />
          </div>
        )
      });

      // Render GST Note right after Sample Requirements & TAT Note
      if (!hasRenderedGstNote) {
        hasRenderedGstNote = true;
        blocks.push({
          id: 'block_gst_note',
          type: 'gst_note',
          render: () => (
            <div key="block_gst_note" style={{ fontSize: '10pt', marginTop: '2px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>NOTE:</span>
              <div style={{ paddingLeft: '14px', fontWeight: 'bold' }}>
                A. {notes.gstNote || `${notes.gstPercent || 18}% GST will be charged as applicable (extra).`}
              </div>
            </div>
          )
        });
      }
      return;
    }

    // Insert General Terms & Conditions heading if not yet inserted
    if (!hasRenderedGeneralTermsHeading && (section.presetKey === 'validity' || section.title?.includes('Validity') || section.title?.includes('General Terms'))) {
      hasRenderedGeneralTermsHeading = true;
      blocks.push({
        id: 'heading_general_terms',
        type: 'main_heading',
        keepWithNext: true,
        render: () => (
          <div key="heading_general_terms" style={{ fontWeight: 'bold', fontSize: '11pt', marginTop: '4px', marginBottom: '2px' }}>
            General Terms &amp; Conditions
          </div>
        )
      });
    }

    // Decompose Section HTML into Granular Atomic Blocks
    const isComplianceMain = section.presetKey === 'compliance_requirements' || (section.title && section.title.includes('Management System Compliance Requirements'));
    const isLegacyMergedSection = section.presetKey === 'decision_rule_disposal' || (section.title && section.title.includes('Decision Rule Application & Sample Disposal'));

    // If section has a main title that is not suppressed
    if (section.title && !isLegacyMergedSection) {
      blocks.push({
        id: `sec_title_${section.id || sIdx}`,
        type: isComplianceMain ? 'main_heading' : 'sub_heading',
        keepWithNext: true,
        render: () => (
          <div
            key={`sec_title_${section.id || sIdx}`}
            style={{
              fontWeight: 'bold',
              fontSize: isComplianceMain ? '11pt' : '10.5pt',
              marginTop: isComplianceMain ? '5px' : '3px',
              marginBottom: '2px',
            }}
          >
            {section.title}
          </div>
        )
      });
    }

    // Parse section content into DOM elements for granular chunking
    if (typeof window !== 'undefined' && window.DOMParser) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(section.content, 'text/html');
        const childNodes = Array.from(doc.body.childNodes).filter(node => node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim().length > 0));

        childNodes.forEach((node, nodeIdx) => {
          const tagName = node.nodeName ? node.nodeName.toUpperCase() : '';
          const htmlContent = node.outerHTML || node.textContent;

          // Check if this child node is a sub-heading paragraph like <p><strong>1. Confidentiality...</strong></p>
          const isSubHeadingP = tagName === 'P' && (node.querySelector('strong') || node.querySelector('b')) && /^\s*(\d+\.|\bNOTE\b|[A-Z][a-zA-Z\s&]+)/i.test(node.textContent.trim());

          if (isSubHeadingP) {
            blocks.push({
              id: `sec_${section.id || sIdx}_node_${nodeIdx}`,
              type: 'sub_heading',
              keepWithNext: true,
              render: () => (
                <div
                  key={`sec_${section.id || sIdx}_node_${nodeIdx}`}
                  style={{ fontWeight: 'bold', fontSize: '10.5pt', marginTop: '2px', marginBottom: '1px' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                />
              )
            });
          } else if (tagName === 'UL' || tagName === 'OL') {
            // Split top-level <li> elements into individual atomic bullet blocks
            const liNodes = Array.from(node.children).filter(child => child.tagName === 'LI');
            if (liNodes.length > 0) {
              liNodes.forEach((li, liIdx) => {
                blocks.push({
                  id: `sec_${section.id || sIdx}_node_${nodeIdx}_li_${liIdx}`,
                  type: 'list_bullet',
                  render: () => (
                    <ul
                      key={`sec_${section.id || sIdx}_node_${nodeIdx}_li_${liIdx}`}
                      className="gt-list"
                      style={{
                        listStyleType: 'disc',
                        paddingLeft: '16px',
                        margin: '1px 0',
                      }}
                    >
                      <li
                        style={{ lineHeight: 1.30, marginBottom: '1px' }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(li.innerHTML) }}
                      />
                    </ul>
                  )
                });
              });
            } else {
              blocks.push({
                id: `sec_${section.id || sIdx}_node_${nodeIdx}`,
                type: 'list_block',
                render: () => (
                  <div
                    key={`sec_${section.id || sIdx}_node_${nodeIdx}`}
                    className="doc-section-rich-content"
                    style={{ fontSize: '10pt', lineHeight: 1.30, marginBottom: '1px' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                  />
                )
              });
            }
          } else {
            // General paragraph or italic note
            const isItalicNote = node.querySelector('em') || node.querySelector('i');
            blocks.push({
              id: `sec_${section.id || sIdx}_node_${nodeIdx}`,
              type: isItalicNote ? 'italic_note' : 'paragraph',
              render: () => (
                <div
                  key={`sec_${section.id || sIdx}_node_${nodeIdx}`}
                  className="doc-section-rich-content"
                  style={{
                    fontSize: isItalicNote ? '9.5pt' : '10pt',
                    fontStyle: isItalicNote ? 'italic' : 'normal',
                    lineHeight: 1.30,
                    marginTop: isItalicNote ? '2px' : '1px',
                    marginBottom: isItalicNote ? '4px' : '1px',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
                />
              )
            });
          }
        });
      } catch (e) {
        // Fallback if parsing fails
        blocks.push({
          id: `sec_fallback_${section.id || sIdx}`,
          type: 'section_item',
          render: () => (
            <div
              key={`sec_fallback_${section.id || sIdx}`}
              className="doc-section-rich-content"
              style={{ fontSize: '10pt', lineHeight: 1.30, marginBottom: '1px' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
            />
          )
        });
      }
    } else {
      // Direct render if not in browser environment
      blocks.push({
        id: `sec_${section.id || sIdx}`,
        type: 'section_item',
        render: () => (
          <div
            key={`sec_${section.id || sIdx}`}
            className="doc-section-rich-content"
            style={{ fontSize: '10pt', lineHeight: 1.30, marginBottom: '1px' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
          />
        )
      });
    }
  });

  // Fallback: If GST note was not triggered by sample_requirements, add it
  if (!hasRenderedGstNote) {
    blocks.push({
      id: 'block_gst_note_fallback',
      type: 'gst_note',
      render: () => (
        <div key="block_gst_note_fallback" style={{ fontSize: '10pt', marginTop: '2px', marginBottom: '3px' }}>
          <span style={{ fontWeight: 'bold' }}>NOTE:</span>
          <div style={{ paddingLeft: '14px', fontWeight: 'bold' }}>
            A. {notes.gstNote || `${notes.gstPercent || 18}% GST will be charged as applicable (extra).`}
          </div>
        </div>
      )
    });
  }

  // 3. Final Prepared By & Bank Details Box
  blocks.push({
    id: 'block_bank_signature',
    type: 'bank_signature',
    render: () => (
      <div key="block_bank_signature" style={{ marginTop: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '9.5pt' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '3px 6px', fontWeight: 'bold', width: '42%', textAlign: 'left', background: '#f8fafc' }}>
                Quotation Prepared By:
              </td>
              <td style={{ border: '1px solid #000000', padding: '3px 6px', fontWeight: 'bold', width: '58%', textAlign: 'left', background: '#f8fafc' }}>
                Bank Details:
              </td>
            </tr>
            <tr>
              {/* Left: Prepared By & Signature */}
              <td style={{ border: '1px solid #000000', padding: '5px 7px', verticalAlign: 'top' }}>
                <div style={{ marginBottom: '2px' }}><strong>Service Tax No.:</strong> {lab.serviceTaxNo || '-'}</div>
                <div style={{ marginBottom: '5px' }}><strong>PAN No.:</strong> {lab.panNo || '-'}</div>

                {isSigRequired ? (
                  <div style={{ marginTop: '5px', textAlign: 'center' }}>
                    {sigImage ? (
                      <div style={{ minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
                        <img
                          src={sigImage}
                          alt="Authorized Signature"
                          style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '8.5pt', fontStyle: 'italic' }}>
                        (Signature Line)
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #000000', paddingTop: '2px', fontWeight: 'bold', fontSize: '9.5pt' }}>
                      {sigName}
                    </div>
                    <div style={{ fontSize: '8.5pt', color: '#475569' }}>
                      {sigDesignation}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '8.5pt', color: '#334155' }}>
                    {signatureDisclaimer}
                  </div>
                )}
              </td>

              {/* Right: Bank Details */}
              <td style={{ border: '1px solid #000000', padding: '5px 7px', verticalAlign: 'top' }}>
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
      </div>
    )
  });

  // Real Dynamic Height Measurement & Pagination Execution
  useLayoutEffect(() => {
    const measureAndPaginate = () => {
      if (!measureContainerRef.current) return;
      const elements = measureContainerRef.current.children;
      if (!elements || elements.length === 0) return;

      // Available inner page height thresholds:
      // Page 1: fits up to end of 2. Payment Terms (~820px)
      // Page 2 & onward: fills page cleanly within frame (~865px)
      const MAX_PAGE_HEIGHT_P1 = 820;
      const MAX_PAGE_HEIGHT_DEFAULT = 865;

      const pages = [];
      let currentPageBlocks = [];
      let currentHeight = 0;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const pageLimit = pages.length === 0 ? MAX_PAGE_HEIGHT_P1 : MAX_PAGE_HEIGHT_DEFAULT;

        if (block.type === 'page_break') {
          if (currentPageBlocks.length > 0) {
            pages.push(currentPageBlocks);
            currentPageBlocks = [];
            currentHeight = 0;
          }
          continue;
        }

        const el = elements[i];
        const elHeight = el ? el.getBoundingClientRect().height : 30;

        // Check if next block needs to be kept with current heading
        let blockTotalHeight = elHeight;
        if (block.keepWithNext && i + 1 < blocks.length) {
          const nextEl = elements[i + 1];
          blockTotalHeight += nextEl ? nextEl.getBoundingClientRect().height : 30;
        }

        if (currentHeight + blockTotalHeight > pageLimit && currentPageBlocks.length > 0) {
          pages.push(currentPageBlocks);
          currentPageBlocks = [block];
          currentHeight = elHeight;
        } else {
          currentPageBlocks.push(block);
          currentHeight += elHeight;
        }
      }

      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
      }

      setPaginatedPages(pages.length > 0 ? pages : [blocks]);
      window.__PRINT_READY__ = true;
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setTimeout(measureAndPaginate, 60);
      });
    } else {
      setTimeout(measureAndPaginate, 60);
    }
  }, [data, lineItems, allSections, notes, signature, logoUrl]);

  // Fallback initial distribution if not yet measured
  const displayPages = paginatedPages || [blocks];
  const totalPages = displayPages.length;

  return (
    <div className="general-testing-quotation-root">
      {/* Hidden Measurement Container for exact DOM height measuring */}
      <div
        ref={measureContainerRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-99999px',
          left: '-99999px',
          width: '190mm', // Exact inner frame width
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif',
          fontSize: '10.5pt',
          lineHeight: 1.35,
          color: '#000000',
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} className="measure-block">
            {block.render ? block.render() : null}
          </div>
        ))}
      </div>

      {/* Rendered Discrete A4 Pages */}
      {displayPages.map((pageBlocks, pIdx) => (
        <PageContainer
          key={pIdx}
          pageNumber={pIdx + 1}
          totalPages={totalPages}
          watermarkEnabled={watermarkEnabled}
          logoUrl={logoUrl}
          isPrintMode={isPrintMode}
        >
          {pageBlocks.map((block) => (block.render ? block.render() : null))}
        </PageContainer>
      ))}
    </div>
  );
};

export default GeneralTestingDocument;
