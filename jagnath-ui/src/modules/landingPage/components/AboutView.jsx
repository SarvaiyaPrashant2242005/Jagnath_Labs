import React from 'react';
import { 
  FlaskConical, 
  Users, 
  Award, 
  Target, 
  CheckCircle2 
} from 'lucide-react';

export const AboutView = ({ onNavigateTab, onAppointmentClick }) => {
  const handleContactClick = () => {
    if (onNavigateTab) {
      onNavigateTab('contact');
    } else if (onAppointmentClick) {
      onAppointmentClick();
    }
  };

  const capabilities = [
    {
      icon: <FlaskConical size={26} color="#66b834" strokeWidth={1.8} />,
      title: 'Advanced Equipment',
      desc: 'State-of-the-art analytical instruments for precise results.'
    },
    {
      icon: <Users size={26} color="#66b834" strokeWidth={1.8} />,
      title: 'Expert Team',
      desc: 'Qualified scientists with deep domain expertise.'
    },
    {
      icon: <Award size={26} color="#66b834" strokeWidth={1.8} />,
      title: 'Quality Assured',
      desc: 'Rigorous QC protocols at every stage of testing.'
    },
    {
      icon: <Target size={26} color="#66b834" strokeWidth={1.8} />,
      title: 'Client Focused',
      desc: 'Tailored solutions and dedicated technical support.'
    }
  ];

  const missionPoints = [
    'Precision-driven analytical processes',
    'Qualified and experienced scientific team',
    'Serving industries across Gujarat',
    'Transparent reporting and fast turnaround'
  ];

  return (
    <div className="jlt-about-wrapper">
      {/* 1. Header Sub-Hero Banner */}
      <section className="jlt-sub-hero">
        <div className="jlt-container">
          <span className="jlt-about-badge">ABOUT US</span>
          <h1 className="jlt-sub-hero-title">Who We Are</h1>
          <p className="jlt-sub-hero-desc">
            Jagnath Lab Technologies is a professional laboratory and testing services company based in Gondal, Rajkot, dedicated to delivering accurate, reliable, and regulatory-compliant analytical results.
          </p>
        </div>
      </section>

      {/* 2. Mission & 2x2 Capabilities Section */}
      <section className="jlt-about-section">
        <div className="jlt-container">
          <div className="jlt-about-grid">
            
            {/* Left Column: Mission Content */}
            <div className="jlt-about-left">
              <span className="jlt-about-badge">OUR MISSION</span>
              <h2 className="jlt-about-heading">Committed to Scientific Excellence</h2>
              
              <p className="jlt-about-text">
                At Jagnath Lab Technologies, our mission is to provide industries, food manufacturers, water utilities, and environmental agencies with precise, dependable, and timely laboratory testing services. We believe that accurate data is the foundation of safe products, healthy communities, and regulatory compliance.
              </p>
              
              <p className="jlt-about-text">
                Located in Gondal, Dist. Rajkot, our state-of-the-art facility is equipped with modern analytical instruments and staffed by a team of qualified scientists and technicians committed to quality at every step.
              </p>

              <ul className="jlt-about-checklist">
                {missionPoints.map((point, idx) => (
                  <li key={idx} className="jlt-about-check-item">
                    <CheckCircle2 size={18} className="jlt-about-check-icon" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: 2x2 Capabilities Grid */}
            <div className="jlt-about-cards-grid">
              {capabilities.map((item, idx) => (
                <div key={idx} className="jlt-about-card">
                  <div className="jlt-about-card-icon">
                    {item.icon}
                  </div>
                  <h3 className="jlt-about-card-title">{item.title}</h3>
                  <p className="jlt-about-card-desc">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 3. Solid Green CTA Banner */}
      <section className="jlt-about-cta-section">
        <div className="jlt-container">
          <div className="jlt-about-cta-content">
            <h2 className="jlt-about-cta-heading">Ready to Work With Us?</h2>
            <p className="jlt-about-cta-desc">
              Contact our team to discuss your testing requirements or book an appointment at our Gondal facility.
            </p>
            <button 
              type="button" 
              onClick={handleContactClick}
              className="jlt-about-cta-btn"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutView;
