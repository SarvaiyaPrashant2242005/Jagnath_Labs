import React from 'react';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';
import { BACKEND_ROOT_URL } from '../../../shared/services/apiEndpoints';

/**
 * Format date as DD/MM/YYYY
 */
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}/${month}/${year}`;
    }
  }
  return dateStr;
};

/**
 * Determines whether result exceeds permissible limit to render bold.
 */
export const shouldBoldResult = (resultStr, limitStr) => {
  if (!resultStr || !limitStr) return false;
  const resClean = String(resultStr).trim();
  const limClean = String(limitStr).trim();
  if (resClean === limClean || limClean === '-' || limClean === 'N/A' || limClean.toLowerCase() === 'applicable') return false;

  const parseNumber = (str) => {
    const match = str.replace(/,/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
    return match ? parseFloat(match[0]) : null;
  };

  const resVal = parseNumber(resClean);
  if (resVal === null) return false;

  const rangeMatch = limClean.match(/([-+]?[0-9]*\.?[0-9]+)\s*(?:-|to)\s*([-+]?[0-9]*\.?[0-9]+)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return resVal < min || resVal > max;
  }

  if (/(?:<|<=|max|below|less)/i.test(limClean)) {
    const limVal = parseNumber(limClean);
    if (limVal !== null) return resVal > limVal;
  }

  if (/(?:>|>=|min|above|more)/i.test(limClean)) {
    const limVal = parseNumber(limClean);
    if (limVal !== null) return resVal < limVal;
  }

  const simpleLimVal = parseNumber(limClean);
  if (simpleLimVal !== null && !isNaN(simpleLimVal)) {
    return resVal > simpleLimVal;
  }

  return false;
};

/**
 * Resolves standard dynamic logo URL with fallback
 */
export const resolveLogoUrl = (report, company) => {
  const rawLogo = report?.companyLogo || company?.test_report_logo || company?.logo || '/Images/Navbar_Logo.png';
  if (!rawLogo) return '/Images/Navbar_Logo.png';
  if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('/Images/') || rawLogo.startsWith('/images/')) {
    return rawLogo;
  }
  const cleanPath = rawLogo.replace(/\\/g, '/');
  const idx = cleanPath.lastIndexOf('uploads/');
  if (idx !== -1) {
    return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
  }
  return `${BACKEND_ROOT_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

/**
 * Splits parameter list into pages based on document capacity:
 * - Single-page report: if total parameters <= 8, everything (header, metadata, parameters, terms, signatures, footer) fits on 1 page.
 * - Multi-page report: Page 1 holds metadata table + up to 18 parameters.
 *   Subsequent continuation pages hold up to 26 parameters each, with the last page holding remaining parameters + terms + signatures + footer.
 */
export const paginateParameters = (paramsList = []) => {
  const total = paramsList.length;
  if (total <= 8) {
    return [paramsList];
  }

  const pages = [];
  // Page 1: metadata table is present
  const page1Items = paramsList.slice(0, 18);
  pages.push(page1Items);

  let remaining = paramsList.slice(18);
  while (remaining.length > 0) {
    // If remaining can fit along with terms + signatures on the final page (<= 14 items)
    if (remaining.length <= 14) {
      pages.push(remaining);
      break;
    }
    // If remaining is larger than 14, take 25 items for intermediate continuation page
    const chunk = remaining.slice(0, 25);
    pages.push(chunk);
    remaining = remaining.slice(25);
  }

  return pages;
};

/**
 * Reusable Right-Aligned Official Footer Component
 * Conforms strictly to user request:
 * 1. Move the complete address and contact information block to the RIGHT side of the page (margin-left: auto).
 * 2. Keep the address on the right-side left column and email, website, and phone in the right-side adjacent column.
 * 3. Right-align the company designation/tagline below the green separator line.
 * 4. Maintain existing icons, colors, typography, spacing and watermark.
 */
export const ReportFooter = () => (
  <div
    className="letterhead-footer-section"
    style={{
      fontFamily: 'sans-serif',
      fontSize: '0.74rem',
      marginTop: 'auto',
      paddingTop: '10px',
      paddingBottom: '4px',
      width: '100%'
    }}
  >
    {/* Address & Contact Columns Right-Aligned */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        gap: '24px',
        flexWrap: 'wrap',
        marginLeft: 'auto',
        marginBottom: '4px'
      }}
    >
      {/* Address Column */}
      <div style={{ color: '#047857', fontWeight: 600, lineHeight: 1.35, textAlign: 'left' }}>
        <div>📍 5-6/B, Nayanjyot Chambers,</div>
        <div style={{ paddingLeft: '16px' }}>First Floor, Opp. Vachhera Vada,</div>
        <div style={{ paddingLeft: '16px' }}>Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
      </div>

      {/* Contact Details Column */}
      <div style={{ color: '#047857', fontWeight: 600, lineHeight: 1.35, textAlign: 'left' }}>
        <div>✉ jagnathtechnologies@yahoo.com</div>
        <div>🌐 www.jagnath.com</div>
        <div>📞 +91 8140 5555 15</div>
      </div>
    </div>

    {/* Green Horizontal Separator */}
    <div style={{ borderTop: '1.2px solid #059669', margin: '4px 0 3px 0' }} />

    {/* GPCB Schedule-II Auditors Tagline Right-Aligned */}
    <div
      style={{
        textAlign: 'right',
        fontSize: '0.76rem',
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginTop: '2px',
        letterSpacing: '0.2px'
      }}
    >
      Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
    </div>
  </div>
);

