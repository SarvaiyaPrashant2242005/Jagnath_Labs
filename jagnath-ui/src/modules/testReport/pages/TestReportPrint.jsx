import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REPORT_ENDPOINTS } from '../../../shared/services/apiEndpoints';

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
      return `http://localhost:5000/${cleanPath.substring(idx)}`;
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
        
        {/* Top Header Logo Row */}
        {withHeaderFooter ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <img src={getLogoUrl()} alt="Company Logo" style={{ height: '60px', objectFit: 'contain' }} />
              </div>
            </div>
            {/* Divider Line */}
            <div style={{ borderBottom: '1.5px solid #000', marginBottom: '2px' }}></div>
          </>
        ) : (
          <div style={{ height: '45px', marginBottom: '2px' }}></div> // Spacer for letterhead header
        )}

        {/* Document Title */}
        <div style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px' }}>
          TEST REPORT
        </div>

        {/* Second Divider Line */}
        <div style={{ borderBottom: '1.5px solid #000', marginBottom: '4px' }}></div>

        {/* Main Metadata Grid Table */}
        <table className="print-report-table">
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                {report.formatNo || 'Format No. 7.8 F-02'}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontWeight: 'bold', fontSize: '0.82rem', borderBottom: '1px solid #000' }}>
                {report.reportNumber || report.referenceNo || 'JLT010726RR00307'}
              </td>
              <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.82rem', borderBottom: '1px solid #000' }}>
                Date: - {formatDateDDMMYYYY(report.formatDate || report.dateOfReceipt || new Date().toISOString())}
              </td>
            </tr>
            <tr>
              <td style={{ width: '32%' }}>Name Of Work</td>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>{report.nameOfWork || report.title || 'Waste Water Analysis'}</td>
            </tr>
            <tr>
              <td>Details of sample</td>
              <td colSpan={3}>{report.detailsOfSample || '-'}</td>
            </tr>
            <tr>
              <td>Mode of Packing</td>
              <td colSpan={3}>{report.packingDetails || 'Sample Sealed in Plastic Bottle'}</td>
            </tr>
            <tr>
              <td>Report Issued To</td>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>{report.reportIssuedTo || report.agencyName || '-'}</td>
            </tr>
            <tr>
              <td>Reference No. / Report No.</td>
              <td colSpan={3} style={{ fontWeight: 'bold' }}>{report.reportNumber || report.referenceNo || '-'}</td>
            </tr>
            <tr>
              <td>Date Of Receipt Of Sample</td>
              <td colSpan={3}>{formatDateDDMMYYYY(report.dateOfReceipt)}</td>
            </tr>
            <tr>
              <td>Name Of Agency/Company</td>
              <td colSpan={3}>
                <div style={{ fontWeight: 'bold' }}>{report.agencyName || report.reportIssuedTo}</div>
                {report.agencyAddress && <div style={{ fontSize: '0.75rem', marginTop: '1px' }}>{report.agencyAddress}</div>}
              </td>
            </tr>
            <tr>
              <td>Sample Quantity</td>
              <td colSpan={3}>{report.sampleQuantity || '01 (1 ltr)'}</td>
            </tr>
            <tr>
              <td>Sampling Location / Type</td>
              <td colSpan={3}>{report.samplingLocation || 'Inlet CETP'}</td>
            </tr>
            <tr>
              <td>Condition of sample during receipt</td>
              <td colSpan={3}>{report.conditionOnReceipt || 'Satisfactory'}</td>
            </tr>
            <tr>
              <td>Sample Collected / Submitted by.</td>
              <td colSpan={3}>{report.sampleCollectedBy || 'By Party'}</td>
            </tr>
            <tr>
              <td style={{ width: '32%' }}>Starting Date Of Test/ Analysis</td>
              <td style={{ width: '28%' }}>{formatDateDDMMYYYY(report.startingDateOfTest)}</td>
              <td style={{ width: '22%' }}>Completion Date of Test</td>
              <td style={{ width: '18%' }}>{formatDateDDMMYYYY(report.completionDateOfTest)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section Sub-Header Banner */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #000', borderTop: 'none', padding: '3px 0', textTransform: 'uppercase' }}>
          {report.sectionHeader || 'WASTE WATER ANALYSIS'}
        </div>

        {/* Test Parameters Results Table */}
        <table className="print-report-table" style={{ borderTop: 'none' }}>
          <thead>
            <tr style={{ textAlign: 'center', fontWeight: 'bold' }}>
              <th style={{ width: '8%' }}>SR.NO.</th>
              <th style={{ width: report.showPermissibleLimits !== false ? '28%' : '34%', textAlign: 'left' }}>TESTS PARAMETERS</th>
              <th style={{ width: report.showPermissibleLimits !== false ? '32%' : '37%', textAlign: 'center' }}>REFERENCE METHOD</th>
              <th style={{ width: '10%', textAlign: 'center' }}>UNIT</th>
              <th style={{ width: '11%', textAlign: 'center' }}>RESULTS</th>
              {report.showPermissibleLimits !== false && <th style={{ width: '11%', textAlign: 'center' }}>PERMISIBLE LIMITS</th>}
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

        {/* Signatures Block (NO STAMP) */}
        <div style={{ border: '1px solid #000', borderTop: 'none', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '100px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Reviewed by,</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>(Sr. Analyst/Analyst)</div>
            <div style={{ marginTop: '3rem', fontWeight: 'bold', fontSize: '0.78rem' }}>
              Lab Incharge Signatory.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Thanking you in anticipation!</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>For Jagnath Lab Technologies,</div>
            {report.signatureImage ? (
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                <img
                  src={report.signatureImage}
                  alt="Authorized Signature"
                  style={{ maxHeight: '65px', maxWidth: '200px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ marginTop: '2rem' }} />
            )}
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
              ({report.authorizedSignatory || 'Technical/Quality Manager'})
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
              ({report.authorizedSignatoryName || 'Mr. Ankit Rathod/ Mr. Purvin Raiyan'})
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Authorized Signatory</div>
          </div>
        </div>

        {/* End of Report Indicator */}
        <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', margin: '6px 0', letterSpacing: '0.5px' }}>
          --------------------------------- END OF TEST REPORT ---------------------------------
        </div>

        {/* Footer Information */}
        {withHeaderFooter ? (
          <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#047857', fontWeight: 600 }}>
                📍 5-6/B, Nayanjyot Chambers, First Floor, Opp. Vachhera Vada, Gondal-360 311. Dist. : Rajkot. (Guj.)
              </div>
              <div style={{ color: '#047857', fontWeight: 600 }}>
                ✉ jagnathtechnologies@yahoo.com
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <div style={{ color: '#047857', fontWeight: 600 }}>
                🌐 www.jagnath.com
              </div>
              <div style={{ color: '#047857', fontWeight: 600 }}>
                📞 +91 8140 5555 15
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
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
