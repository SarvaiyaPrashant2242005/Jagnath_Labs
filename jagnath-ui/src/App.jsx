import React, { useState, useEffect } from 'react';
import './assets/styles/index.css';
import LandingPage from './modules/landingPage/LandingPage';
import Login from './modules/auth/pages/Login';

function App() {
  // Sync page state with browser URL hash for standard history support
  const getPageFromHash = () => {
    const hash = window.location.hash;
    if (hash === '#/login') return 'login';
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
    } else {
      window.location.hash = '#/landing';
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login success:', userData);
    navigateTo('landing');
  };

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigateTo} />;
  }

  return <LandingPage onNavigate={navigateTo} />;
}

export default App;
