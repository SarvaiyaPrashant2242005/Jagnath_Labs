import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './modules/landingPage/LandingPage';
import Login from './modules/auth/pages/Login';
import Dashboard from './modules/dashboard/pages/Dashboard';
import CompanyMaster from './modules/companyMaster/pages/CompanyMaster';
import ClientMaster from './modules/clientMaster/pages/ClientMaster';
import CategoryMaster from './modules/categoryMaster/pages/CategoryMaster';
import ParameterMaster from './modules/parameterMaster/pages/ParameterMaster';
import DashboardLayout from './shared/layouts/DashboardLayout';
import { getStoredUser } from './modules/auth/services/authService';
import './assets/styles/index.css';


// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const user = getStoredUser();
  const isAuthenticated = !!(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Redirect Route if already authenticated
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const user = getStoredUser();
  const isAuthenticated = !!(token && user);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Simple helper component for placeholder/under-construction sections
const PlaceholderPage = ({ title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Under development / configurations</p>
    </div>
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', minHeight: '350px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
        The <strong>{title}</strong> page view is currently under development.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={<LandingPage onNavigate={(page) => window.location.hash = `#/${page}`} />} 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login 
                onLoginSuccess={() => window.location.hash = '#/dashboard'} 
                onNavigate={(page) => window.location.hash = `#/${page}`} 
              />
            </PublicRoute>
          } 
        />

        {/* Authenticated Dashboard Pages */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/company" 
          element={
            <ProtectedRoute>
              <CompanyMaster />
            </ProtectedRoute>
          } 
        />

        {/* Dynamic Placeholder pages for all LIMS routes in sidebar */}
        <Route path="/clients" element={<ProtectedRoute><ClientMaster /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoryMaster /></ProtectedRoute>} />
        <Route path="/parameters" element={<ProtectedRoute><ParameterMaster /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><PlaceholderPage title="Test Requests" /></ProtectedRoute>} />
        <Route path="/new-request" element={<ProtectedRoute><PlaceholderPage title="New Request Intake" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Reports Directory" /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><PlaceholderPage title="Invoices Directory" /></ProtectedRoute>} />
        <Route path="/dispatch" element={<ProtectedRoute><PlaceholderPage title="Dispatch Directory" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings Directory" /></ProtectedRoute>} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
