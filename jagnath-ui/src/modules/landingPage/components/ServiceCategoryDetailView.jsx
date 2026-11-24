import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  PhoneCall, 
  Award, 
  FileCheck2,
  Apple,
  HeartHandshake,
  Wind,
  Sprout,
  Briefcase
} from 'lucide-react';

const categoryIconMap = {
  Apple: <Apple size={24} />,
  HeartHandshake: <HeartHandshake size={24} />,
  Wind: <Wind size={24} />,
  Sprout: <Sprout size={24} />,
  Briefcase: <Briefcase size={24} />
};

export const ServiceCategoryDetailView = ({ category, onAppointmentClick }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category?.slug]);

  if (!category) {
    return (
      <div className="jlt-services-wrapper" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <h2>Service Category Not Found</h2>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>
          Please choose one of our verified testing and consultancy categories from the menu.
        </p>
        <button
          type="button"
          className="jlt-btn-quote"
          style={{ margin: '1.5rem auto' }}
          onClick={() => window.location.hash = '#/services'}
        >
          View All Services
        </button>
      </div>
    );
  }

  return (
    <div className="jlt-category-page-wrapper">
      {/* 1. Category Hero Banner */}
      <section className="jlt-category-hero">
        <div className="jlt-container">
          <div className="jlt-category-hero-content">
            <span className="jlt-category-hero-badge">
              <Award size={15} />
              <span>{category.heroBadge}</span>
            </span>
            <h1 className="jlt-category-hero-title">{category.heroTitle}</h1>
            <p className="jlt-category-hero-desc">{category.heroDescription}</p>

            <div className="jlt-category-hero-actions">
              <button
                type="button"
                className="jlt-btn-category-quote"
                onClick={onAppointmentClick}
              >
                <span>Request Quotation & Analysis</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="#/contact"
                className="jlt-btn-category-contact"
              >
                <PhoneCall size={16} />
                <span>Speak with a Laboratory Officer</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overview & Visual Section */}
      <section className="jlt-category-overview-section">
        <div className="jlt-container">
          <div className="jlt-category-overview-grid">
            {/* Visual Box */}
            <div className="jlt-category-overview-img-wrap">
              <img 
                src={category.image} 
                alt={category.title} 
                className="jlt-category-overview-img" 
              />
              <div className="jlt-category-floating-badge">
                <ShieldCheck size={28} className="floating-badge-icon" />
                <div>
                  <strong>NABL Accredited & Certified</strong>
                  <span>Accurate, legally defensible analytical testing</span>
                </div>
              </div>
            </div>

            {/* Overview Text & Benefits */}
            <div className="jlt-category-overview-text">
              <div className="jlt-category-pill">
                {categoryIconMap[category.iconName] || <Briefcase size={18} />}
                <span>{category.badge}</span>
              </div>
              <h2 className="jlt-category-overview-title">
                Technical Excellence in {category.title}
              </h2>
              <p className="jlt-category-overview-lead">{category.overview}</p>

              <div className="jlt-category-benefits-box">
                <h4 className="jlt-category-benefits-heading">Key Capabilities & Standards:</h4>
                <div className="jlt-category-benefits-grid">
                  {category.keyBenefits.map((benefit, bIdx) => (
                    <div key={bIdx} className="jlt-category-benefit-item">
                      <CheckCircle2 size={18} className="benefit-icon" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dedicated 6 Services Grid */}
      <section className="jlt-category-services-section">
        <div className="jlt-container">
          <div className="jlt-category-section-header">
            <span className="jlt-section-badge" style={{ color: '#047857' }}>COMPLETE SCOPE</span>
            <h2 className="jlt-category-section-title">
              Our 6 Specialized {category.title} Solutions
            </h2>
            <p className="jlt-category-section-desc">
              Every parameter is tested in accordance with national and international standard test methods by our qualified technical analysts.
            </p>
          </div>

          <div className="jlt-category-services-grid">
            {category.services.map((svc, sIdx) => (
              <div key={svc.id} className="jlt-service-card-item">
                <div className="jlt-service-card-top">
                  <span className="jlt-service-card-badge">{svc.badge}</span>
                  <div className="jlt-service-card-num">0{sIdx + 1}</div>
                </div>

                <h3 className="jlt-service-card-title">{svc.name}</h3>
                <p className="jlt-service-card-desc">{svc.description}</p>

                <div className="jlt-service-card-highlights">
                  <span className="highlights-label">Core Capabilities:</span>
                  <ul className="highlights-list">
                    {svc.highlights.map((h, hIdx) => (
                      <li key={hIdx}>
                        <FileCheck2 size={15} className="highlight-icon" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="jlt-service-card-footer">
                  <button
                    type="button"
                    className="jlt-service-card-enquire-btn"
                    onClick={onAppointmentClick}
                  >
                    <span>Enquire for {svc.name}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Professional Enquiry & CTA Section */}
      <section className="jlt-category-cta-section">
        <div className="jlt-container">
          <div className="jlt-category-cta-card">
            <div className="jlt-category-cta-text">
              <span className="jlt-cta-mini-tag">READY TO START YOUR ANALYSIS?</span>
              <h2 className="jlt-category-cta-title">
                Get Certified {category.title} with Jagnath Lab Technologies
              </h2>
              <p className="jlt-category-cta-desc">
                Contact our sample collection and analytical team today for rapid sample pickup, customized testing quotes, and NABL-accredited test reports.
              </p>
            </div>
            <div className="jlt-category-cta-buttons">
              <button
                type="button"
                className="jlt-btn-cta-primary"
                onClick={onAppointmentClick}
              >
                <span>Book Sample Testing</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="#/services"
                className="jlt-btn-cta-secondary"
              >
                <span>Browse All 5 Categories</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .jlt-category-page-wrapper {
          width: 100%;
          background-color: #f8fafc;
        }

        /* Hero */
        .jlt-category-hero {
          background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0284c7 100%);
          color: #ffffff;
          padding: 5.5rem 1rem 4.5rem 1rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .jlt-category-hero-content {
          max-width: 880px;
          margin: 0 auto;
        }

        .jlt-category-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 0.4rem 1.1rem;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .jlt-category-hero-title {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.5px;
        }

        .jlt-category-hero-desc {
          font-size: 1.1rem;
          line-height: 1.7;
          opacity: 0.92;
          margin: 0 auto 2.25rem auto;
          max-width: 760px;
        }

        .jlt-category-hero-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .jlt-btn-category-quote {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #66b834;
          color: #ffffff;
          padding: 0.85rem 1.85rem;
          border-radius: 40px;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(102, 184, 52, 0.35);
        }

        .jlt-btn-category-quote:hover {
          background-color: #58a22b;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 184, 52, 0.45);
        }

        .jlt-btn-category-contact {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 0.85rem 1.75rem;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .jlt-btn-category-contact:hover {
          background-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-2px);
        }

        /* Overview Section */
        .jlt-category-overview-section {
          padding: 5rem 1rem;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .jlt-category-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 3.5rem;
          align-items: center;
        }

        .jlt-category-overview-img-wrap {
          position: relative;
          border-radius: 20px;
          overflow: visible;
        }

        .jlt-category-overview-img {
          width: 100%;
          height: 420px;
          object-fit: cover;
          border-radius: 20px;
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.15);
          display: block;
        }

        .jlt-category-floating-badge {
          position: absolute;
          bottom: -24px;
          left: 20px;
          right: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1);
        }

        .floating-badge-icon {
          color: #047857;
          flex-shrink: 0;
        }

        .jlt-category-floating-badge strong {
          display: block;
          color: #0f172a;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .jlt-category-floating-badge span {
          display: block;
          color: #64748b;
          font-size: 0.8rem;
        }

        .jlt-category-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #ecfdf5;
          color: #047857;
          padding: 0.4rem 1rem;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
        }

        .jlt-category-overview-title {
          font-size: 2.1rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
          margin: 0 0 1.25rem 0;
        }

        .jlt-category-overview-lead {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .jlt-category-benefits-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.5rem;
        }

        .jlt-category-benefits-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 1rem 0;
        }

        .jlt-category-benefits-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .jlt-category-benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.92rem;
          color: #334155;
          font-weight: 500;
        }

        .benefit-icon {
          color: #047857;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* 6 Services Section */
        .jlt-category-services-section {
          padding: 5.5rem 1rem;
        }

        .jlt-category-section-header {
          text-align: center;
          max-width: 780px;
          margin: 0 auto 3.5rem auto;
        }

        .jlt-category-section-title {
          font-size: 2.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0.5rem 0 1rem 0;
          letter-spacing: -0.5px;
        }

        .jlt-category-section-desc {
          font-size: 1.05rem;
          color: #64748b;
          line-height: 1.6;
        }

        .jlt-category-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 2rem;
        }

        .jlt-service-card-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .jlt-service-card-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08);
          border-color: #66b834;
        }

        .jlt-service-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .jlt-service-card-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .jlt-service-card-num {
          font-size: 1.4rem;
          font-weight: 800;
          color: #cbd5e1;
        }

        .jlt-service-card-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.35;
          margin: 0 0 0.85rem 0;
        }

        .jlt-service-card-desc {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .jlt-service-card-highlights {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin-bottom: 1.5rem;
          border: 1px solid #f1f5f9;
        }

        .highlights-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #475569;
          margin-bottom: 0.65rem;
        }

        .highlights-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .highlights-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.4;
        }

        .highlight-icon {
          color: #047857;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .jlt-service-card-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }

        .jlt-service-card-enquire-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background: #f1f5f9;
          color: #047857;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .jlt-service-card-enquire-btn:hover {
          background: #047857;
          color: #ffffff;
          border-color: #047857;
        }

        /* CTA Card */
        .jlt-category-cta-section {
          padding-bottom: 5rem;
        }

        .jlt-category-cta-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 24px;
          padding: 3.5rem 3rem;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2.5rem;
          box-shadow: 0 25px 40px -15px rgba(15, 23, 42, 0.25);
        }

        .jlt-cta-mini-tag {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #86efac;
          display: block;
          margin-bottom: 0.75rem;
        }

        .jlt-category-cta-title {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.3;
          margin: 0 0 0.85rem 0;
          color: #ffffff !important;
        }

        .jlt-category-cta-desc {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 600px;
          margin: 0;
        }

        .jlt-category-cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          flex-shrink: 0;
        }

        .jlt-btn-cta-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #66b834;
          color: #ffffff;
          padding: 0.85rem 1.85rem;
          border-radius: 40px;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(102, 184, 52, 0.4);
          white-space: nowrap;
        }

        .jlt-btn-cta-primary:hover {
          background: #58a22b;
          transform: translateY(-2px);
        }

        .jlt-btn-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #e2e8f0;
          padding: 0.75rem 1.75rem;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          border: 1px solid #334155;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .jlt-btn-cta-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #64748b;
        }

        @media (max-width: 992px) {
          .jlt-category-overview-grid {
            grid-template-columns: 1fr;
            gap: 4rem;
          }
          .jlt-category-cta-card {
            flex-direction: column;
            text-align: center;
            padding: 2.5rem 1.5rem;
          }
          .jlt-category-cta-buttons {
            width: 100%;
          }
          .jlt-category-hero-title {
            font-size: 2.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceCategoryDetailView;

