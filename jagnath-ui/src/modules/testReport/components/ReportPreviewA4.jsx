import React from 'react';
import { groupParametersByLocationScope } from '../services/testReportValidation';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';
import { BACKEND_ROOT_URL } from '../../../shared/services/apiEndpoints';

/**
 * ReportPreviewA4
 * Renders an exact replica of Jagnath Labs Test Report in standard A4 format.
 * Used for live preview in creation workflow and printable exports.
 */
export const ReportPreviewA4 = ({ report, company, withHeaderFooter = true }) => {
  if (!report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No report data available for preview.
      </div>
    );
  }

  const formatDateDDMMYYYY = (dateStr) => {
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

  const getPreviewLogoUrl = () => {
    const rawLogo = report.companyLogo || company?.test_report_logo || company?.logo || '/Images/Jagnath_Report_Header_Logo.png';
    if (!rawLogo) return '/Images/Jagnath_Report_Header_Logo.png';
    if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('/Images/')) {
      return rawLogo;
    }
    return `${BACKEND_ROOT_URL}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`;
  };

  const shouldBoldResult = (resultStr, limitStr) => {
    if (!resultStr || !limitStr) return false;
    const resClean = String(resultStr).trim();
    const limClean = String(limitStr).trim();
    if (resClean === limClean || limClean === '-' || limClean === 'N/A') return false;
    const numRes = parseFloat(resClean);
    const numLim = parseFloat(limClean);
    if (!isNaN(numRes) && !isNaN(numLim) && numRes > numLim) return true;
    return false;
  };

  const parametersList = report.parametersList || [];
  const groupedParameters = groupParametersByLocationScope(parametersList, report.samplingLocation);
  const showLimits = report.showPermissibleLimits !== false;

  return (
    <div 
      className="printable-report-sheet" 
      style={{
        background: '#ffffff',
        borderRadius: '8px',
        padding: '0.6rem 0.8rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        lineHeight: '1.25',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto'
      }}
    >
      {/* 1. Header with Logo */}
      {withHeaderFooter ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <img 
              src={getPreviewLogoUrl()} 
              alt="Company Logo" 
              style={{ height: '62px', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>
        </div>
      ) : (
        <div style={{ height: '45px', marginBottom: '8px' }} />
      )}

      {/* 2. Document Title */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '1.15rem', 
        fontWeight: 'bold', 
        textDecoration: 'underline', 
        marginTop: '8px', 
        marginBottom: '10px', 
        letterSpacing: '0.5px' 
      }}>
        TEST REPORT
      </div>

      {/* 3. Metadata Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', border: '1px solid #000000', marginBottom: '0' }}>
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '18%' }} />
        </colgroup>
        <tbody>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td colSpan={2} rowSpan={2} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold', fontSize: '0.78rem', borderRight: '1px solid #000000', verticalAlign: 'middle' }}>
              D- {report.reportNumber || report.referenceNo || 'JLT010726RR00307'}
            </td>
            <td colSpan={2} style={{ padding: '0.2rem 0.35rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.78rem' }}>
              {report.formatNo || 'Format No. 7.8 F-02'}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td colSpan={2} style={{ padding: '0.2rem 0.35rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.78rem' }}>
              Date: - {formatDateDDMMYYYY(report.formatDate || report.dateOfReceipt || new Date().toISOString())}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Name Of Work</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{report.nameOfWork || 'Waste Water Analysis'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Details of sample</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{report.detailsOfSample || '-'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Mode of Packing</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{report.packingDetails || 'Sample Sealed in Plastic Bottle'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Report Issued To</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{report.reportIssuedTo || '-'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Reference No. / Report No.</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{report.reportNumber || report.referenceNo || '-'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Date Of Receipt Of Sample</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formatDateDDMMYYYY(report.dateOfReceipt)}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Name Of Agency/Company</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{report.agencyName || (report.reportIssuedTo ? report.reportIssuedTo.split('\n')[0] : '')}</div>
              {report.agencyAddress && <div style={{ fontSize: '0.68rem', marginTop: '1px', whiteSpace: 'pre-wrap' }}>{report.agencyAddress}</div>}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Sample Quantity</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{report.sampleQuantity || '01 (1 ltr)'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Location of Sampling</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{report.samplingLocation || 'Site Location'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Condition on Receipt</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{report.conditionOnReceipt || 'Satisfactory'}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Sample Collected by</td>
            <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{report.sampleCollectedBy || 'Client / Representative'}</td>
          </tr>
          <tr>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Starting Date Of Test</td>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>{formatDateDDMMYYYY(report.startingDateOfTest)}</td>
            <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Completion Date Of Test</td>
            <td style={{ padding: '0.2rem 0.35rem' }}>{formatDateDDMMYYYY(report.completionDateOfTest)}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Section Header Banner */}
      <div style={{
        backgroundColor: '#f1f5f9',
        borderLeft: '1px solid #000000',
        borderRight: '1px solid #000000',
        borderBottom: '1px solid #000000',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        padding: '0.25rem 0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {report.sectionHeader || 'DISCIPLINE: CHEMICAL TESTING'}
      </div>

      {/* 5. Testing Parameters Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', border: '1px solid #000000', borderTop: 'none', marginBottom: '0' }}>
        <thead>
          <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #000000', textAlign: 'center' }}>
            <th style={{ width: '6%', padding: '0.25rem 0.2rem', borderRight: '1px solid #000000', fontWeight: 'bold' }}>SR.</th>
            <th style={{ width: '28%', padding: '0.25rem 0.3rem', borderRight: '1px solid #000000', fontWeight: 'bold', textAlign: 'left' }}>TEST PARAMETER</th>
            <th style={{ width: '22%', padding: '0.25rem 0.3rem', borderRight: '1px solid #000000', fontWeight: 'bold', textAlign: 'left' }}>REFERENCE METHOD</th>
            <th style={{ width: '12%', padding: '0.25rem 0.2rem', borderRight: '1px solid #000000', fontWeight: 'bold' }}>UNIT</th>
            <th style={{ width: '14%', padding: '0.25rem 0.2rem', borderRight: showLimits ? '1px solid #000000' : 'none', fontWeight: 'bold' }}>RESULT</th>
            {showLimits && (
              <th style={{ width: '18%', padding: '0.25rem 0.2rem', fontWeight: 'bold' }}>PERMISSIBLE LIMIT</th>
            )}
          </tr>
        </thead>
        <tbody>
          {groupedParameters.length === 0 ? (
            <tr>
              <td colSpan={showLimits ? 6 : 5} style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                No testing parameters added yet.
              </td>
            </tr>
          ) : (
            groupedParameters.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                {group.location && (
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #000000' }}>
                    <td 
                      colSpan={showLimits ? 6 : 5} 
                      style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', fontSize: '0.72rem', color: '#0f172a' }}
                    >
                      Location: {group.location}
                    </td>
                  </tr>
                )}
                {group.parameters.map((param, pIdx) => {
                  const isBold = shouldBoldResult(param.result, param.permissibleLimit);
                  return (
                    <tr key={pIdx} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ textAlign: 'center', padding: '0.2rem 0.15rem', borderRight: '1px solid #000000' }}>
                        {param.srNo || String(pIdx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '0.2rem 0.3rem', borderRight: '1px solid #000000' }}>
                        {sanitizeSamplingParamName(param.parameterName)}
                      </td>
                      <td style={{ padding: '0.2rem 0.3rem', borderRight: '1px solid #000000' }}>
                        {param.referenceMethod || '-'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.2rem 0.15rem', borderRight: '1px solid #000000' }}>
                        {param.unit || '-'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.2rem 0.15rem', borderRight: showLimits ? '1px solid #000000' : 'none', fontWeight: isBold ? 'bold' : 'normal' }}>
                        {param.result || '-'}
                      </td>
                      {showLimits && (
                        <td style={{ textAlign: 'center', padding: '0.2rem 0.15rem' }}>
                          {param.permissibleLimit || '-'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {/* 6. Terms & Signatures */}
      <div style={{ marginTop: '0.75rem', fontSize: '0.68rem', lineHeight: '1.3' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Terms & Conditions:</p>
        <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>The results refer only to the tested sample & applicable parameters. Endorsement of product is neither inferred nor implied.</li>
          <li>Total liability of our laboratory is limited to the invoiced amount. Any dispute arising out of this report is subject to Rajkot jurisdiction.</li>
          <li>This report cannot be used for any legal purpose or court evidence without prior written permission from Jagnath Lab Technologies.</li>
        </ol>

        {/* Signatures Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem', padding: '0 0.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '35px' }}>
              {report.reviewedBySignature && (
                <img src={report.reviewedBySignature} alt="Reviewed Signature" style={{ maxHeight: '35px', maxWidth: '120px' }} />
              )}
            </div>
            <div style={{ borderTop: '1px solid #000000', width: '130px', margin: '0 auto', paddingTop: '2px', fontWeight: 'bold' }}>
              Reviewed By
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '35px' }}>
              {report.signatureImage && (
                <img src={report.signatureImage} alt="Authorized Signature" style={{ maxHeight: '35px', maxWidth: '120px' }} />
              )}
            </div>
            <div style={{ borderTop: '1px solid #000000', width: '150px', margin: '0 auto', paddingTop: '2px', fontWeight: 'bold' }}>
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewA4;