/**
 * Reusable Metadata Identification Table (Page 1)
 */
export const ReportMetadataTable = ({ report }) => (
  <table
    className="tr-meta-table"
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.74rem',
      border: '1px solid #000000',
      marginBottom: '0',
      tableLayout: 'fixed', wordBreak: 'break-word'
    }}
  >
    <colgroup>
      <col style={{ width: '32%' }} />
      <col style={{ width: '28%' }} />
      <col style={{ width: '22%' }} />
      <col style={{ width: '18%' }} />
    </colgroup>
    <tbody>
      <tr>
        <td
          colSpan={2}
          rowSpan={2}
          style={{
            border: '1px solid #000000',
            padding: '2.5px 5px',
            fontWeight: 'bold',
            fontSize: '0.82rem',
            verticalAlign: 'middle'
          }}
        >
          D- {report?.reportNumber || report?.referenceNo || 'N/A'}
        </td>
        <td
          colSpan={2}
          style={{
            border: '1px solid #000000',
            padding: '2.5px 5px',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '0.8rem'
          }}
        >
          {report?.formatNo || 'Format No. 7.8 F-02'}
        </td>
      </tr>
      <tr>
        <td
          colSpan={2}
          style={{
            border: '1px solid #000000',
            padding: '2.5px 5px',
            textAlign: 'left',
            fontWeight: 'bold',
            fontSize: '0.8rem'
          }}
        >
          Date: - {formatDateDDMMYYYY(report?.formatDate || report?.dateOfReceipt || new Date().toISOString())}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Name of Work</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px', fontWeight: 'bold' }}>
          {report?.nameOfWork || report?.title || '-'}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Details of sample/Mode of Packing</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>
          {report?.detailsOfSample && report?.packingDetails
            ? `${report.detailsOfSample} / ${report.packingDetails}`
            : (report?.packingDetails || report?.detailsOfSample || '-')}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px', verticalAlign: 'top' }}>Report Issued To</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>
          {report?.reportIssuedTo || report?.agencyName || '-'}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Reference No. / Report No.</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px', fontWeight: 'bold' }}>
          {report?.reportNumber || report?.referenceNo || '-'}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Date of Sampling</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{formatDateDDMMYYYY(report?.dateOfSampling) || '-'}</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Date of Receipt</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{formatDateDDMMYYYY(report?.dateOfReceipt)}</td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px', verticalAlign: 'top' }}>Name of Agency/Company</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>
          <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>
            {report?.agencyName || (report?.reportIssuedTo ? report.reportIssuedTo.split('\n')[0] : '')}
          </div>
          {report?.agencyAddress && (
            <div style={{ fontSize: '0.7rem', marginTop: '1px', whiteSpace: 'pre-wrap' }}>
              {report.agencyAddress}
            </div>
          )}
        </td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Sample Quantity</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{report?.sampleQuantity || '-'}</td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Sampling Location / Type</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{report?.samplingLocation || '-'}</td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Condition of sample during receipt</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{report?.conditionOnReceipt || 'Satisfactory'}</td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Sample Collected / Submitted by.</td>
        <td colSpan={3} style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{report?.sampleCollectedBy || '-'}</td>
      </tr>

      <tr>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Starting Date Of Test/ Analysis</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{formatDateDDMMYYYY(report?.startingDateOfTest)}</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>Completion Date of Test</td>
        <td style={{ border: '1px solid #000000', padding: '2.5px 5px' }}>{formatDateDDMMYYYY(report?.completionDateOfTest)}</td>
      </tr>
    </tbody>
  </table>
);

