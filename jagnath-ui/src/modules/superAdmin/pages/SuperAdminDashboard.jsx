import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  COMPANY_ENDPOINTS, USER_ENDPOINTS, CLIENT_ENDPOINTS, TEST_REQUEST_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import {
  FaBuilding, FaUserShield, FaUserFriends, FaClipboardList,
  FaPlus, FaArrowRight, FaShieldAlt, FaCheckCircle, FaEdit
} from 'react-icons/fa';

/**
 * @component SuperAdminDashboard
 * @description Centralized administrative platform control panel for Super Admin.
 */
const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    companiesCount: 0,
    usersCount: 0,
    clientsCount: 0,
    requestsCount: 0
  });

  const [recentCompanies, setRecentCompanies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuperAdminStats();
  }, []);

  const fetchSuperAdminStats = async () => {
    try {
      setLoading(true);

      const [compRes, userRes, clientRes, reqRes] = await Promise.all([
        apiService.get(`${COMPANY_ENDPOINTS.GET_MY}?limit=5`),
        apiService.get(`${USER_ENDPOINTS.GET_ALL}?limit=5`),
        apiService.get(`${CLIENT_ENDPOINTS.GET_ALL}?limit=1`),
        apiService.get(`${TEST_REQUEST_ENDPOINTS.GET_ALL}?limit=1`)
      ]);

      const companies = compRes?.data ? (Array.isArray(compRes.data) ? compRes.data : [compRes.data]) : [];
      const users = userRes?.data ? (Array.isArray(userRes.data) ? userRes.data : [userRes.data]) : [];

      setRecentCompanies(companies.slice(0, 5));
      setRecentUsers(users.slice(0, 5));

      setStats({
        companiesCount: compRes?.pagination?.totalItems || companies.length,
        usersCount: userRes?.pagination?.totalItems || users.length,
        clientsCount: clientRes?.pagination?.totalItems || (Array.isArray(clientRes?.data) ? clientRes.data.length : 0),
        requestsCount: reqRes?.pagination?.totalItems || (Array.isArray(reqRes?.data) ? reqRes.data.length : 0)
      });
    } catch (err) {
      console.error('Error loading Super Admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header Banner */}
      {/* <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31104b 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <FaShieldAlt /> SUPER ADMIN WORKSPACE
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Platform Control Panel</h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            System-wide administration, tenant management, and user provisioning.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/company')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
          >
            <FaPlus /> Add Company
          </button>
          <button 
            onClick={() => navigate('/users')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#a855f7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.65rem 1.25rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}
          >
            <FaPlus /> Add User
          </button>
        </div>
      </div> */}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

        {/* Total Companies */}
        <div
          onClick={() => navigate('/company')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>REGISTERED COMPANIES</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaBuilding size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.companiesCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, marginTop: '0.5rem' }}>
            Manage Companies <FaArrowRight size={10} />
          </div>
        </div>

        {/* Total Users */}
        <div
          onClick={() => navigate('/users')}
          style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>PLATFORM USERS</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserShield size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.usersCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#7e22ce', fontWeight: 600, marginTop: '0.5rem' }}>
            Manage Users & Access <FaArrowRight size={10} />
          </div>
        </div>

        {/* System Clients */}
        <div
          style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TOTAL CLIENTS</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserFriends size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.clientsCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Active system clients</div>
        </div>

        {/* Test Requests */}
        <div
          style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>TEST REQUESTS</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaClipboardList size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{loading ? '...' : stats.requestsCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Total processed requests</div>
        </div>
      </div>

      {/* Two Column Grid: Companies & Users Management Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* Companies Overview */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaBuilding style={{ color: '#2563eb' }} />
              <span>Registered Companies</span>
            </h3>
            <button onClick={() => navigate('/company')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentCompanies.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                No companies registered yet.
              </div>
            ) : (
              recentCompanies.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{c.companyName || c.company_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Code: {c.companyCode || 'N/A'} • {c.companyEmail || c.email || 'N/A'}</div>
                  </div>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    backgroundColor: c.status === 'Active' ? '#dcfce7' : '#fee2e2',
                    color: c.status === 'Active' ? '#15803d' : '#991b1b'
                  }}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Overview */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUserShield style={{ color: '#a855f7' }} />
              <span>Platform Users</span>
            </h3>
            <button onClick={() => navigate('/users')} style={{ background: 'none', border: 'none', color: '#a855f7', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentUsers.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                No platform users created yet.
              </div>
            ) : (
              recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{u.email}</div>
                  </div>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    backgroundColor: u.role === 'SuperAdmin' ? '#f3e8ff' : '#e0f2fe',
                    color: u.role === 'SuperAdmin' ? '#7e22ce' : '#0369a1'
                  }}>
                    {u.role || 'User'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SuperAdminDashboard;
