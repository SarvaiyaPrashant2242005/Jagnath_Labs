import React, { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaEnvelope, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';
import authService from '../../../shared/services/authService';
import companyService from '../../../shared/services/companyService';

const Settings = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load logged-in user profile
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        // Load company master details
        const compRes = await companyService.getCompany();
        if (compRes.success && compRes.data) {
          setCompanyInfo(compRes.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load user profile or company settings.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="settings-container" style={{ padding: '0.25rem' }}>
      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="comp-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
          Loading settings...
        </div>
      ) : (
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* User Profile Card */}
          <div className="comp-card" style={{ padding: '1.5rem' }}>
            <div className="chart-header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
              <h3 className="chart-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUser />
                <span>My Profile</span>
              </h3>
              <p className="chart-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Personal credentials and role authorizations</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaUser style={{ color: 'var(--primary-dark)' }} />
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Full Name</div>
                  <strong style={{ color: 'var(--text-dark)' }}>{currentUser?.full_name || currentUser?.name || 'Dr. Sanjay Vora'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaEnvelope style={{ color: 'var(--primary-dark)' }} />
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Email Address</div>
                  <strong style={{ color: 'var(--text-dark)' }}>{currentUser?.email || 'sanjay.vora@jagnath.com'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaShieldAlt style={{ color: 'var(--primary-dark)' }} />
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>System Access Level</div>
                  <span 
                    className="comp-type-badge" 
                    style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '0.2rem', display: 'inline-block' }}
                  >
                    {currentUser?.role?.toUpperCase() || 'LAB ADMINISTRATOR'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Company Settings Card */}
          <div className="comp-card" style={{ padding: '1.5rem' }}>
            <div className="chart-header" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
              <h3 className="chart-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaBuilding />
                <span>Company Information</span>
              </h3>
              <p className="chart-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Registered company details and configurations</p>
            </div>

            {companyInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaBuilding style={{ color: 'var(--primary-dark)' }} />
                  <div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Registered Name</div>
                    <strong style={{ color: 'var(--text-dark)' }}>{companyInfo.companyName || companyInfo.company_name}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaEnvelope style={{ color: 'var(--primary-dark)' }} />
                  <div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Billing Email</div>
                    <strong style={{ color: 'var(--text-dark)' }}>{companyInfo.companyEmail || companyInfo.company_email}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaShieldAlt style={{ color: 'var(--primary-dark)' }} />
                  <div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>GST Registration Number</div>
                    <strong style={{ color: 'var(--text-dark)' }}>{companyInfo.gst_number || '—'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FaCalendarAlt style={{ color: 'var(--primary-dark)' }} />
                  <div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Company Code</div>
                    <strong style={{ color: 'var(--text-dark)' }}>{companyInfo.company_code}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No company registered yet. Please configure it in the "Companies Master" tab.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
