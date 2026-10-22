import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

export default function ContactView() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    message: ''
  });

  const [status, setStatus] = useState({
    submitted: false,
    loading: false,
    error: ''
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setStatus({ submitted: false, loading: false, error: 'Please enter your name and contact phone number.' });
      return;
    }

    setStatus({ submitted: false, loading: true, error: '' });

    // Simulate submission delay with smooth feedback
    setTimeout(() => {
      setStatus({ submitted: true, loading: false, error: '' });
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: '',
        message: ''
      });
    }, 800);
  };

  return (
    <div className="jlt-view-enter">
      {/* Dark Sub-Hero */}
      <section className="jlt-sub-hero">
        <div className="jlt-container">
          <span className="jlt-sub-hero-tag">GET IN TOUCH</span>
          <h1 className="jlt-sub-hero-title">Contact Us</h1>
          <p className="jlt-sub-hero-desc">
            Reach out to our team for testing inquiries, sample submission, or to book an appointment 
            at our Gondal facility.
          </p>
        </div>
      </section>

      {/* Main Contact Grid */}
      <section style={{ padding: '4.5rem 0 3.5rem 0', background: '#ffffff' }}>
        <div className="jlt-container">
          <div className="jlt-contact-grid">
            
            {/* Left Column: Visit or Contact Us */}
            <div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.75rem' }}>
                Visit or Contact Us
              </h2>

              <div className="jlt-contact-info-list">
                {/* Address Card */}
                <div className="jlt-contact-card">
                  <div className="jlt-contact-icon-box">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div className="jlt-contact-label">Address</div>
                    <div className="jlt-contact-val">
                      JAGNATH LAB TECHNOLOGIES,<br />
                      5-6/B Nayanjyot Chambers,<br />
                      Near Orchard Palace, Opp Vikaramsinhji Complex,<br />
                      Vachhera Wada Road, Gondal,<br />
                      Dist. Rajkot – 360311
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="jlt-contact-card">
                  <div className="jlt-contact-icon-box">
                    <Phone size={22} />
                  </div>
                  <div>
                    <div className="jlt-contact-label">Phone</div>
                    <div className="jlt-contact-val">
                      <a href="tel:+918140555515" style={{ color: '#1e293b', textDecoration: 'none' }}>
                        +91 8140 5555 15
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="jlt-contact-card">
                  <div className="jlt-contact-icon-box">
                    <Mail size={22} />
                  </div>
                  <div>
                    <div className="jlt-contact-label">Email</div>
                    <div className="jlt-contact-val">
                      <a href="mailto:jagnathtechnologies@yahoo.com" style={{ color: '#1e293b', textDecoration: 'none' }}>
                        jagnathtechnologies@yahoo.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Working Hours Card */}
                <div className="jlt-contact-card">
                  <div className="jlt-contact-icon-box">
                    <Clock size={22} />
                  </div>
                  <div>
                    <div className="jlt-contact-label">Working Hours</div>
                    <div className="jlt-contact-val">
                      Monday – Saturday: 9:00 AM – 7:00 PM<br />
                      <span style={{ color: '#94a3b8' }}>Sunday: Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Book an Appointment Form */}
            <div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.75rem' }}>
                Book an Appointment
              </h2>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {status.submitted ? (
                  <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eaf7e4', color: '#66b834', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                      Thank You!
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      Your message has been received. Our laboratory representative will contact you shortly to confirm your testing requirements or appointment.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus({ submitted: false, loading: false, error: '' })}
                      className="jlt-btn-quote"
                      style={{ background: '#66b834', fontSize: '0.85rem' }}
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {status.error && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem' }}>
                        <AlertCircle size={18} />
                        <span>{status.error}</span>
                      </div>
                    )}

                    <div>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Name" 
                        required
                        className="jlt-form-input"
                        style={{ width: '100%', background: '#ffffff' }}
                      />
                    </div>

                    <div>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number" 
                        required
                        className="jlt-form-input"
                        style={{ width: '100%', background: '#ffffff' }}
                      />
                    </div>

                    <div>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address" 
                        className="jlt-form-input"
                        style={{ width: '100%', background: '#ffffff' }}
                      />
                    </div>

                    <div>
                      <select 
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="jlt-form-select"
                        style={{ width: '100%', background: '#ffffff', color: formData.service ? '#1e293b' : '#94a3b8' }}
                      >
                        <option value="">Select Service</option>
                        <option value="Environmental Testing & Monitoring">Environmental Testing & Monitoring</option>
                        <option value="Water Analysis">Water Analysis (Drinking, RO, Wastewater)</option>
                        <option value="Microbiological Testing">Microbiological Testing</option>
                        <option value="Nutritional Value Analysis">Nutritional Value Analysis</option>
                        <option value="Food & Agricultural Products">Food & Agricultural Products</option>
                        <option value="Noise Level Monitoring">Noise Level Monitoring</option>
                        <option value="Toxicological Screening">Toxicological Screening & Chemical Testing</option>
                        <option value="Civil & Construction Material Testing">Civil & Construction Material Testing</option>
                        <option value="Other Inquiries">Other Inquiries / Sample Submission</option>
                      </select>
                    </div>

                    <div>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="4" 
                        placeholder="Your Message" 
                        className="jlt-form-textarea"
                        style={{ width: '100%', background: '#ffffff' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={status.loading}
                      className="jlt-btn-quote"
                      style={{ 
                        width: '100%', 
                        background: '#66b834', 
                        justifyContent: 'center', 
                        padding: '0.85rem',
                        fontSize: '0.95rem',
                        borderRadius: '8px',
                        cursor: status.loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {status.loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Location Banner (as seen in Video 2 frame 64) */}
      <section style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eaf7e4', color: '#66b834', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <MapPin size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem 0' }}>
            Gondal, Dist. Rajkot – 360311
          </h3>
          <a 
            href="https://maps.google.com/?q=Nayanjyot+Chambers+Gondal+Rajkot" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#66b834', fontWeight: 700, fontSize: '0.92rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Open in Google Maps <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
