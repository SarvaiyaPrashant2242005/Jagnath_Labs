import React, { useEffect, useRef, useState } from 'react';
import { FaBars, FaSignOutAlt, FaBuilding, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { gsap } from 'gsap';
import Sidebar from '../../../shared/layouts/Sidebar';
import { logoutUser } from '../../auth/services/authService';
import '../../../assets/styles/dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  // GSAP Refs
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  // Default Selected Company from image 2
  const defaultCompany = 'SHREE GANESH INDUSTRIES';

  // Toggle Sidebar Collapse
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Logout Handler
  const handleLogoutClick = () => {
    logoutUser(); // Clear localStorage tokens and user data
    if (onNavigate) {
      onNavigate('landing');
    }
  };

  // GSAP Entrance Animations
  useEffect(() => {
    if (isSidebarOpen && sidebarRef.current) {
      gsap.fromTo(sidebarRef.current,
        { x: -260, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const triggerNotification = () => {
    setShowNotificationAlert(true);
    setTimeout(() => {
      setShowNotificationAlert(false);
    }, 3000);
  };

  // Page titles and subtitles based on active tab
  const pageMeta = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of lab operations' },
    requests: { title: 'Test Requests', subtitle: 'Overview of test intake workflows' },
    'new-request': { title: 'New Request', subtitle: 'Start a new test intake request' },
    companies: { title: 'Companies Master', subtitle: 'Register and manage client companies' },
    clients: { title: 'Clients Master', subtitle: 'Manage client contacts and representatives' },
    categories: { title: 'Categories Master', subtitle: 'Manage diagnostic and testing categories' },
    parameters: { title: 'Parameters Master', subtitle: 'Configure chemical and physical analysis parameters' },
    reports: { title: 'Reports', subtitle: 'Generate and manage pathology reports' },
    invoices: { title: 'Invoices', subtitle: 'Manage billing records and invoices' },
    dispatch: { title: 'Dispatch', subtitle: 'Track physical and digital report dispatch' },
    settings: { title: 'Settings', subtitle: 'Configure laboratory system preferences' },
  };

  const { title, subtitle } = pageMeta[activeTab] || pageMeta.dashboard;

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* Styles Injection for Header & Accordion Sidebar Layout */}
      <style>{`
        .app-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 1.5rem;
          flex-shrink: 0;
          width: 100%;
        }
        .header-left-group {
          display: flex;
          align-items: center;
        }
        .sidebar-toggle-trigger {
          background: none;
          border: none;
          color: #475569;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        .sidebar-toggle-trigger:hover {
          background-color: #f1f5f9;
        }
        .header-right-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .header-company-dropdown {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #0f172a;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .header-company-dropdown:hover {
          background-color: #f1f5f9;
        }
        .header-company-icon {
          color: #22c55e;
          font-size: 0.95rem;
        }
        .header-logout-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-logout-button:hover {
          background-color: #fef2f2;
          border-color: #fca5a5;
        }
        .dashboard-main-area {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background-color: #f8fafc;
        }
        .dashboard-content-scroll {
          flex-grow: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
      `}</style>

      {/* Accordion Sidebar (Full Height on Left) */}
      <Sidebar
        sidebarRef={sidebarRef}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewRequest={() => {
          triggerNotification();
          setActiveTab('new-request');
        }}
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area on Right */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="app-top-header">
          <div className="header-left-group">
            {/* Hamburger Sidebar Trigger */}
            <button className="sidebar-toggle-trigger" onClick={toggleSidebar} title="Toggle Sidebar">
              <FaBars />
            </button>
          </div>

          <div className="header-right-group">
            {/* Default Selected Company Dropdown */}
            <div className="header-company-dropdown">
              <FaBuilding className="header-company-icon" />
              <span>{defaultCompany}</span>
              <FaChevronDown style={{ fontSize: '0.75rem', color: '#64748b' }} />
            </div>

            {/* Logout Button */}
            <button className="header-logout-button" onClick={handleLogoutClick} title="Logout Session">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content Area */}
        <div className="dashboard-content-scroll">
          
          {/* Title Block */}
          <div className="header-title-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="dashboard-heading" style={{ margin: 0, fontSize: '1.65rem' }}>{title}</h2>
              <p className="dashboard-subheading" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{subtitle}</p>
            </div>

            {activeTab !== 'dashboard' && (
              <button
                className="header-btn btn-secondary"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </button>
            )}
          </div>

          {showNotificationAlert && (
            <div className="form-alert form-alert-success animate-fadeIn" style={{ marginBottom: 0 }}>
              <span>Action triggered successfully!</span>
            </div>
          )}

          {/* Inner Route Component Area */}
          <div ref={contentRef} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', minHeight: '350px', padding: '1.5rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '100px' }}>
              Content for <strong>{title}</strong> page will render here.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
