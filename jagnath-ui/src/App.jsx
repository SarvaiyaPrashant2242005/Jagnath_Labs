import React, { useState, useEffect } from 'react';
import './assets/styles/index.css';
import LandingPage from './modules/landingPage/LandingPage';
import Login from './modules/auth/pages/Login';
import Dashboard from './modules/dashboard/pages/Dashboard';

function App() {
  // Sync page state with browser URL hash for standard history support
  const getPageFromHash = () => {
    const hash = window.location.hash;
    if (hash === '#/login') return 'login';
    if (hash === '#/dashboard') return 'dashboard';
    return 'landing'; // Default to landing page
  };

  const [currentPage, setCurrentPage] = useState(getPageFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page) => {
    if (page === 'login') {
      window.location.hash = '#/login';
    } else if (page === 'dashboard') {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = '#/landing';
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login success:', userData);
    navigateTo('dashboard');
  };

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigateTo} />;
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onNavigate={navigateTo} />;
  }

  return <LandingPage onNavigate={navigateTo} />;
}

export default App;
