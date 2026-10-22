import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FlaskConical, 
  Building2, 
  Users,
  Clock, 
  Leaf, 
  Droplet, 
  Apple, 
  Scale, 
  Microscope, 
  CheckCircle2, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export const HomeView = ({ onNavigateTab, onAppointmentClick }) => {
  // Why Choose Us Active Tab State
  const [whyTab, setWhyTab] = useState('reliable');

  // FAQ Accordion State (first open by default or 2nd item as in video)
  const [openFaq, setOpenFaq] = useState(2); // Item index 2 ("How long does it take...") open

  // Appointment Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Environmental Testing & Monitoring',
    date: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please provide your name and phone number.');
      return;
    }
    setFormSubmitted(true);
    setTimeout(() => {
      alert(`Thank you ${formData.name}! Your appointment request for "${formData.service}" has been received. Our team will contact you shortly.`);
      setFormSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: 'Environmental Testing & Monitoring',
        date: '',
        message: ''
      });
    }, 400);
  };

  // Why Choose Us Tab Data
  const whyTabsData = {
    reliable: {
      title: 'Precision You Can Count On',
      desc: 'At Jagnath Lab Technologies, every test is conducted with meticulous care using calibrated, state-of-the-art instruments. Our rigorous quality control protocols ensure that results are accurate, reproducible, and fully compliant with national and international standards. We understand that your decisions depend on our data — so we never compromise on precision.',
      bullets: [
        'ISO-compliant testing protocols',
        'Calibrated instruments & traceable standards',
        'Rigorous QC at every stage',
        'Regulatory-compliant reporting'
      ],
      image: '/assets/reference_images/2254461523.webp'
    },
    comprehensive: {
      title: 'End-to-End Analytical Capabilities',
      desc: 'From initial sample collection and on-site field measurements to multi-parameter lab analysis and certified reporting, we provide full-lifecycle testing services tailored to your industry requirements across environmental, chemical, and biological matrices.',
      bullets: [
        'Single-source analytical provider',
        'Customized sampling and testing plans',
        'Fast-track emergency testing available',
        'Dedicated technical consultation & support'
      ],
      image: '/assets/reference_images/2164156074.webp'
    },
    expertise: {
      title: 'Experienced Scientists & Technical Leadership',
      desc: 'Our senior chemists, microbiologists, and environmental engineers bring decades of collective expertise in regulatory compliance, NABL standards, and method validation across complex matrices and industrial requirements.',
      bullets: [
        'Qualified multi-disciplinary scientists',
        'Continuous proficiency testing & inter-lab trials',
        'GPCB recognized environmental auditors',
        'Comprehensive client guidance on compliance'
      ],
      image: '/assets/reference_images/2277442952.webp'
    }
  };

  // Client List (15 prominent Gujarat industries)
  const clientList = [
    { num: '01', name: 'Adani Ports & SEZ Ltd.', ind: 'Port & Logistics', loc: 'Mundra, Kutch' },
    { num: '02', name: 'Reliance Industries Ltd.', ind: 'Petrochemicals & Refinery', loc: 'Jamnagar' },
    { num: '03', name: 'Essar Steel India Ltd.', ind: 'Steel Manufacturing', loc: 'Hazira, Surat' },
    { num: '04', name: 'Gujarat Fluorochemicals Ltd.', ind: 'Chemicals & Fluoropolymers', loc: 'Ranjitnagar, Panchmahal' },
    { num: '05', name: 'ONGC Ltd.', ind: 'Oil & Natural Gas', loc: 'Ankleshwar, Bharuch' },
    { num: '06', name: 'Torrent Power Ltd.', ind: 'Power Generation', loc: 'Ahmedabad' },
    { num: '07', name: 'Gujarat Alkalies & Chemicals Ltd.', ind: 'Chlor-Alkali Chemicals', loc: 'Vadodara' },
    { num: '08', name: 'Nirma Ltd.', ind: 'Chemicals & FMCG', loc: 'Ahmedabad' },
    { num: '09', name: 'Zydus Lifesciences Ltd.', ind: 'Pharmaceuticals', loc: 'Ahmedabad' },
    { num: '10', name: 'Sun Pharmaceutical Industries', ind: 'Pharmaceuticals', loc: 'Vadodara' },
    { num: '11', name: 'Inox Air Products Ltd.', ind: 'Industrial Gases', loc: 'Vadodara' },
    { num: '12', name: 'Gujarat Heavy Chemicals Ltd.', ind: 'Soda Ash & Chemicals', loc: 'Sutrapada, Junagadh' },
    { num: '13', name: 'Tata Chemicals Ltd.', ind: 'Chemicals & Fertilizers', loc: 'Mithapur, Devbhumi Dwarka' },
    { num: '14', name: 'Deepak Nitrite Ltd.', ind: 'Specialty Chemicals', loc: 'Nandesari, Vadodara' },
    { num: '15', name: 'Alembic Pharmaceuticals Ltd.', ind: 'Pharmaceuticals', loc: 'Vadodara' },
  ];

  // FAQ List
  const faqItems = [
    {
      q: 'What type of testing services do you offer?',
      a: 'We provide comprehensive analytical services covering Environmental Testing (Air, Water, Soil), Water & Wastewater Analysis, Food & Agricultural Testing, Nutritional Value Analysis, and Microbiological Testing, as well as statutory Environmental Audits under GPCB guidelines.'
    },
    {
      q: 'How do I submit samples for testing?',
      a: 'You can bring samples directly to our Gondal facility, send them via courier following our preservation guidelines, or request our field team to collect samples on-site from your industrial plant.'
    },
    {
      q: 'How long does it take to receive test results?',
      a: 'Turnaround time varies by test type. Most standard tests are completed within 3–7 working days. Urgent or priority testing can be arranged on request. You will receive a detailed, certified test report upon completion.'
    },
    {
      q: 'Do you provide consultation and technical support?',
      a: 'Yes. Our senior technical experts provide detailed interpretation of test results, regulatory guidance for GPCB/CPCB compliance, and assistance with corrective action recommendations.'
    },
    {
      q: 'Can you handle bulk or routine testing requirements?',
      a: 'Absolutely. We are equipped to handle high-volume, routine testing for industries with ongoing compliance needs. We offer customized testing packages and scheduled pickups for regular clients.'
    },
    {
      q: 'How can I contact your team for inquiries or support?',
      a: 'You can call us directly at +91 8140 5555 15, email us at jagnathtechnologies@yahoo.com, or fill out our online appointment form on this website.'
    }
  ];

  return (
    <div className="jlt-home-wrapper">
      {/* 1. HERO SECTION (Exact match to reference screenshots) */}
      <section className="jlt-hero-section" style={{ backgroundImage: "url('/assets/reference_images/image-1792410234366.png')" }}>
        <div className="jlt-hero-overlay"></div>
        <div className="jlt-container">
          <div className="jlt-hero-content">
            <h1 className="jlt-hero-title">
              Reliable Testing.<br />
              <span className="jlt-text-green">Accurate Results.</span><br />
              Trusted Science.
            </h1>
            <p className="jlt-hero-desc">
              Advanced laboratory solutions for environmental, water, food, nutritional, and microbiological analysis — delivering precise, compliant, and dependable results every time.
            </p>
            <div className="jlt-hero-ctas">
              <button 
                type="button" 
                className="jlt-btn-hero-primary"
                onClick={() => onNavigateTab('services')}
              >
                Explore More
              </button>
              <button 
                type="button" 
                className="jlt-btn-hero-outline"
                onClick={onAppointmentClick}
              >
                Get Appointment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STATS BAR (Exact match to reference screenshot 2) */}
      <section className="jlt-trust-bar">
        <div className="jlt-container">
          <div className="jlt-trust-grid">
            <div className="jlt-trust-item">
              <span className="jlt-trust-icon"><ShieldCheck size={20} /></span>
              <span>NABL Accredited Lab</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-icon"><FlaskConical size={20} /></span>
              <span>5+ Service Categories</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-icon"><Users size={20} /></span>
              <span>Trusted by Leading Industries</span>
            </div>
            <div className="jlt-trust-item">
              <span className="jlt-trust-icon"><Clock size={20} /></span>
              <span>Fast Turnaround Times</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TOP 5 SERVICE CARDS */}
      <section style={{ paddingTop: '3.5rem', paddingBottom: '2.5rem' }}>
        <div className="jlt-container">
          <div className="jlt-services-grid">
            {/* Service 1: Environmental Testing & Monitoring */}
            <div 
              className="jlt-service-card"
              onClick={() => onNavigateTab('services')}
            >
              <img 
                src="/assets/reference_images/2235272337.webp" 
                alt="Environmental Testing & Monitoring" 
                className="jlt-service-card-bg"
              />
              <div className="jlt-service-card-overlay"></div>
              <div className="jlt-service-card-content">
                <div className="jlt-service-card-icon">
                  <Leaf size={22} />
                </div>
                <h3 className="jlt-service-card-title">Environmental Testing &amp; Monitoring</h3>
                <p className="jlt-service-card-desc">
                  Comprehensive analysis of air, water, and soil samples to ensure environmental compliance and safety standards.
                </p>
              </div>
            </div>

            {/* Service 2: Water Analysis */}
            <div 
              className="jlt-service-card"
              onClick={() => onNavigateTab('services')}
            >
              <img 
                src="/assets/reference_images/2235272368.webp" 
                alt="Water Analysis" 
                className="jlt-service-card-bg"
              />
              <div className="jlt-service-card-overlay"></div>
              <div className="jlt-service-card-content">
                <div className="jlt-service-card-icon">
                  <Droplet size={22} />
                </div>
                <h3 className="jlt-service-card-title">Water Analysis</h3>
                <p className="jlt-service-card-desc">
                  Detailed physicochemical and microbiological testing of drinking water, wastewater, and industrial effluents.
                </p>
              </div>
            </div>

            {/* Service 3: Food Analysis */}
            <div 
              className="jlt-service-card"
              onClick={() => onNavigateTab('services')}
            >
              <img 
                src="/assets/reference_images/2245891170.webp" 
                alt="Food Analysis" 
                className="jlt-service-card-bg"
              />
              <div className="jlt-service-card-overlay"></div>
              <div className="jlt-service-card-content">
                <div className="jlt-service-card-icon">
                  <Apple size={22} />
                </div>
                <h3 className="jlt-service-card-title">Food Analysis</h3>
                <p className="jlt-service-card-desc">
                  Safety and quality testing of food products to meet FSSAI and international regulatory requirements.
                </p>
              </div>
            </div>

            {/* Service 4: Nutritional Value Analysis */}
            <div 
              className="jlt-service-card"
              onClick={() => onNavigateTab('services')}
            >
              <img 
                src="/assets/reference_images/2205687057.webp" 
                alt="Nutritional Value Analysis" 
                className="jlt-service-card-bg"
              />
              <div className="jlt-service-card-overlay"></div>
              <div className="jlt-service-card-content">
                <div className="jlt-service-card-icon">
                  <Scale size={22} />
                </div>
                <h3 className="jlt-service-card-title">Nutritional Value Analysis</h3>
                <p className="jlt-service-card-desc">
                  Accurate determination of macro and micronutrients, calories, vitamins, and minerals in food products.
                </p>
              </div>
            </div>

            {/* Service 5: Microbiological Testing */}
            <div 
              className="jlt-service-card jlt-service-card-wide"
              onClick={() => onNavigateTab('services')}
            >
              <img 
                src="/assets/reference_images/1485080100.webp" 
                alt="Microbiological Testing" 
                className="jlt-service-card-bg"
              />
              <div className="jlt-service-card-overlay"></div>
              <div className="jlt-service-card-content">
                <div className="jlt-service-card-icon">
                  <Microscope size={22} />
                </div>
                <h3 className="jlt-service-card-title">Microbiological Testing</h3>
                <p className="jlt-service-card-desc">
                  Detection and enumeration of pathogens, bacteria, and fungi in food, water, and environmental samples.
                </p>
              </div>
            </div>
          </div>

          <div className="jlt-services-footer-action">
            <button 
              type="button" 
              className="jlt-btn-dark"
              onClick={() => onNavigateTab('services')}
            >
              View All Services
            </button>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US SECTION */}
      <section className="jlt-section" style={{ backgroundColor: '#fcfdfd', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div className="jlt-container">
          <div className="jlt-header-center">
            <span className="jlt-section-badge">WHY CHOOSE US</span>
            <h2 className="jlt-section-title">Expert Laboratory Services for Advanced Research</h2>
          </div>

          {/* 3 Interactive Tabs */}
          <div className="jlt-tabs-nav">
            <button
              type="button"
              className={`jlt-tab-btn ${whyTab === 'reliable' ? 'active' : ''}`}
              onClick={() => setWhyTab('reliable')}
            >
              Reliable Testing
            </button>
            <button
              type="button"
              className={`jlt-tab-btn ${whyTab === 'comprehensive' ? 'active' : ''}`}
              onClick={() => setWhyTab('comprehensive')}
            >
              Comprehensive Solutions
            </button>
            <button
              type="button"
              className={`jlt-tab-btn ${whyTab === 'expertise' ? 'active' : ''}`}
              onClick={() => setWhyTab('expertise')}
            >
              Laboratory Expertise
            </button>
          </div>

          {/* Tab Content */}
          <div className="jlt-tab-content-grid">
            <div className="jlt-tab-text-box">
              <h3 className="jlt-tab-text-title">{whyTabsData[whyTab].title}</h3>
              <p className="jlt-tab-text-p">{whyTabsData[whyTab].desc}</p>
              
              <ul className="jlt-check-list">
                {whyTabsData[whyTab].bullets.map((bullet, idx) => (
                  <li key={idx} className="jlt-check-item">
                    <CheckCircle2 size={18} className="jlt-check-icon" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <button 
                type="button" 
                className="jlt-btn-appointment"
                onClick={onAppointmentClick}
              >
                Get Appointment
              </button>
            </div>

            <div className="jlt-tab-image-box">
              <img 
                src={whyTabsData[whyTab].image} 
                alt={whyTabsData[whyTab].title} 
                className="jlt-tab-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLIENTS SECTION (Dark Navy Background #171b26) */}
      <section className="jlt-section jlt-section-dark">
        <div className="jlt-container">
          <div className="jlt-header-center">
            <span className="jlt-section-badge">OUR CLIENTS</span>
            <h2 className="jlt-section-title">Trusted by Leading Industries Across Gujarat</h2>
            <p className="jlt-section-desc">
              Delivering reliable, accredited testing and environmental audit services to India's most prominent industrial names.
            </p>
          </div>

          <div className="jlt-clients-grid">
            {clientList.map((client, cIdx) => (
              <div key={cIdx} className="jlt-client-card">
                <span className="jlt-client-num">{client.num}</span>
                <div className="jlt-client-info">
                  <h4 className="jlt-client-name" title={client.name}>{client.name}</h4>
                  <div className="jlt-client-industry">{client.ind}</div>
                  <div className="jlt-client-location">{client.loc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="jlt-section" id="faqs">
        <div className="jlt-container">
          <div className="jlt-header-center">
            <span className="jlt-section-badge">FAQ</span>
            <h2 className="jlt-section-title">Frequently Asked Questions</h2>
          </div>

          <div className="jlt-faq-grid">
            {/* Left Column (0, 2, 4) */}
            <div className="jlt-faq-col">
              {[0, 2, 4].map((idx) => {
                const item = faqItems[idx];
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`jlt-faq-item ${isOpen ? 'open' : ''}`}>
                    <button 
                      type="button" 
                      className="jlt-faq-question-btn"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span className="jlt-faq-question-text">{item.q}</span>
                      <ChevronDown size={20} className="jlt-faq-chevron" />
                    </button>
                    {isOpen && (
                      <p className="jlt-faq-answer">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column (1, 3, 5) */}
            <div className="jlt-faq-col">
              {[1, 3, 5].map((idx) => {
                const item = faqItems[idx];
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`jlt-faq-item ${isOpen ? 'open' : ''}`}>
                    <button 
                      type="button" 
                      className="jlt-faq-question-btn"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span className="jlt-faq-question-text">{item.q}</span>
                      <ChevronDown size={20} className="jlt-faq-chevron" />
                    </button>
                    {isOpen && (
                      <p className="jlt-faq-answer">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOOK NOW / APPOINTMENT SECTION */}
      <section className="jlt-section" id="appointment-section" style={{ backgroundColor: '#f8fafc', paddingTop: '3rem' }}>
        <div className="jlt-container">
          <div className="jlt-booking-grid">
            {/* Left Image Column */}
            <div className="jlt-booking-image-col">
              <img 
                src="/assets/reference_images/1746650566.webp" 
                alt="Lab Scientist Booking" 
                className="jlt-booking-bg-img"
              />
              <div className="jlt-booking-image-content">
                <span className="jlt-section-badge" style={{ color: '#86efac' }}>BOOK NOW</span>
                <h3 className="jlt-booking-title">Effortless Online Booking For Your Tests</h3>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="jlt-booking-form-col">
              <h3 className="jlt-booking-form-title">Get an Appointment</h3>
              <p className="jlt-booking-form-subtitle">Fill in your details and we'll get back to you shortly.</p>

              <form onSubmit={handleFormSubmit}>
                <div className="jlt-form-group">
                  <label className="jlt-form-label">Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter your full name" 
                    className="jlt-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="jlt-form-row">
                  <div className="jlt-form-group">
                    <label className="jlt-form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+91 Phone number" 
                      className="jlt-form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="jlt-form-group">
                    <label className="jlt-form-label">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="your@email.com" 
                      className="jlt-form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="jlt-form-row">
                  <div className="jlt-form-group">
                    <label className="jlt-form-label">Select Service</label>
                    <select 
                      className="jlt-form-select"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    >
                      <option value="Environmental Testing & Monitoring">Environmental Testing &amp; Monitoring</option>
                      <option value="Water Analysis">Water &amp; Wastewater Analysis</option>
                      <option value="Food Analysis">Food &amp; Agricultural Testing</option>
                      <option value="Nutritional Value Analysis">Nutritional Value Analysis</option>
                      <option value="Microbiological Testing">Microbiological &amp; Pathogen Testing</option>
                      <option value="Industrial Hygiene & Noise">Industrial Hygiene &amp; Noise</option>
                      <option value="Civil Material Testing">Civil &amp; Construction Testing</option>
                    </select>
                  </div>
                  <div className="jlt-form-group">
                    <label className="jlt-form-label">Preferred Date</label>
                    <input 
                      type="date" 
                      className="jlt-form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="jlt-form-group">
                  <label className="jlt-form-label">Message / Requirements</label>
                  <textarea 
                    rows={3}
                    placeholder="Briefly describe sample type or testing parameters needed..." 
                    className="jlt-form-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button 
                  type="submit" 
                  className="jlt-btn-appointment" 
                  style={{ width: '100%', padding: '0.85rem' }}
                  disabled={formSubmitted}
                >
                  {formSubmitted ? 'Submitting Request...' : 'Submit Appointment Request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
