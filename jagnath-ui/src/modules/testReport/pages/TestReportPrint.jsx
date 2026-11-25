import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REPORT_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import { TestReportDocument } from '../components/TestReportDocument';

/**
 * @component TestReportPrint
 * @description Dedicated A4 Print & PDF View for Test Reports using the unified TestReportDocument.
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
        // Auto-trigger window.print()
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container">
      {/* Top Floating Control Bar - HIDDEN DURING PRINT */}
      <div className="print-control-bar" style={{
        width: '100%',
        maxWidth: '210mm',
        background: 'rgba(255, 255, 255, 0.95)',
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
              background: '#047857',
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
      <div className="print-page-wrapper">
        <TestReportDocument
          report={report}
          parameters={report.parametersList}
          company={null}
          withHeaderFooter={withHeaderFooter}
          isPrintMode={true}
        />
      </div>

      {/* Embedded CSS matching standard A4 print styling */}
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

        .print-page-wrapper {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          box-sizing: border-box;
        }

        @media print {
          .print-control-bar {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
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
          .print-page-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .test-report-document-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TestReportPrint;
