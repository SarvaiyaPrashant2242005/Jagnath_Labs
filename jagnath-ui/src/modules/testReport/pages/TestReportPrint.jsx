import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REPORT_ENDPOINTS, BACKEND_ROOT_URL } from '../../../shared/services/apiEndpoints';

/**
 * @component TestReportPrint
 * @description Dedicated A4 Print View for Test Reports (Same print architecture as TestRequestPrint)
 */
const TestReportPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Parse query parameter to determine default layout
  const queryParams = new URLSearchParams(window.location.search);
  const initialNoHeaderFooter = queryParams.get('noHeaderFooter') === 'true';
  const [withHeaderFooter, setWithHeaderFooter] = useState(!initialNoHeaderFooter);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await apiService.get(TEST_REPORT_ENDPOINTS.GET_BY_ID(id));
      if (res?.data) {
        setReport(res.data);
        // Auto-trigger window.print() same as TestRequestPrint
        setTimeout(() => {
          window.print();
        }, 500);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch test report for print:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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

  const shouldBoldResult = (resultStr, limitStr) => {
    if (!resultStr || !limitStr) return false;
    const resClean = String(resultStr).trim();
    const limClean = String(limitStr).trim();
    if (resClean === limClean || limClean === '-' || limClean === 'N/A') return false;

    const parseNumber = (str) => {
      const match = str.replace(/,/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
      return match ? parseFloat(match[0]) : null;
    };

    const resVal = parseNumber(resClean);
    if (resVal === null) return false;

    // Range: "6.5 - 8.5" or "6.5 to 8.5"
    const rangeMatch = limClean.match(/([-+]?[0-9]*\.?[0-9]+)\s*(?:-|to)\s*([-+]?[0-9]*\.?[0-9]+)/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return resVal < min || resVal > max;
    }

    // Less than / Max limits
    if (/(?:<|<=|max|below|less)/i.test(limClean)) {
      const limVal = parseNumber(limClean);
      if (limVal !== null) return resVal > limVal;
    }

    // Greater than / Min limits
    if (/(?:>|>=|min|above|more)/i.test(limClean)) {
      const limVal = parseNumber(limClean);
      if (limVal !== null) return resVal < limVal;
    }

    // Simple numeric limit (assumed maximum limit)
    const simpleLimVal = parseNumber(limClean);
    if (simpleLimVal !== null && !isNaN(simpleLimVal)) {
      return resVal > simpleLimVal;
    }

    return false;
  };

  const getLogoUrl = () => {
    if (!report || !report.companyLogo) return '/Images/Navbar_Logo.png';
    const cleanPath = report.companyLogo.replace(/\\/g, '/');
    const idx = cleanPath.lastIndexOf('uploads/');
    if (idx !== -1) {
      return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
    }
    return report.companyLogo;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        Loading Print Preview...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red', fontFamily: 'Arial, sans-serif' }}>
        Error loading test report data.
      </div>
    );
  }

  const parameters = Array.isArray(report.parametersList) ? report.parametersList : [];

  const defaultTerms = "The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT. We are authorized to take strict action if the data and result of report is to be changed/corrected by any external source or body. Report varies according to samples and their composition of the materials. JLTs strictly maintains confidentiality of all the test results and analysis and customer supplied products/samples and will not reveal this information to third party unless required for statutory/legal compliance. The report is referring only to the tested sample and for applicable parameters. The sample is destroyed after retention time (15 Days) unless otherwise specified specially. Subject to Gondal Jurdiction.";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container">
      {/* Top Floating Control Bar - HIDDEN DURING PRINT */}
      <div className="print-control-bar" style={{
        width: '100%',
        maxWidth: '210mm',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '0.6rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', fontFamily: 'sans-serif' }}>
            Report Print Layout:
          </span>
          <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <button
              onClick={() => setWithHeaderFooter(true)}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: withHeaderFooter ? '#ffffff' : 'transparent',
                color: withHeaderFooter ? '#1e293b' : '#64748b',
                boxShadow: withHeaderFooter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Normal (With Header/Footer)
            </button>
            <button
              onClick={() => setWithHeaderFooter(false)}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: !withHeaderFooter ? '#ffffff' : 'transparent',
                color: !withHeaderFooter ? '#1e293b' : '#64748b',
                boxShadow: !withHeaderFooter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Letterhead (No Header/Footer)
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontFamily: 'sans-serif' }}>
          <button
            onClick={() => navigate('/test-reports')}
            style={{
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            Back to List
          </button>
          <button
            onClick={handlePrint}
            style={{
              border: 'none',
              background: '#22c55e',
              borderRadius: '8px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      {/* ======================= A4 PRINT PAGE ======================= */}
      <div className="print-page">
        
        {/* Top Header Logo & Title Row */}
        {withHeaderFooter ? (
          <div style={{ position: 'relative', width: '100%', minHeight: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              <img src={getLogoUrl()} alt="Company Logo" style={{ height: '70px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'underline', letterSpacing: '0.5px' }}>
              TEST REPORT
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', minHeight: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'underline', letterSpacing: '0.5px' }}>
              TEST REPORT
            </div>
          </div>
        )}

        {/* Main Metadata Grid Table */}
        <table className="print-report-table">
          <colgroup>
            <col style={{ width: '33%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={2} rowSpan={2} style={{ fontWeight: 'bold', fontSize: '0.82rem', verticalAlign: 'middle' }}>
                UID- {report.reportNumber || report.referenceNo || 'JLT010726RR00307'}
              </td>
              <td colSpan={2} style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '0.82rem' }}>
                {report.formatNo || 'Format No. 7.8 F-02'}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '0.82rem' }}>
                Date: - {formatDateDDMMYYYY(report.formatDate || report.dateOfReceipt || new Date().toISOString())}
              </td>
            </tr>
            <tr>
              <td>Name of Work</td>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>{report.nameOfWork || report.title || '-'}</td>
            </tr>
            <tr>
              <td>Details of sample/Mode of Packing</td>
              <td colSpan={3}>
                {report.detailsOfSample && report.packingDetails
                  ? `${report.detailsOfSample} / ${report.packingDetails}`
                  : (report.packingDetails || report.detailsOfSample || '-')}
              </td>
            </tr>
            <tr>
              <td>Report Issued To</td>
              <td colSpan={3} style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{report.reportIssuedTo || report.agencyName || '-'}</td>
            </tr>
            <tr>
              <td>Reference No. / Report No.</td>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>{report.reportNumber || report.referenceNo || '-'}</td>
            </tr>
            <tr>
              <td>Date of Sampling</td>
              <td>{formatDateDDMMYYYY(report.dateOfSampling) || '-'}</td>
              <td>Date of Receipt</td>
              <td>{formatDateDDMMYYYY(report.dateOfReceipt)}</td>
            </tr>
            <tr>
              <td>Name of Agency/Company</td>
              <td colSpan={3}>
                <div style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{report.agencyName || (report.reportIssuedTo ? report.reportIssuedTo.split('\n')[0] : '')}</div>
                {report.agencyAddress && <div style={{ fontSize: '0.75rem', marginTop: '1px', whiteSpace: 'pre-wrap' }}>{report.agencyAddress}</div>}
              </td>
            </tr>
            <tr>
              <td>Sample Quantity</td>
              <td colSpan={3}>{report.sampleQuantity || '-'}</td>
            </tr>
            <tr>
              <td>Sampling Location / Type</td>
              <td colSpan={3}>{report.samplingLocation || '-'}</td>
            </tr>
            <tr>
              <td>Condition of sample during receipt</td>
              <td colSpan={3}>{report.conditionOnReceipt || '-'}</td>
            </tr>
            <tr>
              <td>Sample Collected / Submitted by.</td>
              <td colSpan={3}>{report.sampleCollectedBy || '-'}</td>
            </tr>
            <tr>
              <td>Starting Date Of Test/ Analysis</td>
              <td>{formatDateDDMMYYYY(report.startingDateOfTest)}</td>
              <td>Completion Date of Test</td>
              <td>{formatDateDDMMYYYY(report.completionDateOfTest)}</td>
            </tr>
          </tbody>
        </table>

        {/* Test Parameters Results Table */}
        <table className="print-report-table" style={{ borderTop: 'none' }}>
          <thead>
            {/* Embedded Sub-Header Section Banner inside parameters table */}
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th colSpan={report.showPermissibleLimits !== false ? 6 : 5} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', padding: '4px 0', textTransform: 'uppercase', background: '#ffffff', color: '#000' }}>
                <u>{report.sectionHeader || 'PHYSICAL CHEMICAL PARAMETERS'}</u>
              </th>
            </tr>
            <tr style={{ textAlign: 'center', fontWeight: 'bold' }}>
              <th style={{ width: '6%', textAlign: 'center' }}>SR.NO.</th>
              <th style={{ width: report.showPermissibleLimits !== false ? '27%' : '37%', textAlign: 'center' }}>TESTS PARAMETERS</th>
              <th style={{ width: report.showPermissibleLimits !== false ? '35%' : '41%', textAlign: 'center' }}>REFERENCE METHOD</th>
              <th style={{ width: '8%', textAlign: 'center' }}>UNIT</th>
              <th style={{ width: '10%', textAlign: 'center' }}>RESULTS</th>
              {report.showPermissibleLimits !== false && (
                <th style={{ width: '14%', textAlign: 'center' }}>
                  PERMISSIBLE LIMIT <br />
                  <span style={{ fontSize: '0.65rem', fontWeight: 'normal' }}>(IS 10500:2012)</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {parameters.length === 0 ? (
              <tr>
                <td colSpan={report.showPermissibleLimits !== false ? 6 : 5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No parameters recorded</td>
              </tr>
            ) : (
              parameters.map((param, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>{param.srNo || String(index + 1).padStart(2, '0')}</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'left' }}>{param.parameterName || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{param.referenceMethod || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{param.unit || '-'}</td>
                  <td style={{
                    textAlign: 'center',
                    fontWeight: shouldBoldResult(param.result, param.permissibleLimit) ? 'bold' : 'normal'
                  }}>{param.result || '-'}</td>
                  {report.showPermissibleLimits !== false && <td style={{ textAlign: 'center' }}>{param.permissibleLimit || '-'}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Terms & Conditions Box */}
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '4px 6px', fontSize: '0.62rem', lineHeight: '1.25', textAlign: 'justify' }}>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px' }}>
            This Report is Issued Under Following Terms & Conditions: -
          </div>
          <div>{report.termsAndConditions || defaultTerms}</div>
        </div>

        {/* Signatures Block with 2-column layout */}
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '120px' }}>
          {/* Left Signature Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%', minHeight: '120px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Reviewed by,</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>(Sr. Analyst/ Analyst)</div>
            </div>
            {report.reviewedBySignature ? (
              <div style={{ margin: '6px 0', display: 'flex', justifyContent: 'flex-start' }}>
                <img
                  src={report.reviewedBySignature}
                  alt="Reviewed By Signature"
                  style={{ maxHeight: '50px', maxWidth: '150px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ height: '50px' }} />
            )}
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
              Lab Incharge Signatory.
            </div>
          </div>

          {/* Right Signature Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: '120px', textAlign: 'right' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Thanking you in anticipation!</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>For Jagnath Lab Technologies,</div>
            </div>
            {report.signatureImage ? (
              <div style={{ margin: '6px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <img
                  src={report.signatureImage}
                  alt="Authorized Signature"
                  style={{ maxHeight: '50px', maxWidth: '150px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ height: '50px' }} />
            )}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#1e293b' }}>
                ({report.authorizedSignatory || 'Quality/ Technical Manager'})
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#1e293b' }}>
                ({report.authorizedSignatoryName || 'Mr. Purvin Raiyani / Mr. Ankit Rathod'})
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Authorized Signatory</div>
            </div>
          </div>
        </div>

        {/* End of Report Indicator */}
        <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', margin: '6px 0', letterSpacing: '0.5px' }}>
          --------------------------------- END OF TEST REPORT ---------------------------------
        </div>

        {/* Footer Information */}
        {withHeaderFooter ? (
          <div style={{ fontSize: '0.66rem', fontFamily: 'sans-serif', marginTop: '45px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '30px', marginLeft: '36%', alignItems: 'flex-start', marginBottom: '6px' }}>
              {/* Left Column: Address */}
              <div style={{ color: '#047857', fontWeight: 600, lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                <div>📍 5-6/B, Nayanjyot Chambers,</div>
                <div style={{ paddingLeft: '14px' }}>First Floor, Opp. Vachhera Vada,</div>
                <div style={{ paddingLeft: '14px' }}>Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
              </div>
              
              {/* Right Column: Contact info */}
              <div style={{ color: '#047857', fontWeight: 600, lineHeight: '1.4', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <div>✉ jagnathtechnologies@yahoo.com</div>
                <div>🌐 www.jagnath.com</div>
                <div>📞 +91 8140 5555 15</div>
              </div>
            </div>
            
            {/* Horizontal Line separating columns and Auditors title */}
            <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

            {/* Auditors Title */}
            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#047857', marginTop: '4px' }}>
              Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
            </div>
          </div>
        ) : (
          <div style={{ height: '30px' }}></div> // Spacer for letterhead footer
        )}

      </div>

      {/* Embedded CSS matching TestRequestPrint print styling */}
      <style>{`
        .print-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: #cbd5e1;
          padding: 20px 0;
          min-height: 100vh;
        }

        .print-page {
          background-color: #ffffff;
          width: 210mm;
          min-height: 297mm;
          padding: 6mm 8mm;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          box-sizing: border-box;
          font-family: "Times New Roman", Times, serif;
          color: #000;
          line-height: 1.2;
        }

        .print-report-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 0.8rem;
        }

        .print-report-table td, .print-report-table th {
          border: 1px solid #000;
          padding: 2px 4px;
        }

        @media print {
          .print-control-bar {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 4mm 6mm;
          }
          html, body { 
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important; 
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container { 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important; 
            padding: 0 !important; 
            background: #ffffff !important;
          }
          .print-page { 
            width: 100% !important; 
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important; 
            margin: 0 !important; 
            box-shadow: none !important;
            box-sizing: border-box !important;
            page-break-after: auto;
            overflow: visible !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TestReportPrint;
