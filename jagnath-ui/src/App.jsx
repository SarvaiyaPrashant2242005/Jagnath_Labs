import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './modules/landingPage/LandingPage';
import Login from './modules/auth/pages/Login';
import Dashboard from './modules/dashboard/pages/Dashboard';
import SuperAdminDashboard from './modules/superAdmin/pages/SuperAdminDashboard';
import CompanyMaster from './modules/companyMaster/pages/CompanyMaster';
import ClientMaster from './modules/clientMaster/pages/ClientMaster';
import CategoryMaster from './modules/categoryMaster/pages/CategoryMaster';
import DepartmentMaster from './modules/departmentMaster/pages/DepartmentMaster';
import SubCategoryMaster from './modules/subCategoryMaster/pages/SubCategoryMaster';
import ParameterMaster from './modules/parameterMaster/pages/ParameterMaster';
import UserMaster from './modules/userMaster/pages/UserMaster';
import DashboardLayout from './shared/layouts/DashboardLayout';
import TestRequestForm from './modules/testRequest/pages/TestRequestForm';
import TestRequestList from './modules/testRequest/pages/TestRequestList';
import TestRequestPrint from './modules/testRequest/pages/TestRequestPrint';
import QuotationPrint from './modules/testRequest/pages/QuotationPrint';
import TestReportList from './modules/testReport/pages/TestReportList';
import TestReportForm from './modules/testReport/pages/TestReportForm';
import TestReportPrint from './modules/testReport/pages/TestReportPrint';
import Profile from './modules/profile/pages/Profile';
import PriceList from './modules/pricelist/pages/PriceList';
import CautionMaster from './modules/cautionMaster/pages/CautionMaster';
import LocationSampleMaster from './modules/locationSampleMaster/pages/LocationSampleMaster';
import { getStoredUser } from './modules/auth/services/authService';
import './assets/styles/index.css';

// Dynamic Dashboard Resolver based on User Role
const DashboardView = () => {
  const user = getStoredUser();
  const isSuperAdmin = user?.role === 'SuperAdmin' || user?.email === 'admin@jagnath.com';
  return isSuperAdmin ? <SuperAdminDashboard /> : <Dashboard />;
};


// Helper to get active token across tab sessions
const getActiveToken = () => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token && !sessionStorage.getItem('accessToken')) {
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('token', token);
  }
  const refresh = localStorage.getItem('refreshToken');
  if (refresh && !sessionStorage.getItem('refreshToken')) {
    sessionStorage.setItem('refreshToken', refresh);
  }
  const user = localStorage.getItem('user');
  if (user && !sessionStorage.getItem('user')) {
    sessionStorage.setItem('user', user);
  }
  return token;
};

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const token = getActiveToken();
  const user = getStoredUser();
  const isAuthenticated = !!(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Protected Print Route (No Dashboard Layout)
const ProtectedPrintRoute = ({ children }) => {
  const token = getActiveToken();
  const user = getStoredUser();
  const isAuthenticated = !!(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect Route if already authenticated
const PublicRoute = ({ children }) => {
  const token = getActiveToken();
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
{/* >>>>>>> Prashant_Dev */}

        {/* Authenticated Dashboard Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardView />
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
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <CompanyMaster />
            </ProtectedRoute>
          }
        />

        {/* Dynamic Placeholder pages for all LIMS routes in sidebar */}
        <Route path="/clients" element={<ProtectedRoute><ClientMaster /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute><DepartmentMaster /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoryMaster /></ProtectedRoute>} />
        <Route path="/location-samples" element={<ProtectedRoute><LocationSampleMaster /></ProtectedRoute>} />
        <Route path="/sub-categories" element={<ProtectedRoute><SubCategoryMaster /></ProtectedRoute>} />
        <Route path="/parameters" element={<ProtectedRoute><ParameterMaster /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserMaster /></ProtectedRoute>} />
        <Route path="/price-lists" element={<ProtectedRoute><PriceList /></ProtectedRoute>} />
        <Route path="/price-master" element={<ProtectedRoute><PriceList /></ProtectedRoute>} />
        <Route path="/cautions" element={<ProtectedRoute><CautionMaster /></ProtectedRoute>} />
        <Route path="/test-requests" element={<ProtectedRoute><TestRequestList /></ProtectedRoute>} />
        <Route path="/test-requests/add" element={<ProtectedRoute><TestRequestForm /></ProtectedRoute>} />
        <Route path="/test-requests/edit/:id" element={<ProtectedRoute><TestRequestForm /></ProtectedRoute>} />
        <Route path="/test-reports" element={<ProtectedRoute><TestReportList /></ProtectedRoute>} />
        <Route path="/test-reports/add" element={<ProtectedRoute><TestReportForm /></ProtectedRoute>} />
        <Route path="/test-reports/edit/:id" element={<ProtectedRoute><TestReportForm /></ProtectedRoute>} />

        {/* Print Routes without DashboardLayout */}
        <Route path="/test-requests/print/:id" element={<ProtectedPrintRoute><TestRequestPrint /></ProtectedPrintRoute>} />
        <Route path="/test-requests/quotation/:id" element={<ProtectedPrintRoute><QuotationPrint /></ProtectedPrintRoute>} />
        <Route path="/test-reports/print/:id" element={<ProtectedPrintRoute><TestReportPrint /></ProtectedPrintRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Reports Directory" /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><PlaceholderPage title="Invoices Directory" /></ProtectedRoute>} />
        <Route path="/dispatch" element={<ProtectedRoute><PlaceholderPage title="Dispatch Directory" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings Directory" /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