/**
 * Reusable Parameter Table Component
 */
export const ReportParametersTable = ({ paramsList, showLimits, borderTopNone = true }) => (
  <table
    className="tr-params-table"
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.74rem',
      border: '1px solid #000000',
      borderTop: borderTopNone ? 'none' : '1px solid #000000',
      marginBottom: '0',
      tableLayout: 'fixed', wordBreak: 'break-word'
    }}
  >
    <thead>
      <tr style={{ textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
        <th style={{ width: '8%', padding: '3px 2px', borderRight: '1px solid #000000', textAlign: 'center' }}>SR.NO.</th>
        <th style={{ width: showLimits ? '28%' : '38%', padding: '3px 4px', borderRight: '1px solid #000000', textAlign: 'center' }}>TESTS PARAMETERS</th>
        <th style={{ width: showLimits ? '25%' : '34%', padding: '3px 4px', borderRight: '1px solid #000000', textAlign: 'center' }}>REFERENCE METHOD</th>
        <th style={{ width: '11%', padding: '3px 2px', borderRight: '1px solid #000000', textAlign: 'center' }}>UNIT</th>
        <th style={{ width: '13%', padding: '3px 2px', borderRight: showLimits ? '1px solid #000000' : 'none', textAlign: 'center' }}>RESULTS</th>
        {showLimits && (
          <th style={{ width: '15%', padding: '2px 2px', textAlign: 'center' }}>
            PERMISSIBLE LIMIT <br />
            <span style={{ fontSize: '0.62rem', fontWeight: 'normal' }}>(IS 10500:2012)</span>
          </th>
        )}
      </tr>
    </thead>
    <tbody>
      {paramsList.length === 0 ? (
        <tr>
          <td colSpan={showLimits ? 6 : 5} style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>
            No testing parameters recorded.
          </td>
        </tr>
      ) : (
        paramsList.map((param, index) => {
          const isBold = shouldBoldResult(param.result, param.permissibleLimit);
          return (
            <tr key={index} style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ textAlign: 'center', padding: '2.5px 2px', borderRight: '1px solid #000000' }}>
                {param.srNo || String(index + 1).padStart(2, '0')}
              </td>
              <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold', textAlign: 'left' }}>
                {sanitizeSamplingParamName(param.parameterName) || '-'}
              </td>
              <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', textAlign: 'center' }}>
                {param.referenceMethod || '-'}
              </td>
              <td style={{ padding: '2.5px 2px', borderRight: '1px solid #000000', textAlign: 'center' }}>
                {param.unit || '-'}
              </td>
              <td style={{ padding: '2.5px 2px', borderRight: showLimits ? '1px solid #000000' : 'none', textAlign: 'center', fontWeight: isBold ? 'bold' : 'normal' }}>
                {param.result || '-'}
              </td>
              {showLimits && (
                <td style={{ padding: '2.5px 2px', textAlign: 'center' }}>
                  {param.permissibleLimit || '-'}
                </td>
              )}
            </tr>
          );
        })
      )}
    </tbody>
  </table>
);

/**
 * Reusable Signatures and Closing Section (Final Page Only)
 */
