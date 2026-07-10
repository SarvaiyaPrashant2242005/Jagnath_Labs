import React, { useEffect, useRef, useState } from 'react';
import { 
  FaFlask, FaChartPie, FaClipboardList, FaPlus, FaBuilding, 
  FaUserFriends, FaTags, FaSlidersH, FaFileAlt, FaFileInvoiceDollar, 
  FaTruck, FaCog, FaSignOutAlt, FaSearch, FaBell, FaChevronRight, 
  FaArrowUp, FaArrowDown, FaRegClock, FaCheck, FaBuilding as FaCompany 
} from 'react-icons/fa';
import { gsap } from 'gsap';
import '../../../assets/styles/dashboard.css';
import TestRequestsList from '../../testRequest/pages/TestRequestsList';
import NewTestRequestWizard from '../../testRequest/pages/NewTestRequestWizard';
import Companies from './Companies';
import Clients from './Clients';
import Categories from './Categories';
import Parameters from './Parameters';

// Central LIMS Mock Database
const INITIAL_MOCK_DATA = [
  { id: 'TR-2026-000245', client: 'Vikram Solanki', company: 'UltraTech Cement Ltd.', category: 'Soil', date: '2026-07-27', priority: 'URGENT', progress: 80, status: 'In Progress' },
  { id: 'TR-2026-000244', client: 'Harsh Mehta', company: 'Tata Chemicals Ltd.', category: 'Drinking Water', date: '2026-03-02', priority: 'High', progress: 10, status: 'Pending Testing' },
  { id: 'TR-2026-000243', client: 'Rajesh Patel', company: 'ABC Industries Pvt. Ltd.', category: 'Waste Water', date: '2026-07-08', priority: 'Normal', progress: 40, status: 'In Progress' },
  { id: 'TR-2026-000242', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Drinking Water', date: '2026-07-19', priority: 'High', progress: 45, status: 'In Progress' },
  { id: 'TR-2026-000241', client: 'Ami Rana', company: 'ABC Industries Pvt. Ltd.', category: 'Surface Water', date: '2026-07-19', priority: 'Normal', progress: 15, status: 'Pending Testing' },
  { id: 'TR-2026-000240', client: 'Harsh Mehta', company: 'Tata Chemicals Ltd.', category: 'Ground Water', date: '2026-03-27', priority: 'Normal', progress: 35, status: 'In Progress' },
  { id: 'TR-2026-000239', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Surface Water', date: '2026-07-11', priority: 'Normal', progress: 15, status: 'Pending Testing' },
  { id: 'TR-2026-000238', client: 'Rajesh Patel', company: 'ABC Industries Pvt. Ltd.', category: 'Soil', date: '2026-03-26', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000237', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Soil', date: '2026-02-11', priority: 'URGENT', progress: 15, status: 'Pending Testing' },
  { id: 'TR-2026-000236', client: 'Nilesh Shah', company: 'Reliance Industries Ltd.', category: 'Food', date: '2026-02-23', priority: 'Normal', progress: 30, status: 'In Progress' },
  
  { id: 'TR-2026-000235', client: 'Bhavin Patel', company: 'Nirma Chemicals', category: 'Waste Water', date: '2026-04-12', priority: 'High', progress: 50, status: 'In Progress' },
  { id: 'TR-2026-000234', client: 'Vikram Solanki', company: 'UltraTech Cement Ltd.', category: 'Soil', date: '2026-05-18', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000233', client: 'Deepika Vyas', company: 'Reliance Industries Ltd.', category: 'Food', date: '2026-06-25', priority: 'Normal', progress: 95, status: 'In Progress' },
  { id: 'TR-2026-000232', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Drinking Water', date: '2026-07-02', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000231', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Soil', date: '2026-01-15', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000230', client: 'Rupesh Gada', company: 'Essar Oil Ltd.', category: 'Ground Water', date: '2026-03-29', priority: 'High', progress: 75, status: 'In Progress' },
  { id: 'TR-2026-000229', client: 'Nita Shah', company: 'GIDC Water Dist.', category: 'Drinking Water', date: '2026-02-05', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000228', client: 'Bhavna Bhatt', company: 'Adani Ports Ltd.', category: 'Soil', date: '2026-06-22', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000227', client: 'Sanjay Vora', company: 'Sterling Biotech', category: 'Waste Water', date: '2026-04-19', priority: 'URGENT', progress: 20, status: 'Pending Testing' },
  { id: 'TR-2026-000226', client: 'Ami Rana', company: 'ABC Industries Pvt. Ltd.', category: 'Drinking Water', date: '2026-07-01', priority: 'Normal', progress: 100, status: 'Completed' },
  
  { id: 'TR-2026-000225', client: 'Pooja Jani', company: 'Zydus Cadila', category: 'Food', date: '2026-03-17', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000224', client: 'Rajesh Patel', company: 'ABC Industries Pvt. Ltd.', category: 'Surface Water', date: '2026-06-11', priority: 'High', progress: 60, status: 'In Progress' },
  { id: 'TR-2026-000223', client: 'Jayesh Vyas', company: 'Torrent Power', category: 'Soil', date: '2026-05-30', priority: 'Normal', progress: 85, status: 'In Progress' },
  { id: 'TR-2026-000222', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Ground Water', date: '2026-07-06', priority: 'URGENT', progress: 10, status: 'Pending Testing' },
  { id: 'TR-2026-000221', client: 'Meera Dave', company: 'Welspun Corp', category: 'Waste Water', date: '2026-02-14', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000220', client: 'Hardik Gohel', company: 'GNFC Ltd.', category: 'Drinking Water', date: '2026-04-03', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000219', client: 'Jignesh Mewada', company: 'GSFC Ltd.', category: 'Soil', date: '2026-05-02', priority: 'High', progress: 90, status: 'In Progress' },
  { id: 'TR-2026-000218', client: 'Harsh Mehta', company: 'Tata Chemicals Ltd.', category: 'Drinking Water', date: '2026-01-20', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000217', client: 'Ami Rana', company: 'ABC Industries Pvt. Ltd.', category: 'Food', date: '2026-06-19', priority: 'Normal', progress: 40, status: 'In Progress' },
  { id: 'TR-2026-000216', client: 'Nilesh Shah', company: 'Reliance Industries Ltd.', category: 'Surface Water', date: '2026-03-12', priority: 'Normal', progress: 100, status: 'Completed' },
  
  { id: 'TR-2026-000215', client: 'Tarun Panchal', company: 'L&T Heavy Eng.', category: 'Soil', date: '2026-05-15', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000214', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Drinking Water', date: '2026-07-04', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000213', client: 'Bhavin Patel', company: 'Nirma Chemicals', category: 'Ground Water', date: '2026-02-28', priority: 'URGENT', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000212', client: 'Vikram Solanki', company: 'UltraTech Cement Ltd.', category: 'Waste Water', date: '2026-05-24', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000211', client: 'Sneha Joshi', company: 'Apollo Tyres Ltd.', category: 'Soil', date: '2026-06-14', priority: 'High', progress: 50, status: 'In Progress' },
  { id: 'TR-2026-000210', client: 'Rajesh Patel', company: 'ABC Industries Pvt. Ltd.', category: 'Drinking Water', date: '2026-02-25', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000209', client: 'Lalji Gada', company: 'Essar Oil Ltd.', category: 'Ground Water', date: '2026-01-18', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000208', client: 'Vikram Solanki', company: 'UltraTech Cement Ltd.', category: 'Soil', date: '2026-04-11', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000207', client: 'Heena Kothari', company: 'Cadila Healthcare', category: 'Food', date: '2026-03-09', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000206', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Waste Water', date: '2026-07-02', priority: 'High', progress: 30, status: 'In Progress' },
  
  { id: 'TR-2026-000205', client: 'Nilesh Shah', company: 'Reliance Industries Ltd.', category: 'Drinking Water', date: '2026-01-08', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000204', client: 'Ami Rana', company: 'ABC Industries Pvt. Ltd.', category: 'Soil', date: '2026-05-09', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000203', client: 'Harsh Mehta', company: 'Tata Chemicals Ltd.', category: 'Waste Water', date: '2026-02-06', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000202', client: 'Ketan Desai', company: 'Jagnath Municipal Corp.', category: 'Soil', date: '2026-07-01', priority: 'URGENT', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000201', client: 'Paresh Rawal', company: 'Sardar Sarovar Corp.', category: 'Surface Water', date: '2026-06-28', priority: 'Normal', progress: 70, status: 'In Progress' },
  { id: 'TR-2026-000200', client: 'Rajesh Patel', company: 'ABC Industries Pvt. Ltd.', category: 'Drinking Water', date: '2026-01-02', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000199', client: 'Vikram Solanki', company: 'UltraTech Cement Ltd.', category: 'Ground Water', date: '2026-03-19', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000198', client: 'Sunita Sharma', company: 'Amul Industries', category: 'Food', date: '2026-05-12', priority: 'Normal', progress: 100, status: 'Completed' },
  { id: 'TR-2026-000197', client: 'Prashant Sarvaiya', company: 'Jagnath Labs', category: 'Soil', date: '2026-07-10', priority: 'High', progress: 95, status: 'In Progress' },
  { id: 'TR-2026-000196', client: 'Harsh Mehta', company: 'Tata Chemicals Ltd.', category: 'Waste Water', date: '2026-01-14', priority: 'Normal', progress: 100, status: 'Completed' }
];

const Dashboard = ({ onNavigate }) => {
  // Navigation active tab mock state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState(INITIAL_MOCK_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  // GSAP Refs
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const metricsRef = useRef([]);
  const monthlyChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const requestsRef = useRef(null);
  const sidePanelRef = useRef(null);
  const quickActionsRef = useRef(null);

  // Chart data and references for animation
  const gridLineCount = 5;
  const monthlyData = [
    { month: 'Jan', received: 110, completed: 85 },
    { month: 'Feb', received: 130, completed: 90 },
    { month: 'Mar', received: 120, completed: 95 },
    { month: 'Apr', received: 150, completed: 110 },
    { month: 'May', received: 140, completed: 105 },
    { month: 'Jun', received: 180, completed: 130 },
    { month: 'Jul', received: 170, completed: 140 },
    { month: 'Aug', received: 210, completed: 160 },
    { month: 'Sep', received: 200, completed: 155 },
    { month: 'Oct', received: 230, completed: 175 },
    { month: 'Nov', received: 220, completed: 185 },
    { month: 'Dec', received: 250, completed: 210 }
  ];

  // SVG Chart Viewbox Dimensions
  const viewWidth = 600;
  const viewHeight = 220;
  const chartPadding = { top: 20, right: 30, bottom: 30, left: 40 };
  const graphWidth = viewWidth - chartPadding.left - chartPadding.right;
  const graphHeight = viewHeight - chartPadding.top - chartPadding.bottom;

  // Max value for charting scales
  const maxValue = 300;

  // Calculate SVG Coordinates helper
  const getX = (index) => chartPadding.left + (index * (graphWidth / (monthlyData.length - 1)));
  const getY = (val) => chartPadding.top + graphHeight - (val * (graphHeight / maxValue));

  // Generate SVG Line Path
  const linePathData = monthlyData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.completed)}`)
    .join(' ');

  // Generate SVG Area Path under Line
  const areaPathData = `
    ${linePathData} 
    L ${getX(monthlyData.length - 1)} ${chartPadding.top + graphHeight} 
    L ${getX(0)} ${chartPadding.top + graphHeight} Z
  `;

  // Categories Donut Data
  const categoriesData = [
    { name: 'Soil', value: 16, percentage: 32, color: '#3B82F6', offset: 0 },
    { name: 'Drinking Water', value: 12, percentage: 24, color: '#87CEEB', offset: 32 },
    { name: 'Surface Water', value: 8, percentage: 16, color: '#A855F7', offset: 56 },
    { name: 'Ground Water', value: 8, percentage: 16, color: '#F59E0B', offset: 72 },
    { name: 'Waste Water', value: 4, percentage: 12, color: '#50C878', offset: 88 }
  ];

  // Total samples
  const totalSamples = 50;

  // GSAP Entrance Animations
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    // 1. Sidebar slide-in (only if sidebar exists)
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current, 
        { x: -260, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // 2. Header fade-in (only if header exists)
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'power3.out' }
      );
    }

    // 3. Stagger metric card slides
    if (metricsRef.current && metricsRef.current.length > 0 && metricsRef.current.some(Boolean)) {
      gsap.fromTo(metricsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power3.out' }
      );
    }

    // 4. Stagger chart section loads
    if (monthlyChartRef.current && donutChartRef.current) {
      gsap.fromTo([monthlyChartRef.current, donutChartRef.current],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, delay: 0.5, ease: 'power3.out' }
      );
    }

    // 5. Stagger double-column logs and quick actions
    if (requestsRef.current && sidePanelRef.current && quickActionsRef.current) {
      gsap.fromTo([requestsRef.current, sidePanelRef.current, quickActionsRef.current],
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, delay: 0.7, ease: 'power3.out' }
      );
    }

    // 6. SVG Chart drawing animations via clipPaths
    gsap.fromTo('#monthly-grid-clip rect',
      { width: 0 },
      { width: viewWidth, duration: 1.2, delay: 0.8, ease: 'power2.inOut' }
    );

    // Donut stroke animations
    categoriesData.forEach((_, index) => {
      const ring = document.querySelector(`.donut-ring-${index}`);
      if (ring) {
        const strokeLength = parseFloat(ring.getAttribute('stroke-dasharray'));
        gsap.fromTo(ring,
          { strokeDashoffset: strokeLength },
          { strokeDashoffset: strokeLength * (1 - categoriesData[index].percentage / 100), duration: 1.2, delay: 0.9, ease: 'power3.out' }
        );
      }
    });

    // Count Up Animations for Metric Cards
    const countConfigs = [
      { id: '#count-requests', target: 1248, suffix: '' },
      { id: '#count-pending', target: 45, suffix: '' },
      { id: '#count-completed', target: 980, suffix: '' },
      { id: '#count-rejection', target: 1.2, suffix: '%', decimals: 1 }
    ];

    countConfigs.forEach((cfg) => {
      const el = document.querySelector(cfg.id);
      if (el) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: cfg.target,
          duration: 1.5,
          delay: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = (cfg.decimals ? obj.val.toFixed(cfg.decimals) : Math.floor(obj.val)) + cfg.suffix;
          }
        });
      }
    });

    // Donut Sample count up
    const donutEl = document.querySelector('#donut-samples-counter');
    if (donutEl) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: totalSamples,
        duration: 1.5,
        delay: 0.7,
        ease: 'power3.out',
        onUpdate: () => {
          donutEl.textContent = Math.floor(obj.val);
        }
      });
    }

  }, [activeTab]);

  // Notifications bell alert trigger
  const triggerNotification = () => {
    setShowNotificationAlert(true);
    setTimeout(() => {
      setShowNotificationAlert(false);
    }, 3000);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Sidebar Menu Component */}
      <aside ref={sidebarRef} className="dashboard-sidebar">
        <div className="sidebar-nav-container">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <FaFlask />
            </div>
            <div className="brand-text">
              <span className="brand-title">Jagnath Lab</span>
              <span className="brand-subtitle">TECHNOLOGIES - LIMS</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <div className="menu-group">
              <div className="menu-label">Overview</div>
              <div 
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="menu-item-left">
                  <FaChartPie className="menu-icon" />
                  <span>Dashboard</span>
                </div>
              </div>
            </div>

            <div className="menu-group">
              <div className="menu-label">Workflow</div>
              <div 
                className={`menu-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <div className="menu-item-left">
                  <FaClipboardList className="menu-icon" />
                  <span>Test Requests</span>
                </div>
                <span className="badge-count">50</span>
              </div>
              <div 
                className={`menu-item ${activeTab === 'new-request' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('new-request');
                }}
              >
                <div className="menu-item-left">
                  <FaPlus className="menu-icon" />
                  <span>New Request</span>
                </div>
              </div>
            </div>

            <div className="menu-group">
              <div className="menu-label">Masters</div>
              {['Companies', 'Clients', 'Categories', 'Parameters'].map((name) => {
                const tabKey = name.toLowerCase();
                const iconMap = {
                  companies: <FaBuilding className="menu-icon" />,
                  clients: <FaUserFriends className="menu-icon" />,
                  categories: <FaTags className="menu-icon" />,
                  parameters: <FaSlidersH className="menu-icon" />
                };
                return (
                  <div 
                    key={name}
                    className={`menu-item ${activeTab === tabKey ? 'active' : ''}`}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <div className="menu-item-left">
                      {iconMap[tabKey]}
                      <span>{name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="menu-group">
              <div className="menu-label">Reports</div>
              {['Reports', 'Invoices', 'Dispatch', 'Settings'].map((name) => {
                const tabKey = name.toLowerCase();
                const iconMap = {
                  reports: <FaFileAlt className="menu-icon" />,
                  invoices: <FaFileInvoiceDollar className="menu-icon" />,
                  dispatch: <FaTruck className="menu-icon" />,
                  settings: <FaCog className="menu-icon" />
                };
                return (
                  <div 
                    key={name}
                    className={`menu-item ${activeTab === tabKey ? 'active' : ''}`}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <div className="menu-item-left">
                      {iconMap[tabKey]}
                      <span>{name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        {/* User profile with Sign Out */}
        <div className="sidebar-profile">
          <div className="profile-left">
            <div className="profile-avatar">SV</div>
            <div className="profile-info">
              <span className="profile-name">Dr. Sanjay Vora</span>
              <span className="profile-role">Lab Administrator</span>
            </div>
          </div>
          <button 
            className="profile-logout-btn" 
            onClick={() => onNavigate && onNavigate('landing')}
            title="Log Out"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </aside>

      {/* 2. Main Dashboard Panel */}
      <main className="dashboard-main">
        {/* Header */}
        <header ref={headerRef} className="dashboard-header">
          <div className="header-title-area">
            <h1 className="dashboard-heading">
              {activeTab === 'requests' ? 'Test Requests' : 
               activeTab === 'new-request' ? 'Test Requests' : 
               activeTab === 'companies' ? 'Company Master' : 
               activeTab === 'new-company' ? 'Company Master' : 
               activeTab === 'clients' ? 'Client Master' : 
               activeTab === 'new-client' ? 'Client Master' : 
               activeTab === 'categories' ? 'Category & Parameter Master' : 
               activeTab === 'parameters' ? 'Parameter Master' : 
               activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="dashboard-subheading">
              {activeTab === 'dashboard' ? 'Overview of lab operations' : 
               activeTab === 'requests' ? 'Workflow / Test Requests' : 
               activeTab === 'new-request' ? 'Workflow / Test Requests' : 
               activeTab === 'companies' ? 'Masters / Companies' : 
               activeTab === 'new-company' ? 'Masters / Companies' : 
               activeTab === 'clients' ? 'Masters / Clients' : 
               activeTab === 'new-client' ? 'Masters / Clients' : 
               activeTab === 'categories' ? 'Masters / Categories' : 
               activeTab === 'parameters' ? 'Masters / Parameters' : 
               `Manage ${activeTab}`}
            </p>
          </div>

          <div className="header-actions">
            {/* Search Bar */}
            <div className="search-bar-wrapper">
              <FaSearch className="search-bar-icon" />
              <input 
                type="text" 
                className="search-bar-input" 
                placeholder="Search requests, clients, TR number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notification bell */}
            <button className="notification-bell-btn" onClick={triggerNotification}>
              <FaBell />
              <span className="bell-badge"></span>
            </button>

            {/* CTA action */}
            <button className="header-btn" onClick={() => setActiveTab('new-request')}>
              <FaPlus />
              <span>New Request</span>
            </button>
          </div>
        </header>

        {showNotificationAlert && (
          <div className="form-alert form-alert-success animate-fadeIn" style={{ marginBottom: 0 }}>
            <span>Demo Triggered: action has been captured!</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* 3. Metrics Row Cards */}
            <section className="metrics-grid">
              {[
                { label: 'Total Requests', id: 'count-requests', trend: '+12.4%', up: true, foot: 'vs yesterday', color: 'var(--primary)' },
                { label: 'Pending Verification', id: 'count-pending', trend: '-4.2%', up: true, foot: 'awaiting approval', color: '#F59E0B' },
                { label: 'Completed Tests', id: 'count-completed', trend: '+8.1%', up: true, foot: 'this month', color: 'var(--secondary)' },
                { label: 'Rejection Rate', id: 'count-rejection', trend: '+18.2%', up: false, foot: 'average 1.5%', color: '#EF4444' }
              ].map((item, idx) => (
                <div 
                  key={item.label}
                  ref={(el) => (metricsRef.current[idx] = el)}
                  className="metric-card"
                >
                  <div className="metric-card-header">
                    <span className="metric-label">{item.label}</span>
                    <span className={`metric-trend ${item.up ? 'up' : 'down'}`}>
                      {item.up ? <FaArrowUp /> : <FaArrowDown />}
                      {item.trend}
                    </span>
                  </div>
                  <span className="metric-val" id={item.id}>0</span>
                  <span className="metric-footer">{item.foot}</span>
                  <div className="metric-card-accent" style={{ backgroundColor: item.color }}></div>
                </div>
              ))}
            </section>

            {/* 4. Charts Section */}
            <section className="charts-grid">
              {/* Monthly Trend Chart */}
              <div ref={monthlyChartRef} className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h3 className="chart-title">Monthly Sample Trend</h3>
                    <p className="chart-subtitle">Samples received vs. tests completed</p>
                  </div>
                  <span className="chart-filter-pill">2026 YTD</span>
                </div>

                <div className="chart-body">
                  <svg className="chart-svg-container" viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none">
                    <defs>
                      {/* Gradients */}
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--secondary-light)" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.15" />
                      </linearGradient>
                      
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity="0" />
                      </linearGradient>

                      {/* Clip Path for Entrance Animation */}
                      <clipPath id="monthly-grid-clip">
                        <rect x="0" y="0" width="0" height={viewHeight} />
                      </clipPath>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {Array.from({ length: gridLineCount }).map((_, i) => {
                      const yVal = chartPadding.top + (i * (graphHeight / (gridLineCount - 1)));
                      return (
                        <line 
                          key={i} 
                          x1={chartPadding.left} 
                          y1={yVal} 
                          x2={viewWidth - chartPadding.right} 
                          y2={yVal} 
                          className="chart-grid-line"
                        />
                      );
                    })}

                    {/* Group containing clipping animation */}
                    <g clipPath="url(#monthly-grid-clip)">
                      {/* Bars Series: Samples Received */}
                      {monthlyData.map((d, i) => {
                        const barWidth = 14;
                        const xCoord = getX(i) - (barWidth / 2);
                        const yCoord = getY(d.received);
                        const barHeight = chartPadding.top + graphHeight - yCoord;
                        return (
                          <rect
                            key={i}
                            x={xCoord}
                            y={yCoord}
                            width={barWidth}
                            height={barHeight}
                            rx="3"
                            fill="url(#barGradient)"
                            className="chart-bar-rect"
                          />
                        );
                      })}

                      {/* Gradient Area under line */}
                      <path d={areaPathData} fill="url(#lineGrad)" />

                      {/* Line Series: Tests Completed */}
                      <path d={linePathData} className="chart-trend-line" />

                      {/* Dots on line intersections */}
                      {monthlyData.map((d, i) => (
                        <circle
                          key={i}
                          cx={getX(i)}
                          cy={getY(d.completed)}
                          r="4"
                          className="chart-line-point"
                          title={`${d.month}: ${d.completed} completed`}
                        />
                      ))}
                    </g>

                    {/* X Axis Labels */}
                    {monthlyData.map((d, i) => (
                      <text
                        key={i}
                        x={getX(i)}
                        y={viewHeight - 8}
                        textAnchor="middle"
                        fill="var(--text-light)"
                        fontSize="9px"
                        fontWeight="600"
                        fontFamily="var(--font-body)"
                      >
                        {d.month}
                      </text>
                    ))}
                  </svg>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: 'var(--secondary-light)' }}></span>
                    <span>Samples received</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: 'var(--primary-dark)' }}></span>
                    <span>Tests completed</span>
                  </div>
                </div>
              </div>

              {/* Top Categories Chart */}
              <div ref={donutChartRef} className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h3 className="chart-title">Top Categories</h3>
                    <p className="chart-subtitle">By request volume</p>
                  </div>
                </div>

                <div className="chart-body">
                  <div className="donut-chart-wrapper">
                    {/* SVG Donut */}
                    <div className="donut-svg-wrapper">
                      <svg width="100%" height="100%" viewBox="0 0 160 160">
                        <circle 
                          cx="80" 
                          cy="80" 
                          r="65" 
                          fill="none" 
                          stroke="#E2E8F0" 
                          strokeWidth="15" 
                        />
                        {categoriesData.map((cat, idx) => {
                          const radius = 65;
                          const circumference = 2 * Math.PI * radius; // 408.4
                          const strokeDash = circumference;
                          const strokeOffset = strokeDash * (1 - cat.percentage / 100);
                          const rotation = (cat.offset / 100) * 360 - 90; // start top-90deg

                          return (
                            <circle
                              key={cat.name}
                              cx="80"
                              cy="80"
                              r={radius}
                              fill="none"
                              stroke={cat.color}
                              strokeWidth="16"
                              strokeDasharray={strokeDash}
                              strokeDashoffset={strokeDash} // Will animate in
                              transform={`rotate(${rotation} 80 80)`}
                              className={`donut-ring-${idx}`}
                              strokeLinecap="round"
                            />
                          );
                        })}
                      </svg>
                      <div className="donut-text-center">
                        <span className="donut-val" id="donut-samples-counter">0</span>
                        <span className="donut-label">samples</span>
                      </div>
                    </div>

                    {/* Donut Legend Lists */}
                    <div className="donut-legend-list">
                      {categoriesData.map((cat) => (
                        <div key={cat.name} className="donut-legend-item">
                          <div className="donut-legend-left">
                            <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                            <span>{cat.name}</span>
                          </div>
                          <span className="donut-legend-val">{cat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Logs Grid Column Layout */}
            <section className="data-grid-section">
              {/* Left Column: Recent Intake activity */}
              <div ref={requestsRef} className="data-card">
                <div className="data-header">
                  <div className="data-title-area">
                    <h3 className="data-title">Recent Test Requests</h3>
                    <p className="data-subtitle">Latest intake activity</p>
                  </div>
                  <a href="#requests" className="data-header-link" onClick={(e) => { e.preventDefault(); setActiveTab('requests'); }}>
                    View all <FaChevronRight style={{ fontSize: '0.7rem' }} />
                  </a>
                </div>

                <div className="requests-list">
                  {[
                    { tr: 'TR-2026-000245', cat: 'Soil', comp: 'UltraTech Cement Ltd.', badge: 'UC', color: '#10B981', status: 'In Progress', cls: 'in-progress' },
                    { tr: 'TR-2026-000244', cat: 'Drinking Water', comp: 'Tata Chemicals Ltd.', badge: 'TC', color: '#0EA5E9', status: 'Pending Testing', cls: 'pending-testing' },
                    { tr: 'TR-2026-000243', cat: 'Waste Water', comp: 'ABC Industries Pvt. Ltd.', badge: 'AI', color: '#6366F1', status: 'In Progress', cls: 'in-progress' },
                    { tr: 'TR-2026-000242', cat: 'Drinking Water', comp: 'Jagnath Municipal Corp.', badge: 'JM', color: '#EC4899', status: 'In Progress', cls: 'in-progress' },
                    { tr: 'TR-2026-000241', cat: 'Surface Water', comp: 'ABC Industries Pvt. Ltd.', badge: 'AI', color: '#F43F5E', status: 'Pending Testing', cls: 'pending-testing' },
                    { tr: 'TR-2026-000240', cat: 'Ground Water', comp: 'Tata Chemicals Ltd.', badge: 'TC', color: '#10B981', status: 'In Progress', cls: 'in-progress' }
                  ].map((row) => (
                    <div key={row.tr} className="request-row">
                      <div className="request-info">
                        <div className="request-badge-avatar" style={{ backgroundColor: row.color }}>
                          {row.badge}
                        </div>
                        <div className="request-details">
                          <span className="request-id-cat">{row.tr}<span>• {row.cat}</span></span>
                          <span className="request-company">{row.comp}</span>
                        </div>
                      </div>
                      <span className={`request-status-badge ${row.cls}`}>
                        <span className="status-dot"></span>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Approvals and Timelines */}
              <div ref={sidePanelRef} className="side-card-split">
                {/* Pending Approvals */}
                <div className="data-card">
                  <div className="data-header">
                    <div className="data-title-area">
                      <h3 className="data-title">Pending Approvals</h3>
                      <p className="data-subtitle">Awaiting verification</p>
                    </div>
                  </div>

                  <div className="approvals-list">
                    {[
                      { tr: 'TR-2026-000238', meta: 'Rajesh Patel • 3 params' },
                      { tr: 'TR-2026-000234', meta: 'Vikram Solanki • 4 params' },
                      { tr: 'TR-2026-000232', meta: 'Ketan Desai • 5 params' },
                      { tr: 'TR-2026-000231', meta: 'Ketan Desai • 3 params' }
                    ].map((row) => (
                      <div key={row.tr} className="approval-row">
                        <div className="approval-info">
                          <div className="approval-icon-clock">
                            <FaRegClock />
                          </div>
                          <div className="approval-details">
                            <span className="approval-id">{row.tr}</span>
                            <span className="approval-meta">{row.meta}</span>
                          </div>
                        </div>
                        <button className="review-btn" onClick={() => setActiveTab('requests')}>
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="data-card">
                  <div className="data-header">
                    <div className="data-title-area">
                      <h3 className="data-title">Activity Timeline</h3>
                    </div>
                  </div>

                  <div className="timeline-list">
                    <div className="timeline-line"></div>
                    {[
                      { bold: 'Ritu Bhatt', text: ' completed testing for ', target: 'TR-2026-000242', time: '12 min ago' },
                      { bold: 'Report generated', text: ' for ', target: 'TR-2026-000239 — Drinking Water', time: '38 min ago' },
                      { bold: 'New sample collected', text: ' from ', target: 'Reliance Industries Ltd.', time: '1 hr ago' },
                      { bold: 'Harsh Mehta', text: ' verified results for 3 parameters', target: '', time: '2 hr ago' },
                      { bold: 'Invoice INV-2026-0118', text: ' marked overdue', target: '', time: '4 hr ago' },
                      { bold: 'Dispatch completed', text: ' for ', target: 'TR-2026-000228', time: 'Yesterday' }
                    ].map((item, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-node"></div>
                        <span className="timeline-desc">
                          <strong>{item.bold}</strong>{item.text}{item.target && <strong>{item.target}</strong>}
                        </span>
                        <span className="timeline-time">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Quick Actions Area */}
            <section ref={quickActionsRef}>
              <div className="data-title-area" style={{ marginBottom: '1.25rem' }}>
                <h3 className="data-title">Quick Actions</h3>
                <p className="data-subtitle">Jump straight into common workflows</p>
              </div>
              <div className="quick-actions-grid">
                {[
                  { title: 'New Test Request', sub: 'Start intake wizard', icon: <FaPlus />, bg: 'rgba(80, 200, 120, 0.1)', color: 'var(--secondary-dark)' },
                  { title: 'Add Company', sub: 'Register new client org', icon: <FaCompany />, bg: 'rgba(135, 206, 235, 0.18)', color: 'var(--primary-dark)' },
                  { title: 'Add Parameter', sub: 'Extend test catalog', icon: <FaFlask />, bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' },
                  { title: 'Generate Report', sub: 'Pick a completed request', icon: <FaFileAlt />, bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }
                ].map((act) => (
                  <div 
                    key={act.title} 
                    className="quick-action-card"
                    onClick={() => {
                      if (act.title === 'New Test Request') {
                        setActiveTab('new-request');
                      } else if (act.title === 'Add Company') {
                        setActiveTab('new-company');
                      } else if (act.title === 'Add Parameter') {
                        setActiveTab('new-parameter');
                      } else {
                        triggerNotification();
                      }
                    }}
                  >
                    <div className="action-icon-wrapper" style={{ backgroundColor: act.bg, color: act.color }}>
                      {act.icon}
                    </div>
                    <div className="action-details">
                      <span className="action-title">{act.title}</span>
                      <span className="action-subtitle">{act.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'requests' && (
          <TestRequestsList 
            triggerNotification={triggerNotification}
            requests={requests}
            setRequests={setRequests}
            onAddNewRequestClick={() => setActiveTab('new-request')}
          />
        )}

        {activeTab === 'new-request' && (
          <NewTestRequestWizard 
            requests={requests}
            onCancel={() => setActiveTab('requests')}
            onSubmitSuccess={(newRecord) => {
              setRequests([newRecord, ...requests]);
              triggerNotification();
              setActiveTab('requests');
            }}
          />
        )}

        {activeTab === 'companies' && (
          <Companies 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={false}
          />
        )}

        {activeTab === 'new-company' && (
          <Companies 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={true}
            onCloseAddDrawer={() => setActiveTab('companies')}
          />
        )}

        {activeTab === 'clients' && (
          <Clients 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={false}
          />
        )}

        {activeTab === 'new-client' && (
          <Clients 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={true}
            onCloseAddDrawer={() => setActiveTab('clients')}
          />
        )}

        {activeTab === 'categories' && (
          <Categories 
            triggerNotification={triggerNotification}
          />
        )}

        {activeTab === 'parameters' && (
          <Parameters 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={false}
          />
        )}

        {activeTab === 'new-parameter' && (
          <Parameters 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={true}
            onCloseAddDrawer={() => setActiveTab('parameters')}
          />
        )}

        {activeTab !== 'dashboard' && activeTab !== 'requests' && activeTab !== 'new-request' && activeTab !== 'companies' && activeTab !== 'new-company' && activeTab !== 'clients' && activeTab !== 'new-client' && activeTab !== 'categories' && activeTab !== 'parameters' && activeTab !== 'new-parameter' && (
          <div className="data-card" style={{ padding: '3rem', textAlign: 'center', margin: '2rem 0' }}>
            <h3 className="data-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Under Construction</h3>
            <p className="data-subtitle" style={{ fontSize: '0.9rem' }}>The tab "{activeTab.toUpperCase()}" is currently under construction. Please check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
