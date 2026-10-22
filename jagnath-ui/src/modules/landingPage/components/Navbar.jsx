import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onAppointmentClick, isScrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = tabId === 'home' ? '#/' : `#/${tabId}`;
  };

  return (
    <>
      <header className={`jlt-navbar ${isScrolled ? 'jlt-scrolled' : ''}`}>
        <div className="jlt-container">
          <div className="jlt-navbar-inner">
            {/* Logo */}
            <div
              className="jlt-logo-link"
              onClick={() => handleNavClick('home')}
              title="Jagnath Lab Technologies"
            >
              <img
                src="/Images/Navbar_Logo.png"
                alt="Jagnath Lab Technologies Logo"
                className="jlt-logo-img"
              />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="jlt-nav-links">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`jlt-nav-link ${activeTab === item.id ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Get Appointment CTA Button */}
            <button
              type="button"
              className="jlt-btn-appointment"
              onClick={onAppointmentClick || (() => window.location.hash = '#/login')}
            >
              Login Portal
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="jlt-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="jlt-mobile-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div className="jlt-mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img
                src="/Images/Navbar_Logo.png"
                alt="Jagnath Logo"
                style={{ height: '44px', width: 'auto' }}
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={24} />
              </button>
            </div>

            <ul className="jlt-mobile-links">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`jlt-mobile-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="jlt-btn-appointment"
              style={{ width: '100%', marginTop: 'auto' }}
              onClick={() => {
                setMobileMenuOpen(false);
                if (onAppointmentClick) {
                  onAppointmentClick();
                } else {
                  window.location.hash = '#/login';
                }
              }}
            >
              Get Appointment
            </button>

            <a
              href="#/login"
              className="jlt-topbar-login-btn"
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', padding: '0.65rem' }}
            >
              Staff Portal Login
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