export const ReportClosingSection = ({ report, termsText }) => (
  <div className="tr-closing-container">
    {/* Terms & Conditions Section */}
    <div
      style={{
        border: '1px solid #000000',
        borderTop: 'none',
        padding: '4px 6px',
        fontSize: '0.58rem',
        lineHeight: '1.2',
        textAlign: 'justify'
      }}
    >
      <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '1px' }}>
        This Report is Issued Under Following Terms & Conditions:
      </div>
      <div>{termsText}</div>
    </div>

    {/* Signatures & Reviewer Block */}
    <div
      style={{
        border: '1px solid #000000',
        borderTop: 'none',
        padding: '5px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        minHeight: '85px'
      }}
    >
      {/* Left Side: Reviewed by & Analyst Photo / Signature */}
      <div style={{ textAlign: 'left', minWidth: '180px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>Reviewed by,</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#1e293b' }}>
          ({report?.reviewedByAnalyst || 'Sr. Analyst / Analyst'})
        </div>

        {/* Analyst Photograph / Signature */}
        <div style={{ margin: '4px 0', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
          {report?.reviewedBySignature ? (
            <img
              src={report.reviewedBySignature}
              alt="Reviewed By"
              style={{ maxHeight: '45px', maxWidth: '120px', objectFit: 'contain' }}
            />
          ) : report?.analystPhoto ? (
            <img
              src={report.analystPhoto}
              alt="Analyst"
              style={{ maxHeight: '45px', maxWidth: '40px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #cbd5e1' }}
            />
          ) : (
            <div style={{ height: '35px' }} />
          )}
        </div>

        <div style={{ fontWeight: 'bold', fontSize: '0.72rem', marginTop: '1px' }}>
          Lab Incharge Signatory.
        </div>
      </div>



      {/* Right Side: Thanking you & Authorized Signatory */}
      <div style={{ textAlign: 'right', minWidth: '220px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>Thanking you in anticipation</div>
        <div style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>For Jagnath Lab Technologies,</div>

        {/* Authorized Signature */}
        <div style={{ margin: '4px 0', minHeight: '38px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {report?.signatureImage ? (
            <img
              src={report.signatureImage}
              alt="Authorized Signature"
              style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ height: '35px' }} />
          )}
        </div>

        <div style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>
          ({report?.authorizedSignatory || 'prashant'})
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '0.68rem', color: '#0f172a' }}>
          ({report?.authorizedSignatoryPersons || 'Mr. Parvin Raiyani / Mr. Ankit Rathod'})
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '0.72rem' }}>
          Authorized Signatory
        </div>
      </div>
    </div>

    {/* End of Test Report Divider */}
    <div
      style={{
        textAlign: 'center',
        fontSize: '0.64rem',
        fontWeight: 'bold',
        margin: '4px 0',
        letterSpacing: '0.5px'
      }}
    >
      ----------------------------- END OF TEST REPORT -----------------------------
    </div>
  </div>
);

/**
 * TestReportDocument
 * DYNAMIC MULTI-PAGE IMPLEMENTATION
 * Used for Live Preview, Browser Print, and PDF Exports.
 */
