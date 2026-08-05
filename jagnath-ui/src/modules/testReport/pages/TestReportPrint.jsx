import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REPORT_ENDPOINTS } from '../../../shared/services/apiEndpoints';

/**
 * @component TestReportPrint
 * @description Standalone A4 Print View for Test Reports matching exact uploaded detailing.
 */
const TestReportPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      const res = await apiService.get(TEST_REPORT_ENDPOINTS.GET_BY_ID(id));
      if (res?.data) {
        setReport(res.data);
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

  const handlePrint = () => {
    window.print();
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

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'Times New Roman, serif' }}>
        <p style={{ fontSize: '1.1rem', color: '#475569' }}>Loading Test Report Document...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'Times New Roman, serif' }}>
        <h3 style={{ color: '#ef4444' }}>Test Report Not Found</h3>
        <button
          onClick={() => navigate('/test-reports')}
          style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem' }}
        >
          Back to Test Reports
        </button>
      </div>
    );
  }

  const parameters = Array.isArray(report.parametersList) ? report.parametersList : [];

  const defaultTerms = "The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT. We are authorized to take strict action if the data and result of report is to be changed/corrected by any external source or body. Report varies according to samples and their composition of the materials. JLTs strictly maintains confidentiality of all the test results and analysis and customer supplied products/samples and will not reveal this information to third party unless required for statutory/legal compliance. The report is referring only to the tested sample and for applicable parameters. The sample is destroyed after retention time (15 Days) unless otherwise specified specially. Subject to Gondal Jurdiction.";

  return (
    <div style={{ background: '#cbd5e1', minHeight: '100vh', padding: '1.5rem 0' }}>
      
      {/* Floating Action Bar (Hidden during print) */}
      <div className="no-print" style={{
        maxWidth: '820px',
        margin: '0 auto 1.5rem auto',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '0.75rem 1.25rem',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => navigate('/test-reports')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
        >
          <FaArrowLeft /> Back to List
        </button>
        <button
          onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
        >
          <FaPrint /> Print / Save as PDF
        </button>
      </div>

      {/* A4 Document Paper Container */}
      <div style={{
        maxWidth: '820px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        padding: '2rem 2.25rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        lineHeight: '1.3'
      }}>

        {/* Top Row: Logo Image ONLY (no text block) on left, Format/Date info on right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <div>
            <img src="/Images/Navbar_Logo.png" alt="Jagnath Logo" style={{ height: '60px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Horizontal Line under header */}
        <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '0.4rem' }}></div>

        {/* Centered Document Title */}
        <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '0.3rem' }}>
          TEST REPORT
        </div>

        {/* Format No. & Date Line */}
        <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
          <span>{report.formatNo || 'Format No. 7.8 F-02'}</span>
          <span style={{ marginLeft: '2rem' }}>Date: - {formatDateDDMMYYYY(report.formatDate || report.dateOfReceipt || new Date().toISOString())}</span>
        </div>

        {/* Metadata Grid Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid #000000', marginBottom: '0' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td colSpan={4} style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {report.reportNumber || report.referenceNo || 'JLT010726RR00307'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ width: '32%', padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Name Of Work</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold' }}>{report.nameOfWork || report.title || 'Waste Water Analysis'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Details of sample/Mode of Packing</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{report.detailsOfSample || report.packingDetails || 'Sample Sealed in Plastic Bottle'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Report Issued To</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold' }}>{report.reportIssuedTo || report.agencyName || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Reference No. / Report No.</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold' }}>{report.reportNumber || report.referenceNo || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Date Of Receipt Of Sample</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{formatDateDDMMYYYY(report.dateOfReceipt)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Name Of Agency/Company</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>
                <div style={{ fontWeight: 'bold' }}>{report.agencyName || report.reportIssuedTo}</div>
                {report.agencyAddress && <div style={{ fontSize: '0.75rem', marginTop: '1px' }}>{report.agencyAddress}</div>}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Sample Quantity</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{report.sampleQuantity || '01 (1 ltr)'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Sampling Location / Type</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{report.samplingLocation || 'Inlet CETP'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Condition of sample during receipt</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{report.conditionOnReceipt || 'Satisfactory'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Sample Collected / Submitted by.</td>
              <td colSpan={3} style={{ padding: '0.25rem 0.4rem' }}>{report.sampleCollectedBy || 'By Party'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td style={{ padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Starting Date Of Test/ Analysis</td>
              <td style={{ width: '28%', padding: '0.25rem 0.4rem', borderRight: '1px solid #000000' }}>{formatDateDDMMYYYY(report.startingDateOfTest)}</td>
              <td style={{ width: '22%', padding: '0.25rem 0.4rem', fontWeight: 'bold', borderRight: '1px solid #000000' }}>Completion Date of Test</td>
              <td style={{ width: '18%', padding: '0.25rem 0.4rem' }}>{formatDateDDMMYYYY(report.completionDateOfTest)}</td>
            </tr>
          </tbody>
        </table>

        {/* Section Sub-Header Banner */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #000000', borderTop: 'none', padding: '0.2rem 0', textTransform: 'uppercase' }}>
          {report.sectionHeader || 'WASTE WATER ANALYSIS'}
        </div>

        {/* Parameters Results Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #000000', borderTop: 'none', marginBottom: '0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>
              <th style={{ width: '8%', padding: '0.3rem', borderRight: '1px solid #000000' }}>SR.NO.</th>
              <th style={{ width: '28%', padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'left' }}>TESTS PARAMETERS</th>
              <th style={{ width: '32%', padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>REFERENCE METHOD</th>
              <th style={{ width: '10%', padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>UNIT</th>
              <th style={{ width: '11%', padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>RESULTS</th>
              <th style={{ width: '11%', padding: '0.3rem', textAlign: 'center' }}>PERMISSIBLE LIMITS</th>
            </tr>
          </thead>
          <tbody>
            {parameters.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No parameters recorded</td>
              </tr>
            ) : (
              parameters.map((param, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #000000' }}>
                  <td style={{ padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{param.srNo || String(index + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '0.3rem 0.4rem', borderRight: '1px solid #000000', fontWeight: 'bold' }}>{param.parameterName || '-'}</td>
                  <td style={{ padding: '0.3rem 0.4rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{param.referenceMethod || '-'}</td>
                  <td style={{ padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{param.unit || '-'}</td>
                  <td style={{ padding: '0.3rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{param.result || '-'}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'center' }}>{param.permissibleLimit || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Terms & Conditions Box */}
        <div style={{ border: '1px solid #000000', borderTop: 'none', padding: '0.3rem 0.5rem', fontSize: '0.62rem', lineHeight: '1.25', textAlign: 'justify' }}>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '0.1rem' }}>
            This Report is Issued Under Following Terms & Conditions: -
          </div>
          <div>{report.termsAndConditions || defaultTerms}</div>
        </div>

        {/* Signatures Section (Clean layout - NO STAMP) */}
        <div style={{ border: '1px solid #000000', borderTop: 'none', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '110px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Reviewed by,</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>(Sr. Analyst/Analyst)</div>
            <div style={{ marginTop: '3.5rem', fontWeight: 'bold', fontSize: '0.78rem' }}>
              Lab Incharge Signatory.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Thanking you in anticipation!</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>For Jagnath Lab Technologies,</div>
            <div style={{ marginTop: '2.5rem', fontWeight: 'bold', fontSize: '0.78rem' }}>
              ({report.authorizedSignatory || 'Technical/Quality Manager'})
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
              ({report.authorizedSignatoryName || 'Mr. Ankit Rathod/ Mr. Purvin Raiyan'})
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>Authorized Signatory</div>
          </div>
        </div>

        {/* End of Test Report Marker */}
        <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', margin: '0.5rem 0', letterSpacing: '0.5px' }}>
          --------------------------------- END OF TEST REPORT ---------------------------------
        </div>

        {/* Footer Info */}
        <div style={{ borderTop: '1px solid #64748b', paddingTop: '0.4rem', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>
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

      </div>

      {/* Print-specific CSS Rules */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TestReportPrint;
