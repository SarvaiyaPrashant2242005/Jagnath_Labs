import React, { useEffect, useRef, useState } from 'react';
import { 
  FaFlask, FaChartPie, FaClipboardList, FaPlus, FaBuilding, 
  FaUserFriends, FaTags, FaSlidersH, FaFileAlt, FaFileInvoiceDollar, 
  FaTruck, FaCog, FaSignOutAlt, FaSearch, FaBell, FaChevronRight, 
  FaArrowUp, FaArrowDown, FaRegClock, FaCheck, FaBuilding as FaCompany,
  FaArrowLeft
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

<<<<<<< HEAD
  const handleSignOut = () => {
    authService.logout();
  };
=======
  // 1. Companies Form
  const renderCompaniesForm = () => (
    <div className="lims-form-container">
      <h2 className="lims-form-title">Register New Client Company</h2>
      <form className="lims-form" onSubmit={(e) => { e.preventDefault(); triggerNotification(); }}>
        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Company Name *</label>
            <input type="text" placeholder="e.g. UltraTech Cement Ltd." className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Registration / Tax ID *</label>
            <input type="text" placeholder="e.g. GSTIN-24AAACU1234F" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Contact Person Name *</label>
            <input type="text" placeholder="e.g. Rajesh Patel" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Industry Type *</label>
            <select className="lims-form-select" required>
              <option value="">Select industry type</option>
              <option value="cement">Cement / Construction</option>
              <option value="chemicals">Chemicals & Pesticides</option>
              <option value="water">Municipal Water Supply</option>
              <option value="pharmaceuticals">Pharmaceuticals</option>
              <option value="diagnostics">Diagnostics & Medical</option>
              <option value="food">Food & Beverages</option>
            </select>
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Contact Email *</label>
            <input type="email" placeholder="e.g. contact@ultratech.com" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Contact Phone *</label>
            <input type="tel" placeholder="e.g. +91 98765 43210" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-group">
          <label className="lims-form-label">Billing Address *</label>
          <textarea placeholder="Enter complete business billing address..." className="lims-form-textarea" required></textarea>
        </div>

        <div className="lims-form-actions">
          <button type="submit" className="lims-form-btn-submit">Register Company</button>
          <button type="button" className="lims-form-btn-cancel" onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );

  // 2. Clients Form
  const renderClientsForm = () => (
    <div className="lims-form-container">
      <h2 className="lims-form-title">Add Client Representative</h2>
      <form className="lims-form" onSubmit={(e) => { e.preventDefault(); triggerNotification(); }}>
        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Full Name *</label>
            <input type="text" placeholder="e.g. Aarav Shah" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Designation / Role *</label>
            <input type="text" placeholder="e.g. Quality Assurance Lead" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Associated Company *</label>
            <select className="lims-form-select" required>
              <option value="">Select associated company</option>
              <option value="1">UltraTech Cement Ltd.</option>
              <option value="2">Tata Chemicals Ltd.</option>
              <option value="3">ABC Industries Pvt. Ltd.</option>
              <option value="4">Jagnath Municipal Corp.</option>
            </select>
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Status *</label>
            <select className="lims-form-select" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Email Address *</label>
            <input type="email" placeholder="e.g. aarav.shah@company.com" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Phone Number *</label>
            <input type="tel" placeholder="e.g. +91 91234 56789" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-actions">
          <button type="submit" className="lims-form-btn-submit">Add Client</button>
          <button type="button" className="lims-form-btn-cancel" onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );

  // 3. Categories Form
  const renderCategoriesForm = () => (
    <div className="lims-form-container">
      <h2 className="lims-form-title">Create Test Category</h2>
      <form className="lims-form" onSubmit={(e) => { e.preventDefault(); triggerNotification(); }}>
        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Category Name *</label>
            <input type="text" placeholder="e.g. Drinking Water" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Category Code *</label>
            <input type="text" placeholder="e.g. CAT-DW" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Laboratory Department *</label>
            <select className="lims-form-select" required>
              <option value="">Select department</option>
              <option value="microbiology">Microbiology Lab</option>
              <option value="chemical">Chemical Analysis Lab</option>
              <option value="heavy-metals">Heavy Metals Diagnostics</option>
              <option value="organic">Organic Compounds</option>
            </select>
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Status *</label>
            <select className="lims-form-select" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="lims-form-group">
          <label className="lims-form-label">Description / Scope *</label>
          <textarea placeholder="Describe the testing parameters and methodologies covered under this category..." className="lims-form-textarea" required></textarea>
        </div>

        <div className="lims-form-actions">
          <button type="submit" className="lims-form-btn-submit">Create Category</button>
          <button type="button" className="lims-form-btn-cancel" onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );

  // 4. Parameters Form
  const renderParametersForm = () => (
    <div className="lims-form-container">
      <h2 className="lims-form-title">Configure Testing Parameter</h2>
      <form className="lims-form" onSubmit={(e) => { e.preventDefault(); triggerNotification(); }}>
        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Parameter Name *</label>
            <input type="text" placeholder="e.g. pH Value" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Parameter Code / Symbol *</label>
            <input type="text" placeholder="e.g. PAR-PH" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Unit of Measure (UOM) *</label>
            <input type="text" placeholder="e.g. mg/L, ppm, pH Unit" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Test Category *</label>
            <select className="lims-form-select" required>
              <option value="">Select test category</option>
              <option value="soil">Soil</option>
              <option value="drinking-water">Drinking Water</option>
              <option value="waste-water">Waste Water</option>
              <option value="surface-water">Surface Water</option>
              <option value="ground-water">Ground Water</option>
            </select>
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Permissible Limit (Min) *</label>
            <input type="number" step="any" placeholder="e.g. 6.5" className="lims-form-input" required />
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Permissible Limit (Max) *</label>
            <input type="number" step="any" placeholder="e.g. 8.5" className="lims-form-input" required />
          </div>
        </div>

        <div className="lims-form-group">
          <label className="lims-form-label">Reference Testing Standard *</label>
          <input type="text" placeholder="e.g. IS 3025 (Part 11) : 1983" className="lims-form-input" required />
        </div>

        <div className="lims-form-actions">
          <button type="submit" className="lims-form-btn-submit">Add Parameter</button>
          <button type="button" className="lims-form-btn-cancel" onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );

  // 5. New Test Request Form
  const renderNewRequestForm = () => (
    <div className="lims-form-container">
      <h2 className="lims-form-title">Create New Laboratory Test Request</h2>
      <form className="lims-form" onSubmit={(e) => { e.preventDefault(); triggerNotification(); }}>
        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Select Company *</label>
            <select className="lims-form-select" required>
              <option value="">Select client company</option>
              <option value="ultratech">UltraTech Cement Ltd.</option>
              <option value="tata">Tata Chemicals Ltd.</option>
              <option value="abc">ABC Industries Pvt. Ltd.</option>
            </select>
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Client Representative *</label>
            <select className="lims-form-select" required>
              <option value="">Select contact representative</option>
              <option value="rajesh">Rajesh Patel</option>
              <option value="aarav">Aarav Shah</option>
              <option value="vikram">Vikram Solanki</option>
            </select>
          </div>
        </div>

        <div className="lims-form-grid-2col">
          <div className="lims-form-group">
            <label className="lims-form-label">Sample Category *</label>
            <select className="lims-form-select" required>
              <option value="">Select test category</option>
              <option value="soil">Soil</option>
              <option value="drinking-water">Drinking Water</option>
              <option value="waste-water">Waste Water</option>
              <option value="surface-water">Surface Water</option>
              <option value="ground-water">Ground Water</option>
            </select>
          </div>
          <div className="lims-form-group">
            <label className="lims-form-label">Collection Date *</label>
            <input type="date" className="lims-form-input" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        <div className="lims-form-group">
          <label className="lims-form-label">Parameters checklist (Select all applicable) *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {['pH Value', 'Turbidity', 'TDS (Total Dissolved Solids)', 'Fluoride Count', 'Chloride Count', 'Nitrate Level', 'Sulphate Level', 'Hardness (CaCO3)', 'Coliform Bacteria'].map((p) => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--primary)' }} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="lims-form-group">
          <label className="lims-form-label">Additional Instructions / Sample Condition</label>
          <textarea placeholder="e.g. Sample collected in sterile 1L container, refrigerated at 4°C during transport..." className="lims-form-textarea"></textarea>
        </div>

        <div className="lims-form-actions">
          <button type="submit" className="lims-form-btn-submit">Submit Request</button>
          <button type="button" className="lims-form-btn-cancel" onClick={() => setActiveTab('dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );
>>>>>>> origin/Jenil's_Dev

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
                <span className="badge-count">{dashboardMetrics.totalRequests}</span>
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
            <h1 className="dashboard-heading">
<<<<<<< HEAD
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
=======
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'new-request' && 'New Request'}
              {activeTab === 'companies' && 'Companies Master'}
              {activeTab === 'clients' && 'Clients Master'}
              {activeTab === 'categories' && 'Categories Master'}
              {activeTab === 'parameters' && 'Parameters Master'}
              {activeTab === 'requests' && 'Test Requests'}
              {activeTab === 'reports' && 'Reports'}
              {activeTab === 'invoices' && 'Invoices'}
              {activeTab === 'dispatch' && 'Dispatch'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <p className="dashboard-subheading">
              {activeTab === 'dashboard' && 'Overview of lab operations'}
              {activeTab === 'new-request' && 'Start a new test intake request'}
              {activeTab === 'companies' && 'Register and manage client companies'}
              {activeTab === 'clients' && 'Manage client contacts and representatives'}
              {activeTab === 'categories' && 'Manage diagnostic and testing categories'}
              {activeTab === 'parameters' && 'Configure chemical and physical analysis parameters'}
              {activeTab === 'requests' && 'Overview of test intake workflows'}
              {activeTab === 'reports' && 'Generate and manage pathology reports'}
              {activeTab === 'invoices' && 'Manage billing records and invoices'}
              {activeTab === 'dispatch' && 'Track physical and digital report dispatch'}
              {activeTab === 'settings' && 'Configure laboratory system preferences'}
>>>>>>> origin/Jenil's_Dev
            </p>
          </div>

          <div className="header-actions">
<<<<<<< HEAD
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
=======
            {activeTab === 'dashboard' ? (
              <>
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
>>>>>>> origin/Jenil's_Dev

                {/* Notification bell */}
                <button className="notification-bell-btn" onClick={triggerNotification}>
                  <FaBell />
                  <span className="bell-badge"></span>
                </button>

<<<<<<< HEAD
            {/* CTA action */}
            <button className="header-btn" onClick={() => setActiveTab('new-request')}>
              <FaPlus />
              <span>New Request</span>
            </button>
=======
                {/* CTA action */}
                <button className="header-btn" onClick={() => setActiveTab('new-request')}>
                  <FaPlus />
                  <span>New Request</span>
                </button>
              </>
            ) : (
              <button className="header-btn btn-secondary" onClick={() => setActiveTab('dashboard')} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </button>
            )}
>>>>>>> origin/Jenil's_Dev
          </div>
        </header>

        {showNotificationAlert && (
          <div className="form-alert form-alert-success animate-fadeIn" style={{ marginBottom: 0 }}>
            <span>Action completed successfully!</span>
          </div>
        )}

<<<<<<< HEAD
        {activeTab === 'dashboard' && (
=======
        {activeTab === 'dashboard' ? (
>>>>>>> origin/Jenil's_Dev
          <>
            {/* 3. Metrics Row Cards */}
            <section className="metrics-grid">
              {[
<<<<<<< HEAD
                { label: 'Total Requests Logged', id: 'count-requests', trend: '+12.4%', up: true, foot: 'from launch date', color: 'var(--primary)' },
                { label: 'Pending Analyses', id: 'count-pending', trend: '-4.2%', up: true, foot: 'awaiting completion', color: '#F59E0B' },
                { label: 'Completed Tests', id: 'count-completed', trend: '+8.1%', up: true, foot: 'this month', color: 'var(--secondary)' },
                { label: 'Dispatch Deliveries', id: 'count-rejection', trend: '+18.2%', up: true, foot: 'reports sent', color: '#EF4444' }
=======
                { label: 'Total Requests', id: 'count-requests', trend: '+12.4%', up: true, foot: 'vs yesterday', color: 'var(--primary)' },
                { label: 'Pending Verification', id: 'count-pending', trend: '-4.2%', up: true, foot: 'awaiting approval', color: '#F59E0B' },
                { label: 'Completed Tests', id: 'count-completed', trend: '+8.1%', up: true, foot: 'this month', color: 'var(--secondary)' },
                { label: 'Rejection Rate', id: 'count-rejection', trend: '+18.2%', up: false, foot: 'average 1.5%', color: '#EF4444' }
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
=======
                      {/* Gradients */}
>>>>>>> origin/Jenil's_Dev
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--secondary-light)" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.15" />
                      </linearGradient>
                      
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity="0" />
                      </linearGradient>

<<<<<<< HEAD
=======
                      {/* Clip Path for Entrance Animation */}
>>>>>>> origin/Jenil's_Dev
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

<<<<<<< HEAD
=======
                    {/* Group containing clipping animation */}
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
                          const circumference = 2 * Math.PI * radius; // 408.4
                          const strokeDash = circumference;
                          const strokeOffset = strokeDash * (1 - cat.percentage / 100);
=======
                          const circumference = 2 * Math.PI * radius;
                          const strokeDash = circumference;
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
                {/* Recent Clients / Contacts */}
                <div className="data-card">
                  <div className="data-header">
                    <div className="data-title-area">
                      <h3 className="data-title">Recent Registered Clients</h3>
                      <p className="data-subtitle">Latest client accounts added</p>
=======
                {/* Pending Approvals */}
                <div className="data-card">
                  <div className="data-header">
                    <div className="data-title-area">
                      <h3 className="data-title">Pending Approvals</h3>
                      <p className="data-subtitle">Awaiting verification</p>
>>>>>>> origin/Jenil's_Dev
                    </div>
                  </div>

                  <div className="approvals-list">
<<<<<<< HEAD
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
=======
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
                        <button className="review-btn" onClick={triggerNotification}>
                          Review
                        </button>
                      </div>
                    ))}
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
                      { bold: 'Lab Administrator', text: ' completed setup for ', target: 'LIMS Central Portal', time: 'Just now' },
                      { bold: 'API Service Layer', text: ' established successfully', target: '', time: '5 min ago' },
                      { bold: 'All CRUD operations', text: ' connected to postgres database', target: '', time: '10 min ago' },
                      { bold: 'Authorization interceptors', text: ' activated for requests security', target: '', time: '15 min ago' }
=======
                      { bold: 'Ritu Bhatt', text: ' completed testing for ', target: 'TR-2026-000242', time: '12 min ago' },
                      { bold: 'Report generated', text: ' for ', target: 'TR-2026-000239 — Drinking Water', time: '38 min ago' },
                      { bold: 'New sample collected', text: ' from ', target: 'Reliance Industries Ltd.', time: '1 hr ago' },
                      { bold: 'Harsh Mehta', text: ' verified results for 3 parameters', target: '', time: '2 hr ago' },
                      { bold: 'Invoice INV-2026-0118', text: ' marked overdue', target: '', time: '4 hr ago' },
                      { bold: 'Dispatch completed', text: ' for ', target: 'TR-2026-000228', time: 'Yesterday' }
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
                  { title: 'New Test Request', sub: 'Start intake wizard', icon: <FaPlus />, bg: 'rgba(80, 200, 120, 0.1)', color: 'var(--secondary-dark)' },
                  { title: 'Add Company', sub: 'Register new client org', icon: <FaCompany />, bg: 'rgba(135, 206, 235, 0.18)', color: 'var(--primary-dark)' },
                  { title: 'Add Parameter', sub: 'Extend test catalog', icon: <FaFlask />, bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' },
                  { title: 'Generate Report', sub: 'Pick a completed request', icon: <FaFileAlt />, bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }
=======
                  { title: 'New Test Request', sub: 'Start intake wizard', icon: <FaPlus />, bg: 'rgba(80, 200, 120, 0.1)', color: 'var(--secondary-dark)', action: 'new-request' },
                  { title: 'Add Company', sub: 'Register new client org', icon: <FaCompany />, bg: 'rgba(135, 206, 235, 0.18)', color: 'var(--primary-dark)', action: 'companies' },
                  { title: 'Add Parameter', sub: 'Extend test catalog', icon: <FaFlask />, bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', action: 'parameters' },
                  { title: 'Generate Report', sub: 'Pick a completed request', icon: <FaFileAlt />, bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', action: 'reports' }
>>>>>>> origin/Jenil's_Dev
                ].map((act) => (
                  <div 
                    key={act.title} 
                    className="quick-action-card"
                    onClick={() => {
<<<<<<< HEAD
                      if (act.title === 'New Test Request') {
                        setActiveTab('new-request');
                      } else if (act.title === 'Add Company') {
                        setActiveTab('companies');
                      } else if (act.title === 'Add Parameter') {
                        setActiveTab('parameters');
                      } else {
                        setActiveTab('reports');
=======
                      if (act.action === 'reports') {
                        triggerNotification();
                      } else {
                        setActiveTab(act.action);
>>>>>>> origin/Jenil's_Dev
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
<<<<<<< HEAD
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
=======
        ) : (
          <>
            {activeTab === 'companies' && renderCompaniesForm()}
            {activeTab === 'clients' && renderClientsForm()}
            {activeTab === 'categories' && renderCategoriesForm()}
            {activeTab === 'parameters' && renderParametersForm()}
            {activeTab === 'new-request' && renderNewRequestForm()}
            {['requests', 'reports', 'invoices', 'dispatch', 'settings'].includes(activeTab) && (
              <div className="lims-form-container" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>Under Construction</h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>The {activeTab} view design will be configured shortly in the master workflow module.</p>
                <button className="lims-form-btn-submit" onClick={() => setActiveTab('dashboard')}>Back to Dashboard</button>
              </div>
            )}
          </>
>>>>>>> origin/Jenil's_Dev
        )}
      </main>
    </div>
  );
};

export default Dashboard;
