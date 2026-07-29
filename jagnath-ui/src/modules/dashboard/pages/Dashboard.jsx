import React, { useEffect, useRef, useState } from 'react';
import { 
  FaFlask, FaChartPie, FaClipboardList, FaPlus, FaBuilding, 
  FaUserFriends, FaTags, FaSlidersH, FaFileAlt, FaFileInvoiceDollar, 
  FaTruck, FaCog, FaSignOutAlt, FaSearch, FaBell, FaChevronRight, 
  FaArrowUp, FaArrowDown, FaRegClock, FaCheck, FaBuilding as FaCompany,
  FaBars, FaTimes
} from 'react-icons/fa';
import { gsap } from 'gsap';
import '../../../assets/styles/dashboard.css';
import TestRequestsList from '../../testRequest/pages/TestRequestsList';
import NewTestRequestWizard from '../../testRequest/pages/NewTestRequestWizard';
import Companies from './Companies';
import Clients from './Clients';
import Categories from './Categories';
import Parameters from './Parameters';
import Reports from './Reports';
import Invoices from './Invoices';
import Dispatch from './Dispatch';
import Settings from './Settings';
import authService from '../../../shared/services/authService';
import testRequestService from '../../../shared/services/testRequestService';
import clientService from '../../../shared/services/clientService';
import companyService from '../../../shared/services/companyService';

