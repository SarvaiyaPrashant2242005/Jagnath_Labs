import React from 'react';

/**
 * @component Dashboard
 * @description Standalone dashboard landing/overview page.
 */
const Dashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title block */}
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Dashboard</h2>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Overview of lab operations</p>
      </div>

      {/* Main card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', minHeight: '350px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            Welcome back to the Jagnath Lab Diagnostic Portal! General metrics, sample queues, and key performance widgets will render here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
