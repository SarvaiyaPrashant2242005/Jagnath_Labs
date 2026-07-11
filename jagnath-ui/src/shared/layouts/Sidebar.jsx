import React, { useState, useEffect } from 'react';
import {
  FaChartPie, FaBuilding, FaUserFriends, FaTags, FaSlidersH,
  FaClipboardList, FaPlus, FaFileAlt, FaFileInvoiceDollar,
  FaTruck, FaCog, FaChevronRight, FaFolder
} from 'react-icons/fa';

/**
 * @component Sidebar
 * @description Compact accordion sidebar navigation with full-width Jagnath Lab Logo.
 */
const Sidebar = ({ activeTab, onTabChange, onNewRequest, sidebarRef, isOpen = true }) => {
  const [openGroup, setOpenGroup] = useState(null);

  // Auto-expand group containing the active tab
  useEffect(() => {
    if (['companies', 'clients', 'categories', 'parameters'].includes(activeTab)) {
      setOpenGroup('masters');
    } else if (['requests', 'new-request'].includes(activeTab)) {
      setOpenGroup('workflow');
    } else if (['reports', 'invoices', 'dispatch', 'settings'].includes(activeTab)) {
      setOpenGroup('reports');
    }
  }, [activeTab]);

  const handleGroupToggle = (groupKey) => {
    setOpenGroup(prev => (prev === groupKey ? null : groupKey));
  };

  if (!isOpen) return null;

  return (
    <aside ref={sidebarRef} className="dashboard-sidebar" style={{ padding: 0 }}>
      {/* Scope-encapsulated styles for full-width logo and compact layout */}
      <style>{`
        .dashboard-sidebar {
          padding: 0 !important;
          background-color: var(--bg-dark);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-glass-dark);
        }
        .sidebar-nav-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .sidebar-brand-wrapper {
          height: 64px;
          width: 100%;
          background-color: transparent;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 0.75rem;
          flex-shrink: 0;
        }
        .sidebar-logo-img {
          max-height: 56px;
          max-width: 95%;
          object-fit: contain;
        }
        .sidebar-menu {
          padding: 0.5rem 1.25rem 1.75rem 1.25rem !important;
          flex-grow: 1;
          overflow-y: auto;
        }
        .menu-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.25);
          padding: 0.25rem 0.75rem;
          margin-bottom: 0.25rem;
        }
        .menu-group {
          margin-bottom: 0.25rem !important;
        }
        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem !important;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          margin-bottom: 0.15rem !important;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .menu-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 0.15rem;
        }
        .menu-group-header:hover {
          background-color: rgba(255, 255, 255, 0.03);
          color: #ffffff;
        }
        .menu-group-header .chevron-icon {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: #64748b;
        }
        .menu-group-header.expanded-header .chevron-icon {
          transform: rotate(90deg);
          color: #ffffff;
        }
        .submenu-container {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          padding-left: 1.5rem;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out, margin 0.25s;
          margin-bottom: 0;
        }
        .submenu-container.open {
          max-height: 220px;
          opacity: 1;
          margin-bottom: 0.4rem;
          margin-top: 0.15rem;
        }
        .submenu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.4rem 0.75rem;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 0.1rem;
        }
        .submenu-item:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.02);
        }
        .submenu-item.active-sub {
          color: #22c55e;
          background-color: rgba(34, 197, 94, 0.06);
          font-weight: 600;
        }
      `}</style>

      <div className="sidebar-nav-container">
        {/* Brand Logo Wrapper (Full-Width, white background, matches header height) */}
        <div className="sidebar-brand-wrapper">
          <img
            src="/Images/Navbar_Logo.png"
            alt="Jagnath Lab"
            className="sidebar-logo-img"
          />
        </div>

        {/* Compact Accordion Menu */}
        <nav className="sidebar-menu">


          {/* 1. Dashboard */}
          <div className="menu-group">
            <div
              className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                onTabChange('dashboard');
                setOpenGroup(null);
              }}
            >
              <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaChartPie className="menu-icon" />
                <span>Dashboard</span>
              </div>
            </div>
          </div>

          {/* 2. Master Dropdown */}
          <div className="menu-group">
            <div
              className={`menu-group-header ${openGroup === 'masters' ? 'expanded-header' : ''}`}
              onClick={() => handleGroupToggle('masters')}
            >
              <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaFolder className="menu-icon" />
                <span>Master</span>
              </div>
              <FaChevronRight size={11} className="chevron-icon" />
            </div>

            <div className={`submenu-container ${openGroup === 'masters' ? 'open' : ''}`}>
              {[
                { name: 'Company', key: 'companies', icon: <FaBuilding size={14} /> },
                { name: 'Clients', key: 'clients', icon: <FaUserFriends size={14} /> },
                { name: 'Categories', key: 'categories', icon: <FaTags size={14} /> },
                { name: 'Parameters', key: 'parameters', icon: <FaSlidersH size={14} /> }
              ].map(item => (
                <div
                  key={item.key}
                  className={`submenu-item ${activeTab === item.key ? 'active-sub' : ''}`}
                  onClick={() => onTabChange(item.key)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Workflow Dropdown */}
          <div className="menu-group">
            <div
              className={`menu-group-header ${openGroup === 'workflow' ? 'expanded-header' : ''}`}
              onClick={() => handleGroupToggle('workflow')}
            >
              <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaClipboardList className="menu-icon" />
                <span>Forms</span>
              </div>
              <FaChevronRight size={11} className="chevron-icon" />
            </div>

            <div className={`submenu-container ${openGroup === 'workflow' ? 'open' : ''}`}>
              <div
                className={`submenu-item ${activeTab === 'requests' ? 'active-sub' : ''}`}
                onClick={() => onTabChange('requests')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaClipboardList size={14} />
                  <span>Test Request Form</span>
                </div>
                {/* <span className="badge-count" style={{ transform: 'scale(0.85)', margin: 0 }}>50</span> */}
              </div>
              {/* <div
                className={`submenu-item ${activeTab === 'new-request' ? 'active-sub' : ''}`}
                onClick={() => onNewRequest && onNewRequest()}
              >
                <FaPlus size={14} />
              </div> */}
            </div>
          </div>

          {/* 4. Reports Dropdown */}
          <div className="menu-group">
            {/* <div
              className={`menu-group-header ${openGroup === 'reports' ? 'expanded-header' : ''}`}
              onClick={() => handleGroupToggle('reports')}
            >
              <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaFileAlt className="menu-icon" />
                <span>Reports</span>
              </div>
              <FaChevronRight size={11} className="chevron-icon" />
            </div> */}

            <div className={`submenu-container ${openGroup === 'reports' ? 'open' : ''}`}>
              {[
                { name: 'Reports', key: 'reports', icon: <FaFileAlt size={14} /> },
                { name: 'Invoices', key: 'invoices', icon: <FaFileInvoiceDollar size={14} /> },
                { name: 'Dispatch', key: 'dispatch', icon: <FaTruck size={14} /> },
                { name: 'Settings', key: 'settings', icon: <FaCog size={14} /> }
              ].map(item => (
                <div
                  key={item.key}
                  className={`submenu-item ${activeTab === item.key ? 'active-sub' : ''}`}
                  onClick={() => onTabChange(item.key)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
