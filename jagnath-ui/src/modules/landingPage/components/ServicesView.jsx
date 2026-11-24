import React from 'react';
import { 
  Apple, 
  HeartHandshake, 
  Wind, 
  Sprout, 
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../servicesData';

const categoryIconMap = {
  Apple: <Apple size={28} />,
  HeartHandshake: <HeartHandshake size={28} />,
  Wind: <Wind size={28} />,
  Sprout: <Sprout size={28} />,
  Briefcase: <Briefcase size={28} />
};

export const ServicesView = ({ onAppointmentClick, onSelectCategory }) => {
  const handleCardClick = (catSlug) => {
    if (onSelectCategory) {
      onSelectCategory(catSlug);
    } else {
      window.location.hash = `#/services/${catSlug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="jlt-services-wrapper">
      {/* 1. Header Banner */}
      <section className="jlt-sub-hero">
        <div className="jlt-container">
          <span className="jlt-section-badge" style={{ color: '#86efac' }}>OUR SERVICES OVERVIEW</span>
          <h1 className="jlt-sub-hero-title">Comprehensive Testing, Counseling & Consultancy Solutions</h1>
          <p className="jlt-sub-hero-desc">
            Explore our 5 core specialized divisions. Each division offers dedicated scientific infrastructure, certified methodology, and expert laboratory teams to fulfill regulatory and commercial quality benchmarks.
          </p>
        </div>
      </section>

      {/* 2. Five Main Categories Showcase Grid */}
      <section className="jlt-section" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        <div className="jlt-container">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem auto' }}>
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              marginBottom: '0.75rem'
            }}>
              5 Specialized Divisions
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              Choose a Dedicated Service Category
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Select any category below to view detailed testing parameters, approved analytical methods, sample guidelines, and regulatory frameworks.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            {SERVICE_CATEGORIES.map((cat, idx) => (
              <div 
                key={cat.id}
                onClick={() => handleCardClick(cat.slug)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#66b834';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Category Image Header */}
                <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                  <img 
                    src={cat.image} 
                    alt={cat.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    {cat.badge}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#047857',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {categoryIconMap[cat.iconName] || <Briefcase size={24} />}
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1.25rem 0', flex: 1 }}>
                    {cat.heroDescription}
                  </p>

                  <div style={{ 
                    borderTop: '1px solid #f1f5f9', 
                    paddingTop: '1rem',
                    marginBottom: '1.25rem' 
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                      Key Capabilities ({cat.services.length} Services):
                    </span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {cat.services.slice(0, 3).map((s) => (
                        <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#334155' }}>
                          <CheckCircle2 size={14} color="#66b834" />
                          <span>{s.name}</span>
                        </li>
                      ))}
                      {cat.services.length > 3 && (
                        <li style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, paddingLeft: '1.25rem' }}>
                          + {cat.services.length - 3} more specialized services
                        </li>
                      )}
                    </ul>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>
                      Explore Category Page
                    </span>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#047857'
                    }}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Consultation CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(4, 120, 87, 0.3)'
          }}>
            <Award size={40} color="#a7f3d0" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
              Need Custom Environmental, Food, or Industrial Testing?
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#d1fae5', maxWidth: '650px', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
              Our analytical scientists and certified consultants work closely with industries, research institutions, and food businesses across India.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="jlt-btn-quote"
                style={{ backgroundColor: '#ffffff', color: '#064e3b', fontWeight: 700 }}
                onClick={onAppointmentClick}
              >
                <span>Request Laboratory Consultation</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesView;
