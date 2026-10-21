import React from 'react';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from 'lucide-react';

export default function Footer({ onNavigateTab }) {
  const quickLinks = [
    { label: 'Home', tab: 'home' },
    { label: 'About Us', tab: 'about' },
    { label: 'Services', tab: 'services' },
    { label: 'Certificates', tab: 'certificates' },
    { label: 'Contact Us', tab: 'contact' }
  ];

  const serviceLinks = [
    { label: 'Environmental Testing & Monitoring', tab: 'services' },
    { label: 'Water Analysis', tab: 'services' },
    { label: 'Microbiological Testing', tab: 'services' },
    { label: 'Nutritional Value Analysis', tab: 'services' },
    { label: 'Food Analysis', tab: 'services' }
  ];

  const handleLinkClick = (tab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <footer className="jlt-footer">
      <div className="jlt-container jlt-footer-main">
        <div className="jlt-footer-grid" style={{ gridTemplateColumns: '1.25fr 1fr 1.35fr' }}>
          
          {/* Column 1: Logo & Tagline */}
          <div>
            <div style={{ display: 'inline-block', background: '#ffffff', padding: '6px 14px', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <img 
                src="/Images/Navbar_Logo.png" 
                alt="Jagnath Lab Technologies" 
                style={{ height: '48px', width: 'auto', display: 'block' }}
              />
            </div>
            
            <p className="jlt-footer-tagline" style={{ maxWidth: '320px', color: '#94a3b8' }}>
              Trust in Every Test. Purity in Every Report.
            </p>

            <div className="jlt-social-row">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="jlt-social-btn"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="jlt-social-btn"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://wa.me/918140555515" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="jlt-social-btn"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links & Our Services */}
          <div>
            <h3 className="jlt-footer-col-title" style={{ marginBottom: '1rem' }}>
              Quick Links
            </h3>
            <ul className="jlt-footer-links" style={{ marginBottom: '2rem' }}>
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <button 
                    type="button" 
                    onClick={() => handleLinkClick(link.tab)}
                    className="jlt-footer-link"
                  >
                    <span className="jlt-footer-link-dot" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="jlt-footer-col-title" style={{ marginBottom: '1rem' }}>
              Our Services
            </h3>
            <ul className="jlt-footer-links">
              {serviceLinks.map((item, idx) => (
                <li key={idx}>
                  <button 
                    type="button" 
                    onClick={() => handleLinkClick(item.tab)}
                    className="jlt-footer-link"
                  >
                    <span className="jlt-footer-link-dot" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div>
            <h3 className="jlt-footer-col-title" style={{ marginBottom: '1.25rem' }}>
              Contact Us
            </h3>
            <div className="jlt-footer-contact-items">
              <div className="jlt-footer-contact-row">
                <MapPin size={18} />
                <span>
                  <strong>JAGNATH LAB TECHNOLOGIES</strong>,<br />
                  5-6/B Nayanjyot Chambers,<br />
                  Near Orchard Palace, Opp Vikaramsinhji Complex,<br />
                  Vachhera Wada Road, Gondal,<br />
                  Dist. Rajkot – 360311
                </span>
              </div>

              <div className="jlt-footer-contact-row">
                <Phone size={18} />
                <a href="tel:+918140555515" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  +91 8140 5555 15
                </a>
              </div>

              <div className="jlt-footer-contact-row">
                <Mail size={18} />
                <a href="mailto:jagnathtechnologies@yahoo.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  jagnathtechnologies@yahoo.com
                </a>
              </div>

              <div className="jlt-footer-contact-row">
                <Clock size={18} />
                <span>
                  Mon–Sat: 9:00 AM – 7:00 PM<br />
                  <span style={{ color: '#64748b' }}>Sunday: Closed</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="jlt-footer-bottom">
        <div className="jlt-container">
          <p style={{ margin: 0 }}>
            Copyright © {new Date().getFullYear()} Jagnath Lab Technologies – All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
