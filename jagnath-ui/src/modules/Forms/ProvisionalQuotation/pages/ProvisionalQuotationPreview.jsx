/**
 * @file ProvisionalQuotationPreview.jsx
 * @description Multi-Page A4 Interactive Preview for Provisional Estimated Quotations.
 * Formatted identically to official Jagnath Lab Technologies proposal documents.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaPrint, FaEdit, FaFilePdf, FaDownload,
  FaBuilding, FaCheckCircle, FaPhoneAlt, FaEnvelope
} from 'react-icons/fa';

import { getQuotationById, fetchMasterData, DEFAULT_TERMS_TEXT, DEFAULT_ANNEXURE_B_GROUPS } from '../services/provisionalQuotationStorage.service';
import {
  calculateMainCharges,
  calculateAnnexureI,
  calculateAnnexureA,
  calculateTransport,
  calculateDA,
  calculateAccommodation,
  calculateSubtotal,
  calculateGST,
  calculateGrandTotal,
  generateAnnexureB,
  calculateGroupTotal,
  calculateActivity,
  calculateAnnexureARowCharge,
  calculateAnnexureATotals,
  generateQuotationNumber,
  cleanQuotationNumber,
  getDepartmentCode,
  calculatePage2Charges,
} from '../utils/quotationCalculation.utils';


import '../styles/provisionalQuotationPrint.css';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${monthName} ${parseInt(day, 10)}, ${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDate = formatDisplayDate;

const getAuditReportTitle = (dept = 'ENVIRONMENTAL') => {
  const d = (dept || 'ENVIRONMENTAL').toUpperCase();
  if (d === 'ENVIRONMENTAL' || d === 'ENVIRONMENT') return 'Environment Audit Report charges';
  if (d === 'FOOD') return 'Food Audit Report charges';
  if (d === 'CHEMICAL') return 'Chemical Audit Report charges';
  const formatted = dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase();
  return `${formatted} Audit Report charges`;
};

const getPage2TableTitle = (dept = 'ENVIRONMENTAL') => {
  const d = (dept || 'ENVIRONMENTAL').toLowerCase().replace(/environmental/i, 'environment');
  return `Detail of Charges for carrying out ${d} audit as per GPCB`;
};

const formatDDMMYYYY = (dateStr) => {
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

const renderRichContent = (content) => {
  if (!content) return null;
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <div className="whitespace-pre-line">{content}</div>;
};

const getLogoUrl = (comp = {}) => {
  const logoPath = comp.quotationLogo || comp.quotation_logo || comp.logo;
  if (!logoPath) return '/Images/Navbar_Logo.png';
  const cleanPath = String(logoPath).replace(/\\/g, '/');
  const idx = cleanPath.lastIndexOf('uploads/');
  if (idx !== -1) {
    const backendRoot = import.meta.env.VITE_BACKEND_ROOT_URL || 'http://localhost:5000';
    return `${backendRoot}/${cleanPath.substring(idx)}`;
  }
  if (cleanPath.startsWith('file:') || cleanPath.startsWith('C:') || cleanPath.startsWith('D:')) {
    return '/Images/Navbar_Logo.png';
  }
  return logoPath;
};

const renderStandardPageFooter = (pageNum) => (
  <div className="doc-page-footer" style={{ marginTop: 'auto', paddingTop: '14px' }}>
    {/* Centered Slogan Above Divider Line */}
    <div style={{ textAlign: 'center', marginBottom: '3px' }}>
      <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', letterSpacing: '0.04em' }}>
        "NURTURING THE NATURE FOR HUMAN RACE"
      </span>
    </div>

    {/* Divider Line & Footer Details Below */}
    <div style={{ borderTop: '1.5px solid #0284c7', paddingTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', width: '50px' }}>
          Page {pageNum}
        </span>
        <div style={{ flexGrow: 1, textAlign: 'center', fontSize: '9.5px', color: '#1e293b', lineHeight: 1.4, marginRight: '50px' }}>
          <div>5-6/B, Nayanjyot chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist. – Rajkot (Guj.) +91 8140-555515</div>
          <div>
            Email: jagnathtechnologies@yahoo.com // <span style={{ color: '#0284c7', textDecoration: 'underline' }}>www.jagnath.com</span> // purvin@jagnath.com
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProvisionalQuotationPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [company, setCompany] = useState({});
  const [allParams, setAllParams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const quoteData = getQuotationById(id);
        setQuotation(quoteData);

        const masters = await fetchMasterData();
        setCompany(masters.company || {});
        setAllParams(masters.parameters || []);
      } catch (err) {
        console.error('Error loading preview data:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const annexureBList = useMemo(() => {
    if (!quotation) return [];
    return generateAnnexureB(quotation.activities || [], allParams, quotation.rateOverrides || {});
  }, [quotation, allParams]);

  if (loading || !quotation) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Loading Quotation Preview...</p>
      </div>
    );
  }

  // Financial values
  const globalVisits = parseInt(quotation.annexureAVisits !== undefined ? quotation.annexureAVisits : (quotation.annexureI?.visits || 3), 10) || 3;
  const annexureATotals = calculateAnnexureATotals(quotation.activities || [], globalVisits);
  const mainChargesTotal = calculateMainCharges(quotation.mainCharges || []);
  const annexureITotal = calculateAnnexureI(quotation.annexureI);
  const annexureATotal = annexureATotals.totalAnnualCharge;
  const discount = parseFloat(quotation.discount) || 0;
  const taxableAmount = calculateSubtotal(mainChargesTotal, annexureITotal, annexureATotal, discount);
  const gstPct = parseFloat(quotation.gstPercentage !== undefined ? quotation.gstPercentage : 18);
  const gstAmount = calculateGST(taxableAmount, gstPct);
  const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);


  const transport = quotation.annexureI?.transport || {};
  const da = quotation.annexureI?.da || {};
  const acc = quotation.annexureI?.accommodation || {};

  return (
    <div className="preview-page-container">
      {/* Action Toolbar */}
      <div className="preview-toolbar d-flex justify-between align-center mb-4 p-3 bg-white rounded shadow-sm border">
        <div className="d-flex align-center gap-3">
          <Link to={`/quotations/provisional/edit/${quotation.id}`} className="btn btn-outline-secondary btn-sm">
            <FaArrowLeft /> Edit Quotation
          </Link>
          <span className="font-bold text-slate-800">
            Previewing: {quotation.quotationNumber} (v{quotation.version || 1})
          </span>
          <span className="badge badge-info text-xs">{quotation.status || 'Draft'}</span>
        </div>

        <div className="d-flex align-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm font-semibold"
            onClick={() => window.open(`#/quotations/provisional/print/${quotation.id}`, '_blank')}
          >
            <FaPrint /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Document Container */}
      <div className="a4-preview-scroll-wrapper">
        {/* ================= PAGE 1: COVERING LETTER ================= */}
        <div className="a4-sheet">
          {/* CENTERED COMPANY LOGO FROM MASTERS & HORIZONTAL DIVIDER */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <img
              src={getLogoUrl(company)}
              alt="Company Logo"
              style={{ maxHeight: '100px', maxWidth: '300px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
            />
          </div>
          <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '24px' }}></div>

          {/* DATE ON RIGHT (REGULAR FONT) */}
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {formatDisplayDate(quotation.quotationDate)}
            </span>
          </div>

          {/* RECIPIENT CLIENT & PLANT ADDRESS (REGULAR CLEAN FORMAT) */}
          <div className="mb-4" style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.5, fontWeight: 'normal' }}>
            <p className="mb-1" style={{ margin: '0 0 4px 0' }}>To,</p>
            <p className="mb-1" style={{ margin: '0 0 4px 0', fontSize: '13.5px' }}>M/s. {quotation.clientName || 'Valued Client'}</p>
            <div className="whitespace-pre-line" style={{ lineHeight: 1.5 }}>
              {quotation.plantAddress || quotation.registeredAddress || 'Plant Address'}
            </div>
          </div>

          <div className="subject-box mb-4">
            <p className="subject-text font-bold">
              <u>Subject:</u> {quotation.subject || 'Submission of Provisional Estimated Quotation for Environmental Audit'}
            </p>
          </div>

          <div className="covering-letter-body mb-5">
            <p className="mb-3 font-semibold">Dear Sir,</p>
            <div className="intro-paragraphs">
              {renderRichContent(quotation.introText)}
            </div>
          </div>

          <div className="signature-footer pt-3" style={{ fontSize: '12px', marginBottom: '8px' }}>
            <p className="mb-0">Thanking you</p>
            <p className="mb-2 font-semibold">Authorized Signatory</p>
            
            <p className="mb-1" style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'normal' }}>
              For, JAGNATH LAB TECHNOLOGIES.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '55px', margin: '6px 0' }}>
              {quotation.signatorySignature && (
                <img
                  src={quotation.signatorySignature}
                  alt="Signature"
                  style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
                />
              )}
              {quotation.stampImage && (
                <img
                  src={quotation.stampImage}
                  alt="Stamp 1"
                  style={{ maxHeight: '60px', maxWidth: '75px', objectFit: 'contain' }}
                />
              )}
              {quotation.stampImage2 && (
                <img
                  src={quotation.stampImage2}
                  alt="Stamp 2"
                  style={{ maxHeight: '60px', maxWidth: '75px', objectFit: 'contain' }}
                />
              )}
            </div>

            <p className="font-bold mb-0" style={{ fontSize: '13px', color: '#0f172a' }}>
              {quotation.signatoryName || 'Purvin Raiyani'}
            </p>
            <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
              {quotation.signatoryDesignation || '(Proprietor)'}
            </p>
          </div>

          {renderStandardPageFooter(1)}
        </div>

        {/* ================= PAGE 2: PROVISIONAL ESTIMATED QUOTE & METADATA ================= */}
        <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11.5px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* CENTERED LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img
              src={getLogoUrl(company)}
              alt="Company Logo"
              style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
            />
          </div>
          <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '16px' }}></div>

          {/* PAGE 2 TITLE */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
              PROVISIONAL ESTIMATED QUOTE
            </h2>
          </div>

          {/* 3-COLUMN METADATA TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', marginBottom: '22px', fontSize: '11px', color: '#0f172a' }}>
            <tbody>
              <tr>
                {/* COLUMN 1: ENTIRE CLIENT SECTION BOLD */}
                <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top', fontWeight: 700 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>CLIENT NAME:-</p>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 700 }}>M/s. {quotation.clientName || 'Client Name'}</p>
                  
                  <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>ADDRES:</p>
                  <div className="whitespace-pre-line" style={{ lineHeight: 1.45, fontWeight: 700 }}>
                    {quotation.plantAddress || quotation.registeredAddress || 'Plant Address'}
                  </div>
                </td>

                {/* COLUMN 2: REFERENCE & APPROVED BY (LABELS BOLD) */}
                <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top' }}>
                  {(() => {
                    const refStr = quotation.referenceHeader || `REFERENCE:- GPCB - ${quotation.auditDepartment || 'ENVIRONMENTAL'} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`;
                    if (refStr.startsWith('REFERENCE:-') || refStr.startsWith('REFERENCE:')) {
                      const rest = refStr.replace(/^REFERENCE:-\s*|^REFERENCE:\s*/, '');
                      return (
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'normal', lineHeight: 1.45 }}>
                          <strong>REFERENCE:-</strong> {rest}
                        </p>
                      );
                    }
                    return (
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'normal', lineHeight: 1.45 }}>
                        {refStr}
                      </p>
                    );
                  })()}
                  
                  <div style={{ marginTop: '24px' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>APPROVED BY:-</p>
                    <p style={{ margin: 0, fontWeight: 'normal' }}>
                      {quotation.signatoryName ? (quotation.signatoryName.startsWith('Mr.') || quotation.signatoryName.startsWith('Dr.') ? quotation.signatoryName : `Mr. ${quotation.signatoryName}`) : 'Mr. Purvin Raiyani'}
                    </p>
                  </div>
                </td>

                {/* COLUMN 3: Q-P.I & DATES (LABELS BOLD) */}
                <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top' }}>
                  <p style={{ margin: '0 0 24px 0', fontWeight: 'normal' }}>
                    <strong>Q-P.I :-</strong> {cleanQuotationNumber(quotation.quotationNumber) || generateQuotationNumber(quotation.auditDepartment, quotation.quotationDate)}
                  </p>
                  
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'normal' }}>
                    <strong>DATE:-</strong> {formatDDMMYYYY(quotation.quotationDate)}
                  </p>
                  {(quotation.hasRevisedDate && quotation.revisedDate) ? (
                    <p style={{ margin: 0, fontWeight: 'normal', color: '#334155' }}>
                      <strong>Revised –</strong> {formatDDMMYYYY(quotation.revisedDate)}
                    </p>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>

          {/* SCOPE OF WORK HEADING & CONTENT */}
          <div style={{ textAlign: 'center', marginTop: '6px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
              SCOPE OF WORK
            </h3>
          </div>

          <p style={{ fontWeight: 700, textDecoration: 'underline', fontSize: '11px', marginBottom: '8px', color: '#0f172a', lineHeight: 1.35 }}>
            Visit, Collection &amp; analysis of the sample as {(quotation.auditDepartment || 'environment').toLowerCase().replace(/environmental/i, 'environment')} audit of your unit will be conducted as per below details:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: '#0f172a', lineHeight: 1.35, marginBottom: '10px' }}>
            {/* Point 1 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
              <span style={{ fontWeight: 700 }}>
                Method of collection and analysis must be approved / recognized by {quotation.scopeMethodRecognition || 'GPCB / CPCB / MoEF&CC.'}
              </span>
            </div>

            {/* Point 2 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.1, flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span style={{ fontWeight: 'normal' }}>
                Collection of sample and preservation of sample be made as per {quotation.scopePreservationGuidelines || 'GPCB/CPCB or IS/APHA'} guidelines.
              </span>
            </div>

            {/* Point 3 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
              <span style={{ fontWeight: 700 }}>
                Mode of Transportation for instruments and Dearness Allowance for Audit Officers to your Unit.
              </span>
            </div>

            {/* Point 4 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.1, flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span style={{ fontWeight: 'normal' }}>
                If any one of above is provided by you to the auditors, which are arranged by you then charges for same as mentioned below is not to be considered.
              </span>
            </div>

            {/* Point 5 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
              <span style={{ fontWeight: 700 }}>
                For the audit fee, Rs. 15,000/- for small scale, Rs. 20,000/- for medium scale and Rs. 25,000/- for large scale shall be considered.
              </span>
            </div>

            {/* Point 6 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
              <span style={{ fontWeight: 700 }}>
                Final Quote is to be submitted at a time after our first visit to your UNIT, Below Quote is just a Provisional Estimated Quote that is made as per your units Consent by {quotation.scopeConsentAuthority || 'GPCB.'}
              </span>
            </div>
          </div>

          {/* ================= PAGE 2: DETAIL OF CHARGES SUMMARY TABLE ================= */}
          {(() => {
            const p2Calc = calculatePage2Charges(quotation, annexureATotals.totalAnnualCharge);
            return (
              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '11.5px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.02em', color: '#0f172a' }}>
                    {getPage2TableTitle(quotation.auditDepartment)}
                  </h3>
                </div>

                {/* 6-Column Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9px', color: '#0f172a', lineHeight: 1.28, marginBottom: '6px' }}>
                  <thead>
                    <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                      <th style={{ width: '6%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                        Sr.<br />No.
                      </th>
                      <th style={{ width: '51%', border: '1px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontWeight: 800 }}>
                        Description of work
                      </th>
                      <th style={{ width: '7%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                        Qty.
                      </th>
                      <th style={{ width: '7%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                        Unit
                      </th>
                      <th style={{ width: '14%', border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                        Rate
                      </th>
                      <th style={{ width: '15%', border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                        Amount<br />Rs.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ROW 1: AUDIT REPORT CHARGES */}
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                        1
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 6px', fontWeight: 700 }}>
                        {quotation.page2Charges?.row1Description || `${getAuditReportTitle(quotation.auditDepartment)} (As per GPCB Guidelines)`}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>
                        {p2Calc.row1Qty}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>
                        {p2Calc.row1Unit}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                        {Number(p2Calc.auditFee).toLocaleString('en-IN')}/-
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                        {Number(p2Calc.row1Amount).toLocaleString('en-IN')}/-
                      </td>
                    </tr>

                    {/* ROW 2.1: TRANSPORTATION CHARGES */}
                    <tr>
                      <td rowSpan={3} style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        2
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                        <div>
                          Transportation charges for monitoring instrument/material for {p2Calc.transportDaysText || 'twelve days'}. [{p2Calc.visits} visits per year ({p2Calc.visits} X {p2Calc.daysPerVisit} Days/Visit)]. <span style={{ fontWeight: 700, fontSize: '8.5px' }}>(See Annexure I)</span>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.transportQty}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.transportUnit}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.transportRatePerVisit).toLocaleString('en-IN')}/-
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.transportTotal).toLocaleString('en-IN')}/-
                      </td>
                    </tr>

                    {/* ROW 2.2: DEARNESS ALLOWANCE (DA) */}
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                        <div>
                          Dearness allowance for audit team members. ({p2Calc.daPersons} persons per day X {p2Calc.daDaysPerYear} days per year). <span style={{ fontWeight: 700, fontSize: '8.5px' }}>({p2Calc.daRatePerPerson} rate per person per day).</span>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.daQty}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.daUnit}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.daRatePerVisit).toLocaleString('en-IN')}/-
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.daTotal).toLocaleString('en-IN')}/-
                      </td>
                    </tr>

                    {/* ROW 2.3: ACCOMMODATION FOR AUDITORS */}
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                        <div>
                          Accommodation For Auditors ({p2Calc.daPersons} persons per day X {p2Calc.daDaysPerYear} days per year). <span style={{ fontWeight: 700, fontSize: '8.5px' }}>(Stay in Hotel as {p2Calc.hotelRoomRate}/- x {p2Calc.hotelRoomsCount} Rooms per day = {p2Calc.dailyRoomCost}*{p2Calc.hotelNightsPerVisit}Nights i.e. {p2Calc.accomRatePerVisit} Per Visit)</span>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.accomQty}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                        {p2Calc.accomUnit}
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.accomRatePerVisit).toLocaleString('en-IN')}/-
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {Number(p2Calc.accomTotal).toLocaleString('en-IN')}/-
                      </td>
                    </tr>

                    {/* ROW 3: CHARGES FOR SAMPLING & ANALYSIS (ANNEXURE-A) */}
                    <tr>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        3
                      </td>
                      <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                        <div>
                          {quotation.page2Charges?.samplingDescription || 'Charges for sampling & analysis of various samples including Water, Wastewater, Stack Emission, and Ambient air quality, Solid waste & Noise level etc. (See Annexure A)'}
                        </div>
                      </td>
                      <td colSpan={4} style={{ border: '1px solid #0f172a', padding: '4px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600 }}>As actual as per GPCB rates</div>
                        <div style={{ fontWeight: 800, marginTop: '2px' }}>
                          ({Number(p2Calc.samplingTotal).toLocaleString('en-IN')}/- ) (See Annexure)
                        </div>
                      </td>
                    </tr>

                    {/* SUMMARY / TOTAL ROW */}
                    <tr style={{ borderTop: '1.5px solid #0f172a', background: '#ffffff', fontWeight: 800 }}>
                      <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '9px' }}>
                        Total (for Sr. no. 1 , 2 &amp; 3) Rs.
                      </td>
                      <td colSpan={4} style={{ border: '1px solid #0f172a', padding: '4px 8px', textAlign: 'center', fontWeight: 700, fontSize: '9px' }}>
                        ({Number(p2Calc.taxableTotal).toLocaleString('en-IN')}/- + GST {p2Calc.gstPercentage} %) = <span style={{ fontWeight: 800, textDecoration: 'underline' }}>{Number(p2Calc.grandTotal).toLocaleString('en-IN')}/-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Note below Table */}
                <div style={{ textAlign: 'center', marginTop: '4px', fontWeight: 800, fontSize: '9px', textDecoration: 'underline', color: '#0f172a' }}>
                  {quotation.page2Charges?.bottomNoteText || 'Note: - Tax will be paid extra (GST 18%) apart from above rate / amount.'}
                </div>
              </div>
            );
          })()}

          {renderStandardPageFooter(2)}
        </div>

        {/* ================= PAGE 3: TERMS & CONDITIONS ================= */}
        <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* CENTERED LOGO & DIVIDER */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img
              src={getLogoUrl(company)}
              alt="Company Logo"
              style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
            />
          </div>
          <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '16px' }}></div>

          {/* TERMS & CONDITIONS HEADING */}
          <h3 style={{ fontSize: '13px', fontWeight: 800, textDecoration: 'underline', color: '#0f172a', margin: '0 0 14px 0' }}>
            Terms and conditions:
          </h3>

          {/* TERMS BODY (RICH TEXT CONTENT) */}
          <div className="terms-conditions-body" style={{ color: '#0f172a', lineHeight: 1.5, fontSize: '11px' }}>
            {renderRichContent(quotation.termsText !== undefined ? quotation.termsText : DEFAULT_TERMS_TEXT)}
          </div>

          {/* SIGNATORY & CONTACT PERSON BLOCK */}
          <div style={{ marginTop: '16px', fontSize: '11.5px', color: '#0f172a', marginBottom: '8px' }}>
            <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Thanking you in anticipation!</p>
            <p style={{ fontWeight: 700, margin: '0 0 8px 0' }}>For, Jagnath Lab Technologies</p>

            {/* SIGNATURE & STAMP ROW (PAGE 3) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '48px', margin: '4px 0' }}>
              {quotation.signatorySignature && (
                <img src={quotation.signatorySignature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }} />
              )}
              {quotation.stampImage && (
                <img src={quotation.stampImage} alt="Round Stamp" style={{ maxHeight: '55px', maxWidth: '90px', objectFit: 'contain' }} />
              )}
              {quotation.stampImage2 && (
                <img src={quotation.stampImage2} alt="Address Stamp" style={{ maxHeight: '55px', maxWidth: '140px', objectFit: 'contain' }} />
              )}
            </div>

            <p style={{ fontWeight: 700, margin: '4px 0 14px 0' }}>Authorized Signatory</p>

            <p style={{ fontWeight: 700, margin: '0 0 14px 0' }}>
              Contact Person: - {quotation.contactPerson || 'Ankit Mistry (+91 7226-0579-78)'}
            </p>
          </div>

          {renderStandardPageFooter(3)}
        </div>

        {/* ================= PAGE 4: ANNEXURE - I & ANNEXURE - A (Combined Same Page) ================= */}
        <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '10mm 14mm 8mm 14mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '10.5px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* TOP HEADER: LOGO */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <img
              src={getLogoUrl(company)}
              alt="Company Logo"
              style={{ maxHeight: '70px', maxWidth: '240px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
            />
          </div>
          <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '10px' }}></div>

          {/* 1. TITLE: ANNEXURE - I */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.06em', color: '#0f172a' }}>
              ANNEXURE - I
            </h2>
          </div>

          {/* ANNEXURE - I GRID TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9.5px', color: '#0f172a', marginBottom: '12px' }}>
            <tbody>
              {/* ROW 1: AUDIT REPORT CHARGES */}
              <tr>
                <td style={{ width: '30px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                  1
                </td>
                <td style={{ border: '1px solid #0f172a', padding: '6px 8px', fontWeight: 700, verticalAlign: 'middle' }}>
                  {getAuditReportTitle(quotation.auditDepartment)}
                </td>
                <td style={{ width: '95px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                  {Number(quotation.annexureI?.auditFee || 25000).toLocaleString('en-IN')}
                </td>
                <td style={{ width: '105px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                  {Number(quotation.annexureI?.auditFee || 25000).toLocaleString('en-IN')}/-
                </td>
                <td style={{ width: '115px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                  {Number(quotation.annexureI?.auditFee || 25000).toLocaleString('en-IN')}/-
                </td>
              </tr>

              {/* ROW 2: MAIN TRANSPORTATION CHARGES (JLTs Vehicle) */}
              {(() => {
                const daysPerVisit = parseInt(quotation.annexureI?.daysPerVisit ?? quotation.page2Charges?.daysPerVisit, 10) || 4;
                const visits = parseInt(quotation.annexureI?.visits ?? quotation.page2Charges?.visits, 10) || 3;
                const totalDays = daysPerVisit * visits;
                const jltRate = Number(quotation.annexureI?.jltVehicleRatePerDay ?? quotation.page2Charges?.jltVehicleRatePerDay ?? 5000);
                const ratePerVisit = Number(quotation.annexureI?.transportRatePerVisit !== undefined ? quotation.annexureI.transportRatePerVisit : (quotation.page2Charges?.transportRatePerVisit !== undefined ? quotation.page2Charges.transportRatePerVisit : (jltRate * daysPerVisit)));
                const transportTotal = Number(quotation.annexureI?.transportTotalAmount !== undefined ? quotation.annexureI.transportTotalAmount : (quotation.page2Charges?.transportTotalAmount !== undefined ? quotation.page2Charges.transportTotalAmount : (ratePerVisit * visits)));
                const row2Text = (quotation.annexureI?.row2Title || 'Transportation charges for monitoring instrument/material. (per day) + Total {totalDays} Days. (For JLTs Vehicle)').replace('{totalDays}', totalDays);

                return (
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      2
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'middle', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700 }}>
                        {row2Text}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR PER DAY</div>
                      <div style={{ fontWeight: 800 }}>{Number(jltRate).toLocaleString('en-IN')}/-</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR {daysPerVisit} DAYS</div>
                      <div style={{ fontWeight: 800 }}>{Number(ratePerVisit).toLocaleString('en-IN')}/-</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR {visits} VISITS</div>
                      <div style={{ fontWeight: 800 }}>{Number(transportTotal).toLocaleString('en-IN')}/-</div>
                    </td>
                  </tr>
                );
              })()}

              {/* ROW 2A: OPTION 1 (CLIENT PROVIDED) */}
              {(() => {
                const opt1Text = (quotation.annexureI?.option1Title || 'In Option 1 if transportation for both instruments and officers are provided by M/s. {clientName} then NILL charges.').replace('{clientName}', quotation.clientName || 'Valued Client');
                const opt1Sub = quotation.annexureI?.option1Subtext || '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)';

                return (
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      <div style={{ marginBottom: '2px' }}>2</div>
                      <div>A</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                        {opt1Text}
                      </div>
                      <div style={{ fontSize: '9px', color: '#334155' }}>
                        {opt1Sub}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      -
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      -
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 6px', textAlign: 'left', fontSize: '8.8px', lineHeight: 1.35, color: '#1e293b', verticalAlign: 'top' }}>
                      {quotation.annexureI?.decisionNote || 'It is to be decided by the Company. If Option 1 or Option 2 for TA is chosen, then JLTs Vehicle transportation would be removed. And actual DA billing is to be added at the time of billing.'}
                    </td>
                  </tr>
                );
              })()}

              {/* ROW 2B: OPTION 2 (AGENCY CHARGES) */}
              {(() => {
                const opt2Text = quotation.annexureI?.option2Title || 'In Option 2 if transportation for both instruments and officers are provided by JLTs then it may increase as per charges of agency.';
                const opt2Sub = quotation.annexureI?.option2Subtext || '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)';
                const instLbl = quotation.annexureI?.instrumentLabel || 'For Instruments,';
                const audLbl = quotation.annexureI?.auditorLabel || 'For Auditors,';

                const instRate = Number(quotation.annexureI?.instrumentKmRate !== undefined ? quotation.annexureI.instrumentKmRate : 12);
                const instKm = Number(quotation.annexureI?.instrumentKmPerDay !== undefined ? quotation.annexureI.instrumentKmPerDay : 300);
                const instDaily = instRate * instKm;

                const audRate = Number(quotation.annexureI?.auditorKmRate !== undefined ? quotation.annexureI.auditorKmRate : 15);
                const audKm = Number(quotation.annexureI?.auditorKmPerDay !== undefined ? quotation.annexureI.auditorKmPerDay : 300);
                const audDaily = audRate * audKm;

                const combDaily = instDaily + audDaily;
                const dPerVisit = parseInt(quotation.annexureI?.daysPerVisit ?? quotation.page2Charges?.daysPerVisit, 10) || 4;
                const vCount = parseInt(quotation.annexureI?.visits ?? quotation.page2Charges?.visits, 10) || 3;
                const combDays = combDaily * dPerVisit;
                const combVisits = combDays * vCount;

                return (
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      <div style={{ marginBottom: '2px' }}>2</div>
                      <div>B</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                        {opt2Text}
                      </div>
                      <div style={{ fontSize: '9px', color: '#334155', marginBottom: '4px' }}>
                        {opt2Sub}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '9.2px', color: '#0f172a' }}>
                        <div>{instLbl} <span style={{ fontWeight: 600 }}>INR {instRate} for {instKm} kms/day = {Number(instDaily).toLocaleString('en-IN')}/-</span></div>
                        <div style={{ marginTop: '2px' }}>{audLbl} <span style={{ fontWeight: 600 }}>INR {audRate} for {audKm} kms/day = {Number(audDaily).toLocaleString('en-IN')}/-</span></div>
                      </div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR PER DAY</div>
                      <div style={{ fontWeight: 800 }}>{Number(combDaily).toLocaleString('en-IN')}/-</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR {dPerVisit} DAYS</div>
                      <div style={{ fontWeight: 800 }}>{Number(combDays).toLocaleString('en-IN')}/-</div>
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR {vCount} VISITS</div>
                      <div style={{ fontWeight: 800 }}>{Number(combVisits).toLocaleString('en-IN')}/-</div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>

          {/* 2. TITLE: ANNEXURE -A (BELOW ANNEXURE-I) */}
          <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
              ANNEXURE -A
            </h2>
          </div>

          {/* ANNEXURE - A 7-COLUMN TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9.5px', color: '#0f172a', marginBottom: '10px' }}>
            <thead>
              <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                <th style={{ width: '22%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  DESCRIPTIONS
                </th>
                <th style={{ width: '18%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  PARAMETERS TO BE MONITORED
                </th>
                <th style={{ width: '13%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  RATE PER SAMPLE
                </th>
                <th style={{ width: '8%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  VISITS
                </th>
                <th style={{ width: '15%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  NO. OF SAMPLE/QUARTER
                </th>
                <th style={{ width: '12%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  CHARGE PER VISIT/QUARTER
                </th>
                <th style={{ width: '12%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                  CHARGE
                </th>
              </tr>
            </thead>
            <tbody>
              {(quotation.activities || []).map((act, aIdx) => {
                const rowCalc = calculateAnnexureARowCharge(act, globalVisits);
                return (
                  <tr key={act.id || aIdx}>
                    {/* 1. DESCRIPTIONS */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 5px', fontWeight: 600, verticalAlign: 'middle', lineHeight: 1.3 }}>
                      {act.description}
                    </td>
                    {/* 2. PARAMETERS TO BE MONITORED */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', verticalAlign: 'middle', lineHeight: 1.3 }}>
                      {act.parametersMonitored || `As per annexure- B, Sr. No. ${act.srNo || aIdx + 1}`}
                    </td>
                    {/* 3. RATE PER SAMPLE */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                      {Number(rowCalc.rate).toLocaleString('en-IN')}/-
                    </td>
                    {/* 4. VISITS (Vertically centered spanning all rows) */}
                    {aIdx === 0 ? (
                      <td
                        rowSpan={(quotation.activities || []).length}
                        style={{
                          border: '1px solid #0f172a',
                          padding: '5px 4px',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          verticalAlign: 'middle',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        {globalVisits}
                      </td>
                    ) : null}
                    {/* 5. NO. OF SAMPLE/QUARTER */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 600, verticalAlign: 'middle' }}>
                      {act.sampleQuarter || `${String(act.sampleQty || 1).padStart(2, '0')} Sample`}
                    </td>
                    {/* 6. CHARGE PER VISIT/QUARTER */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                      {Number(rowCalc.chargePerVisit).toLocaleString('en-IN')}/-
                    </td>
                    {/* 7. CHARGE */}
                    <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      {Number(rowCalc.totalCharge).toLocaleString('en-IN')}/-
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL ROW */}
              <tr style={{ borderTop: '1.5px solid #0f172a', background: '#ffffff', fontWeight: 800 }}>
                <td style={{ border: '1px solid #0f172a', padding: '5px 5px', fontWeight: 800, textAlign: 'center' }}>
                  Total
                </td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px' }}></td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                  {Number(annexureATotals.totalRate).toLocaleString('en-IN')}/-
                </td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}>
                  -
                </td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px' }}></td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                  {Number(annexureATotals.totalChargePerVisit).toLocaleString('en-IN')}/-
                </td>
                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                  {Number(annexureATotals.totalAnnualCharge).toLocaleString('en-IN')}/-
                </td>
              </tr>
            </tbody>
          </table>

          {/* BREAK-UP OF ALL ANALYSIS CHARGES NOTE */}
          <div style={{ marginTop: '14px', marginBottom: '14px' }}>
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11px', textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a', marginBottom: '8px' }}>
              {quotation.annexureANoteTitle || `BREAK-UP OF ALL ANALYSIS CHARGES FOR AUDIT ${(quotation.financialYear || '2024-2025').replace(/^YEAR\s*/i, '')}`}
            </div>
            <p style={{ fontSize: '9.5px', lineHeight: 1.45, color: '#0f172a', margin: '0', textAlign: 'left', fontWeight: 500 }}>
              {quotation.annexureANoteText || 'The rates are indicative and may vary as per actual visits/work undertaken: Nos. of Days spent on site: Sampling and testing requirements: revision of rates from GPCB and any additional visit undertaken for additional data collection.'}
            </p>
          </div>

          {renderStandardPageFooter(4)}
        </div>

        {/* ================= PAGE 5: ANNEXURE - B (Discipline Groups & Parameters) ================= */}
        {(() => {
          const allGroups = quotation.annexureB || [];
          if (!allGroups.length) return null;
          const page5Groups = allGroups.length > 3 ? allGroups.slice(0, 3) : allGroups;
          const page6Groups = allGroups.length > 3 ? allGroups.slice(3) : [];

          return (
            <>
              <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* TOP HEADER: LOGO */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <img
                    src={getLogoUrl(company)}
                    alt="Company Logo"
                    style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                    onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                  />
                </div>
                <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '14px' }}></div>

                {/* TITLE: Annexure -B */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', fontStyle: 'italic', letterSpacing: '0.04em', color: '#0f172a' }}>
                    Annexure -B
                  </h2>
                </div>

                {/* ANNEXURE - B TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '10.5px', color: '#0f172a', marginBottom: '14px' }}>
                  <thead>
                    <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                      <th style={{ width: '8%', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                        Sr. No.
                      </th>
                      <th style={{ width: '74%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                        DESCRIPTIONS
                      </th>
                      <th style={{ width: '18%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                        RATE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page5Groups.map((group, gIdx) => {
                      const groupTotal = calculateGroupTotal(group);
                      return (
                        <React.Fragment key={group.id || gIdx}>
                          {/* Group Header Row */}
                          <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                              {group.srNo}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 8px', fontWeight: 800, color: '#0f172a' }}>
                              {group.category}
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800 }}>
                            </td>
                          </tr>

                          {/* Parameter Rows */}
                          {(group.parameters || []).map((param, pIdx) => (
                            <tr key={param.id || pIdx}>
                              <td style={{ border: '1px solid #0f172a', padding: '3.5px 4px', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px 3.5px 16px', color: '#1e293b' }}>
                                {param.description}
                              </td>
                              <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                {Number(param.rate || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}

                          {/* Subtotal Row */}
                          <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}></td>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              Total ({group.category}):
                            </td>
                            <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {Number(groupTotal).toLocaleString('en-IN')}/-
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {renderStandardPageFooter(5)}
              </div>

              {/* PAGE 6 (IF NEEDED FOR OVERFLOW GROUPS) */}
              {page6Groups.length > 0 && (
                <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {/* TOP HEADER: LOGO */}
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <img
                      src={getLogoUrl(company)}
                      alt="Company Logo"
                      style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                      onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                    />
                  </div>
                  <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '14px' }}></div>

                  {/* TITLE: Annexure -B (Contd.) */}
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', fontStyle: 'italic', letterSpacing: '0.04em', color: '#0f172a' }}>
                      Annexure -B (Contd.)
                    </h2>
                  </div>

                  {/* TABLE */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '10.5px', color: '#0f172a', marginBottom: '14px' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                        <th style={{ width: '8%', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                          Sr. No.
                        </th>
                        <th style={{ width: '74%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                          DESCRIPTIONS
                        </th>
                        <th style={{ width: '18%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                          RATE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {page6Groups.map((group, gIdx) => {
                        const groupTotal = calculateGroupTotal(group);
                        return (
                          <React.Fragment key={group.id || gIdx}>
                            <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                                {group.srNo}
                              </td>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 8px', fontWeight: 800, color: '#0f172a' }}>
                                {group.category}
                              </td>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800 }}>
                              </td>
                            </tr>

                            {(group.parameters || []).map((param, pIdx) => (
                              <tr key={param.id || pIdx}>
                                <td style={{ border: '1px solid #0f172a', padding: '3.5px 4px', textAlign: 'center' }}></td>
                                <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px 3.5px 16px', color: '#1e293b' }}>
                                  {param.description}
                                </td>
                                <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                  {Number(param.rate || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}

                            <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}></td>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                Total ({group.category}):
                              </td>
                              <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                {Number(groupTotal).toLocaleString('en-IN')}/-
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>

                  {renderStandardPageFooter(6)}
                </div>
              )}
            </>
          );
        })()}

      </div>
    </div>
  );
};

export default ProvisionalQuotationPreview;
