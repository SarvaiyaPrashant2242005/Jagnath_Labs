import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2, 
  Download, 
  Eye, 
  Star,
  Scale,
  Globe2,
  Target,
  Phone,
  ArrowRight
} from 'lucide-react';
import CertificateModal from './CertificateModal';

export default function CertificatesView({ onNavigateTab, onAppointmentClick }) {
  const [selectedCert, setSelectedCert] = useState(null);

  // NABL Certificate Data
  const nablCert = {
    title: 'NABL Accreditation Certificate (TC-14851)',
    subtitle: 'ISO/IEC 17025:2017 Testing Laboratory Accreditation (2024–2028)',
    image: '/assets/reference_images/nabl_cert_tc14851.webp',
    pdfUrl: '/assets/reference_images/Certificate_TC-14851_2024-2028.pdf',
    downloadName: 'Certificate_TC-14851_2024-2028.pdf',
    validity: '(2024–2028)'
  };

  // ILAC - NABL Agreement Data
  const ilacCert = {
    title: 'ILAC – NABL MRA Agreement',
    subtitle: 'Terms and Conditions for Use of Combined ILAC MRA Mark (2024–2028)',
    image: '/assets/reference_images/ilac_nabl_agreement.webp',
    pdfUrl: '/assets/reference_images/ILAC_-_NABL_AGREEMENT_2024-2028.pdf',
    downloadName: 'ILAC_-_NABL_AGREEMENT_2024-2028.pdf',
    validity: '(2024–2028)'
  };

  // GPCB Recognition Certificates Data
  const gpcbCerts = [
    {
      page: 'Page 1',
      title: 'GPCB Recognition (2025 – Dec 2026) — Page 1',
      subtitle: 'Gujarat Pollution Control Board Recognition Order - Schedule-II Auditor',
      image: '/assets/reference_images/gpcb_page_1.webp',
      pdfUrl: '/assets/reference_images/GPCB_RECOGNITION_2025-_DEC_2026.pdf',
      downloadName: 'GPCB_Recognition_2025_DEC_2026.pdf'
    },
    {
      page: 'Page 2',
      title: 'GPCB Recognition (2025 – Dec 2026) — Page 2',
      subtitle: 'Gujarat Pollution Control Board Recognition Conditions & Approvals',
      image: '/assets/reference_images/gpcb_page_2.webp',
      pdfUrl: '/assets/reference_images/GPCB_RECOGNITION_2025-_DEC_2026.pdf',
      downloadName: 'GPCB_Recognition_2025_DEC_2026.pdf'
    }
  ];

  const handleContactNav = () => {
    if (onNavigateTab) {
      onNavigateTab('contact');
    } else if (onAppointmentClick) {
      onAppointmentClick();
    } else {
      window.location.hash = '#/contact';
    }
  };

  return (
    <div className="jlt-view-enter">
      {/* 1. DARK SUB-HERO BANNER (Matches Screenshot 1) */}
      <section className="jlt-sub-hero">
        <div className="jlt-container">
          <span className="jlt-sub-hero-tag">ACCREDITATIONS & CERTIFICATIONS</span>
          <h1 className="jlt-sub-hero-title">Our Quality Credentials</h1>
          <p className="jlt-sub-hero-desc">
            Every certificate we hold is a promise to our clients — that our results are accurate, 
            traceable, and accepted by regulators, courts, and international bodies.
          </p>

          <div className="jlt-sub-hero-badges">
            <span className="jlt-sub-badge">• NABL Accredited</span>
            <span className="jlt-sub-badge">• FSSAI Approved</span>
            <span className="jlt-sub-badge">• ISO 17025</span>
            <span className="jlt-sub-badge">• GPCB Authorised</span>
            <span className="jlt-sub-badge">• BIS Recognised</span>
          </div>
        </div>
      </section>

      {/* 2. SOLID GREEN TRUST STATS BAR (Matches Screenshot 1) */}
      <div className="jlt-trust-bar jlt-trust-bar-green">
        <div className="jlt-container">
          <div className="jlt-trust-grid">
            <div className="jlt-trust-item">
              <span className="jlt-trust-num">10+</span>
              <span className="jlt-trust-label">Years of Experience</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-num">NABL</span>
              <span className="jlt-trust-label">Accredited Lab</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-num">5 Lakh+</span>
              <span className="jlt-trust-label">Parameters Tested</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-num">1000+</span>
              <span className="jlt-trust-label">Clients Served</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN ACCREDITATION SECTIONS CONTAINER */}
      <div className="jlt-container" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        
        {/* =================================================================
           1. NABL Accreditation (Matches Screenshot 2, 3 & 4)
           ================================================================= */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            {/* Left Image with green NABL badge */}
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#66b834' }}>NABL</span>
              <img 
                src="/assets/reference_images/1746650566.webp" 
                alt="NABL Accredited Testing Facility" 
              />
            </div>

            {/* Right Content */}
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={26} color="#66b834" />
                </div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  NABL Accreditation
                </h2>
              </div>
              <p style={{ color: '#65a30d', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.1rem' }}>
                National Accreditation Board for Testing & Calibration Laboratories
              </p>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Our NABL accreditation is the highest mark of technical competence for a testing laboratory in India. 
                It confirms that our testing methods, equipment, personnel, and quality management system meet the 
                stringent requirements of ISO/IEC 17025 as assessed by an independent international body.
              </p>

              {/* Key Benefits Box */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65a30d', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div className="jlt-cert-benefits-grid">
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#66b834" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>ISO/IEC 17025 based assessment</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#66b834" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Internationally recognised</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#66b834" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Regular surveillance audits</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#66b834" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Covers all major test parameters</span>
                  </div>
                </div>
              </div>

              {/* Official Certificates & Agreements Cards (Side-by-side) */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65a30d', margin: '0 0 0.95rem 0' }}>
                  OFFICIAL CERTIFICATES & AGREEMENTS
                </h4>
                <div className="jlt-cert-docs-grid">
                  
                  {/* Card 1: NABL Accreditation Certificate */}
                  <div className="jlt-cert-doc-card">
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                      NABL Accreditation Certificate
                    </div>
                    <div 
                      className="jlt-cert-doc-preview" 
                      onClick={() => setSelectedCert(nablCert)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={nablCert.image} alt={nablCert.title} />
                      <div className="jlt-cert-doc-overlay">
                        <button type="button" className="jlt-cert-doc-btn">
                          <Eye size={16} /> View Certificate
                        </button>
                      </div>
                    </div>
                    <div className="jlt-cert-download-footer">
                      <span className="jlt-cert-validity-text">(2024–2028)</span>
                      <a 
                        href={nablCert.pdfUrl} 
                        download={nablCert.downloadName}
                        className="jlt-cert-pill-download-btn"
                        title="Download NABL Certificate PDF"
                      >
                        <Download size={14} /> Certificate
                      </a>
                    </div>
                  </div>

                  {/* Card 2: ILAC - NABL MRA Agreement */}
                  <div className="jlt-cert-doc-card">
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                      ILAC – NABL MRA Agreement
                    </div>
                    <div 
                      className="jlt-cert-doc-preview" 
                      onClick={() => setSelectedCert(ilacCert)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={ilacCert.image} alt={ilacCert.title} />
                      <div className="jlt-cert-doc-overlay">
                        <button type="button" className="jlt-cert-doc-btn">
                          <Eye size={16} /> View Certificate
                        </button>
                      </div>
                    </div>
                    <div className="jlt-cert-download-footer">
                      <span className="jlt-cert-validity-text">(2024–2028)</span>
                      <a 
                        href={ilacCert.pdfUrl} 
                        download={ilacCert.downloadName}
                        className="jlt-cert-pill-download-btn"
                        title="Download ILAC - NABL Agreement PDF"
                      >
                        <Download size={14} /> Certificate
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
           2. FSSAI Approved Laboratory (Matches Screenshot 4)
           ================================================================= */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            {/* Left Content */}
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={26} color="#e11d48" />
                </div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  FSSAI Approved Laboratory
                </h2>
              </div>
              <p style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.1rem' }}>
                Food Safety and Standards Authority of India
              </p>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Approved by FSSAI under the Food Safety and Standards Act, 2006, our laboratory is authorised to conduct 
                official food testing for regulatory compliance. This approval enables us to issue test reports that are 
                accepted by food businesses, regulators, and export authorities across India.
              </p>

              {/* Key Benefits Box */}
              <div style={{ background: '#fff1f2', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e11d48', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div className="jlt-cert-benefits-grid">
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#e11d48" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Official food testing authority</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#e11d48" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Covers packaged & raw food</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#e11d48" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Adulteration & contaminant testing</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#e11d48" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Export compliance reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image with pink FSSAI badge */}
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#e11d48' }}>FSSAI</span>
              <img 
                src="/assets/reference_images/2268874760.webp" 
                alt="FSSAI Approved Food Testing Laboratory" 
              />
            </div>
          </div>
        </section>

        {/* =================================================================
           3. ISO/IEC 17025 Compliant (Matches Screenshot 5)
           ================================================================= */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            {/* Left Image with blue ISO 17025 badge */}
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#0284c7' }}>ISO 17025</span>
              <img 
                src="/assets/reference_images/1413994710.webp" 
                alt="ISO/IEC 17025 Certified Testing" 
              />
            </div>

            {/* Right Content */}
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={26} color="#0284c7" />
                </div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  ISO/IEC 17025 Compliant
                </h2>
              </div>
              <p style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.1rem' }}>
                General Requirements for Competence of Testing Laboratories
              </p>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                ISO/IEC 17025 is the global benchmark for laboratory competence. Our quality management system is fully aligned 
                with this standard, ensuring that every test result we deliver is technically valid, traceable, and reproducible — 
                giving our clients complete confidence in our data.
              </p>

              {/* Key Benefits Box */}
              <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div className="jlt-cert-benefits-grid">
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Documented QMS procedures</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Calibrated & traceable equipment</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Proficiency testing participation</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Measurement uncertainty reporting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
           4. GPCB / CPCB Authorised (Matches Screenshot 6 & 7)
           ================================================================= */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            {/* Left Content */}
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck2 size={26} color="#ea580c" />
                </div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  GPCB / CPCB Authorised
                </h2>
              </div>
              <p style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.1rem' }}>
                Gujarat Pollution Control Board & Central Pollution Control Board
              </p>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Authorised by GPCB and CPCB for environmental testing and monitoring, our laboratory supports industries 
                across Gujarat in meeting their statutory environmental compliance obligations — from effluent discharge 
                monitoring to ambient air quality assessments and stack emission testing.
              </p>

              {/* Key Benefits Box */}
              <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ffedd5', marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div className="jlt-cert-benefits-grid">
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#ea580c" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Effluent & stack emission testing</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#ea580c" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Ambient air quality monitoring</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#ea580c" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Solid & hazardous waste analysis</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#ea580c" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>GPCB compliance reporting</span>
                  </div>
                </div>
              </div>

              {/* GPCB Recognition Certificate Cards (Page 1 & Page 2) */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', margin: '0 0 1rem 0' }}>
                  GPCB RECOGNITION CERTIFICATE
                </h4>
                <div className="jlt-cert-docs-grid">
                  {gpcbCerts.map((cert, idx) => (
                    <div key={idx} className="jlt-cert-doc-card">
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                        {cert.page}
                      </div>
                      <div 
                        className="jlt-cert-doc-preview" 
                        onClick={() => setSelectedCert(cert)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={cert.image} alt={cert.title} />
                        <div className="jlt-cert-doc-overlay">
                          <button type="button" className="jlt-cert-doc-btn">
                            <Eye size={16} /> View Certificate
                          </button>
                        </div>
                      </div>
                      <div className="jlt-cert-doc-caption">
                        {cert.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Image with orange GPCB badge */}
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#f59e0b' }}>GPCB</span>
              <img 
                src="/assets/reference_images/2177266918.webp" 
                alt="Environmental Compliance Field Engineer" 
              />
            </div>
          </div>
        </section>

        {/* =================================================================
           5. Robust Quality Management (Matches Screenshot 8)
           ================================================================= */}
        <section className="jlt-cert-section" style={{ paddingBottom: '1rem' }}>
          <div className="jlt-service-row">
            {/* Left Image with teal QMS badge */}
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#06b6d4' }}>QMS</span>
              <img 
                src="/assets/reference_images/1545344758.webp" 
                alt="Robust Quality Management and Testing Controls" 
              />
            </div>

            {/* Right Content */}
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={26} color="#0891b2" />
                </div>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  Robust Quality Management
                </h2>
              </div>
              <p style={{ color: '#0891b2', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.1rem' }}>
                Internal Quality System & Proficiency Testing
              </p>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Beyond external accreditations, we maintain a rigorous internal quality management system with documented SOPs, 
                regular equipment calibration, inter-laboratory comparisons, and proficiency testing participation — 
                ensuring every result we deliver is accurate, reliable, and defensible.
              </p>

              {/* Key Benefits Box */}
              <div style={{ background: '#ecfeff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #a5f3fc' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div className="jlt-cert-benefits-grid">
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0891b2" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Documented SOPs for all tests</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0891b2" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Regular equipment calibration</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0891b2" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Inter-laboratory comparisons</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} color="#0891b2" />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Continuous staff training</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* =================================================================
         6. WHY IT MATTERS SECTION (Matches Screenshot 9)
         ================================================================= */}
      <section className="jlt-why-matters-section">
        <div className="jlt-container">
          <div className="jlt-header-center" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="jlt-why-matters-badge">WHY IT MATTERS</span>
            <h2 className="jlt-why-matters-title">What Our Accreditations Mean for You</h2>
          </div>

          <div className="jlt-why-matters-grid">
            {/* Card 1: Legally Defensible Reports */}
            <div className="jlt-why-matters-card">
              <div className="jlt-why-matters-icon-box" style={{ background: '#f0f9ff' }}>
                <Scale size={32} color="#0284c7" />
              </div>
              <h3 className="jlt-why-matters-card-title">Legally Defensible Reports</h3>
              <p className="jlt-why-matters-card-desc">
                Our accredited test reports are accepted by courts, tribunals, GPCB, MoEFCC, and all regulatory authorities without question.
              </p>
            </div>

            {/* Card 2: Internationally Recognised */}
            <div className="jlt-why-matters-card">
              <div className="jlt-why-matters-icon-box" style={{ background: '#f0fdf4' }}>
                <Globe2 size={32} color="#16a34a" />
              </div>
              <h3 className="jlt-why-matters-card-title">Internationally Recognised</h3>
              <p className="jlt-why-matters-card-desc">
                NABL accreditation is recognised under ILAC MRA, meaning our reports are accepted in over 100 countries for trade and compliance.
              </p>
            </div>

            {/* Card 3: Accurate & Reliable Results */}
            <div className="jlt-why-matters-card">
              <div className="jlt-why-matters-icon-box" style={{ background: '#fef2f2' }}>
                <Target size={32} color="#ef4444" />
              </div>
              <h3 className="jlt-why-matters-card-title">Accurate &amp; Reliable Results</h3>
              <p className="jlt-why-matters-card-desc">
                Regular proficiency testing, calibration, and audits ensure our results are consistently accurate — protecting your business decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
         7. CERTIFICATE VERIFICATION CTA BANNER (Matches Screenshot 10)
         ================================================================= */}
      <section className="jlt-cert-verify-cta">
        <div className="jlt-container">
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <span className="jlt-sub-hero-tag" style={{ color: '#66b834', display: 'inline-block', marginBottom: '0.75rem' }}>
              CERTIFICATE VERIFICATION
            </span>
            <h2 className="jlt-cert-verify-title">
              Need to Verify Our Accreditations?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 2.25rem 0' }}>
              Contact us directly for certificate copies, accreditation scope details, or to discuss how our credentials support your specific compliance requirements.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleContactNav}
                className="jlt-btn-appointment"
                style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Contact Us <ArrowRight size={18} />
              </button>

              <a
                href="tel:+918140555515"
                className="jlt-cert-phone-btn"
              >
                <Phone size={18} /> +91 8140 5555 15
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <CertificateModal 
        isOpen={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}
