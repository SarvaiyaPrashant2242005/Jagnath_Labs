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
import BlogView from './components/BlogView';
import Footer from './components/Footer';
import { getCategoryBySlug } from './servicesData';
import { ServiceCategoryDetailView } from './components/ServiceCategoryDetailView';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onNavigate, initialTab }) {
  // Parse tab and optional category slug from hash e.g. #/services or #/services/food-testing
  const parseHash = () => {
    const rawHash = window.location.hash.replace('#/', '').replace('#', '').trim();
    const parts = rawHash.split('/');
    const tab = parts[0]?.toLowerCase();
    const categorySlug = parts[1] || '';

    if (['about', 'services', 'certificates', 'blog', 'contact'].includes(tab)) {
      return { tab, categorySlug };
    }
    return { tab: initialTab || 'home', categorySlug: '' };
  };

  const initialParsed = parseHash();
  const [activeTab, setActiveTab] = useState(initialParsed.tab);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(initialParsed.categorySlug);
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
      const parsed = parseHash();
      setActiveTab(parsed.tab);
      setSelectedCategorySlug(parsed.categorySlug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSelectedCategorySlug('');
    window.location.hash = tabId === 'home' ? '#/' : `#/${tabId}`;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false, duration: 0.8 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Category Selection from Dropdown or Overview Cards
  const handleCategorySelect = (categorySlug) => {
    setActiveTab('services');
    setSelectedCategorySlug(categorySlug);
    window.location.hash = `#/services/${categorySlug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Get Appointment CTA -> Opens the Login page
  const handleAppointmentClick = () => {
    if (onNavigate) {
      onNavigate('login');
    } else {
      window.location.hash = '#/login';
    }
  };

  const matchedCategory = selectedCategorySlug ? getCategoryBySlug(selectedCategorySlug) : null;

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
          currentCategorySlug={selectedCategorySlug}
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
          matchedCategory ? (
            <ServiceCategoryDetailView 
              category={matchedCategory}
              onAppointmentClick={handleAppointmentClick}
            />
          ) : (
            <ServicesView 
              onAppointmentClick={handleAppointmentClick} 
              onSelectCategory={handleCategorySelect}
            />
          )
        )}

        {activeTab === 'certificates' && (
          <CertificatesView 
            onNavigateTab={handleTabChange} 
            onAppointmentClick={handleAppointmentClick} 
          />
        )}

        {activeTab === 'blog' && (
          <BlogView 
            onAppointmentClick={handleAppointmentClick} 
          />
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
