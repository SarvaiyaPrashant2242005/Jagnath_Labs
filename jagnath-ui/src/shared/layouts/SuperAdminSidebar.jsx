import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartPie, FaBuilding, FaUserShield, FaUserCircle, FaTimes, FaShieldAlt } from 'react-icons/fa';

/**
 * @component SuperAdminSidebar
 * @description Sidebar navigation dedicated strictly for Super Admin.
 */
const SuperAdminSidebar = ({ activeTab, onTabChange, sidebarRef, isOpen = true, onCloseMobile }) => {
  const handleItemClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => onCloseMobile && onCloseMobile()}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}
        style={{ padding: 0 }}
      >
        <style>{`
          .dashboard-sidebar {
            padding: 0 !important;
            background-color: var(--bg-dark);
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--border-glass-dark);
            width: 260px;
            flex-shrink: 0;
            z-index: 1005;
            height: 100%;
            transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @media (min-width: 992px) {
            .dashboard-sidebar:not(.open) {
              margin-left: -260px !important;
            }
          }

          .sidebar-backdrop {
            display: none;
          }

          @media (max-width: 991px) {
            .sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background-color: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(4px);
              -webkit-backdrop-filter: blur(4px);
              z-index: 1004;
              animation: fadeIn 0.2s ease-out;
            }

            .dashboard-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              width: 270px;
              max-width: 85vw;
              transform: translateX(-100%);
              box-shadow: 10px 0 30px rgba(0, 0, 0, 0.3);
              margin-left: 0 !important;
            }

            .dashboard-sidebar.open {
              transform: translateX(0);
            }
          }

          .super-admin-sidebar-header {
            padding: 1.25rem 1rem 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
            box-sizing: border-box;
          }

          .super-admin-logo-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .super-admin-logo-img {
            max-height: 44px;
            max-width: 180px;
            object-fit: contain;
          }

          .super-admin-close-btn {
            display: none;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0.4rem;
            border-radius: 6px;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
          }

          .super-admin-close-btn:hover {
            color: #ffffff;
          }

          @media (max-width: 991px) {
            .super-admin-close-btn {
              display: flex;
            }
          }

          .menu-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 0.75rem !important;
            color: #94a3b8;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 8px;
            margin-bottom: 0.15rem !important;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 40px;
            text-decoration: none !important;
          }

          .menu-item:hover, .menu-item.active {
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.05);
          }
        `}</style>

        <div className="sidebar-nav-container">
          {/* Brand Logo & Portal Badge */}
          <div className="super-admin-sidebar-header">
            <div className="super-admin-logo-row">
              <img
                src="/Images/Navbar_Logo.png"
                alt="Jaganath Lab"
                className="super-admin-logo-img"
              />
              <button
                className="super-admin-close-btn"
                onClick={() => onCloseMobile && onCloseMobile()}
                aria-label="Close Sidebar"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Super Admin Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.3))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <FaShieldAlt size={12} />
              <span>Super Admin Portal</span>
            </div>
          </div>

          {/* Super Admin Nav Menu */}
          <nav className="sidebar-menu" style={{ marginTop: '0.75rem' }}>
            <div className="menu-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', paddingLeft: '1rem', marginBottom: '0.5rem' }}>MANAGEMENT</div>

            {/* 1. Super Admin Dashboard */}
            <div className="menu-group">
              <Link
                to="/dashboard"
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={handleItemClick}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaChartPie className="menu-icon" />
                  <span>Platform Dashboard</span>
                </div>
              </Link>
            </div>

            {/* 2. Companies Management */}
            <div className="menu-group">
              <Link
                to="/company"
                className={`menu-item ${activeTab === 'companies' ? 'active' : ''}`}
                onClick={handleItemClick}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaBuilding className="menu-icon" />
                  <span>Companies</span>
                </div>
              </Link>
            </div>

            {/* 3. User & Access Management */}
            <div className="menu-group">
              <Link
                to="/users"
                className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={handleItemClick}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaUserShield className="menu-icon" />
                  <span>Users & Access</span>
                </div>
              </Link>
            </div>

            <div className="menu-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', paddingLeft: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>ACCOUNT</div>

            {/* 4. Profile */}
            <div className="menu-group">
              <Link
                to="/profile"
                className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={handleItemClick}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaUserCircle className="menu-icon" />
                  <span>Profile Settings</span>
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
