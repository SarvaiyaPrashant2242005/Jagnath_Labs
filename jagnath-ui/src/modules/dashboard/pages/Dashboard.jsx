import React from 'react';

/**
 * @component Dashboard
 * @description Clean minimal Dashboard view displaying a single line "test".
 */
const Dashboard = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '2rem 3rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#838383ff'
        }}>
          Dashboard
        </h3>
      </div>
    </div>
  );
};

export default Dashboard;
