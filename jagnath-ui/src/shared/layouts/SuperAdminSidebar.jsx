import React from 'react';
import { FaChartPie, FaBuilding, FaUserShield, FaUserCircle, FaTimes, FaShieldAlt } from 'react-icons/fa';

/**
 * @component SuperAdminSidebar
 * @description Sidebar navigation dedicated strictly for Super Admin.
 */
const SuperAdminSidebar = ({ activeTab, onTabChange, sidebarRef, isOpen = true, onCloseMobile }) => {
  const handleItemClick = (key) => {
    onTabChange(key);
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
              <div
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleItemClick('dashboard')}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaChartPie className="menu-icon" />
                  <span>Platform Dashboard</span>
                </div>
              </div>
            </div>

            {/* 2. Companies Management */}
            <div className="menu-group">
              <div
                className={`menu-item ${activeTab === 'companies' ? 'active' : ''}`}
                onClick={() => handleItemClick('companies')}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaBuilding className="menu-icon" />
                  <span>Companies</span>
                </div>
              </div>
            </div>

            {/* 3. User & Access Management */}
            <div className="menu-group">
              <div
                className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => handleItemClick('users')}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaUserShield className="menu-icon" />
                  <span>Users & Access</span>
                </div>
              </div>
            </div>

            <div className="menu-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', paddingLeft: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>ACCOUNT</div>

            {/* 4. Profile */}
            <div className="menu-group">
              <div
                className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleItemClick('profile')}
              >
                <div className="menu-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaUserCircle className="menu-icon" />
                  <span>Profile Settings</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
