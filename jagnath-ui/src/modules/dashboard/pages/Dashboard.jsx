import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaClipboardList, FaFileMedicalAlt, FaUsers, FaFlask,
  FaPlus, FaSync, FaPrint, FaEdit, FaArrowRight
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { DASHBOARD_ENDPOINTS } from '../../../shared/services/apiEndpoints';

/**
 * @component Dashboard
 * @description Clean Real-Time Dashboard displaying Side-by-Side Recent Test Requests and Test Reports (Max 5 items each).
 */
const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${DASHBOARD_ENDPOINTS.GET_STATS}?companyId=${activeCompId}` : DASHBOARD_ENDPOINTS.GET_STATS;
      const res = await apiService.get(url);

      if (res?.data) {
        setStats(res.data);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>Loading dashboard analytics...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const counts = stats?.counts || {
    totalTestRequests: 0,
    totalTestReports: 0,
    totalClients: 0,
    totalParameters: 0,
    totalCategories: 0,
    totalSubCategories: 0,
    totalLocations: 0
  };

  const recentRequests = stats?.recentTestRequests || [];
  const recentReports = stats?.recentTestReports || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {/* 1. Header Toolbar & Quick Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Dashboard</h2>
          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Laboratory real-time analytics & active workflow monitoring</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            title="Refresh Statistics"
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: '#2563eb' }} />
            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/test-requests/add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <FaPlus size={12} />
            <span>New Test Request</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/test-reports/add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <FaPlus size={12} />
            <span>New Test Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* KPI 1: Test Requests */}
        <div
          onClick={() => navigate('/test-requests')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px -4px rgba(59, 130, 246, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.04)'; }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <FaClipboardList />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Test Requests</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: '0.15rem 0' }}>
              {counts.totalTestRequests}
            </span>
            <span style={{ fontSize: '0.73rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All TRFs</span> <FaArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* KPI 2: Test Reports */}
        <div
          onClick={() => navigate('/test-reports')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px -4px rgba(16, 185, 129, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.04)'; }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <FaFileMedicalAlt />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Test Reports</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: '0.15rem 0' }}>
              {counts.totalTestReports}
            </span>
            <span style={{ fontSize: '0.73rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Completed Reports</span> <FaArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* KPI 3: Clients */}
        <div
          onClick={() => navigate('/clients')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px -4px rgba(139, 92, 246, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.04)'; }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <FaUsers />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Clients</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: '0.15rem 0' }}>
              {counts.totalClients}
            </span>
            <span style={{ fontSize: '0.73rem', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Registered Clients</span> <FaArrowRight size={10} />
            </span>
          </div>
        </div>

        {/* KPI 4: Parameters */}
        <div
          onClick={() => navigate('/parameters')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, boxShadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px -4px rgba(245, 158, 11, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.04)'; }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <FaFlask />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Test Parameters</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: '0.15rem 0' }}>
              {counts.totalParameters}
            </span>
            <span style={{ fontSize: '0.73rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Master Parameters</span> <FaArrowRight size={10} />
            </span>
          </div>
        </div>

      </div>

      {/* 3. Main Side-by-Side Workflows Layout Grid (50% / 50% Split) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* LEFT CARD: Recent Test Requests (TRF) - Max 5 */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)', borderRadius: '3px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Recent Test Requests (TRF)</h3>
            </div>
            <button
              onClick={() => navigate('/test-requests')}
              style={{ border: 'none', background: 'none', color: '#2563eb', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              View All <FaArrowRight size={10} />
            </button>
          </div>

          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>REPORT / TR NO.</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>CLIENT NAME</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>DATE</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No test requests found. <button onClick={() => navigate('/test-requests/add')} style={{ color: '#2563eb', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Create First TRF</button>
                    </td>
                  </tr>
                ) : (
                  recentRequests.slice(0, 5).map(tr => (
                    <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.65rem 0.65rem', fontWeight: 700, color: '#1e293b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {tr.reportNumber}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', color: '#0f172a', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {tr.clientName}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDateDDMMYYYY(tr.dateOfReceipt)}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => navigate(`/test-requests/print/${tr.id}`)}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Print TRF PDF"
                        >
                          <FaPrint size={10} /> Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT CARD: Recent Test Reports (TR) - Max 5 */}
        <div style={{ background: '#ffffff', borderRadius: '18px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #10b981, #047857)', borderRadius: '3px' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Recent Test Reports (TR)</h3>
            </div>
            <button
              onClick={() => navigate('/test-reports')}
              style={{ border: 'none', background: 'none', color: '#059669', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              View All <FaArrowRight size={10} />
            </button>
          </div>

          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>REPORT NO.</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>ISSUED TO</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap' }}>DATE</th>
                  <th style={{ padding: '0.6rem 0.65rem', fontWeight: 700, fontSize: '0.73rem', whiteSpace: 'nowrap', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No test reports generated yet. <button onClick={() => navigate('/test-reports/add')} style={{ color: '#059669', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Create First Report</button>
                    </td>
                  </tr>
                ) : (
                  recentReports.slice(0, 5).map(rep => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.65rem 0.65rem', fontWeight: 700, color: '#1e293b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {rep.reportNumber}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', color: '#0f172a', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {rep.reportIssuedTo}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDateDDMMYYYY(rep.dateOfReceipt)}
                      </td>
                      <td style={{ padding: '0.65rem 0.65rem', textAlign: 'center', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', gap: '0.3rem' }}>
                        <button
                          onClick={() => navigate(`/test-reports/print/${rep.id}`)}
                          style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Print PDF"
                        >
                          <FaPrint size={10} /> Print
                        </button>
                        <button
                          onClick={() => navigate(`/test-reports/edit/${rep.id}`)}
                          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Edit Report"
                        >
                          <FaEdit size={10} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
