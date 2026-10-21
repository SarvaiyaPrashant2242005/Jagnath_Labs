import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2, 
  Download, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import CertificateModal from './CertificateModal';
import { getJagnathImage } from '../utils/images';

export default function CertificatesView() {
  const [selectedCert, setSelectedCert] = useState(null);

  const gpcbCerts = [
    {
      page: 'Page 1',
      title: 'GPCB Recognition (2025 – Dec 2026) — Page 1',
      subtitle: 'Gujarat Pollution Control Board Recognition Order - Schedule-II Auditor',
      image: getJagnathImage('2205869132.webp'),
      downloadName: 'GPCB_Recognition_Certificate_Page_1.webp'
    },
    {
      page: 'Page 2',
      title: 'GPCB Recognition (2025 – Dec 2026) — Page 2',
      subtitle: 'Gujarat Pollution Control Board Recognition Conditions & Approvals',
      image: getJagnathImage('2277442957.webp'),
      downloadName: 'GPCB_Recognition_Certificate_Page_2.webp'
    }
  ];

  return (
    <div className="jlt-view-enter">
      {/* Dark Sub-Hero */}
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

      {/* Green Trust Stats Bar */}
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

      {/* Main Certificates Content Container */}
      <div className="jlt-container" style={{ paddingTop: '3.5rem', paddingBottom: '4.5rem' }}>
        
        {/* 1. NABL Accreditation */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge">NABL</span>
              <img 
                src={getJagnathImage('1746650566.webp')} 
                alt="NABL Accredited Testing Facility" 
              />
            </div>

            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <Award size={28} color="#66b834" />
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

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65a30d', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>ISO/IEC 17025 based assessment</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Internationally recognised</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Regular surveillance audits</span>
                  </div>
                  <div className="jlt-service-sub-bullet">
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '0.88rem', color: '#334155' }}>Covers all major test parameters</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65a30d', margin: '0 0 0.75rem 0' }}>
                  OFFICIAL CERTIFICATES & AGREEMENTS
                </h4>
                <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                      NABL Accreditation Certificate
                    </span>
                    <a 
                      href={getJagnathImage('1746650566.webp')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#66b834', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={14} /> Download Certificate
                    </a>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                      ILAC – NABL MRA Agreement
                    </span>
                    <a 
                      href={getJagnathImage('1746650566.webp')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#66b834', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Download size={14} /> Download Agreement
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FSSAI Approved Laboratory */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} color="#e11d48" />
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

              <div style={{ background: '#fff1f2', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#e11d48', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
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

            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#e11d48' }}>FSSAI</span>
              <img 
                src={getJagnathImage('1261561179.webp')} 
                alt="FSSAI Approved Food Testing" 
              />
            </div>
          </div>
        </section>

        {/* 3. ISO/IEC 17025 Compliant */}
        <section className="jlt-cert-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3.5rem', marginBottom: '3.5rem' }}>
          <div className="jlt-service-row">
            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#0284c7' }}>ISO 17025</span>
              <img 
                src={getJagnathImage('1413994710.webp')} 
                alt="ISO/IEC 17025 Certified Testing" 
              />
            </div>

            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={28} color="#0284c7" />
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

              <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
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

        {/* 4. GPCB / CPCB Authorised */}
        <section className="jlt-cert-section" style={{ paddingBottom: '1rem' }}>
          <div className="jlt-service-row">
            <div className="jlt-service-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <FileCheck2 size={28} color="#ea580c" />
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

              <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '12px', border: '1px solid #ffedd5', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', margin: '0 0 0.85rem 0' }}>
                  KEY BENEFITS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
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

              {/* GPCB Recognition Certificate Cards */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ea580c', margin: '0 0 1rem 0' }}>
                  GPCB RECOGNITION CERTIFICATE
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
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

            <div className="jlt-service-img-box">
              <span className="jlt-service-img-badge" style={{ background: '#f59e0b' }}>GPCB</span>
              <img 
                src={getJagnathImage('2177266918.webp')} 
                alt="Environmental Compliance Field Engineer" 
              />
            </div>
          </div>
        </section>

      </div>

      {/* Lightbox Modal */}
      <CertificateModal 
        isOpen={!!selectedCert}
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}