export const TestReportDocument = ({
  report = {},
  parameters = [],
  company = null,
  withHeaderFooter = true,
  isPrintMode = false,
  containerStyle = {}
}) => {
  const paramsList = Array.isArray(parameters) && parameters.length > 0
    ? parameters
    : (Array.isArray(report?.parametersList) ? report.parametersList : []);

  const logoUrl = resolveLogoUrl(report, company);
  const showLimits = report?.showPermissibleLimits !== false;

  const defaultTerms = "The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT. We are authorized to take strict action if the data and result of report is to be changed/corrected by any external source or body. Report varies according to samples and their composition of the materials. JLT's strictly maintains confidentiality of all the test results and analysis and customer supplied products/samples and will not reveal this information to third party unless required for statutory/legal compliance. The report is referring only to the tested sample and for applicable parameters. The sample is destroyed after retention time (15 Days) unless otherwise specified specially. Subject to Gondal Jurisdiction.";

  const termsText = report?.termsAndConditions || defaultTerms;
  const categoryHeading = report?.sectionHeader || report?.nameOfWork || 'TEST REPORT';

  const pages = paginateParameters(paramsList);

  return (
    <div className="test-report-multi-pages-wrapper" style={{ width: '100%' }}>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <div
            key={pageIdx}
            className="test-report-document-container letterhead-sheet"
            style={{
              width: '100%',
              maxWidth: isPrintMode ? '210mm' : '100%',
              minHeight: '297mm',
              display: 'flex',
              flexDirection: 'column',
              margin: pageIdx > 0 ? (isPrintMode ? '0' : '20px auto 0 auto') : '0 auto',
              padding: isPrintMode ? '8mm 12mm' : '8mm 12mm',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: 1.25,
              position: 'relative',
              boxShadow: isPrintMode ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: isPrintMode ? 'none' : '1px solid #e2e8f0',
              borderRadius: isPrintMode ? '0' : '8px',
              pageBreakAfter: isLastPage ? 'auto' : 'always',
              breakAfter: isLastPage ? 'auto' : 'page',
              ...containerStyle
            }}
          >
            {/* 1. Official Jagnath Labs Emblem Watermark on EVERY page */}
            <img
              src="/images/letterpad_watermark.png"
              alt="Watermark"
              className="letterhead-watermark"
              style={{
                position: 'absolute',
                left: '-30px',
                top: '50%',
                bottom: 'auto',
                transform: 'translateY(-50%)',
                width: '470px',
                maxWidth: '58%',
                height: 'auto',
                objectFit: 'contain',
                opacity: 0.88,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 0
              }}
            />

            {/* 2. Foreground Document Content Layer */}
            <div
              className="letterhead-content"
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header Logo on EVERY page */}
              {withHeaderFooter ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', minHeight: '78px', marginBottom: '8px' }}>
                  <img
                    src={logoUrl}
                    alt="Jagnath Lab Technologies"
                    style={{
                      height: '90px',
                      maxWidth: '300px',
                      objectFit: 'contain',
                      display: 'block',
                      marginLeft: '-35px'
                    }}
                  />
                </div>
              ) : (
                <div style={{ height: '48px', marginBottom: '8px' }} />
              )}

              {/* Report Title on EVERY page */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  marginTop: '4px',
                  marginBottom: '10px',
                  letterSpacing: '0.5px'
                }}
              >
                TEST REPORT
              </div>

              {/* Identification Metadata Table (Only on Page 1) */}
              {isFirstPage && (
                <ReportMetadataTable report={report} />
              )}

              {/* Section Heading Banner (e.g. WATER (NATURAL) or PANIPURI) */}
              {isFirstPage && (
                <div
                  style={{
                    borderLeft: '1px solid #000000',
                    borderRight: '1px solid #000000',
                    borderBottom: '1px solid #000000',
                    backgroundColor: '#ffffff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    padding: '3px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  <u>{categoryHeading}</u>
                </div>
              )}

              {/* Parameters Table on this page */}
              <ReportParametersTable
                paramsList={pageItems}
                showLimits={showLimits}
                borderTopNone={isFirstPage}
              />

              {/* Final Page Elements ONLY: Terms, Signatures, End Divider */}
              {isLastPage && (
                <ReportClosingSection report={report} termsText={termsText} />
              )}

              {/* Official Letterhead Footer ONLY ON FINAL PAGE */}
              {withHeaderFooter && isLastPage && (
                <ReportFooter />
              )}

              {/* Blank spacing on non-final pages */}
              {(!isLastPage || !withHeaderFooter) && (
                <div style={{ height: '18px', marginTop: 'auto' }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TestReportDocument;

/**
 * Generates raw HTML string for Browser Print & PDF export across dynamic multi-page documents.
 */
export const generateTestReportHtml = (report = {}, parameters = [], options = {}) => {
  const {
    withHeaderFooter = true,
    company = null,
    isSingleDoc = true,
    pageBreak = true
  } = options;

  const paramsList = Array.isArray(parameters) && parameters.length > 0
    ? parameters
    : (Array.isArray(report?.parametersList) ? report.parametersList : []);

  const logoUrl = resolveLogoUrl(report, company);
  const showLimits = report?.showPermissibleLimits !== false;

  const defaultTerms = "The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT. We are authorized to take strict action if the data and result of report is to be changed/corrected by any external source or body. Report varies according to samples and their composition of the materials. JLT's strictly maintains confidentiality of all the test results and analysis and customer supplied products/samples and will not reveal this information to third party unless required for statutory/legal compliance. The report is referring only to the tested sample and for applicable parameters. The sample is destroyed after retention time (15 Days) unless otherwise specified specially. Subject to Gondal Jurisdiction.";

  const termsText = report?.termsAndConditions || defaultTerms;
  const categoryHeading = report?.sectionHeader || report?.nameOfWork || 'TEST REPORT';

  const pages = paginateParameters(paramsList);

  return pages.map((pageItems, pageIdx) => {
    const isFirstPage = pageIdx === 0;
    const isLastPage = pageIdx === pages.length - 1;

    const paramRows = pageItems.length === 0
      ? `<tr><td colspan="${showLimits ? 6 : 5}" style="padding: 10px; text-align: center; color: #64748b; border: 1px solid #000;">No testing parameters recorded.</td></tr>`
      : pageItems.map((param, index) => {
        const isBold = shouldBoldResult(param.result, param.permissibleLimit);
        return `
            <tr style="border-bottom: 1px solid #000000;">
              <td style="text-align: center; padding: 2.5px 2px; border: 1px solid #000000;">${param.srNo || String(index + 1).padStart(2, '0')}</td>
              <td style="padding: 2.5px 5px; border: 1px solid #000000; font-weight: bold; text-align: left;">${sanitizeSamplingParamName(param.parameterName) || '-'}</td>
              <td style="padding: 2.5px 5px; border: 1px solid #000000; text-align: center;">${param.referenceMethod || '-'}</td>
              <td style="padding: 2.5px 2px; border: 1px solid #000000; text-align: center;">${param.unit || '-'}</td>
              <td style="padding: 2.5px 2px; border: 1px solid #000000; text-align: center; font-weight: ${isBold ? 'bold' : 'normal'};">${param.result || '-'}</td>
              ${showLimits ? `<td style="padding: 2.5px 2px; border: 1px solid #000000; text-align: center;">${param.permissibleLimit || '-'}</td>` : ''}
            </tr>
          `;
      }).join('');

    return `
      <div class="test-report-page letterhead-sheet" style="position: relative; ${(!isLastPage || pageBreak) ? 'page-break-after: always; break-after: page;' : ''} padding: 8mm 12mm; box-sizing: border-box; width: 210mm; min-height: 297mm; display: flex; flex-direction: column; margin: 0 auto; background-color: #ffffff; background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 21px, rgba(16, 185, 129, 0.07) 22px); font-family: 'Times New Roman', Times, serif; color: #000000; line-height: 1.25; overflow: hidden;">
        <!-- Background Watermark Image on EVERY page -->
        <img
          src="/images/letterpad_watermark.png"
          alt="Watermark"
          class="letterhead-watermark"
          style="position: absolute; left: -30px; top: 50%; bottom: auto; transform: translateY(-50%); width: 470px; max-width: 58%; height: auto; object-fit: contain; opacity: 0.88; mix-blend-mode: multiply; pointer-events: none; user-select: none; z-index: 0;"
        />

        <!-- Foreground Content -->
        <div class="letterhead-content" style="position: relative; z-index: 1; width: 100%; height: 100%; flex-grow: 1; display: flex; flex-direction: column;">
          <!-- Header Logo on EVERY page -->
          ${withHeaderFooter ? `
            <div style="display: flex; justify-content: flex-start; align-items: center; min-height: 78px; margin-bottom: 8px;">
              <img src="${logoUrl}" alt="Company Logo" style="height: 78px; max-width: 300px; object-fit: contain; display: block;" />
            </div>
          ` : `<div style="height: 48px; margin-bottom: 8px;"></div>`}

          <!-- Document Title on EVERY page -->
          <div style="text-align: center; font-size: 1.25rem; font-weight: bold; text-decoration: underline; margin-top: 4px; margin-bottom: 10px; letter-spacing: 0.5px;">
            TEST REPORT
          </div>

          <!-- Identification Table (Page 1 Only) -->
          ${isFirstPage ? `
            <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; border: 1px solid #000000; margin-bottom: 0; table-layout: fixed;">
              <colgroup>
                <col style="width: 32%" />
                <col style="width: 28%" />
                <col style="width: 22%" />
                <col style="width: 18%" />
              </colgroup>
              <tbody>
                <tr>
                  <td colspan="2" rowspan="2" style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold; font-size: 0.82rem; vertical-align: middle;">
                    D- ${report?.reportNumber || report?.referenceNo || 'N/A'}
                  </td>
                  <td colspan="2" style="border: 1px solid #000000; padding: 2.5px 5px; text-align: left; font-weight: bold; font-size: 0.8rem;">
                    ${report?.formatNo || 'Format No. 7.8 F-02'}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000000; padding: 2.5px 5px; text-align: left; font-weight: bold; font-size: 0.8rem;">
                    Date: - ${formatDateDDMMYYYY(report?.formatDate || report?.dateOfReceipt || new Date().toISOString())}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Name of Work</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">${report?.nameOfWork || report?.title || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Details of sample/Mode of Packing</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">
                    ${report?.detailsOfSample && report?.packingDetails ? `${report.detailsOfSample} / ${report.packingDetails}` : (report?.packingDetails || report?.detailsOfSample || '-')}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px; vertical-align: top;">Report Issued To</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold; white-space: pre-wrap;">${report?.reportIssuedTo || report?.agencyName || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Reference No. / Report No.</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">${report?.reportNumber || report?.referenceNo || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Date of Sampling</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">${formatDateDDMMYYYY(report?.dateOfSampling) || '-'}</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Date of Receipt</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">${formatDateDDMMYYYY(report?.dateOfReceipt)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px; vertical-align: top;">Name of Agency/Company</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">
                    <div style="font-weight: bold; white-space: pre-wrap;">${report?.agencyName || (report?.reportIssuedTo ? report.reportIssuedTo.split('\n')[0] : '')}</div>
                    ${report?.agencyAddress ? `<div style="font-size: 0.7rem; margin-top: 1px; white-space: pre-wrap;">${report.agencyAddress}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sample Quantity</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">${report?.sampleQuantity || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sampling Location / Type</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">${report?.samplingLocation || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Condition of sample during receipt</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">${report?.conditionOnReceipt || 'Satisfactory'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sample Collected / Submitted by.</td>
                  <td colspan="3" style="border: 1px solid #000000; padding: 2.5px 5px;">${report?.sampleCollectedBy || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Starting Date Of Test/ Analysis</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">${formatDateDDMMYYYY(report?.startingDateOfTest)}</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">Completion Date of Test</td>
                  <td style="border: 1px solid #000000; padding: 2.5px 5px;">${formatDateDDMMYYYY(report?.completionDateOfTest)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Section Heading Banner -->
            <div style="border-left: 1px solid #000000; border-right: 1px solid #000000; border-bottom: 1px solid #000000; background-color: #ffffff; text-align: center; font-weight: bold; font-size: 0.85rem; padding: 3px 0; text-transform: uppercase; letter-spacing: 0.5px;">
              <u>${categoryHeading}</u>
            </div>
          ` : ''}

          <!-- Parameters Table on this page -->
          <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; border: 1px solid #000000; ${isFirstPage ? 'border-top: none;' : ''} margin-bottom: 0; table-layout: fixed;">
            <thead>
              <tr style="text-align: center; font-weight: bold; border-bottom: 1px solid #000000;">
                <th style="width: 8%; padding: 3px 2px; border: 1px solid #000000; text-align: center;">SR.NO.</th>
                <th style="width: ${showLimits ? '28%' : '38%'}; padding: 3px 4px; border: 1px solid #000000; text-align: center;">TESTS PARAMETERS</th>
                <th style="width: ${showLimits ? '25%' : '34%'}; padding: 3px 4px; border: 1px solid #000000; text-align: center;">REFERENCE METHOD</th>
                <th style="width: 11%; padding: 3px 2px; border: 1px solid #000000; text-align: center;">UNIT</th>
                <th style="width: 13%; padding: 3px 2px; border: 1px solid #000000; text-align: center;">RESULTS</th>
                ${showLimits ? `
                  <th style="width: 15%; padding: 2px 2px; border: 1px solid #000000; text-align: center;">
                    PERMISSIBLE LIMIT <br />
                    <span style="font-size: 0.62rem; font-weight: normal;">(IS 10500:2012)</span>
                  </th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${paramRows}
            </tbody>
          </table>

          <!-- Final Page ONLY Elements: Terms, Signatures, End Divider -->
          ${isLastPage ? `
            <!-- Terms & Conditions Section -->
            <div style="border: 1px solid #000000; border-top: none; padding: 4px 6px; font-size: 0.58rem; line-height: 1.2; text-align: justify;">
              <div style="font-weight: bold; text-decoration: underline; margin-bottom: 1px;">
                This Report is Issued Under Following Terms & Conditions:
              </div>
              <div>${termsText}</div>
            </div>

            <!-- Signatures Row -->
            <div style="border: 1px solid #000000; border-top: none; padding: 5px 8px; display: flex; justify-content: space-between; align-items: flex-start; min-height: 85px;">
              <!-- Left Side: Reviewed by -->
              <div style="text-align: left; min-width: 180px;">
                <div style="font-weight: bold; font-size: 0.72rem;">Reviewed by,</div>
                <div style="font-size: 0.68rem; font-weight: bold; color: #1e293b;">
                  (${report?.reviewedByAnalyst || 'Sr. Analyst / Analyst'})
                </div>
                <div style="margin: 4px 0; min-height: 38px; display: flex; align-items: center;">
                  ${report?.reviewedBySignature ? `
                    <img src="${report.reviewedBySignature}" alt="Reviewed By" style="max-height: 45px; max-width: 120px; object-fit: contain;" />
                  ` : report?.analystPhoto ? `
                    <img src="${report.analystPhoto}" alt="Analyst" style="max-height: 45px; max-width: 40px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" />
                  ` : `<div style="height: 35px;"></div>`}
                </div>
                <div style="font-weight: bold; font-size: 0.72rem; margin-top: 1px;">
                  Lab Incharge Signatory.
                </div>
              </div>



              <!-- Right Side: Authorized Signatory -->
              <div style="text-align: right; min-width: 220px;">
                <div style="font-weight: bold; font-size: 0.72rem;">Thanking you in anticipation</div>
                <div style="font-weight: bold; font-size: 0.72rem;">For Jagnath Lab Technologies,</div>
                <div style="margin: 4px 0; min-height: 38px; display: flex; justify-content: flex-end; align-items: center;">
                  ${report?.signatureImage ? `
                    <img src="${report.signatureImage}" alt="Authorized Signature" style="max-height: 45px; max-width: 140px; object-fit: contain;" />
                  ` : `<div style="height: 35px;"></div>`}
                </div>
                <div style="font-weight: bold; font-size: 0.72rem;">
                  (${report?.authorizedSignatory || 'prashant'})
                </div>
                <div style="font-weight: bold; font-size: 0.68rem; color: #0f172a;">
                  (${report?.authorizedSignatoryPersons || 'Mr. Parvin Raiyani / Mr. Ankit Rathod'})
                </div>
                <div style="font-weight: bold; font-size: 0.72rem;">
                  Authorized Signatory
                </div>
              </div>
            </div>

            <!-- End of Test Report Divider -->
            <div style="text-align: center; font-size: 0.64rem; font-weight: bold; margin: 4px 0; letter-spacing: 0.5px;">
              ----------------------------- END OF TEST REPORT -----------------------------
            </div>
          ` : ''}

          <!-- Official Right-Aligned Letterhead Footer (FINAL PAGE ONLY) -->
          ${withHeaderFooter && isLastPage ? `
            <div class="letterhead-footer-section" style="font-family: sans-serif; font-size: 0.74rem; margin-top: auto; padding-top: 10px; padding-bottom: 4px; width: 100%;">
              <div style="display: flex; justify-content: flex-end; align-items: flex-start; gap: 24px; flex-wrap: wrap; margin-left: auto; margin-bottom: 4px;">
                <div style="color: #047857; font-weight: 600; line-height: 1.35; text-align: left;">
                  <div>📍 5-6/B, Nayanjyot Chambers,</div>
                  <div style="padding-left: 16px;">First Floor, Opp. Vachhera Vada,</div>
                  <div style="padding-left: 16px;">Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
                </div>
                <div style="color: #047857; font-weight: 600; line-height: 1.35; text-align: left;">
                  <div>✉ jagnathtechnologies@yahoo.com</div>
                  <div>🌐 www.jagnath.com</div>
                  <div>📞 +91 8140 5555 15</div>
                </div>
              </div>
              <div style="border-top: 1.2px solid #059669; margin: 4px 0 3px 0;"></div>
              <div style="text-align: right; font-size: 0.76rem; font-weight: bold; color: #1e3a8a; margin-top: 2px; letter-spacing: 0.2px;">
                Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
              </div>
            </div>
          ` : `<div style="height: 18px; margin-top: auto;"></div>`}
        </div>
      </div>
    `;
  }).join('');
};
