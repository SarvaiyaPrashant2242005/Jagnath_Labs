import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaBuilding, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { logoutUser } from '../../modules/auth/services/authService';
import { apiService } from '../services/apiService';
import { COMPANY_ENDPOINTS } from '../services/apiEndpoints';

/**
 * @component DashboardLayout
 * @description Shared layout container for all authenticated dashboard routes.
 * Renders the full-height Sidebar on the left and the dynamic Header bar on the right.
 */
const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab key based on URL pathname
  const getActiveTabFromPath = (pathname) => {
    const path = pathname.replace('/', '');
    if (!path) return 'dashboard';
    if (path === 'company') return 'companies';
    if (path.startsWith('test-requests')) return 'requests';
    return path;
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Selected company and list of all user companies
  const [selectedCompany, setSelectedCompany] = useState('SHREE GANESH INDUSTRIES');
  const [companiesList, setCompaniesList] = useState([]);
  
  // Dropdown visibility
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef(null);

  // Load all user companies on init
  const loadCompanies = async () => {
    try {
      const response = await apiService.get(COMPANY_ENDPOINTS.GET_MY);
      if (response && response.data) {
        const companyList = Array.isArray(response.data) ? response.data : [response.data];
        setCompaniesList(companyList);
        
        if (companyList.length > 0) {
          // Check if there is a saved selection in localStorage
          const savedSelectedId = localStorage.getItem('selectedCompanyId');
          const found = companyList.find(c => c.id === savedSelectedId);
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
      // Silent fallback
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
    if (tabKey === 'requests') route = '/test-requests';
    
    navigate(route);
  };

  // Logout handler
  const handleLogoutClick = () => {
    logoutUser();
    navigate('/login');
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

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewRequest={() => navigate('/test-requests/add')}
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area on Right */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="app-top-header">
          <div className="header-left-group">
            <button className="sidebar-toggle-trigger" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle Sidebar">
              <FaBars />
            </button>
          </div>

          <div className="header-right-group">
            {/* Dynamic Company Selector Dropdown */}
            <div className="header-company-container" style={{ position: 'relative' }} ref={companyDropdownRef}>
              <div className="header-company-dropdown" onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}>
                <FaBuilding className="header-company-icon" />
                <span>{selectedCompany}</span>
                <FaChevronDown style={{ fontSize: '0.75rem', color: '#64748b' }} />
              </div>
              
              {showCompanyDropdown && companiesList.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '240px',
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

            <button className="header-profile-button" onClick={() => navigate('/profile')} title="My Profile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <FaUserCircle style={{ fontSize: '1.1rem' }} />
              <span>Profile</span>
            </button>

            <button className="header-logout-button" onClick={handleLogoutClick} title="Logout Session">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="dashboard-content-scroll">
          {/* Allow children to trigger header company updates directly */}
          {React.cloneElement(children, { onCompanyUpdate: handleCompanyUpdate })}
        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;
