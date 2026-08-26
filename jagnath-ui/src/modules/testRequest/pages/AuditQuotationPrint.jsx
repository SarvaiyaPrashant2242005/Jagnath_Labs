/**
 * @file AuditQuotationPrint.jsx
 * @description Printable A4 multi-page layout view for Audit Quotation.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../../shared/services/apiService';
import { API_BASE_URL } from '../../../shared/services/apiEndpoints';

const BACKEND_ROOT_URL = 'http://localhost:5000';

const AuditQuotationPrint = () => {
  const { id } = useParams(); // testRequestId
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const res = await apiService.get(`${API_BASE_URL}/audit-quotation/test-request/${id}`);
        if (res?.data) {
          setData(res.data);
        } else {
          setError("Failed to load quotation data.");
        }
      } catch (err) {
        console.error(err);
        setError(err?.messageToShow || err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  useEffect(() => {
    if (data) {
      // Auto-trigger browser print dialog when loaded
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading Quotation Print View...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!data) return null;

  const client = data.client || {};
  const company = data.company || {};
  
  // Format long date
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  // Helper to resolve company logo URL
  const getLogoUrl = () => {
    const logoPath = company.quotationLogo || company.quotation_logo || company.logo;
    if (!logoPath) return '/Images/Navbar_Logo.png';
    const cleanPath = logoPath.replace(/\\/g, '/');
    const idx = cleanPath.lastIndexOf('uploads/');
    if (idx !== -1) {
      return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
    }
    return logoPath;
  };

  // Calculate totals
  const subtotal = data.charges.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = Math.round(subtotal + gstAmount);

  // Group Annexure items by category
  const groupedAnnexure = data.annexure.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="audit-print-document">
      <style>{`
        @media screen {
          body {
            background-color: #f1f5f9;
            margin: 0;
            padding: 2rem 0;
          }
          .audit-print-page {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            margin: 0 auto 2rem auto;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .audit-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
        .audit-print-page {
          width: 210mm;
          min-height: 297mm;
          background-color: #ffffff;
          padding: 20mm 20mm 20mm 20mm;
          box-sizing: border-box;
          font-family: "Times New Roman", Times, serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #000000;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header-logo-container {
          text-align: center;
          margin-bottom: 5px;
        }
        .header-logo-img {
          max-height: 65px;
          object-fit: contain;
        }
        .header-divider-line {
          border: none;
          border-top: 1.5px solid #000000;
          margin: 5px 0 15px 0;
        }
        .footer-container {
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 8pt;
          color: #475569;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
          margin-top: auto;
        }
        .footer-slogan {
          font-weight: bold;
          font-style: italic;
          color: #1e293b;
          margin-bottom: 2px;
        }
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9.5pt;
        }
        .audit-table th, .audit-table td {
          border: 1px solid #000000;
          padding: 6px 8px;
          vertical-align: top;
        }
        .audit-table th {
          background-color: #f8fafc;
          font-weight: bold;
          text-align: center;
        }
      `}</style>

      {/* ================= PAGE 1 ================= */}
      <div className="audit-print-page">
        <div className="page-content-wrapper">
          <div className="header-logo-container">
            <img className="header-logo-img" src={getLogoUrl()} alt="Company Logo" />
            <hr className="header-divider-line" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <span style={{ fontWeight: 'bold' }}>Date: {formatDateLong(data.quotationDate)}</span>
          </div>

          <div style={{ marginBottom: '25px', fontSize: '11pt' }}>
            <div style={{ fontWeight: 'bold' }}>To,</div>
            <div style={{ fontWeight: 'bold' }}>M/s. {client.companyName || client.clientName || 'CLIENT NAME'}</div>
            <div style={{ whiteSpace: 'pre-line', marginTop: '2px' }}>
              {client.plantAddress || client.address || 'Plant Address'}
            </div>
          </div>

          <div style={{ marginBottom: '25px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: '1.4' }}>
            SUBJECT: - <span style={{ textDecoration: 'underline' }}>{data.subject}</span>
          </div>

          <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>Dear Sir,</div>

          <div style={{ textAlign: 'justify', whiteSpace: 'pre-line', marginBottom: '25px' }}>
            {data.introText}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div>Thanking you</div>
            <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
          </div>

          <div style={{ marginTop: '30px', position: 'relative' }}>
            <div>For, {company.companyName?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}.</div>
            
            {/* Signature & Stamp absolute placement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '10px 0' }}>
              {data.signatorySignature && (
                <img src={data.signatorySignature} alt="Signature" style={{ maxHeight: '60px', objectFit: 'contain' }} />
              )}
              {data.stampImage && (
                <img src={data.stampImage} alt="Stamp" style={{ maxHeight: '75px', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '5px' }}>{data.signatoryName || 'Purvin Raiyani'}</div>
            <div>({data.signatoryDesignation || 'Proprietor'})</div>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div className="footer-container">
          <div className="footer-slogan">"NURTURING THE NATURE FOR HUMAN RACE"</div>
          <div>5-6/B, Nayan Jyot Chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist.- Rajkot (GUJ.) +91 81405 55515</div>
          <div>Email: jagnathtechnologies@yahoo.com / www.jagnathlabtechnologies.com</div>
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="audit-print-page">
        <div className="page-content-wrapper">
          <div className="header-logo-container">
            <img className="header-logo-img" src={getLogoUrl()} alt="Company Logo" />
            <hr className="header-divider-line" />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '13pt', margin: 0 }}>PROVISIONAL ESTIMATED QUOTE</h3>
          </div>

          {/* Metadata Grid Table */}
          <table className="audit-table" style={{ marginBottom: '20px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', fontWeight: 'bold' }}>
                  CLIENT NAME:- <span style={{ fontWeight: 'normal' }}>M/s. {client.companyName || client.clientName || 'CLIENT NAME'}</span>
                </td>
                <td style={{ width: '50%', fontWeight: 'bold' }}>
                  REFERENCE:- <span style={{ fontWeight: 'normal' }}>{data.reference}</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>
                  ADDRESS:- <span style={{ fontWeight: 'normal', whiteSpace: 'pre-line' }}>{client.plantAddress || client.address || 'Address'}</span>
                </td>
                <td style={{ fontWeight: 'bold' }}>
                  APPROVED BY:- <span style={{ fontWeight: 'normal' }}>{data.signatoryName || 'Mr. Purvin Patel'}</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>
                  Q-P.I :- <span style={{ fontWeight: 'normal' }}>{data.quotationNumber}</span>
                </td>
                <td style={{ fontWeight: 'bold' }}>
                  DATE:- <span style={{ fontWeight: 'normal' }}>{data.quotationDate}</span>
                  {data.revisedDate && <div>REVISED DATE:- <span style={{ fontWeight: 'normal' }}>{data.revisedDate}</span></div>}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Scope of work */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '11pt' }}>SCOPE OF WORK</h4>
            <div style={{ whiteSpace: 'pre-line', fontSize: '9.5pt', lineHeight: '1.4', textAlign: 'justify' }}>
              {data.scopeText}
            </div>
          </div>

          {/* Detail of Charges Table */}
          <div>
            <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 10px 0', fontSize: '11pt' }}>
              Detail of Charges for carrying out environmental audit as per GPCB norms.
            </h4>
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>Sr. No.</th>
                  <th style={{ width: '47%' }}>Description of work</th>
                  <th style={{ width: '10%' }}>Qty.</th>
                  <th style={{ width: '10%' }}>Unit</th>
                  <th style={{ width: '12%' }}>Rate</th>
                  <th style={{ width: '13%' }}>Amount Rs.</th>
                </tr>
              </thead>
              <tbody>
                {data.charges.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{item.srNo || index + 1}</td>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.rate).toLocaleString('en-IN')}/-</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.amount).toLocaleString('en-IN')}/-</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                  <td colSpan={5} style={{ textAlign: 'right' }}>Total Subtotal:</td>
                  <td style={{ textAlign: 'right' }}>{subtotal.toLocaleString('en-IN')}/-</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                  <td colSpan={5} style={{ textAlign: 'right' }}>GST (18%):</td>
                  <td style={{ textAlign: 'right' }}>{gstAmount.toLocaleString('en-IN')}/-</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', fontSize: '10.5pt' }}>
                  <td colSpan={5} style={{ textAlign: 'right' }}>Grand Total (Rs.):</td>
                  <td style={{ textAlign: 'right' }}>{grandTotal.toLocaleString('en-IN')}/-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '9pt', fontStyle: 'italic', marginTop: '10px' }}>
            Note: - Tax will be paid extra (GST 18%) apart from above rate/amount.
          </div>
        </div>

        {/* Footer Page 2 */}
        <div className="footer-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9pt', fontWeight: 'bold' }}>Page 2</span>
            <span className="footer-slogan">"NURTURING THE NATURE FOR HUMAN RACE"</span>
            <span style={{ width: '30px' }}></span>
          </div>
        </div>
      </div>

      {/* ================= PAGE 3 ================= */}
      <div className="audit-print-page">
        <div className="page-content-wrapper">
          <div className="header-logo-container">
            <img className="header-logo-img" src={getLogoUrl()} alt="Company Logo" />
            <hr className="header-divider-line" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 12px 0', fontSize: '11.5pt' }}>Terms and conditions:</h4>
            <div style={{ whiteSpace: 'pre-line', fontSize: '9.5pt', lineHeight: '1.5', textAlign: 'justify' }}>
              {data.termsText}
            </div>
          </div>

          <div style={{ fontSize: '9pt', fontStyle: 'italic', marginBottom: '25px', background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            (Note: - We have briefly studied all your scope of work and accordingly we are tied and committed to uphold highest standards of honesty & integrity for accuracy to the work order.)
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div>Thanking you in anticipation!</div>
            <div style={{ fontWeight: 'bold' }}>For, {company.companyName?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '15px 0' }}>
            {data.signatorySignature && (
              <img src={data.signatorySignature} alt="Signature" style={{ maxHeight: '60px', objectFit: 'contain' }} />
            )}
            {data.stampImage && (
              <img src={data.stampImage} alt="Stamp" style={{ maxHeight: '75px', objectFit: 'contain' }} />
            )}
          </div>

          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>Authorized Signatory</div>
          <div style={{ marginTop: '20px', fontSize: '10pt', fontWeight: 'bold' }}>
            Contact Person: - {data.contactPerson}
          </div>
        </div>

        {/* Footer Page 3 */}
        <div className="footer-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9pt', fontWeight: 'bold' }}>Page 3</span>
            <span className="footer-slogan">"NURTURING THE NATURE FOR HUMAN RACE"</span>
            <span style={{ width: '30px' }}></span>
          </div>
        </div>
      </div>

      {/* ================= PAGE 4 (ANNEXURE) ================= */}
      <div className="audit-print-page" style={{ padding: '15mm 15mm 15mm 15mm' }}>
        <div className="page-content-wrapper">
          <div className="header-logo-container" style={{ marginBottom: '2px' }}>
            <img className="header-logo-img" src={getLogoUrl()} alt="Company Logo" style={{ maxHeight: '55px' }} />
            <hr className="header-divider-line" style={{ margin: '3px 0 10px 0' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '12pt', margin: 0 }}>Annexure - B</h3>
          </div>

          {/* Rate Matrix Table */}
          <table className="audit-table" style={{ fontSize: '8.2pt', marginBottom: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ width: '6%', padding: '4px' }}>Sr. No.</th>
                <th style={{ width: '36%', padding: '4px', textAlign: 'left' }}>DESCRIPTIONS</th>
                <th style={{ width: '13%', padding: '4px' }}>Rate per sample</th>
                <th style={{ width: '13%', padding: '4px' }}>Sample per visit</th>
                <th style={{ width: '16%', padding: '4px' }}>Charges per visit / order</th>
                <th style={{ width: '16%', padding: '4px' }}>Total (3 visit)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedAnnexure).map((catName, catIdx) => {
                const items = groupedAnnexure[catName];
                return (
                  <React.Fragment key={catIdx}>
                    {/* Category Header Row */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>
                      <td style={{ textAlign: 'center', padding: '4px' }}>{catIdx + 1}</td>
                      <td colSpan={5} style={{ padding: '4px', textTransform: 'uppercase' }}>{catName}</td>
                    </tr>

                    {items.map((item, itemIdx) => {
                      const formattedRate = parseFloat(item.ratePerSample || 0).toLocaleString('en-IN');
                      const formattedVisitCharges = parseFloat(item.chargesPerVisit || 0).toLocaleString('en-IN');
                      const formattedTotal = parseFloat(item.total || 0).toLocaleString('en-IN');

                      return (
                        <tr key={itemIdx}>
                          <td></td>
                          <td style={{ padding: '3px 6px' }}>{item.description}</td>
                          <td style={{ textAlign: 'center', padding: '3px' }}>{formattedRate}/-</td>
                          <td style={{ textAlign: 'center', padding: '3px' }}>{item.samplePerVisit}</td>
                          <td style={{ textAlign: 'right', padding: '3px' }}>{formattedVisitCharges}/-</td>
                          <td style={{ textAlign: 'right', padding: '3px', fontWeight: 'bold' }}>{formattedTotal}/-</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div style={{ fontSize: '8pt', fontStyle: 'italic', background: '#f8fafc', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
            Note: At the time of visit if any extra stack found then extra charges will be included in invoice and if any parameters found to be added for testing then their charges are to be included at the time of reporting and invoice.
          </div>
        </div>

        {/* Footer Page 4 */}
        <div className="footer-container" style={{ paddingTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>Page 4</span>
            <span className="footer-slogan" style={{ fontSize: '7.5pt' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
            <span style={{ width: '30px' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditQuotationPrint;