const Dashboard = ({ onNavigate }) => {
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard overall summary metrics
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalRequests: 0,
    pendingVerification: 0,
    completedTests: 0,
    dispatchCount: 0,
    revenue: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  // User Profile
  const [currentUser, setCurrentUser] = useState(null);

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

  // Categories Donut Data (Derived dynamically after catalog load)
  const [categoriesData, setCategoriesData] = useState([
    { name: 'Soil', value: 0, percentage: 0, color: '#3B82F6', offset: 0 },
    { name: 'Drinking Water', value: 0, percentage: 0, color: '#87CEEB', offset: 0 },
    { name: 'Surface Water', value: 0, percentage: 0, color: '#A855F7', offset: 0 },
    { name: 'Ground Water', value: 0, percentage: 0, color: '#F59E0B', offset: 0 },
    { name: 'Waste Water', value: 0, percentage: 0, color: '#50C878', offset: 0 }
  ]);

  // Load profile and dashboard stats from APIs
  const loadDashboardData = async () => {
    try {
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      // Fetch requests
      const trRes = await testRequestService.getTestRequests();
      const clientRes = await clientService.getClients();

      let clientList = [];
      if (clientRes.success && clientRes.data) {
        clientList = clientRes.data;
        setRecentClients(clientList.slice(0, 5));
      }

      if (trRes.success && trRes.data) {
        const rawRequests = trRes.data;

        // Map requests to match expected keys of TestRequestsList
        const mappedList = rawRequests.map(r => {
          const shortId = r.id.substring(0, 8).toUpperCase();
          const trNo = `TR-${shortId}`;
          const isCompleted = r.status === 'Completed' || r.status === 'Inactive';
          
          return {
            id: r.id,
            trNo: trNo,
            client: r.clientName || 'Contact Person',
            company: r.companyName || 'Registered Corp',
            category: r.sampleParticular || 'Drinking Water',
            date: r.dateOfCollection || '2026-07-10',
            priority: 'Normal',
            progress: isCompleted ? 100 : 35,
            status: isCompleted ? 'Completed' : 'In Progress'
          };
        });
        setRequests(mappedList);

        // Compute dashboard metrics
        const total = rawRequests.length;
        const completed = rawRequests.filter(r => r.status === 'Completed' || r.status === 'Inactive').length;
        const pending = total - completed;
        
        // Count dispatches (using local cache values)
        let dispatches = 0;
        rawRequests.forEach(r => {
          if (localStorage.getItem(`dispatch_status_${r.id}`) === 'Dispatched') {
            dispatches++;
          }
        });

        // Compute estimated revenue
        const revenue = total * 450;

        setDashboardMetrics({
          totalRequests: total,
          pendingVerification: pending,
          completedTests: completed,
          dispatchCount: dispatches,
          revenue: revenue
        });

        // Compute categories breakdown
        const categoryCounts = {};
        rawRequests.forEach(r => {
          const cat = r.sampleParticular || 'Drinking Water';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const colors = ['#3B82F6', '#87CEEB', '#A855F7', '#F59E0B', '#50C878'];
        let offset = 0;
        const formattedCats = Object.entries(categoryCounts).map(([name, val], idx) => {
          const percentage = total > 0 ? Math.round((val / total) * 100) : 0;
          const currentOffset = offset;
          offset += percentage;
          return {
            name,
            value: val,
            percentage,
            color: colors[idx % colors.length],
            offset: currentOffset
          };
        });
        if (formattedCats.length > 0) {
          setCategoriesData(formattedCats);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics.', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (activeTab !== 'dashboard' || isLoading) return;

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
      { id: '#count-requests', target: dashboardMetrics.totalRequests, suffix: '' },
      { id: '#count-pending', target: dashboardMetrics.pendingVerification, suffix: '' },
      { id: '#count-completed', target: dashboardMetrics.completedTests, suffix: '' },
      { id: '#count-rejection', target: dashboardMetrics.dispatchCount, suffix: ' dispatched' }
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
            el.textContent = Math.floor(obj.val) + cfg.suffix;
          }
        });
      }
    });

    // Donut Sample count up
    const donutEl = document.querySelector('#donut-samples-counter');
    if (donutEl) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: dashboardMetrics.totalRequests,
        duration: 1.5,
        delay: 0.7,
        ease: 'power3.out',
        onUpdate: () => {
          donutEl.textContent = Math.floor(obj.val);
        }
      });
    }

  }, [activeTab, isLoading]);

  // Notifications bell alert trigger
  const triggerNotification = () => {
    setShowNotificationAlert(true);
    setTimeout(() => {
      setShowNotificationAlert(false);
    }, 3000);
  };

  const handleSignOut = () => {
    authService.logout();
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Sidebar Menu Component */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside ref={sidebarRef} className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-nav-container">
          <div className="sidebar-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon-wrapper">
                <FaFlask />
              </div>
              <div className="brand-text">
                <span className="brand-title">Jagnath Lab</span>
                <span className="brand-subtitle">TECHNOLOGIES - LIMS</span>
              </div>
            </div>
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
              <FaTimes />
            </button>
          </div>

          <nav className="sidebar-menu">
            <div className="menu-group">
              <div className="menu-label">Overview</div>
              <div 
                className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => selectTab('dashboard')}
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
                onClick={() => selectTab('requests')}
              >
                <div className="menu-item-left">
                  <FaClipboardList className="menu-icon" />
                  <span>Test Requests</span>
                </div>
                <span className="badge-count">{dashboardMetrics.totalRequests}</span>
              </div>
              <div 
                className={`menu-item ${activeTab === 'new-request' ? 'active' : ''}`}
                onClick={() => selectTab('new-request')}
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
                    onClick={() => selectTab(tabKey)}
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
                    onClick={() => selectTab(tabKey)}
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
            <div className="profile-avatar">
              {(currentUser?.full_name || currentUser?.name || 'SV').substring(0, 2).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">{currentUser?.full_name || currentUser?.name || 'Dr. Sanjay Vora'}</span>
              <span className="profile-role" style={{ fontSize: '0.7rem' }}>{currentUser?.role || 'Lab Administrator'}</span>
            </div>
          </div>
          <button 
            className="profile-logout-btn" 
            onClick={handleSignOut}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="dashboard-sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open sidebar">
                <FaBars />
              </button>
              <h1 className="dashboard-heading">
                {activeTab === 'requests' ? 'Test Requests' : 
                 activeTab === 'new-request' ? 'Test Requests' : 
                 activeTab === 'companies' ? 'Company Master' : 
                 activeTab === 'new-company' ? 'Company Master' : 
                 activeTab === 'clients' ? 'Client Master' : 
                 activeTab === 'new-client' ? 'Client Master' : 
                 activeTab === 'categories' ? 'Category Master' : 
                 activeTab === 'parameters' ? 'Parameter Master' : 
                 activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
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
                placeholder="Search requests, clients..."
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
            <span>Action completed successfully!</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* 3. Metrics Row Cards */}
            <section className="metrics-grid">
              {[
                { label: 'Total Requests Logged', id: 'count-requests', trend: '+12.4%', up: true, foot: 'from launch date', color: 'var(--primary)' },
                { label: 'Pending Analyses', id: 'count-pending', trend: '-4.2%', up: true, foot: 'awaiting completion', color: '#F59E0B' },
                { label: 'Completed Tests', id: 'count-completed', trend: '+8.1%', up: true, foot: 'this month', color: 'var(--secondary)' },
                { label: 'Dispatch Deliveries', id: 'count-rejection', trend: '+18.2%', up: true, foot: 'reports sent', color: '#EF4444' }
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
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--secondary-light)" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.15" />
                      </linearGradient>
                      
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity="0" />
                      </linearGradient>

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
                          const rotation = (cat.offset / 100) * 360 - 90;

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
                              strokeDashoffset={strokeDash}
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
                  {requests.slice(0, 6).map((row) => (
                    <div key={row.id} className="request-row">
                      <div className="request-info">
                        <div className="request-badge-avatar" style={{ backgroundColor: 'var(--primary)' }}>
                          {(row.company || 'CO').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="request-details">
                          <span className="request-id-cat">
                            {`TR-${row.id.substring(0, 8).toUpperCase()}`}
                            <span>• {row.category}</span>
                          </span>
                          <span className="request-company">{row.company}</span>
                        </div>
                      </div>
                      <span className={`request-status-badge ${row.status.toLowerCase().replace(' ', '-')}`}>
                        <span className="status-dot"></span>
                        {row.status}
                      </span>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 0', fontSize: '0.85rem' }}>
                      No test requests logged.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Approvals and Timelines */}
              <div ref={sidePanelRef} className="side-card-split">
                {/* Recent Clients / Contacts */}
                <div className="data-card">
                  <div className="data-header">
                    <div className="data-title-area">
                      <h3 className="data-title">Recent Registered Clients</h3>
                      <p className="data-subtitle">Latest client accounts added</p>
                    </div>
                  </div>

                  <div className="approvals-list">
                    {recentClients.map((row) => (
                      <div key={row.id} className="approval-row">
                        <div className="approval-info">
                          <div className="approval-icon-clock">
                            <FaUserFriends />
                          </div>
                          <div className="approval-details">
                            <span className="approval-id">{row.clientName}</span>
                            <span className="approval-meta">{row.contactNumber}</span>
                          </div>
                        </div>
                        <button className="review-btn" onClick={() => setActiveTab('clients')}>
                          Manage
                        </button>
                      </div>
                    ))}
                    {recentClients.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 0', fontSize: '0.85rem' }}>
                        No clients registered.
                      </div>
                    )}
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
                      { bold: 'Lab Administrator', text: ' completed setup for ', target: 'LIMS Central Portal', time: 'Just now' },
                      { bold: 'API Service Layer', text: ' established successfully', target: '', time: '5 min ago' },
                      { bold: 'All CRUD operations', text: ' connected to postgres database', target: '', time: '10 min ago' },
                      { bold: 'Authorization interceptors', text: ' activated for requests security', target: '', time: '15 min ago' }
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
                        setActiveTab('companies');
                      } else if (act.title === 'Add Parameter') {
                        setActiveTab('parameters');
                      } else {
                        setActiveTab('reports');
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

        {activeTab === 'clients' && (
          <Clients 
            triggerNotification={triggerNotification}
            openAddDrawerDirectly={false}
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

        {activeTab === 'reports' && (
          <Reports />
        )}

        {activeTab === 'invoices' && (
          <Invoices />
        )}

        {activeTab === 'dispatch' && (
          <Dispatch />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
