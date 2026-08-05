import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaBuilding, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import Sidebar from './Sidebar';
import SuperAdminSidebar from './SuperAdminSidebar';
import { logoutUser, getStoredUser } from '../../modules/auth/services/authService';
import { apiService } from '../services/apiService';
import { COMPANY_ENDPOINTS } from '../services/apiEndpoints';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog';

/**
 * @component DashboardLayout
 * @description Shared layout container for all authenticated dashboard routes with responsive mobile drawer support.
 */
const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const isSuperAdmin = user?.role === 'SuperAdmin' || user?.email === 'admin@jagnath.com';

  // Determine active tab key based on URL pathname
  const getActiveTabFromPath = (pathname) => {
    const path = pathname.replace('/', '');
    if (!path) return 'dashboard';
    if (path === 'company') return 'companies';
    if (path.startsWith('test-requests')) return 'requests';
    return path;
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  
  // Responsive sidebar open state: closed by default on mobile/tablets
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 991);
  
  // Selected company and list of all user companies
  const [selectedCompany, setSelectedCompany] = useState('SHREE GANESH INDUSTRIES');
  const [companiesList, setCompaniesList] = useState([]);
  
  // Dropdown visibility
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef(null);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Auto-manage sidebar drawer state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load all user companies on init
  const loadCompanies = async () => {
    try {
      const response = await apiService.get(COMPANY_ENDPOINTS.GET_MY);
      if (response && response.data) {
        const companyList = Array.isArray(response.data) ? response.data : [response.data];
        setCompaniesList(companyList);
        
        if (companyList.length > 0) {
          const savedSelectedId = localStorage.getItem('selectedCompanyId');
          const found = companyList.find(c => String(c.id) === String(savedSelectedId));
          if (found) {
            setSelectedCompany(found.companyName || found.company_name);
          } else {
            setSelectedCompany(companyList[0].companyName || companyList[0].company_name);
            localStorage.setItem('selectedCompanyId', companyList[0].id);
          }
        } else {
          setSelectedCompany('No Company Registered');
        }
      } else {
        setCompaniesList([]);
        setSelectedCompany('No Company Registered');
      }
    } catch (err) {
      setCompaniesList([]);
      setSelectedCompany('No Company Registered');
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Close company dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dynamic company list on changes
  const handleCompanyUpdate = () => {
    loadCompanies();
  };

  // Switch company context
  const handleSelectCompany = (company) => {
    const name = company.companyName || company.company_name;
    setSelectedCompany(name);
    localStorage.setItem('selectedCompanyId', company.id);
    setShowCompanyDropdown(false);
    
    // Broadcast company context changes
    window.dispatchEvent(new Event('companyChanged'));
  };

  // Sidebar navigation handler
  const handleTabChange = (tabKey) => {
    let route = `/${tabKey}`;
    if (tabKey === 'companies') route = '/company';
    if (tabKey === 'users') route = '/users';
    if (tabKey === 'requests') route = '/test-requests';
    
    navigate(route);
  };

  // Logout handler
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutUser();
    navigate('/login');
  };

  // Close sidebar on mobile item selection (keeps sidebar open on desktop)
  const handleCloseMobile = () => {
    if (window.innerWidth <= 991) {
      setIsSidebarOpen(false);
    }
  };

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
          box-sizing: border-box;
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
          min-width: 44px;
          min-height: 44px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .sidebar-toggle-trigger:hover {
          background-color: #f1f5f9;
        }

        .header-right-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-company-dropdown {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          color: #0f172a;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
          max-width: 220px;
        }

        .header-company-dropdown:hover {
          background-color: #f1f5f9;
        }

        .header-company-icon {
          color: #22c55e;
          font-size: 0.95rem;
          flex-shrink: 0;
        }

        .header-company-text {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-logout-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 38px;
        }

        .header-logout-button:hover {
          background-color: #fef2f2;
          border-color: #fca5a5;
        }

        .header-profile-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          color: #3b82f6;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 38px;
        }

        .header-profile-button:hover {
          background-color: #eff6ff;
          border-color: #bfdbfe;
        }

        .dashboard-main-area {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background-color: #f8fafc;
          width: 100%;
        }

        .dashboard-content-scroll {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .app-top-header {
            padding: 0 0.85rem;
          }

          .dashboard-content-scroll {
            padding: 1rem;
            gap: 1.25rem;
          }
        }

        @media (max-width: 576px) {
          .app-top-header {
            padding: 0 0.5rem;
          }

          .header-right-group {
            gap: 0.35rem;
          }

          .header-company-dropdown {
            padding: 0.4rem 0.6rem;
            font-size: 0.78rem;
          }

          .header-company-text {
            max-width: 85px;
          }

          .header-btn-text {
            display: none;
          }

          .header-profile-button,
          .header-logout-button {
            padding: 0.4rem 0.6rem;
          }

          .dashboard-content-scroll {
            padding: 0.75rem;
            gap: 1rem;
          }
        }
      `}</style>

      {/* Sidebar navigation */}
      {isSuperAdmin ? (
        <SuperAdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={isSidebarOpen}
          onCloseMobile={handleCloseMobile}
        />
      ) : (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewRequest={() => navigate('/test-requests/add')}
          isOpen={isSidebarOpen}
          onCloseMobile={handleCloseMobile}
        />
      )}

      {/* Main Content Area on Right */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="app-top-header">
          <div className="header-left-group">
            <button
              className="sidebar-toggle-trigger"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar Navigation"
            >
              <FaBars />
            </button>
          </div>

          <div className="header-right-group">
            {/* Dynamic Company Selector Dropdown */}
            <div className="header-company-container" style={{ position: 'relative' }} ref={companyDropdownRef}>
              <div className="header-company-dropdown" onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}>
                <FaBuilding className="header-company-icon" />
                <span className="header-company-text">{selectedCompany}</span>
                <FaChevronDown style={{ fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }} />
              </div>
              
              {showCompanyDropdown && companiesList.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '240px',
                  maxWidth: '85vw',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 999,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '4px 0'
                }}>
                  {companiesList.map(company => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.625rem 1rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#334155',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <FaBuilding style={{ color: '#22c55e', flexShrink: 0 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {company.companyName || company.company_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/profile" className="header-profile-button" title="My Profile">
              <FaUserCircle style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span className="header-btn-text">Profile</span>
            </Link>

            <button className="header-logout-button" onClick={handleLogoutClick} title="Logout Session">
              <FaSignOutAlt style={{ flexShrink: 0 }} />
              <span className="header-btn-text">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="dashboard-content-scroll">
          {/* Allow children to trigger header company updates directly */}
          {React.cloneElement(children, { onCompanyUpdate: handleCompanyUpdate })}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your session? You will need to log back in to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        icon={<FaSignOutAlt />}
      />
    </div>
  );
};

export default DashboardLayout;
