import React, { useState, useEffect } from 'react';
import './assets/styles/index.css';
import LandingPage from './modules/landingPage/LandingPage';
import Login from './modules/auth/pages/Login';
import Dashboard from './modules/dashboard/pages/Dashboard';
import { getStoredUser, logoutUser } from './modules/auth/services/authService';

function App() {
  // Check if user has a valid session persisted in localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken');
    const user = getStoredUser();
    return !!(token && user);
  };

  // Sync page state with browser URL hash, but respect auth state
  const getPageFromHash = () => {
    const hash = window.location.hash;

    // If user is authenticated, allow dashboard; redirect login → dashboard
    if (isAuthenticated()) {
      if (hash === '#/login') return 'dashboard';
      if (hash === '#/dashboard') return 'dashboard';
    }

    // If user is NOT authenticated but trying to access dashboard, redirect to login
    if (!isAuthenticated() && hash === '#/dashboard') {
      return 'login';
    }

    if (hash === '/login') return 'login';
    if (hash === '/dashboard') return 'dashboard';
    return 'landing';
  };

  const [currentPage, setCurrentPage] = useState(getPageFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync the hash when page state changes
  useEffect(() => {
    const expectedHash =
      currentPage === 'login' ? '#/login' :
        currentPage === 'dashboard' ? '#/dashboard' :
          '#/landing';

    if (window.location.hash !== expectedHash) {
      window.location.hash = expectedHash;
    }
  }, [currentPage]);

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
    // Tokens are already stored in localStorage by authService.loginUser()
    console.log('Login success:', userData);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    logoutUser(); // Clear tokens and user from localStorage
    navigateTo('landing');
  };

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigateTo} />;
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onNavigate={handleLogout} />;
  }

  return <LandingPage onNavigate={navigateTo} />;
}

export default App;
