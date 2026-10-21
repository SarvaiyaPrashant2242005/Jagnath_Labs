import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Import Landing Page Styles
import './styles/landing.css';

// Components
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import ServicesView from './components/ServicesView';
import CertificatesView from './components/CertificatesView';
import ContactView from './components/ContactView';
import Footer from './components/Footer';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onNavigate, initialTab }) {
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '').trim().toLowerCase();
    if (['about', 'services', 'certificates', 'contact'].includes(hash)) {
      return hash;
    }
    return initialTab || 'home';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [isScrolled, setIsScrolled] = useState(false);
  const lenisRef = useRef(null);

  // Initialize Lenis smooth scroll and scroll listeners
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTab(newTab);
      lenis.scrollTo(0, { immediate: false });
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Handle Tab Switch
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId === 'home' ? '#/' : `#/${tabId}`;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false, duration: 0.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Get Appointment CTA -> Opens the Login page
  const handleAppointmentClick = () => {
    if (onNavigate) {
      onNavigate('login');
    } else {
      window.location.hash = '#/login';
    }
  };

  return (
    <div className="jlt-root">
      {/* 1. Fixed Header (TopBar + Navbar) */}
      <div className="jlt-fixed-header">
        <TopBar />
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          onAppointmentClick={handleAppointmentClick}
          isScrolled={isScrolled}
        />
      </div>

      {/* 2. Main Content */}
      <main id="main-content" className="jlt-main-content">
        {activeTab === 'home' && (
          <HomeView 
            onNavigateTab={handleTabChange} 
            onAppointmentClick={handleAppointmentClick} 
          />
        )}

        {activeTab === 'about' && (
          <AboutView 
            onNavigateTab={handleTabChange}
            onAppointmentClick={handleAppointmentClick} 
          />
        )}

        {activeTab === 'services' && (
          <ServicesView 
            onAppointmentClick={handleAppointmentClick} 
          />
        )}

        {activeTab === 'certificates' && (
          <CertificatesView />
        )}

        {activeTab === 'contact' && (
          <ContactView />
        )}
      </main>

      {/* 4. Footer */}
      <Footer onNavigateTab={handleTabChange} />
    </div>
  );
}
