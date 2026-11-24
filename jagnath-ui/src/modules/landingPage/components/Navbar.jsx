import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  ChevronDown, 
  Apple, 
  HeartHandshake, 
  Wind, 
  Sprout, 
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../servicesData';

const categoryIconMap = {
  Apple: <Apple size={20} />,
  HeartHandshake: <HeartHandshake size={20} />,
  Wind: <Wind size={20} />,
  Sprout: <Sprout size={20} />,
  Briefcase: <Briefcase size={20} />
};

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onAppointmentClick, 
  isScrolled,
  currentCategorySlug
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services', hasDropdown: true },
    { id: 'certificates', label: 'Certificates' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact Us' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServicesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = tabId === 'home' ? '#/' : `#/${tabId}`;
  };

  const handleCategorySelect = (category) => {
    setServicesDropdownOpen(false);
    setMobileMenuOpen(false);
    setActiveTab('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.location.hash = `#/services/${category.slug}`;
  };

  const isServicesActive = activeTab === 'services' || !!currentCategorySlug;

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
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <div 
                      key={item.id}
                      ref={dropdownRef}
                      className="jlt-nav-dropdown-wrapper"
                      onMouseEnter={() => setServicesDropdownOpen(true)}
                      onMouseLeave={() => setServicesDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick('services')}
                        className={`jlt-nav-link jlt-nav-link-dropdown ${isServicesActive ? 'active' : ''}`}
                        aria-expanded={servicesDropdownOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown 
                          size={15} 
                          className={`jlt-nav-chevron ${servicesDropdownOpen ? 'rotated' : ''}`}
                        />
                      </button>

                      {/* Dropdown Menu - Exclusively the 5 Main Categories */}
                      <div className={`jlt-services-dropdown-menu ${servicesDropdownOpen ? 'open' : ''}`}>
                        <div className="jlt-dropdown-header">
                          <span className="jlt-dropdown-header-title">Service Categories</span>
                          <button
                            type="button"
                            className="jlt-dropdown-view-all"
                            onClick={() => handleNavClick('services')}
                          >
                            All Services Overview &rarr;
                          </button>
                        </div>

                        <div className="jlt-services-dropdown-list">
                          {SERVICE_CATEGORIES.map((cat) => {
                            const isCurrent = currentCategorySlug === cat.slug;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className={`jlt-dropdown-item ${isCurrent ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(cat)}
                              >
                                <div className="jlt-dropdown-item-icon">
                                  {categoryIconMap[cat.iconName] || <Briefcase size={20} />}
                                </div>
                                <div className="jlt-dropdown-item-info">
                                  <span className="jlt-dropdown-item-title">{cat.title}</span>
                                  <span className="jlt-dropdown-item-badge">{cat.services.length} Specialized Services</span>
                                </div>
                                <ArrowRight size={14} className="jlt-dropdown-item-arrow" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`jlt-nav-link ${activeTab === item.id ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                );
              })}
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
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <li key={item.id} className="jlt-mobile-has-dropdown">
                      <div className="jlt-mobile-link-row">
                        <button
                          type="button"
                          className={`jlt-mobile-link ${isServicesActive ? 'active' : ''}`}
                          onClick={() => handleNavClick(item.id)}
                          style={{ flex: 1, textAlign: 'left' }}
                        >
                          {item.label}
                        </button>
                        <button
                          type="button"
                          className="jlt-mobile-expand-btn"
                          onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                          aria-label="Toggle Categories"
                        >
                          <ChevronDown size={18} className={`jlt-nav-chevron ${mobileServicesOpen ? 'rotated' : ''}`} />
                        </button>
                      </div>

                      {mobileServicesOpen && (
                        <div className="jlt-mobile-subservices">
                          <button
                            type="button"
                            className="jlt-mobile-subservice-btn"
                            style={{ fontWeight: 600, color: '#047857' }}
                            onClick={() => handleNavClick('services')}
                          >
                            <span>&rarr; All Services Overview</span>
                          </button>
                          {SERVICE_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              className={`jlt-mobile-subservice-btn ${currentCategorySlug === cat.slug ? 'active' : ''}`}
                              onClick={() => handleCategorySelect(cat)}
                            >
                              <div className="jlt-mobile-subservice-icon">
                                {categoryIconMap[cat.iconName] || <Briefcase size={16} />}
                              </div>
                              <span className="jlt-mobile-subservice-title">{cat.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`jlt-mobile-link ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
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
              Login Portal
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
