/**
 * @file ProvisionalQuotationForm.jsx
 * @description Streamlined Provisional Estimated Quotation Builder with TRF Dropdown Auto-Fetch
 * and Side-by-Side Live A4 Print Preview.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaClipboardList, FaBuilding,
  FaFileInvoiceDollar, FaCar, FaUserTie, FaHotel, FaFlask,
  FaTable, FaGavel, FaSignature, FaStamp, FaUpload, FaTrash,
  FaPlus, FaCheckCircle, FaPercent, FaEye, FaCalculator, FaUndo
} from 'react-icons/fa';

import { apiService } from '../../../../shared/services/apiService';
import { TEST_REQUEST_ENDPOINTS, TEST_REQUEST_PARAMETER_ENDPOINTS } from '../../../../shared/services/apiEndpoints';

import {
  fetchMasterData,
  createInitialQuotation,
  saveQuotationSnapshot,
  getQuotationById,
  DEFAULT_INTRO_TEXT,
  DEFAULT_SCOPE_ITEMS,
  DEFAULT_TERMS_ITEMS,
  DEFAULT_ANNEXURE_A_ACTIVITIES,
  DEFAULT_ANNEXURE_B_GROUPS,
} from '../services/provisionalQuotationStorage.service';

import {
  calculateMainCharges,
  calculateAnnexureI,
  calculateAnnexureA,
  calculateTransport,
  calculateDA,
  calculateAccommodation,
  calculateSubtotal,
  calculateGST,
  calculateGrandTotal,
  generateAnnexureB,
  calculateGroupTotal,
  calculateAnnexureBTotal,
  mapTRFAnnexureToGroups,
  buildAnnexureBFromTRF,
  calculateActivity,
  calculateAnnexureARowCharge,
  calculateAnnexureATotals,
  syncAnnexureAFromAnnexureB,
  generateQuotationNumber,
  cleanQuotationNumber,
  getDepartmentCode,
  calculatePage2Charges,
  getNumberInWords,
} from '../utils/quotationCalculation.utils';


import '../styles/provisionalQuotation.css';
import '../styles/provisionalQuotationPrint.css';
import RichTextEditor from '../components/RichTextEditor';

const FINANCIAL_YEAR_OPTIONS = [
  'YEAR 2023-24',
  'YEAR 2024-25',
  'YEAR 2025-26',
  'YEAR 2026-27',
  'YEAR 2027-28',
  'YEAR 2028-29',
  'YEAR 2029-30',
  'YEAR 2030-31',
];

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${monthName} ${parseInt(day, 10)}, ${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDate = formatDisplayDate;

const getAuditReportTitle = (dept = 'ENVIRONMENTAL') => {
  const d = (dept || 'ENVIRONMENTAL').toUpperCase();
  if (d === 'ENVIRONMENTAL' || d === 'ENVIRONMENT') return 'Environment Audit Report charges';
  if (d === 'FOOD') return 'Food Audit Report charges';
  if (d === 'CHEMICAL') return 'Chemical Audit Report charges';
  const formatted = dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase();
  return `${formatted} Audit Report charges`;
};

const getPage2TableTitle = (dept = 'ENVIRONMENTAL') => {
  const d = (dept || 'ENVIRONMENTAL').toLowerCase().replace(/environmental/i, 'environment');
  return `Detail of Charges for carrying out ${d} audit as per GPCB`;
};

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const renderRichContent = (content) => {
  if (!content) return null;
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <div className="whitespace-pre-line">{content}</div>;
};

const getLogoUrl = (comp = {}) => {
  const logoPath = comp.quotationLogo || comp.quotation_logo || comp.logo;
  if (!logoPath) return '/Images/Navbar_Logo.png';
  const cleanPath = String(logoPath).replace(/\\/g, '/');
  const idx = cleanPath.lastIndexOf('uploads/');
  if (idx !== -1) {
    const backendRoot = import.meta.env.VITE_BACKEND_ROOT_URL || 'http://localhost:5000';
    return `${backendRoot}/${cleanPath.substring(idx)}`;
  }
  if (cleanPath.startsWith('file:') || cleanPath.startsWith('C:') || cleanPath.startsWith('D:')) {
    return '/Images/Navbar_Logo.png';
  }
  return logoPath;
};

const buildSubject = (dept = 'ENVIRONMENTAL', pcbId = '', finYear = 'YEAR 2025-26') => {
  const pcbClean = pcbId ? pcbId.replace(/^(PCBID-?\s*|\(|\)|\[|\])/gi, '').trim() : '';
  const pcbStr = pcbClean ? `(PCBID- ${pcbClean}) ` : '';
  const yrStr = finYear ? (finYear.startsWith('YEAR') ? finYear : `YEAR ${finYear}`) : 'YEAR 2025-26';
  return `PROVISIONAL ESTIMATED QUOTATION FOR CARRYING OUT ${dept.toUpperCase()} AUDIT OF YOUR UNIT ${pcbStr}FOR ${yrStr}.`;
};

const renderStandardPageFooter = (pageNum) => (
  <div className="doc-page-footer" style={{ marginTop: 'auto', paddingTop: '14px' }}>
    {/* Centered Slogan Above Divider Line */}
    <div style={{ textAlign: 'center', marginBottom: '3px' }}>
      <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', letterSpacing: '0.04em' }}>
        "NURTURING THE NATURE FOR HUMAN RACE"
      </span>
    </div>

    {/* Divider Line & Footer Details Below */}
    <div style={{ borderTop: '1.5px solid #0284c7', paddingTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', width: '50px' }}>
          Page {pageNum}
        </span>
        <div style={{ flexGrow: 1, textAlign: 'center', fontSize: '9.5px', color: '#1e293b', lineHeight: 1.4, marginRight: '50px' }}>
          <div>5-6/B, Nayanjyot chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist. – Rajkot (Guj.) +91 8140-555515</div>
          <div>
            Email: jagnathtechnologies@yahoo.com // <span style={{ color: '#0284c7', textDecoration: 'underline' }}>www.jagnath.com</span> // purvin@jagnath.com
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProvisionalQuotationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [activeFormTab, setActiveFormTab] = useState('general'); // 'general', 'logistics', 'sampling', 'terms'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Master Data
  const [masters, setMasters] = useState({
    clients: [],
    parameters: [],
    categories: [],
    subCategories: [],
    users: [],
    company: {},
    priceMasters: [],
    testRequests: [],
  });

  // Quotation State
  const [formData, setFormData] = useState({
    ...createInitialQuotation(),
    auditDepartment: 'ENVIRONMENTAL',
    pcbId: '',
    financialYear: 'YEAR 2025-26',
    subject: buildSubject('ENVIRONMENTAL', '', 'YEAR 2025-26'),
  });

  const sigInputRef = useRef();
  const stampInputRef = useRef();
  const stampInputRef2 = useRef();

  // Load masters & existing quotation
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const loadedMasters = await fetchMasterData();
        setMasters(loadedMasters);

        if (isEditing) {
          const existing = getQuotationById(id);
          if (existing) {
            setFormData({
              ...existing,
              auditDepartment: existing.auditDepartment || 'ENVIRONMENTAL',
              pcbId: existing.pcbId || '',
              financialYear: existing.financialYear || 'YEAR 2025-26',
              subject: existing.subject || buildSubject(existing.auditDepartment || 'ENVIRONMENTAL', existing.pcbId || '', existing.financialYear || 'YEAR 2025-26'),
            });
          } else {
            const initial = createInitialQuotation(loadedMasters.company);
            setFormData({
              ...initial,
              auditDepartment: 'ENVIRONMENTAL',
              pcbId: '',
              financialYear: 'YEAR 2025-26',
              subject: buildSubject('ENVIRONMENTAL', '', 'YEAR 2025-26'),
            });
          }
        } else {
          const initial = createInitialQuotation(loadedMasters.company);
          setFormData({
            ...initial,
            auditDepartment: 'ENVIRONMENTAL',
            pcbId: '',
            financialYear: 'YEAR 2025-26',
            subject: buildSubject('ENVIRONMENTAL', '', 'YEAR 2025-26'),
          });
        }
      } catch (err) {
        console.error('Error initializing quotation form:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEditing]);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Populate Everything Directly from TRF (Test Request) - ONLY selected parameters
  const handleSelectTRF = async (trId) => {
    if (!trId) {
      setFormData(prev => ({
        ...prev,
        testRequestId: '',
        clientName: '',
        registeredAddress: '',
        plantName: '',
        plantAddress: '',
        activities: [],
        annexureB: [],
      }));
      return;
    }

    let selectedTR = (masters.testRequests || []).find(r => r.id === trId);
    let trParams = [];

    // Fetch full TR details by ID to get nested relations & testRequestParameters
    try {
      const fullRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(trId));
      if (fullRes?.data) {
        selectedTR = fullRes.data;
        if (Array.isArray(fullRes.data.testRequestParameters)) {
          trParams = fullRes.data.testRequestParameters;
        } else if (Array.isArray(fullRes.data.parameters)) {
          trParams = fullRes.data.parameters;
        }
      }
    } catch (e) {
      console.log('Using cached TRF object or fallback', e);
    }

    // Fallback: If trParams is not directly in TR, fetch matching transaction records
    if (!trParams.length) {
      try {
        const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
        if (trpRes?.data) {
          const allTrps = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data?.rows || []);
          trParams = allTrps.filter(t => t.testRequestId === trId || t.test_request_id === trId);
        }
      } catch (e) {
        console.log('Error fetching TR transaction parameters', e);
      }
    }

    if (!selectedTR) return;

    const trClient = selectedTR.client || (masters.clients || []).find(c => c.id === selectedTR.clientId) || {};
    const plantAddr = trClient.plantAddress || trClient.plant_address || selectedTR.plantAddress || selectedTR.address || trClient.officeAddress || trClient.office_address || '';
    const regAddr = trClient.officeAddress || trClient.office_address || selectedTR.address || plantAddr;
    const reportNo = selectedTR.reportNumber || selectedTR.sampleIdNumber || selectedTR.report_number || 'TRF-001';

    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    const finYear = formData.financialYear || `YEAR ${currentYear}-${nextYearShort}`;
    const pcbId = trClient.pcbId || trClient.pcb_id || formData.pcbId || '';
    const dept = formData.auditDepartment || 'ENVIRONMENTAL';

    // Extract ONLY selected parameters for this TRF
    const populatedParams = trParams.map(p => {
      if (p.parameter && typeof p.parameter === 'object') return p.parameter;
      const matchedParam = (masters.parameters || []).find(param => param.id === (p.parameterId || p.id));
      return matchedParam || p;
    });

    const matrixCategory = selectedTR.sampleParticular || selectedTR.formTitle || 'Effluent Water Analysis';

    const initialActivity = {
      id: 'act_' + Date.now(),
      category: matrixCategory,
      description: `Sampling and laboratory analysis of ${matrixCategory}`,
      calculationType: 'PER_SAMPLE',
      ratePerSample: 1500,
      samplesPerVisit: 1,
      visits: 3,
      locations: 1,
      parameters: populatedParams.length > 0 ? populatedParams : [],
    };

    const rawDate = selectedTR.createdAt || selectedTR.created_at || selectedTR.date || selectedTR.sampleCollectionDate || selectedTR.inwardDate || new Date();
    let parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) parsedDate = new Date();
    const trfDateStr = parsedDate.toISOString().split('T')[0];

    const trIndex = (masters.testRequests || []).findIndex(r => r.id === selectedTR.id);
    const srNo = trIndex >= 0 ? trIndex + 1 : 1;

    // Detect Industry Type (Scale: small = 15K, medium = 20K, large = 25K)
    const rawScale = (selectedTR.industryType || selectedTR.industry_type || trClient.industryType || trClient.industryScale || trClient.scale || '').toLowerCase();
    let detectedScale = 'large';
    let detectedFee = 25000;
    if (rawScale.includes('small')) {
      detectedScale = 'small';
      detectedFee = 15000;
    } else if (rawScale.includes('med')) {
      detectedScale = 'medium';
      detectedFee = 20000;
    } else if (rawScale.includes('large')) {
      detectedScale = 'large';
      detectedFee = 25000;
    }

    // Build Annexure-B containing ONLY parameters selected when creating this TRF!
    const populatedAnnexureB = buildAnnexureBFromTRF(selectedTR, trParams, masters);
    // Build Annexure-A dynamically from Annexure-B Discipline Groups!
    const populatedAnnexureA = syncAnnexureAFromAnnexureB(populatedAnnexureB, [], formData.annexureAVisits || 3);

    setFormData(prev => ({
      ...prev,
      testRequestId: selectedTR.id,
      clientId: selectedTR.clientId || trClient.id || '',
      clientName: trClient.clientName || trClient.name || '',
      registeredAddress: regAddr,
      plantName: trClient.clientName ? `${trClient.clientName} - Plant Site` : '',
      plantAddress: plantAddr,
      referenceNo: reportNo,
      quotationDate: trfDateStr,
      hasRevisedDate: false,
      revisedDate: '',
      quotationNumber: generateQuotationNumber(dept, parsedDate, srNo, 'JLT'),
      referenceHeader: `REFERENCE:- GPCB - ${dept} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`,
      financialYear: finYear,
      pcbId: pcbId,
      auditDepartment: dept,
      subject: buildSubject(dept, pcbId, finYear),
      industryType: detectedScale,
      annexureI: {
        ...(prev.annexureI || {}),
        industryType: detectedScale,
        auditFee: detectedFee,
      },
      annexureB: populatedAnnexureB,
      mainCharges: prev.mainCharges?.length ? [
        { ...prev.mainCharges[0], rate: detectedFee, amount: detectedFee },
        ...prev.mainCharges.slice(1)
      ] : [{ id: 'mc_1', srNo: 1, description: 'Environment audit report charges (As per GPCB Guidelines)', calculationType: 'FIXED', qty: 1, unit: 'No.', rate: detectedFee, amount: detectedFee }],
      activities: populatedAnnexureA,
    }));

    const paramCount = populatedAnnexureB.reduce((sum, g) => sum + (g.parameters?.length || 0), 0);
    triggerToast(`Loaded TRF ${reportNo} • ${paramCount} selected parameter(s) mapped to Annexure-A & Annexure-B!`, 'success');
  };


  // Industry Type Change Handler (Small = 15K, Medium = 20K, Large = 25K)
  const handleIndustryTypeChange = (scale) => {
    let fee = 25000;
    if (scale === 'small') fee = 15000;
    else if (scale === 'medium') fee = 20000;
    else if (scale === 'large') fee = 25000;

    setFormData(prev => ({
      ...prev,
      industryType: scale,
      annexureI: {
        ...(prev.annexureI || {}),
        industryType: scale,
        auditFee: fee,
      },
      mainCharges: prev.mainCharges?.length ? [
        { ...prev.mainCharges[0], rate: fee, amount: fee },
        ...prev.mainCharges.slice(1)
      ] : [{ id: 'mc_1', srNo: 1, description: 'Environment audit report charges (As per GPCB Guidelines)', calculationType: 'FIXED', qty: 1, unit: 'No.', rate: fee, amount: fee }]
    }));
  };

  // Direct Client Select
  const handleSelectClient = (clientId) => {
    const selectedClient = (masters.clients || []).find(c => c.id === clientId);
    if (selectedClient) {
      const plantAddr = selectedClient.plantAddress || selectedClient.plant_address || selectedClient.address || selectedClient.officeAddress || selectedClient.office_address || '';
      const regAddr = selectedClient.officeAddress || selectedClient.office_address || selectedClient.address || plantAddr;
      const pcbId = selectedClient.pcbId || selectedClient.pcb_id || formData.pcbId || '';
      const finYear = formData.financialYear || 'YEAR 2025-26';
      const dept = formData.auditDepartment || 'ENVIRONMENTAL';

      setFormData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        clientName: selectedClient.clientName || selectedClient.name || '',
        registeredAddress: regAddr,
        plantAddress: plantAddr,
        pcbId: pcbId,
        subject: buildSubject(dept, pcbId, finYear),
      }));
    }
  };

  const handleDepartmentChange = (dept) => {
    setFormData(prev => {
      const cleanNum = cleanQuotationNumber(prev.quotationNumber);
      const isAuto = !cleanNum || /^JLT\/(EAC|FAC|[A-Z]+)\/\d{2}-\d{2}\/A[A-Z]\d{3}/i.test(cleanNum);
      const newQuoteNum = isAuto ? generateQuotationNumber(dept, prev.quotationDate || new Date(), 1, 'JLT') : cleanNum;

      return {
        ...prev,
        auditDepartment: dept,
        quotationNumber: newQuoteNum,
        referenceHeader: `REFERENCE:- GPCB - ${dept} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`,
        subject: buildSubject(dept, prev.pcbId, prev.financialYear),
      };
    });
  };

  const handleFinancialYearChange = (year) => {
    setFormData(prev => ({
      ...prev,
      financialYear: year,
      subject: buildSubject(prev.auditDepartment, prev.pcbId, year),
    }));
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['discount', 'gstPercentage'].includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

  // Page 2 Dedicated Dynamic Settings Handler (Visits, Days, DA, Hotel, etc.)
  const handleP2FieldChange = (field, rawVal) => {
    setFormData(prev => {
      const updatedP2 = { ...(prev.page2Charges || {}) };
      updatedP2[field] = rawVal;

      const updatedAnnexureI = { ...(prev.annexureI || {}) };
      let newAnnexureAVisits = prev.annexureAVisits;

      if (field === 'visits' || field === 'daysPerVisit') {
        const v = parseInt(field === 'visits' ? rawVal : (updatedP2.visits ?? updatedAnnexureI.visits ?? 3), 10) || 3;
        const d = parseInt(field === 'daysPerVisit' ? rawVal : (updatedP2.daysPerVisit ?? updatedAnnexureI.daysPerVisit ?? 4), 10) || 4;
        const tot = v * d;
        const word = getNumberInWords(tot);

        updatedP2.daDaysPerYear = tot;
        updatedP2.transportDaysText = word ? `${word} days` : `${tot} days`;

        // Auto update transport rate & total if dynamic calculation
        const jltRate = Number(updatedP2.jltVehicleRatePerDay ?? updatedAnnexureI.jltVehicleRatePerDay ?? 5000);
        const autoPerVisit = jltRate * d;
        const autoTotal = autoPerVisit * v;
        updatedP2.transportRatePerVisit = autoPerVisit;
        updatedP2.transportTotalAmount = autoTotal;
        updatedAnnexureI.transportRatePerVisit = autoPerVisit;
        updatedAnnexureI.transportTotalAmount = autoTotal;
      }

      if (field === 'visits') {
        updatedAnnexureI.visits = rawVal;
        newAnnexureAVisits = rawVal;
      }
      if (field === 'daysPerVisit') {
        updatedAnnexureI.daysPerVisit = rawVal;
      }
      if (field === 'jltVehicleRatePerDay') {
        updatedAnnexureI.jltVehicleRatePerDay = rawVal;
        const d = parseInt(updatedP2.daysPerVisit ?? updatedAnnexureI.daysPerVisit ?? 4, 10) || 4;
        const v = parseInt(updatedP2.visits ?? updatedAnnexureI.visits ?? 3, 10) || 3;
        const autoPerVisit = (parseFloat(rawVal) || 0) * d;
        const autoTotal = autoPerVisit * v;
        updatedP2.transportRatePerVisit = autoPerVisit;
        updatedP2.transportTotalAmount = autoTotal;
        updatedAnnexureI.transportRatePerVisit = autoPerVisit;
        updatedAnnexureI.transportTotalAmount = autoTotal;
      }

      if (field === 'daRatePerPerson' || field === 'daPersons' || field === 'daDaysPerYear') {
        const rate = parseFloat(field === 'daRatePerPerson' ? rawVal : (updatedP2.daRatePerPerson ?? 520)) || 0;
        const persons = parseFloat(field === 'daPersons' ? rawVal : (updatedP2.daPersons ?? 4)) || 0;
        const days = parseFloat(field === 'daDaysPerYear' ? rawVal : (updatedP2.daDaysPerYear ?? 12)) || 0;
        const v = parseInt(updatedP2.visits ?? updatedAnnexureI.visits ?? 3, 10) || 3;
        const amount = Math.round(rate * persons * days);
        const ratePerVisit = v > 0 ? Math.round(amount / v) : amount;
        updatedP2.daTotalAmount = amount;
        updatedP2.daRatePerVisit = ratePerVisit;
      }

      if (field === 'hotelRoomRate' || field === 'hotelRoomsCount' || field === 'hotelNightsPerVisit') {
        const rRate = parseFloat(field === 'hotelRoomRate' ? rawVal : (updatedP2.hotelRoomRate ?? 3000)) || 0;
        const rCount = parseFloat(field === 'hotelRoomsCount' ? rawVal : (updatedP2.hotelRoomsCount ?? 2)) || 0;
        const nights = parseFloat(field === 'hotelNightsPerVisit' ? rawVal : (updatedP2.hotelNightsPerVisit ?? 2)) || 0;
        const v = parseInt(updatedP2.visits ?? updatedAnnexureI.visits ?? 3, 10) || 3;
        const dailyCost = rRate * rCount;
        const ratePerVisit = dailyCost * nights;
        const accomTotal = ratePerVisit * v;
        updatedP2.accomRatePerVisit = ratePerVisit;
        updatedP2.accomTotalAmount = accomTotal;
      }

      return {
        ...prev,
        annexureAVisits: newAnnexureAVisits,
        annexureI: updatedAnnexureI,
        page2Charges: updatedP2
      };
    });
  };

  // Annexure-I Handlers
  const handleAuditFeeChange = (val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: { ...prev.annexureI, auditFee: parseFloat(val) || 0 }
    }));
  };

  const handleTransportChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          [field]: field === 'mode' ? val : (parseFloat(val) || 0)
        }
      }
    }));
  };

  const handleDAChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        da: { ...prev.annexureI.da, [field]: parseFloat(val) || 0 }
      }
    }));
  };

  const handleAccChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        accommodation: { ...prev.annexureI.accommodation, [field]: parseFloat(val) || 0 }
      }
    }));
  };

  // Annexure - A Handlers
  const handleGlobalVisitsChange = (val) => {
    const v = parseInt(val, 10) || 1;
    setFormData(prev => ({
      ...prev,
      annexureAVisits: v,
      activities: (prev.activities || []).map(act => ({
        ...act,
        visits: v,
      }))
    }));
  };

  const handleUpdateActivity = (index, field, val) => {
    setFormData(prev => {
      const activities = [...(prev.activities || [])];
      if (!activities[index]) return prev;

      const act = { ...activities[index] };

      if (field === 'description') {
        act.description = val;
      } else if (field === 'parametersMonitored') {
        act.parametersMonitored = val;
      } else if (field === 'srNo') {
        act.srNo = val;
      } else if (field === 'visits') {
        act.visits = parseInt(val, 10) || 1;
      } else if (field === 'sampleQuarter') {
        act.sampleQuarter = val;
      } else if (field === 'sampleQty') {
        const qty = parseFloat(val) || 0;
        act.sampleQty = qty;
        const isLoc = (act.sampleQuarter || '').toLowerCase().includes('loc') || (act.description || '').toLowerCase().includes('air') || (act.description || '').toLowerCase().includes('noise') || (act.description || '').toLowerCase().includes('stack');
        const unit = isLoc ? 'Locations' : 'Sample';
        act.sampleQuarter = `${String(qty).padStart(2, '0')} ${unit}`;
        if (!act.isChargeOverridden) {
          act.chargePerVisit = Math.round((parseFloat(act.ratePerSample) || 0) * qty);
        }
      } else if (field === 'ratePerSample') {
        const rate = parseFloat(val) || 0;
        act.ratePerSample = rate;
        act.isRateOverridden = true;
        if (!act.isChargeOverridden) {
          act.chargePerVisit = Math.round(rate * (parseFloat(act.sampleQty !== undefined ? act.sampleQty : 1) || 1));
        }
      } else if (field === 'chargePerVisit') {
        act.chargePerVisit = parseFloat(val) || 0;
        act.isChargeOverridden = true;
      } else if (field === 'resetOverride') {
        act.isChargeOverridden = false;
        act.chargePerVisit = Math.round((parseFloat(act.ratePerSample) || 0) * (parseFloat(act.sampleQty !== undefined ? act.sampleQty : 1) || 1));
      }

      activities[index] = act;
      return { ...prev, activities };
    });
  };

  const handleAddActivity = () => {
    setFormData(prev => {
      const activities = [...(prev.activities || [])];
      const newSr = String(activities.length + 1);
      const visits = prev.annexureAVisits || 3;
      activities.push({
        id: 'act_' + Date.now(),
        srNo: newSr,
        description: 'New Sampling / Monitoring Activity',
        parametersMonitored: `As per annexure- B, Sr. No. ${newSr}`,
        ratePerSample: 0,
        isRateOverridden: false,
        visits: visits,
        sampleQuarter: '01 Sample',
        sampleQty: 1,
        chargePerVisit: 0,
        isChargeOverridden: false,
      });
      return { ...prev, activities };
    });
  };

  const handleDeleteActivity = (index) => {
    setFormData(prev => {
      const activities = [...(prev.activities || [])];
      activities.splice(index, 1);
      return { ...prev, activities };
    });
  };

  const handleSyncAnnexureAFromB = () => {
    setFormData(prev => {
      const synced = syncAnnexureAFromAnnexureB(prev.annexureB || [], prev.activities || [], prev.annexureAVisits || 3);
      triggerToast('Annexure-A synced from Annexure-B Discipline Groups!', 'success');
      return { ...prev, activities: synced };
    });
  };


  // Annexure-B Rate Override Handlers
  const handleRateOverride = (uniqueKey, rateVal) => {
    setFormData(prev => ({
      ...prev,
      rateOverrides: {
        ...prev.rateOverrides,
        [uniqueKey]: { isOverridden: true, rate: parseFloat(rateVal) || 0 }
      }
    }));
  };

  // Annexure-B Discipline Group and Parameter Handlers
  const handleAddAnnexureBGroup = () => {
    setFormData(prev => {
      const groups = prev.annexureB || [];
      const newSr = String(groups.length + 1);
      return {
        ...prev,
        annexureB: [
          ...groups,
          {
            id: 'grp_' + Date.now(),
            srNo: newSr,
            category: 'New Discipline Group',
            parameters: [
              { id: 'p_' + Date.now(), description: 'Sample Parameter', rate: 1000 }
            ]
          }
        ]
      };
    });
  };

  const handleUpdateAnnexureBGroup = (groupIdx, field, val) => {
    setFormData(prev => {
      const groups = [...(prev.annexureB || [])];
      if (groups[groupIdx]) {
        groups[groupIdx] = { ...groups[groupIdx], [field]: val };
      }
      return { ...prev, annexureB: groups };
    });
  };

  const handleDeleteAnnexureBGroup = (groupIdx) => {
    setFormData(prev => {
      const groups = [...(prev.annexureB || [])];
      groups.splice(groupIdx, 1);
      return { ...prev, annexureB: groups };
    });
  };

  const handleAddAnnexureBParam = (groupIdx) => {
    setFormData(prev => {
      const groups = [...(prev.annexureB || [])];
      if (groups[groupIdx]) {
        const params = [...(groups[groupIdx].parameters || [])];
        params.push({
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          description: '',
          rate: 0
        });
        groups[groupIdx] = { ...groups[groupIdx], parameters: params };
      }
      return { ...prev, annexureB: groups };
    });
  };

  const handleUpdateAnnexureBParam = (groupIdx, pIdx, field, val) => {
    setFormData(prev => {
      const groups = [...(prev.annexureB || [])];
      if (groups[groupIdx]) {
        const params = [...(groups[groupIdx].parameters || [])];
        if (params[pIdx]) {
          params[pIdx] = { ...params[pIdx], [field]: val };
          groups[groupIdx] = { ...groups[groupIdx], parameters: params };
        }
      }
      return { ...prev, annexureB: groups };
    });
  };

  const handleDeleteAnnexureBParam = (groupIdx, pIdx) => {
    setFormData(prev => {
      const groups = [...(prev.annexureB || [])];
      if (groups[groupIdx]) {
        const params = [...(groups[groupIdx].parameters || [])];
        params.splice(pIdx, 1);
        groups[groupIdx] = { ...groups[groupIdx], parameters: params };
      }
      return { ...prev, annexureB: groups };
    });
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, signatorySignature: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, stampImage: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, stampImage2: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const globalVisits = parseInt(formData.annexureAVisits !== undefined ? formData.annexureAVisits : (formData.annexureI?.visits || 3), 10) || 3;
  const annexureATotals = useMemo(() => {
    return calculateAnnexureATotals(formData?.activities || [], globalVisits);
  }, [formData?.activities, globalVisits]);

  // Synchronize financial totals into quotation snapshot
  const syncTotals = (currentForm) => {
    const v = parseInt(currentForm.annexureAVisits !== undefined ? currentForm.annexureAVisits : (currentForm.annexureI?.visits || 3), 10) || 3;
    const mainChargesTotal = calculateMainCharges(currentForm.mainCharges || []);
    const annexureITotal = calculateAnnexureI(currentForm.annexureI);
    const aTotals = calculateAnnexureATotals(currentForm.activities || [], v);
    const annexureATotal = aTotals.totalAnnualCharge;
    const discount = parseFloat(currentForm.discount) || 0;
    const taxableAmount = calculateSubtotal(mainChargesTotal, annexureITotal, annexureATotal, discount);
    const gstPct = parseFloat(currentForm.gstPercentage !== undefined ? currentForm.gstPercentage : 18);
    const gstAmount = calculateGST(taxableAmount, gstPct);
    const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);

    return {
      ...currentForm,
      mainChargesTotal,
      annexureITotal,
      annexureATotal,
      taxableAmount,
      gstAmount,
      grandTotal,
    };
  };

  const handleSave = () => {
    if (!formData) return;
    setSaving(true);
    try {
      const finalized = syncTotals(formData);
      const saved = saveQuotationSnapshot(finalized);
      setFormData(saved);
      triggerToast('Provisional Quotation saved successfully!', 'success');
      if (!isEditing && saved.id) {
        navigate(`/quotations/provisional/edit/${saved.id}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save quotation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const mainChargesTotal = calculateMainCharges(formData?.mainCharges || []);
  const annexureITotal = calculateAnnexureI(formData?.annexureI);
  const annexureATotal = annexureATotals.totalAnnualCharge;
  const discount = parseFloat(formData?.discount) || 0;
  const taxableAmount = calculateSubtotal(mainChargesTotal, annexureITotal, annexureATotal, discount);
  const gstPct = parseFloat(formData?.gstPercentage !== undefined ? formData.gstPercentage : 18);
  const gstAmount = calculateGST(taxableAmount, gstPct);
  const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);

  const transport = formData?.annexureI?.transport || {};
  const da = formData?.annexureI?.da || {};
  const acc = formData?.annexureI?.accommodation || {};

  const annexureBList = useMemo(() => {
    if (!formData) return [];
    return generateAnnexureB(formData.activities || [], masters.parameters, formData.rateOverrides || {});
  }, [formData?.activities, masters.parameters, formData?.rateOverrides]);


  const scrollToPreview = useCallback((targetId) => {
    const previewContainer = document.querySelector('.a4-preview-scroll-frame');
    const targetElement = document.getElementById(targetId);
    if (previewContainer && targetElement) {
      const containerRect = previewContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const currentScrollTop = previewContainer.scrollTop;
      const targetOffsetTop = targetRect.top - containerRect.top + currentScrollTop - 15;
      
      if (Math.abs(previewContainer.scrollTop - targetOffsetTop) > 30) {
        previewContainer.scrollTo({
          top: Math.max(0, targetOffsetTop),
          behavior: 'smooth'
        });
      }
    }
  }, []);

  if (loading || !formData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Loading Quotation & TRF Master data...</p>
      </div>
    );
  }

  return (
    <div className="provisional-quotation-module">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`toast-banner-custom toast-${toast.type}`}>
          <FaCheckCircle /> {toast.message}
        </div>
      )}

      {/* Top Action Bar */}
      <div className="module-header d-flex justify-between align-center mb-3">
        <div className="d-flex align-center gap-3">
          <Link to="/quotations/provisional" className="btn btn-outline-secondary btn-sm">
            <FaArrowLeft /> Back to List
          </Link>
          <div>
            <h2 className="module-title" style={{ fontSize: '1.35rem' }}>
              {isEditing ? `Edit Quotation: ${formData.quotationNumber}` : 'New Provisional Estimated Quotation'}
            </h2>
            <span className="text-xs text-muted">
              Schedule-II Environmental Audit & Sampling Proposal Builder
            </span>
          </div>
        </div>

        <div className="d-flex align-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => {
              handleSave();
              window.open(`#/quotations/provisional/print/${formData.id}`, '_blank');
            }}
          >
            <FaPrint /> Print / Save PDF
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm font-semibold"
            onClick={handleSave}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: FORM ON LEFT, LIVE A4 PREVIEW ON RIGHT */}
      <div className="builder-split-view">

        {/* ================= LEFT COLUMN: CLEAN STREAMLINED FORM (VERTICAL FLOW) ================= */}
        <div className="builder-form-area" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. PRIMARY TRF SELECTION HERO DROPDOWN */}
          <div
            onFocusCapture={() => scrollToPreview('preview-page-1')}
            onClick={() => scrollToPreview('preview-page-1')}
            style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 4px rgba(34, 197, 94, 0.08)', cursor: 'default' }}
          >
            <label className="form-label font-bold text-primary mb-1 d-flex align-center gap-2" style={{ fontSize: '0.9rem' }}>
              <FaClipboardList /> 1. Select Test Request (TRF) to Auto-Fetch Everything:
            </label>
            <select
              className="form-control font-bold"
              style={{ height: '42px', fontSize: '0.92rem', borderColor: '#22c55e', backgroundColor: '#ffffff' }}
              value={formData.testRequestId || ''}
              onChange={(e) => handleSelectTRF(e.target.value)}
            >
              <option value="">-- Choose TRF Number to Auto-Populate ({masters.testRequests.length} available) --</option>
              {masters.testRequests.map(tr => (
                <option key={tr.id} value={tr.id}>
                  TRF: {tr.reportNumber || tr.sampleIdNumber || tr.id.slice(0, 8)} • {tr.client?.clientName || 'Client'} ({tr.sampleParticular || 'Environmental Matrix'})
                </option>
              ))}
            </select>
            <small className="text-muted d-block mt-1">
              Selecting a TRF automatically fetches the Client, Office Address, Plant Site, Parameters, and Sample Matrix.
            </small>

            {/* Client / Organization Name (Read-Only) */}
            {/* Client / Organization Name (Fully Editable) */}
            <div className="form-group mb-2 mt-3">
              <label className="form-label font-semibold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>
                Client / Organization Name
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName || ''}
                onChange={handleFieldChange}
                className="form-control font-bold"
                style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1.5px solid #86efac', height: '38px' }}
                placeholder="Enter or edit Client Name"
              />
            </div>

            {/* Plant / Industry Address (Fully Editable) */}
            <div className="form-group mb-2">
              <label className="form-label required font-semibold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>
                Plant / Industry Address
              </label>
              <textarea
                name="plantAddress"
                rows={2}
                value={formData.plantAddress || ''}
                onChange={handleFieldChange}
                className="form-control font-medium"
                style={{ backgroundColor: '#ffffff', color: '#1e293b', border: '1.5px solid #86efac' }}
                placeholder="Enter or edit Plant Site Address..."
              />
            </div>

            {/* Industry Type / Scale Selector (Auto-sets ₹15K, ₹20K, ₹25K) */}
            <div className="form-group mb-0">
              <label className="form-label font-bold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>
                Industry Type (Audit Fee Scale)
              </label>
              <select
                name="industryType"
                value={formData.industryType || formData.annexureI?.industryType || 'large'}
                onChange={(e) => handleIndustryTypeChange(e.target.value)}
                className="form-control font-bold"
                style={{ height: '38px', borderColor: '#22c55e', backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                <option value="small">Small (₹15,000/-)</option>
                <option value="medium">Medium (₹20,000/-)</option>
                <option value="large">Large (₹25,000/-)</option>
              </select>
              <small className="text-muted d-block mt-1">
                Changing Industry Type automatically sets Environment Audit Report Fee to ₹15K, ₹20K, or ₹25K.
              </small>
            </div>
          </div>

          {/* 2. COVERING LETTER & SIGNATORY (PAGE 1 OFFER LETTER) */}
          <div
            onFocusCapture={() => scrollToPreview('preview-page-1')}
            onClick={() => scrollToPreview('preview-page-1')}
            style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>✉️</span> 2. Covering Letter & Signatory (Page 1)
              </h4>
            </div>

            {/* Department & Financial Year Dropdowns for Auto-Subject Composition */}
            <div className="logistics-grid-2 mb-2">
              <div className="form-group mb-0">
                <label className="form-label font-bold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>Department Master</label>
                <select
                  name="auditDepartment"
                  value={formData.auditDepartment || 'ENVIRONMENTAL'}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="form-control font-semibold"
                  style={{ height: '38px', border: '1.5px solid #cbd5e1' }}
                >
                  <option value="ENVIRONMENTAL">Environmental (EAC)</option>
                  <option value="FOOD">Food (FAC)</option>
                  <option value="CHEMICAL">Chemical</option>
                  {(masters.categories || [])
                    .filter(c => !['ENVIRONMENTAL', 'FOOD', 'CHEMICAL'].includes((c.categoryName || c.name || '').toUpperCase()))
                    .map(c => (
                      <option key={c.id} value={(c.categoryName || c.name || '').toUpperCase()}>
                        {c.categoryName || c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label font-bold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>Financial Year</label>
                <select
                  name="financialYear"
                  value={formData.financialYear || 'YEAR 2025-26'}
                  onChange={(e) => handleFinancialYearChange(e.target.value)}
                  className="form-control font-semibold"
                  style={{ height: '38px', border: '1.5px solid #cbd5e1' }}
                >
                  {FINANCIAL_YEAR_OPTIONS.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Covering Letter Paragraph (Rich Text Editor with Bold, Italic, Headings, Lists) */}
            <div className="form-group mb-3">
              <label className="form-label required font-bold" style={{ color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span>Covering Letter Offer Paragraph</span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>✓ Rich Text Formatting</span>
              </label>
              <RichTextEditor
                value={formData.introText || ''}
                onChange={handleFieldChange}
                placeholder="Enter covering letter offer text..."
                minHeight="280px"
              />
            </div>

            {/* Signatory Details & Signature / Stamp Upload */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem' }}>
                Authorized Signatory & Stamp
              </div>

              <div className="logistics-grid-2 mb-2">
                <div className="form-group mb-0">
                  <label className="form-label font-semibold" style={{ fontSize: '0.78rem', color: '#334155' }}>Signatory Name</label>
                  <input
                    type="text"
                    name="signatoryName"
                    value={formData.signatoryName || ''}
                    onChange={handleFieldChange}
                    placeholder="e.g. Purvin Raiyani"
                    className="form-control font-semibold"
                    style={{ height: '36px' }}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label font-semibold" style={{ fontSize: '0.78rem', color: '#334155' }}>Designation</label>
                  <input
                    type="text"
                    name="signatoryDesignation"
                    value={formData.signatoryDesignation || ''}
                    onChange={handleFieldChange}
                    placeholder="e.g. (Proprietor)"
                    className="form-control"
                    style={{ height: '36px' }}
                  />
                </div>
              </div>

              {/* Upload Buttons for Signature and Stamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {/* Signature Upload */}
                <div>
                  <input
                    type="file"
                    ref={sigInputRef}
                    onChange={handleSignatureUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => sigInputRef.current && sigInputRef.current.click()}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px' }}
                  >
                    <FaUpload /> Upload Signature
                  </button>
                </div>

                {formData.signatorySignature && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #86efac' }}>
                    <img
                      src={formData.signatorySignature}
                      alt="Signature"
                      style={{ maxHeight: '28px', maxWidth: '80px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, signatorySignature: '' }))}
                      className="btn btn-outline-danger btn-xs"
                      style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Stamp Upload */}
                <div>
                  <input
                    type="file"
                    ref={stampInputRef}
                    onChange={handleStampUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => stampInputRef.current && stampInputRef.current.click()}
                    className="btn btn-outline-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px' }}
                  >
                    <FaUpload /> Upload Stamp
                  </button>
                </div>

                {formData.stampImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                    <img
                      src={formData.stampImage}
                      alt="Stamp"
                      style={{ maxHeight: '28px', maxWidth: '80px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, stampImage: '' }))}
                      className="btn btn-outline-danger btn-xs"
                      style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. DEDICATED PROVISIONAL ESTIMATE QUOTE DETAILS (PAGE 2 HEADER & METADATA) */}
          <div
            onFocusCapture={() => scrollToPreview('preview-page-2')}
            onClick={() => scrollToPreview('preview-page-2')}
            style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>📄</span> 3. Provisional Estimate Quote Details (Page 2 Header)
              </h4>
            </div>

            {/* 1st: Reference Line Header (Editable without square brackets) */}
            <div className="form-group mb-3">
              <label className="form-label font-bold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>
                Reference Line (Editable • No brackets)
              </label>
              <input
                type="text"
                name="referenceHeader"
                value={formData.referenceHeader !== undefined ? formData.referenceHeader : `REFERENCE:- GPCB - ${formData.auditDepartment || 'ENVIRONMENTAL'} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceHeader: e.target.value }))}
                className="form-control font-medium"
                style={{ height: '38px', fontSize: '0.84rem' }}
              />
            </div>

            {/* 2nd: Revised Date (Checkbox Toggle + Date Select) */}
            <div className="form-group mb-0">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ color: '#0f172a', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    name="hasRevisedDate"
                    checked={!!formData.hasRevisedDate}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        hasRevisedDate: checked,
                        revisedDate: checked ? (prev.revisedDate || prev.quotationDate || new Date().toISOString().split('T')[0]) : ''
                      }));
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  Include Revised Date?
                </label>
                {formData.hasRevisedDate && (
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Active</span>
                )}
              </div>

              {formData.hasRevisedDate && (
                <input
                  type="date"
                  name="revisedDate"
                  min={formData.quotationDate || ''}
                  value={formData.revisedDate || formData.quotationDate || ''}
                  onChange={handleFieldChange}
                  className="form-control font-semibold mt-2"
                  style={{ height: '38px', borderColor: '#93c5fd' }}
                />
              )}
            </div>
          </div>

          {/* 4. SCOPE OF WORK DETAILS (PAGE 2) - COMPACT */}
          <div
            onFocusCapture={() => scrollToPreview('preview-page-2-scope')}
            onClick={() => scrollToPreview('preview-page-2-scope')}
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>📋</span> 4. Scope of Work Details (Page 2)
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.85fr', gap: '0.5rem' }}>
              {/* Editable 1: Method Recognition Authority */}
              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  1. Method Authority <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>(Pt 1)</span>
                </label>
                <input
                  type="text"
                  name="scopeMethodRecognition"
                  value={formData.scopeMethodRecognition !== undefined ? formData.scopeMethodRecognition : 'GPCB / CPCB / MoEF&CC.'}
                  onChange={handleFieldChange}
                  placeholder="e.g. GPCB / CPCB / MoEF&CC."
                  className="form-control font-medium"
                  style={{ height: '32px', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                />
              </div>

              {/* Editable 2: Sample Preservation Guidelines */}
              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  2. Preservation Guideline <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>(Pt 2)</span>
                </label>
                <input
                  type="text"
                  name="scopePreservationGuidelines"
                  value={formData.scopePreservationGuidelines !== undefined ? formData.scopePreservationGuidelines : 'GPCB/CPCB or IS/APHA'}
                  onChange={handleFieldChange}
                  placeholder="e.g. GPCB/CPCB or IS/APHA"
                  className="form-control font-medium"
                  style={{ height: '32px', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                />
              </div>

              {/* Editable 3: Consent Authority */}
              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  3. Consent By <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>(Pt 6)</span>
                </label>
                <input
                  type="text"
                  name="scopeConsentAuthority"
                  value={formData.scopeConsentAuthority !== undefined ? formData.scopeConsentAuthority : 'GPCB.'}
                  onChange={handleFieldChange}
                  placeholder="e.g. GPCB."
                  className="form-control font-medium"
                  style={{ height: '32px', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                />
              </div>
            </div>
          </div>

          {/* 5. TERMS & CONDITIONS (PAGE 3) */}
          <div
            onFocusCapture={() => scrollToPreview('preview-page-3')}
            onClick={() => scrollToPreview('preview-page-3')}
            style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>📜</span> 5. Terms &amp; Conditions (Page 3)
              </h4>
            </div>

            {/* Contact Person (Editable in Left Panel) */}
            <div className="form-group mb-3">
              <label className="form-label font-bold" style={{ color: '#0f172a', fontSize: '0.82rem' }}>
                Contact Person &amp; Phone <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(Page 3 Sign-off)</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson !== undefined ? formData.contactPerson : 'Ankit Mistry (+91 7226-0579-78)'}
                onChange={handleFieldChange}
                placeholder="e.g. Ankit Mistry (+91 7226-0579-78)"
                className="form-control font-semibold"
                style={{ height: '38px' }}
              />
            </div>

            {/* Terms and conditions Rich Text Editor */}
            <div className="form-group mb-0">
              <label className="form-label font-bold" style={{ color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span>Terms &amp; Conditions Content</span>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>✓ Rich Text Formatting</span>
              </label>
              <RichTextEditor
                name="termsText"
                value={formData.termsText !== undefined ? formData.termsText : DEFAULT_TERMS_TEXT}
                onChange={(e) => {
                  if (e && e.target) {
                    setFormData(prev => ({ ...prev, termsText: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, termsText: e }));
                  }
                }}
                placeholder="Enter terms and conditions text..."
                minHeight="240px"
              />
            </div>
          </div>

          {/* 6. ANNEXURE - I LOGISTICS & RATES (PAGE 4 - TOP) */}
          <div
            onFocusCapture={() => scrollToPreview('preview-annexure-1')}
            onClick={() => scrollToPreview('preview-annexure-1')}
            style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>💰</span> 6. Annexure - I Rates &amp; Logistics (Page 4 - Top)
              </h4>
            </div>

            {/* Industry Scale & Audit Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  Industry Scale (Auto-set)
                </label>
                <select
                  value={formData.annexureI?.industryType || formData.industryType || 'large'}
                  onChange={(e) => handleIndustryTypeChange(e.target.value)}
                  className="form-control font-bold"
                  style={{ height: '34px', fontSize: '0.82rem', borderColor: '#22c55e' }}
                >
                  <option value="small">Small (₹15,000/-)</option>
                  <option value="medium">Medium (₹20,000/-)</option>
                  <option value="large">Large (₹25,000/-)</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  Audit Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.annexureI?.auditFee !== undefined ? formData.annexureI.auditFee : 25000}
                  onChange={(e) => {
                    const feeVal = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      annexureI: { ...(prev.annexureI || {}), auditFee: feeVal },
                      mainCharges: prev.mainCharges?.length ? [
                        { ...prev.mainCharges[0], rate: feeVal, amount: feeVal },
                        ...prev.mainCharges.slice(1)
                      ] : prev.mainCharges
                    }));
                  }}
                  className="form-control font-bold"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Days/Visits & Vehicle Rate Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px', marginBottom: '10px' }}>
              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  Days / Visit
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.annexureI?.daysPerVisit !== undefined ? formData.annexureI.daysPerVisit : 4}
                  onChange={(e) => handleP2FieldChange('daysPerVisit', e.target.value)}
                  className="form-control font-bold"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  Total Visits
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.annexureI?.visits !== undefined ? formData.annexureI.visits : 3}
                  onChange={(e) => handleP2FieldChange('visits', e.target.value)}
                  className="form-control font-bold"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                  Vehicle Rate/Day (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.annexureI?.jltVehicleRatePerDay !== undefined ? formData.annexureI.jltVehicleRatePerDay : 5000}
                  onChange={(e) => handleP2FieldChange('jltVehicleRatePerDay', e.target.value)}
                  className="form-control font-bold text-primary"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Configurable Rate per Visit & Total Amount */}
            {(() => {
              const d = parseInt(formData.annexureI?.daysPerVisit ?? formData.page2Charges?.daysPerVisit, 10) || 4;
              const v = parseInt(formData.annexureI?.visits ?? formData.page2Charges?.visits, 10) || 3;
              const perDay = Number(formData.annexureI?.jltVehicleRatePerDay ?? formData.page2Charges?.jltVehicleRatePerDay ?? 5000);
              const autoPerVisit = perDay * d;
              const currentPerVisit = formData.annexureI?.transportRatePerVisit !== undefined ? formData.annexureI.transportRatePerVisit : autoPerVisit;
              const autoTotal = (Number(currentPerVisit) || 0) * v;
              const currentTotal = formData.annexureI?.transportTotalAmount !== undefined ? formData.annexureI.transportTotalAmount : autoTotal;

              return (
                <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
                    ⚙️ Transport Rate &amp; Total Amount (Editable &amp; Auto-Calculated)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Rate for {d} Days (₹ / Visit)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.annexureI?.transportRatePerVisit !== undefined ? formData.annexureI.transportRatePerVisit : autoPerVisit}
                        onChange={(e) => {
                          const val = e.target.value;
                          const rVal = val === '' ? '' : parseFloat(val);
                          const totalVal = (parseFloat(val) || 0) * v;
                          setFormData(prev => ({
                            ...prev,
                            annexureI: {
                              ...(prev.annexureI || {}),
                              transportRatePerVisit: rVal,
                              transportTotalAmount: totalVal
                            },
                            page2Charges: {
                              ...(prev.page2Charges || {}),
                              transportRatePerVisit: rVal,
                              transportTotalAmount: totalVal
                            }
                          }));
                        }}
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.78rem', borderColor: '#3b82f6' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                        Total for {v} Visits (₹ Amount)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.annexureI?.transportTotalAmount !== undefined ? formData.annexureI.transportTotalAmount : currentTotal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const tVal = val === '' ? '' : parseFloat(val);
                          setFormData(prev => ({
                            ...prev,
                            annexureI: { ...(prev.annexureI || {}), transportTotalAmount: tVal },
                            page2Charges: { ...(prev.page2Charges || {}), transportTotalAmount: tVal }
                          }));
                        }}
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.78rem', borderColor: '#10b981' }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600, background: '#f0f9ff', padding: '4px 8px', borderRadius: '4px' }}>
                    ✓ Auto-formula: ₹{Number(perDay).toLocaleString('en-IN')}/day × {d} days = ₹{Number(currentPerVisit).toLocaleString('en-IN')}/visit × {v} visits = ₹{Number(currentTotal).toLocaleString('en-IN')} Total
                  </div>
                </div>
              );
            })()}

            {/* Row 2 Transportation Description Template */}
            <div className="form-group mb-2">
              <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                Row 2: JLT Vehicle Description Text
              </label>
              <input
                type="text"
                value={formData.annexureI?.row2Title !== undefined ? formData.annexureI.row2Title : 'Transportation charges for monitoring instrument/material. (per day) + Total {totalDays} Days. (For JLTs Vehicle)'}
                onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), row2Title: e.target.value } }))}
                className="form-control font-semibold"
                style={{ height: '32px', fontSize: '0.78rem' }}
              />
            </div>

            {/* Option 1: Client Provided Vehicle Details */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                🚙 Row 2 A: Option 1 (Client Provided) Texts
              </div>
              <div className="form-group mb-2">
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                  Option 1 Title (use {'{clientName}'} for auto-insert)
                </label>
                <input
                  type="text"
                  value={formData.annexureI?.option1Title !== undefined ? formData.annexureI.option1Title : 'In Option 1 if transportation for both instruments and officers are provided by M/s. {clientName} then NILL charges.'}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), option1Title: e.target.value } }))}
                  className="form-control font-medium"
                  style={{ height: '30px', fontSize: '0.76rem' }}
                />
              </div>
              <div className="form-group mb-0">
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                  Option 1 Subtext
                </label>
                <textarea
                  rows={2}
                  value={formData.annexureI?.option1Subtext !== undefined ? formData.annexureI.option1Subtext : '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)'}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), option1Subtext: e.target.value } }))}
                  className="form-control"
                  style={{ fontSize: '0.74rem' }}
                />
              </div>
            </div>

            {/* Option 2: Agency Rates Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                🚗 Row 2 B: Option 2 (Agency Charges) Texts &amp; Rates
              </div>
              <div className="form-group mb-2">
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                  Option 2 Title Text
                </label>
                <input
                  type="text"
                  value={formData.annexureI?.option2Title !== undefined ? formData.annexureI.option2Title : 'In Option 2 if transportation for both instruments and officers are provided by JLTs then it may increase as per charges of agency.'}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), option2Title: e.target.value } }))}
                  className="form-control font-medium"
                  style={{ height: '30px', fontSize: '0.76rem' }}
                />
              </div>
              <div className="form-group mb-2">
                <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                  Option 2 Subtext
                </label>
                <textarea
                  rows={2}
                  value={formData.annexureI?.option2Subtext !== undefined ? formData.annexureI.option2Subtext : '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)'}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), option2Subtext: e.target.value } }))}
                  className="form-control"
                  style={{ fontSize: '0.74rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Label 1
                  </label>
                  <input
                    type="text"
                    value={formData.annexureI?.instrumentLabel !== undefined ? formData.annexureI.instrumentLabel : 'For Instruments,'}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), instrumentLabel: e.target.value } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.76rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Rate (₹/km)
                  </label>
                  <input
                    type="number"
                    value={formData.annexureI?.instrumentKmRate !== undefined ? formData.annexureI.instrumentKmRate : 12}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), instrumentKmRate: parseFloat(e.target.value) || 0 } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Kms/Day
                  </label>
                  <input
                    type="number"
                    value={formData.annexureI?.instrumentKmPerDay !== undefined ? formData.annexureI.instrumentKmPerDay : 300}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), instrumentKmPerDay: parseFloat(e.target.value) || 0 } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Label 2
                  </label>
                  <input
                    type="text"
                    value={formData.annexureI?.auditorLabel !== undefined ? formData.annexureI.auditorLabel : 'For Auditors,'}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), auditorLabel: e.target.value } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.76rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Rate (₹/km)
                  </label>
                  <input
                    type="number"
                    value={formData.annexureI?.auditorKmRate !== undefined ? formData.annexureI.auditorKmRate : 15}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), auditorKmRate: parseFloat(e.target.value) || 0 } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Kms/Day
                  </label>
                  <input
                    type="number"
                    value={formData.annexureI?.auditorKmPerDay !== undefined ? formData.annexureI.auditorKmPerDay : 300}
                    onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), auditorKmPerDay: parseFloat(e.target.value) || 0 } }))}
                    className="form-control"
                    style={{ height: '30px', fontSize: '0.78rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Decision Note Text */}
            <div className="form-group mb-0">
              <label className="form-label font-bold mb-1" style={{ color: '#0f172a', fontSize: '0.74rem' }}>
                Company Decision Note (Right Column)
              </label>
              <textarea
                rows={3}
                value={formData.annexureI?.decisionNote !== undefined ? formData.annexureI.decisionNote : 'It is to be decided by the Company. If Option 1 or Option 2 for TA is chosen, then JLTs Vehicle transportation would be removed. And actual DA billing is to be added at the time of billing.'}
                onChange={(e) => setFormData(prev => ({ ...prev, annexureI: { ...(prev.annexureI || {}), decisionNote: e.target.value } }))}
                className="form-control"
                style={{ fontSize: '0.75rem', lineHeight: 1.35 }}
              />
            </div>
          </div>

          {/* 7. ANNEXURE - A SAMPLING & MONITORING ACTIVITIES (PAGE 4 - BOTTOM) */}
          <div
            onFocusCapture={() => scrollToPreview('preview-annexure-a')}
            onClick={() => scrollToPreview('preview-annexure-a')}
            style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', cursor: 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>📊</span> 7. Annexure - A: Sampling Activities Matrix (Page 4 - Bottom)
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-xs font-semibold"
                  onClick={handleSyncAnnexureAFromB}
                  title="Sync activities and rates from Annexure-B Discipline Groups"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FaUndo /> Sync from Annexure-B
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-xs font-semibold"
                  onClick={handleAddActivity}
                  style={{ fontSize: '0.72rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FaPlus /> Add Activity
                </button>
              </div>
            </div>

            {/* Global Visits Input & Totals Banner */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Visits Multiplier (All Rows):
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.annexureAVisits !== undefined ? formData.annexureAVisits : 3}
                  onChange={(e) => handleGlobalVisitsChange(e.target.value)}
                  className="form-control font-bold text-center"
                  style={{ width: '60px', height: '32px', fontSize: '0.84rem', borderColor: '#2563eb' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700 }}>RATE TOTAL</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(annexureATotals.totalRate).toLocaleString('en-IN')}/-</div>
                </div>
                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700 }}>PER VISIT TOTAL</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(annexureATotals.totalChargePerVisit).toLocaleString('en-IN')}/-</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '3px 8px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: '#047857', fontWeight: 700 }}>ANNUAL CHARGE</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065f46' }}>₹{Number(annexureATotals.totalAnnualCharge).toLocaleString('en-IN')}/-</div>
                </div>
              </div>
            </div>

            {/* Activities List */}
            {(formData.activities || []).length === 0 ? (
              <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', color: '#64748b', marginBottom: '10px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>No sampling activities loaded.</p>
                <span style={{ fontSize: '0.74rem' }}>Please choose a Test Request (TRF) in Section 1 above to auto-populate sampling activities, or click "+ Add Activity" to add rows manually.</span>
              </div>
            ) : (
              (formData.activities || []).map((act, aIdx) => {
              const rowCalc = calculateAnnexureARowCharge(act, globalVisits);
              return (
                <div
                  key={act.id || aIdx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Row 1: Sr No, Description & Delete */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ width: '55px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                        Sr.
                      </label>
                      <input
                        type="text"
                        value={act.srNo || ''}
                        onChange={(e) => handleUpdateActivity(aIdx, 'srNo', e.target.value)}
                        className="form-control font-bold text-center"
                        style={{ height: '30px', fontSize: '0.78rem' }}
                      />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                        Activity / Discipline Description
                      </label>
                      <input
                        type="text"
                        value={act.description || ''}
                        onChange={(e) => handleUpdateActivity(aIdx, 'description', e.target.value)}
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-xs mt-3"
                      onClick={() => handleDeleteActivity(aIdx)}
                      title="Delete Activity Row"
                      style={{ height: '30px', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FaTrash style={{ fontSize: '0.72rem' }} />
                    </button>
                  </div>

                  {/* Row 2: Parameters Monitored Reference Text */}
                  <div className="form-group mb-2">
                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                      Parameters To Be Monitored Reference
                    </label>
                    <input
                      type="text"
                      value={act.parametersMonitored || ''}
                      onChange={(e) => handleUpdateActivity(aIdx, 'parametersMonitored', e.target.value)}
                      placeholder="e.g. As per annexure- B, Sr. No. 1"
                      className="form-control"
                      style={{ height: '28px', fontSize: '0.76rem' }}
                    />
                  </div>

                  {/* Row 3: The 3 User-Editable Columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.2fr 1.1fr', gap: '8px', alignItems: 'flex-end', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {/* Rate Per Sample */}
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                        Rate / Sample (₹)
                      </label>
                      <input
                        type="number"
                        value={act.ratePerSample !== undefined ? act.ratePerSample : ''}
                        onChange={(e) => handleUpdateActivity(aIdx, 'ratePerSample', e.target.value)}
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.78rem' }}
                      />
                    </div>

                    {/* Column 2: NO. OF SAMPLE/QUARTER */}
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                        Sample / Qtr Text
                      </label>
                      <input
                        type="text"
                        value={act.sampleQuarter || ''}
                        onChange={(e) => handleUpdateActivity(aIdx, 'sampleQuarter', e.target.value)}
                        placeholder="e.g. 01 Sample"
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.78rem', borderColor: '#3b82f6' }}
                      />
                    </div>

                    {/* Column 3: CHARGE PER VISIT/QUARTER */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Charge / Visit (₹)
                        </label>
                        {act.isChargeOverridden && (
                          <button
                            type="button"
                            onClick={() => handleUpdateActivity(aIdx, 'resetOverride')}
                            className="btn btn-link p-0 text-xs text-primary"
                            style={{ fontSize: '0.62rem', textDecoration: 'underline' }}
                            title="Reset to Rate × Qty"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={act.chargePerVisit !== undefined ? act.chargePerVisit : rowCalc.chargePerVisit}
                        onChange={(e) => handleUpdateActivity(aIdx, 'chargePerVisit', e.target.value)}
                        className="form-control font-bold"
                        style={{ height: '30px', fontSize: '0.78rem', borderColor: act.isChargeOverridden ? '#f59e0b' : '#10b981', color: '#0f172a' }}
                      />
                    </div>

                    {/* Annual Total */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Annual (×{globalVisits})</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065f46' }}>
                        ₹{Number(rowCalc.totalCharge).toLocaleString('en-IN')}/-
                      </div>
                    </div>
                  </div>
                </div>
              );
            }))}

            {/* Annexure-A Bottom Note */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', marginTop: '10px' }}>
              <div className="form-group mb-2">
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                  Bottom Note Heading
                </label>
                <input
                  type="text"
                  value={formData.annexureANoteTitle !== undefined ? formData.annexureANoteTitle : `BREAK-UP OF ALL ANALYSIS CHARGES FOR AUDIT ${(formData.financialYear || '2024-2025').replace(/^YEAR\s*/i, '')}`}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureANoteTitle: e.target.value }))}
                  className="form-control font-bold"
                  style={{ height: '30px', fontSize: '0.78rem' }}
                />
              </div>
              <div className="form-group mb-0">
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                  Bottom Note Text
                </label>
                <textarea
                  rows={2}
                  value={formData.annexureANoteText !== undefined ? formData.annexureANoteText : 'The rates are indicative and may vary as per actual visits/work undertaken: Nos. of Days spent on site: Sampling and testing requirements: revision of rates from GPCB and any additional visit undertaken for additional data collection.'}
                  onChange={(e) => setFormData(prev => ({ ...prev, annexureANoteText: e.target.value }))}
                  className="form-control"
                  style={{ fontSize: '0.74rem', lineHeight: 1.35 }}
                />
              </div>
            </div>
          </div>



        </div>

        {/* ================= RIGHT COLUMN: INSTANT LIVE A4 PRINT PREVIEW (ALL PAGES) ================= */}
        <div className="builder-preview-area">

          {/* Preview Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '8px 8px 0 0' }}>
            <span className="text-xs font-bold uppercase tracking-wider d-flex align-center gap-1">
              <FaEye className="text-emerald-400" /> Live A4 Print Preview
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, background: '#1e293b', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
              {!formData.testRequestId ? 'Select TRF to Preview' : `Full Quotation (${(formData.annexureB || []).length === 0 ? '4 Pages' : ((formData.annexureB || []).length > 3 ? '6 Pages' : '5 Pages')})`}
            </span>
          </div>

          {/* Scrollable A4 Preview Frame (All Pages Stacked) */}
          <div className="a4-preview-scroll-frame" style={{ background: '#cbd5e1', padding: '1rem', overflowY: 'auto', border: '1px solid #94a3b8', borderTop: 'none', borderRadius: '0 0 8px 8px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {!formData.testRequestId ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '450px',
                border: '2px dashed #94a3b8'
              }}>
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  border: '2px solid #86efac',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '1.25rem'
                }}>
                  <FaClipboardList />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Please Select a TRF for Preview
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '420px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Please select a Test Request (TRF) number from <strong>Section 1</strong> on the left side form to auto-load customer data, sampling activities, and live A4 print preview.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1px solid #cbd5e1'
                }}>
                  👈 Select TRF from the dropdown in Section 1
                </div>
              </div>
            ) : (
              <>
            {/* PAGE 1: COVERING LETTER */}
            <div id="preview-page-1" className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* TOP HEADER: LOGO */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <img
                  src={getLogoUrl(masters.company)}
                  alt="Company Logo"
                  style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                />
              </div>

              <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '12px' }}></div>

              {/* META INFO ROW: REF & DATE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', fontSize: '11px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  Ref No.: <span style={{ fontWeight: 800 }}>{cleanQuotationNumber(formData.quotationNumber)}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  Date: <span style={{ fontWeight: 800 }}>{formatDate(formData.quotationDate || new Date())}</span>
                </div>
              </div>

              {/* TO SECTION */}
              <div style={{ marginBottom: '14px', lineHeight: '1.45', color: '#0f172a' }}>
                <div style={{ fontWeight: 700 }}>To,</div>
                <div style={{ fontWeight: 800, fontSize: '11.5px' }}>{formData.clientName || 'M/s. Valued Client'}</div>
                <div style={{ whiteSpace: 'pre-line', color: '#334155' }}>
                  {formData.plantAddress || formData.registeredAddress || 'Plant Site Address'}
                </div>
              </div>

              {/* REFERENCE BAR */}
              <div style={{ marginBottom: '12px', fontSize: '10.5px', color: '#0f172a', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>REFERENCE: - </span>
                <span>
                  {formData.referenceHeader || `GPCB - ${formData.auditDepartment || 'ENVIRONMENTAL'} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`}
                </span>
              </div>

              {/* SUBJECT BAR */}
              <div style={{ marginBottom: '14px', fontSize: '11px', color: '#0f172a', lineHeight: 1.45 }}>
                <span style={{ fontWeight: 700, textDecoration: 'underline' }}>SUBJECT: -</span>{' '}
                <span style={{ fontWeight: 700 }}>
                  {formData.subject || buildSubject(formData.auditDepartment || 'ENVIRONMENTAL', formData.pcbId, formData.financialYear)}
                </span>
              </div>

              {/* SALUTATION */}
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
                Dear Sir,
              </div>

              {/* COVERING LETTER BODY */}
              <div className="covering-letter-body" style={{ color: '#0f172a', lineHeight: 1.5, fontSize: '11px', marginBottom: '12px' }}>
                {renderRichContent(formData.introText || DEFAULT_INTRO_TEXT)}
              </div>

              {/* SIGNATORY BLOCK */}
              <div style={{ marginTop: 'auto', paddingTop: '8px', fontSize: '11px', color: '#0f172a' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Thanking you.</div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>For, Jagnath Lab Technologies</div>

                {/* SIGNATURE & STAMP ROW */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '48px', margin: '4px 0' }}>
                  {formData.signatorySignature && (
                    <img src={formData.signatorySignature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }} />
                  )}
                  {formData.stampImage && (
                    <img src={formData.stampImage} alt="Round Stamp" style={{ maxHeight: '55px', maxWidth: '90px', objectFit: 'contain' }} />
                  )}
                  {formData.stampImage2 && (
                    <img src={formData.stampImage2} alt="Address Stamp" style={{ maxHeight: '55px', maxWidth: '140px', objectFit: 'contain' }} />
                  )}
                </div>

                <div style={{ fontWeight: 700 }}>{formData.signatoryName || 'Purvin Raiyani'}</div>
                <div style={{ fontWeight: 600 }}>{formData.signatoryDesignation || '(Proprietor)'}</div>
              </div>

              {renderStandardPageFooter(1)}
            </div>

            {/* PAGE 2: SCOPE OF WORK */}
            <div id="preview-page-2" className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* TOP HEADER: LOGO */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img
                  src={getLogoUrl(masters.company)}
                  alt="Company Logo"
                  style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                />
              </div>
              <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '16px' }}></div>

              {/* PAGE 2 TITLE */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
                  PROVISIONAL ESTIMATED QUOTE
                </h2>
              </div>

              {/* 3-COLUMN METADATA TABLE */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', marginBottom: '22px', fontSize: '11px', color: '#0f172a' }}>
                <tbody>
                  <tr>
                    {/* COLUMN 1: ENTIRE CLIENT SECTION BOLD */}
                    <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top', fontWeight: 700 }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>CLIENT NAME:-</p>
                      <p style={{ margin: '0 0 12px 0', fontWeight: 700 }}>M/s. {formData.clientName || 'Client Name'}</p>

                      <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>ADDRES:</p>
                      <div className="whitespace-pre-line" style={{ lineHeight: 1.45, fontWeight: 700 }}>
                        {formData.plantAddress || formData.registeredAddress || 'Plant Address'}
                      </div>
                    </td>

                    {/* COLUMN 2: REFERENCE & APPROVED BY (LABELS BOLD) */}
                    <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top' }}>
                      {(() => {
                        const refStr = formData.referenceHeader || `REFERENCE:- GPCB - ${formData.auditDepartment || 'ENVIRONMENTAL'} AUDIT CELL (As per order of Hon'ble High Court of Gujarat)`;
                        if (refStr.startsWith('REFERENCE:-') || refStr.startsWith('REFERENCE:')) {
                          const rest = refStr.replace(/^REFERENCE:-\s*|^REFERENCE:\s*/, '');
                          return (
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'normal', lineHeight: 1.45 }}>
                              <strong>REFERENCE:-</strong> {rest}
                            </p>
                          );
                        }
                        return (
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'normal', lineHeight: 1.45 }}>
                            {refStr}
                          </p>
                        );
                      })()}

                      <div style={{ marginTop: '24px' }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>APPROVED BY:-</p>
                        <p style={{ margin: 0, fontWeight: 'normal' }}>
                          {formData.signatoryName ? (formData.signatoryName.startsWith('Mr.') || formData.signatoryName.startsWith('Dr.') ? formData.signatoryName : `Mr. ${formData.signatoryName}`) : 'Mr. Purvin Raiyani'}
                        </p>
                      </div>
                    </td>

                    {/* COLUMN 3: Q-P.I & DATES (LABELS BOLD) */}
                    <td style={{ width: '33.33%', border: '1px solid #0f172a', padding: '10px 12px', verticalAlign: 'top' }}>
                      <p style={{ margin: '0 0 24px 0', fontWeight: 'normal' }}>
                        <strong>Q-P.I :-</strong> {cleanQuotationNumber(formData.quotationNumber) || generateQuotationNumber(formData.auditDepartment, formData.quotationDate)}
                      </p>

                      <p style={{ margin: '0 0 4px 0', fontWeight: 'normal' }}>
                        <strong>DATE:-</strong> {formatDDMMYYYY(formData.quotationDate)}
                      </p>
                      {formData.hasRevisedDate && formData.revisedDate && (
                        <p style={{ margin: 0, fontWeight: 'normal', color: '#334155' }}>
                          <strong>Revised –</strong> {formatDDMMYYYY(formData.revisedDate)}
                        </p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SCOPE OF WORK HEADING & CONTENT */}
              <div id="preview-page-2-scope" style={{ textAlign: 'center', marginTop: '6px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
                  SCOPE OF WORK
                </h3>
              </div>

              <p style={{ fontWeight: 700, textDecoration: 'underline', fontSize: '11px', marginBottom: '8px', color: '#0f172a', lineHeight: 1.35 }}>
                Visit, Collection &amp; analysis of the sample as {(formData.auditDepartment || 'environment').toLowerCase().replace(/environmental/i, 'environment')} audit of your unit will be conducted as per below details:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: '#0f172a', lineHeight: 1.35, marginBottom: '10px' }}>
                {/* Point 1 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
                  <span style={{ fontWeight: 700 }}>
                    Method of collection and analysis must be approved / recognized by {formData.scopeMethodRecognition || 'GPCB / CPCB / MoEF&CC.'}
                  </span>
                </div>

                {/* Point 2 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.1, flexShrink: 0, fontWeight: 700 }}>✓</span>
                  <span style={{ fontWeight: 'normal' }}>
                    Collection of sample and preservation of sample be made as per {formData.scopePreservationGuidelines || 'GPCB/CPCB or IS/APHA'} guidelines.
                  </span>
                </div>

                {/* Point 3 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
                  <span style={{ fontWeight: 700 }}>
                    Mode of Transportation for instruments and Dearness Allowance for Audit Officers to your Unit.
                  </span>
                </div>

                {/* Point 4 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#0f172a', fontSize: '11px', lineHeight: 1.1, flexShrink: 0, fontWeight: 700 }}>✓</span>
                  <span style={{ fontWeight: 'normal' }}>
                    If any one of above is provided by you to the auditors, which are arranged by you then charges for same as mentioned below is not to be considered.
                  </span>
                </div>

                {/* Point 5 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
                  <span style={{ fontWeight: 700 }}>
                    For the audit fee, Rs. 15,000/- for small scale, Rs. 20,000/- for medium scale and Rs. 25,000/- for large scale shall be considered.
                  </span>
                </div>

                {/* Point 6 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#e11d48', fontSize: '12px', lineHeight: 1.1, flexShrink: 0 }}>✦</span>
                  <span style={{ fontWeight: 700 }}>
                    Final Quote is to be submitted at a time after our first visit to your UNIT, Below Quote is just a Provisional Estimated Quote that is made as per your units Consent by {formData.scopeConsentAuthority || 'GPCB.'}
                  </span>
                </div>
              </div>

              {/* ================= PAGE 2: DETAIL OF CHARGES SUMMARY TABLE ================= */}
              {(() => {
                const p2Calc = calculatePage2Charges(formData, annexureATotals.totalAnnualCharge);
                return (
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '11.5px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.02em', color: '#0f172a' }}>
                        {getPage2TableTitle(formData.auditDepartment)}
                      </h3>
                    </div>

                    {/* 6-Column Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9px', color: '#0f172a', lineHeight: 1.28, marginBottom: '6px' }}>
                      <thead>
                        <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                          <th style={{ width: '6%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                            Sr.<br />No.
                          </th>
                          <th style={{ width: '51%', border: '1px solid #0f172a', padding: '4px 6px', textAlign: 'center', fontWeight: 800 }}>
                            Description of work
                          </th>
                          <th style={{ width: '7%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                            Qty.
                          </th>
                          <th style={{ width: '7%', border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                            Unit
                          </th>
                          <th style={{ width: '14%', border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                            Rate
                          </th>
                          <th style={{ width: '15%', border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                            Amount<br />Rs.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* ROW 1: AUDIT REPORT CHARGES */}
                        <tr>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800 }}>
                            1
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 6px', fontWeight: 700 }}>
                            {formData.page2Charges?.row1Description || `${getAuditReportTitle(formData.auditDepartment)} (As per GPCB Guidelines)`}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>
                            {p2Calc.row1Qty}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>
                            {p2Calc.row1Unit}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                            {Number(p2Calc.auditFee).toLocaleString('en-IN')}/-
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800 }}>
                            {Number(p2Calc.row1Amount).toLocaleString('en-IN')}/-
                          </td>
                        </tr>

                        {/* ROW 2.1: TRANSPORTATION CHARGES */}
                        <tr>
                          <td rowSpan={3} style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            2
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                            <div>
                              Transportation charges for monitoring instrument/material for {p2Calc.transportDaysText || 'twelve days'}. [{p2Calc.visits} visits per year ({p2Calc.visits} X {p2Calc.daysPerVisit} Days/Visit)]. <span style={{ fontWeight: 700, fontSize: '8.5px' }}>(See Annexure I)</span>
                            </div>
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.transportQty}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.transportUnit}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.transportRatePerVisit).toLocaleString('en-IN')}/-
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.transportTotal).toLocaleString('en-IN')}/-
                          </td>
                        </tr>

                        {/* ROW 2.2: DEARNESS ALLOWANCE (DA) */}
                        <tr>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                            <div>
                              Dearness allowance for audit team members. ({p2Calc.daPersons} persons per day X {p2Calc.daDaysPerYear} days per year). <span style={{ fontWeight: 700, fontSize: '8.5px' }}>({p2Calc.daRatePerPerson} rate per person per day).</span>
                            </div>
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.daQty}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.daUnit}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.daRatePerVisit).toLocaleString('en-IN')}/-
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.daTotal).toLocaleString('en-IN')}/-
                          </td>
                        </tr>

                        {/* ROW 2.3: ACCOMMODATION FOR AUDITORS */}
                        <tr>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                            <div>
                              Accommodation For Auditors ({p2Calc.daPersons} persons per day X {p2Calc.daDaysPerYear} days per year). <span style={{ fontWeight: 700, fontSize: '8.5px' }}>(Stay in Hotel as {p2Calc.hotelRoomRate}/- x {p2Calc.hotelRoomsCount} Rooms per day = {p2Calc.dailyRoomCost}*{p2Calc.hotelNightsPerVisit}Nights i.e. {p2Calc.accomRatePerVisit} Per Visit)</span>
                            </div>
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.accomQty}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                            {p2Calc.accomUnit}
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.accomRatePerVisit).toLocaleString('en-IN')}/-
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            {Number(p2Calc.accomTotal).toLocaleString('en-IN')}/-
                          </td>
                        </tr>

                        {/* ROW 3: CHARGES FOR SAMPLING & ANALYSIS (ANNEXURE-A) */}
                        <tr>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 3px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                            3
                          </td>
                          <td style={{ border: '1px solid #0f172a', padding: '4px 6px', verticalAlign: 'middle' }}>
                            <div>
                              {formData.page2Charges?.samplingDescription || 'Charges for sampling & analysis of various samples including Water, Wastewater, Stack Emission, and Ambient air quality, Solid waste & Noise level etc. (See Annexure A)'}
                            </div>
                          </td>
                          <td colSpan={4} style={{ border: '1px solid #0f172a', padding: '4px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600 }}>As actual as per GPCB rates</div>
                            <div style={{ fontWeight: 800, marginTop: '2px' }}>
                              ({Number(p2Calc.samplingTotal).toLocaleString('en-IN')}/- ) (See Annexure)
                            </div>
                          </td>
                        </tr>

                        {/* SUMMARY / TOTAL ROW */}
                        <tr style={{ borderTop: '1.5px solid #0f172a', background: '#ffffff', fontWeight: 800 }}>
                          <td colSpan={2} style={{ border: '1px solid #0f172a', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '9px' }}>
                            Total (for Sr. no. 1 , 2 &amp; 3) Rs.
                          </td>
                          <td colSpan={4} style={{ border: '1px solid #0f172a', padding: '4px 8px', textAlign: 'center', fontWeight: 700, fontSize: '9px' }}>
                            ({Number(p2Calc.taxableTotal).toLocaleString('en-IN')}/- + GST {p2Calc.gstPercentage} %) = <span style={{ fontWeight: 800, textDecoration: 'underline' }}>{Number(p2Calc.grandTotal).toLocaleString('en-IN')}/-</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Note below Table */}
                    <div style={{ textAlign: 'center', marginTop: '4px', fontWeight: 800, fontSize: '9px', textDecoration: 'underline', color: '#0f172a' }}>
                      {formData.page2Charges?.bottomNoteText || 'Note: - Tax will be paid extra (GST 18%) apart from above rate / amount.'}
                    </div>
                  </div>
                );
              })()}

              {renderStandardPageFooter(2)}
            </div>

            {/* PAGE 3: TERMS & CONDITIONS */}
            <div id="preview-page-3" className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* CENTERED LOGO & DIVIDER */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img
                  src={getLogoUrl(masters.company)}
                  alt="Company Logo"
                  style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                />
              </div>
              <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '16px' }}></div>

              {/* TERMS & CONDITIONS HEADING */}
              <h3 style={{ fontSize: '13px', fontWeight: 800, textDecoration: 'underline', color: '#0f172a', margin: '0 0 14px 0' }}>
                Terms and conditions:
              </h3>

              {/* TERMS BODY (RICH TEXT CONTENT) */}
              <div className="terms-conditions-body" style={{ color: '#0f172a', lineHeight: 1.5, fontSize: '11px' }}>
                {renderRichContent(formData.termsText !== undefined ? formData.termsText : DEFAULT_TERMS_TEXT)}
              </div>

              {/* SIGNATORY & CONTACT PERSON BLOCK */}
              <div style={{ marginTop: '16px', fontSize: '11.5px', color: '#0f172a', marginBottom: '10px' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Thanking you in anticipation!</p>
                <p style={{ fontWeight: 700, margin: '0 0 8px 0' }}>For, Jagnath Lab Technologies</p>

                {/* SIGNATURE & STAMP ROW (PAGE 3) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '48px', margin: '4px 0' }}>
                  {formData.signatorySignature && (
                    <img src={formData.signatorySignature} alt="Signature" style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }} />
                  )}
                  {formData.stampImage && (
                    <img src={formData.stampImage} alt="Round Stamp" style={{ maxHeight: '55px', maxWidth: '90px', objectFit: 'contain' }} />
                  )}
                  {formData.stampImage2 && (
                    <img src={formData.stampImage2} alt="Address Stamp" style={{ maxHeight: '55px', maxWidth: '140px', objectFit: 'contain' }} />
                  )}
                </div>

                <p style={{ fontWeight: 700, margin: '4px 0 14px 0' }}>Authorized Signatory</p>

                <p style={{ fontWeight: 700, margin: '0 0 14px 0' }}>
                  Contact Person: - {formData.contactPerson || 'Ankit Mistry (+91 7226-0579-78)'}
                </p>
              </div>

              {renderStandardPageFooter(3)}
            </div>

            {/* ================= PAGE 4: ANNEXURE - I & ANNEXURE - A (Combined Same Page) ================= */}
            <div id="preview-page-4" className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '10mm 14mm 8mm 14mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '10.5px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* TOP HEADER: LOGO */}
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <img
                  src={getLogoUrl(masters.company)}
                  alt="Company Logo"
                  style={{ maxHeight: '70px', maxWidth: '240px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                />
              </div>
              <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '10px' }}></div>

              {/* 1. TITLE: ANNEXURE - I */}
              <div id="preview-annexure-1" style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.06em', color: '#0f172a' }}>
                  ANNEXURE - I
                </h2>
              </div>

              {/* ANNEXURE - I GRID TABLE */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9.5px', color: '#0f172a', marginBottom: '12px' }}>
                <tbody>
                  {/* ROW 1: AUDIT REPORT CHARGES */}
                  <tr>
                    <td style={{ width: '30px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      1
                    </td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px 8px', fontWeight: 700, verticalAlign: 'middle' }}>
                      {getAuditReportTitle(formData.auditDepartment)}
                    </td>
                    <td style={{ width: '95px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      {Number(formData.annexureI?.auditFee || 25000).toLocaleString('en-IN')}
                    </td>
                    <td style={{ width: '105px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      {Number(formData.annexureI?.auditFee || 25000).toLocaleString('en-IN')}/-
                    </td>
                    <td style={{ width: '115px', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                      {Number(formData.annexureI?.auditFee || 25000).toLocaleString('en-IN')}/-
                    </td>
                  </tr>

                  {/* ROW 2: MAIN TRANSPORTATION CHARGES (JLTs Vehicle) */}
                  {(() => {
                    const daysPerVisit = parseInt(formData.annexureI?.daysPerVisit ?? formData.page2Charges?.daysPerVisit, 10) || 4;
                    const visits = parseInt(formData.annexureI?.visits ?? formData.page2Charges?.visits, 10) || 3;
                    const totalDays = daysPerVisit * visits;
                    const jltRate = Number(formData.annexureI?.jltVehicleRatePerDay ?? formData.page2Charges?.jltVehicleRatePerDay ?? 5000);
                    const ratePerVisit = Number(formData.annexureI?.transportRatePerVisit !== undefined ? formData.annexureI.transportRatePerVisit : (formData.page2Charges?.transportRatePerVisit !== undefined ? formData.page2Charges.transportRatePerVisit : (jltRate * daysPerVisit)));
                    const transportTotal = Number(formData.annexureI?.transportTotalAmount !== undefined ? formData.annexureI.transportTotalAmount : (formData.page2Charges?.transportTotalAmount !== undefined ? formData.page2Charges.transportTotalAmount : (ratePerVisit * visits)));
                    const row2Text = (formData.annexureI?.row2Title || 'Transportation charges for monitoring instrument/material. (per day) + Total {totalDays} Days. (For JLTs Vehicle)').replace('{totalDays}', totalDays);

                    return (
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                          2
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'middle', lineHeight: 1.35 }}>
                          <div style={{ fontWeight: 700 }}>
                            {row2Text}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR PER DAY</div>
                          <div style={{ fontWeight: 800 }}>{Number(jltRate).toLocaleString('en-IN')}/-</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR {daysPerVisit} DAYS</div>
                          <div style={{ fontWeight: 800 }}>{Number(ratePerVisit).toLocaleString('en-IN')}/-</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px' }}>FOR {visits} VISITS</div>
                          <div style={{ fontWeight: 800 }}>{Number(transportTotal).toLocaleString('en-IN')}/-</div>
                        </td>
                      </tr>
                    );
                  })()}

                  {/* ROW 2A: OPTION 1 (CLIENT PROVIDED) */}
                  {(() => {
                    const opt1Text = (formData.annexureI?.option1Title || 'In Option 1 if transportation for both instruments and officers are provided by M/s. {clientName} then NILL charges.').replace('{clientName}', formData.clientName || 'Valued Client');
                    const opt1Sub = formData.annexureI?.option1Subtext || '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)';

                    return (
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                          <div style={{ marginBottom: '2px' }}>2</div>
                          <div>A</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.35 }}>
                          <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                            {opt1Text}
                          </div>
                          <div style={{ fontSize: '9px', color: '#334155' }}>
                            {opt1Sub}
                          </div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                          -
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                          -
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 6px', textAlign: 'left', fontSize: '8.8px', lineHeight: 1.35, color: '#1e293b', verticalAlign: 'top' }}>
                          {formData.annexureI?.decisionNote || 'It is to be decided by the Company. If Option 1 or Option 2 for TA is chosen, then JLTs Vehicle transportation would be removed. And actual DA billing is to be added at the time of billing.'}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* ROW 2B: OPTION 2 (AGENCY CHARGES) */}
                  {(() => {
                    const opt2Text = formData.annexureI?.option2Title || 'In Option 2 if transportation for both instruments and officers are provided by JLTs then it may increase as per charges of agency.';
                    const opt2Sub = formData.annexureI?.option2Subtext || '(As per govt. norms TWO different vehicles are to be hired by the unit in this case, i.e. one for instruments and other vehicle for auditors/engineers/officers.)';
                    const instLbl = formData.annexureI?.instrumentLabel || 'For Instruments,';
                    const audLbl = formData.annexureI?.auditorLabel || 'For Auditors,';

                    const instRate = Number(formData.annexureI?.instrumentKmRate !== undefined ? formData.annexureI.instrumentKmRate : 12);
                    const instKm = Number(formData.annexureI?.instrumentKmPerDay !== undefined ? formData.annexureI.instrumentKmPerDay : 300);
                    const instDaily = instRate * instKm;

                    const audRate = Number(formData.annexureI?.auditorKmRate !== undefined ? formData.annexureI.auditorKmRate : 15);
                    const audKm = Number(formData.annexureI?.auditorKmPerDay !== undefined ? formData.annexureI.auditorKmPerDay : 300);
                    const audDaily = audRate * audKm;

                    const combDaily = instDaily + audDaily;
                    const dPerVisit = parseInt(formData.annexureI?.daysPerVisit ?? formData.page2Charges?.daysPerVisit, 10) || 4;
                    const vCount = parseInt(formData.annexureI?.visits ?? formData.page2Charges?.visits, 10) || 3;
                    const combDays = combDaily * dPerVisit;
                    const combVisits = combDays * vCount;

                    return (
                      <tr>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                          <div style={{ marginBottom: '2px' }}>2</div>
                          <div>B</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.35 }}>
                          <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                            {opt2Text}
                          </div>
                          <div style={{ fontSize: '9px', color: '#334155', marginBottom: '4px' }}>
                            {opt2Sub}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '9.2px', color: '#0f172a' }}>
                            <div>{instLbl} <span style={{ fontWeight: 600 }}>INR {instRate} for {instKm} kms/day = {Number(instDaily).toLocaleString('en-IN')}/-</span></div>
                            <div style={{ marginTop: '2px' }}>{audLbl} <span style={{ fontWeight: 600 }}>INR {audRate} for {audKm} kms/day = {Number(audDaily).toLocaleString('en-IN')}/-</span></div>
                          </div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR PER DAY</div>
                          <div style={{ fontWeight: 800 }}>{Number(combDaily).toLocaleString('en-IN')}/-</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR {dPerVisit} DAYS</div>
                          <div style={{ fontWeight: 800 }}>{Number(combDays).toLocaleString('en-IN')}/-</div>
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '2px' }}>FOR {vCount} VISITS</div>
                          <div style={{ fontWeight: 800 }}>{Number(combVisits).toLocaleString('en-IN')}/-</div>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>

              {/* 2. TITLE: ANNEXURE -A (BELOW ANNEXURE-I) */}
              <div id="preview-annexure-a" style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a' }}>
                  ANNEXURE - A
                </h2>
              </div>

              {/* ANNEXURE - A 7-COLUMN TABLE */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '9.5px', color: '#0f172a', marginBottom: '10px' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                    <th style={{ width: '22%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      DESCRIPTIONS
                    </th>
                    <th style={{ width: '18%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      PARAMETERS TO BE MONITORED
                    </th>
                    <th style={{ width: '13%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      RATE PER SAMPLE
                    </th>
                    <th style={{ width: '8%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      VISITS
                    </th>
                    <th style={{ width: '15%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      NO. OF SAMPLE/QUARTER
                    </th>
                    <th style={{ width: '12%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      CHARGE PER VISIT/QUARTER
                    </th>
                    <th style={{ width: '12%', border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, fontSize: '9.5px', verticalAlign: 'middle' }}>
                      CHARGE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.activities || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #0f172a', padding: '14px 8px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', fontSize: '10px' }}>
                        No sampling activities / parameters loaded. Please select a Test Request (TRF) above to auto-populate.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {(formData.activities || []).map((act, aIdx) => {
                        const rowCalc = calculateAnnexureARowCharge(act, globalVisits);
                        return (
                          <tr key={act.id || aIdx}>
                            {/* 1. DESCRIPTIONS */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 5px', fontWeight: 600, verticalAlign: 'middle', lineHeight: 1.3 }}>
                              {act.description}
                            </td>
                            {/* 2. PARAMETERS TO BE MONITORED */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', verticalAlign: 'middle', lineHeight: 1.3 }}>
                              {act.parametersMonitored || `As per annexure- B, Sr. No. ${act.srNo || aIdx + 1}`}
                            </td>
                            {/* 3. RATE PER SAMPLE */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                              {Number(rowCalc.rate).toLocaleString('en-IN')}/-
                            </td>
                            {/* 4. VISITS (Vertically centered spanning all rows) */}
                            {aIdx === 0 ? (
                              <td
                                rowSpan={(formData.activities || []).length}
                                style={{
                                  border: '1px solid #0f172a',
                                  padding: '5px 4px',
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  verticalAlign: 'middle',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                {globalVisits}
                              </td>
                            ) : null}
                            {/* 5. NO. OF SAMPLE/QUARTER */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 600, verticalAlign: 'middle' }}>
                              {act.sampleQuarter || `${String(act.sampleQty || 1).padStart(2, '0')} Sample`}
                            </td>
                            {/* 6. CHARGE PER VISIT/QUARTER */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle' }}>
                              {Number(rowCalc.chargePerVisit).toLocaleString('en-IN')}/-
                            </td>
                            {/* 7. CHARGE */}
                            <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                              {Number(rowCalc.totalCharge).toLocaleString('en-IN')}/-
                            </td>
                          </tr>
                        );
                      })}

                      {/* TOTAL ROW */}
                      <tr style={{ borderTop: '1.5px solid #0f172a', background: '#ffffff', fontWeight: 800 }}>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 5px', fontWeight: 800, textAlign: 'center' }}>
                          Total
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px' }}></td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                          {Number(annexureATotals.totalRate).toLocaleString('en-IN')}/-
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}>
                          -
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px' }}></td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                          {Number(annexureATotals.totalChargePerVisit).toLocaleString('en-IN')}/-
                        </td>
                        <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800 }}>
                          {Number(annexureATotals.totalAnnualCharge).toLocaleString('en-IN')}/-
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* BREAK-UP OF ALL ANALYSIS CHARGES NOTE */}
              <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11px', textDecoration: 'underline', letterSpacing: '0.04em', color: '#0f172a', marginBottom: '8px' }}>
                  {formData.annexureANoteTitle || `BREAK-UP OF ALL ANALYSIS CHARGES FOR AUDIT ${(formData.financialYear || '2024-2025').replace(/^YEAR\s*/i, '')}`}
                </div>
                <p style={{ fontSize: '9.5px', lineHeight: 1.45, color: '#0f172a', margin: '0', textAlign: 'left', fontWeight: 500 }}>
                  {formData.annexureANoteText || 'The rates are indicative and may vary as per actual visits/work undertaken: Nos. of Days spent on site: Sampling and testing requirements: revision of rates from GPCB and any additional visit undertaken for additional data collection.'}
                </p>
              </div>

              {renderStandardPageFooter(4)}
            </div>

            {/* ================= PAGE 5: ANNEXURE - B (Discipline Groups & Parameters) ================= */}
            {(() => {
              const allGroups = formData.annexureB || [];
              if (!allGroups.length) return null;
              const page5Groups = allGroups.length > 3 ? allGroups.slice(0, 3) : allGroups;
              const page6Groups = allGroups.length > 3 ? allGroups.slice(3) : [];

              return (
                <>
                  <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* TOP HEADER: LOGO */}
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <img
                        src={getLogoUrl(masters.company)}
                        alt="Company Logo"
                        style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                        onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                      />
                    </div>
                    <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '14px' }}></div>

                    {/* TITLE: Annexure -B */}
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', fontStyle: 'italic', letterSpacing: '0.04em', color: '#0f172a' }}>
                        Annexure -B
                      </h2>
                    </div>

                    {/* ANNEXURE - B TABLE */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '10.5px', color: '#0f172a', marginBottom: '14px' }}>
                      <thead>
                        <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                          <th style={{ width: '8%', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                            Sr. No.
                          </th>
                          <th style={{ width: '74%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                            DESCRIPTIONS
                          </th>
                          <th style={{ width: '18%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                            RATE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {page5Groups.map((group, gIdx) => {
                          const groupTotal = calculateGroupTotal(group);
                          return (
                            <React.Fragment key={group.id || gIdx}>
                              {/* Group Header Row */}
                              <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                                  {group.srNo}
                                </td>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 8px', fontWeight: 800, color: '#0f172a' }}>
                                  {group.category}
                                </td>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800 }}>
                                </td>
                              </tr>

                              {/* Parameter Rows */}
                              {(group.parameters || []).map((param, pIdx) => (
                                <tr key={param.id || pIdx}>
                                  <td style={{ border: '1px solid #0f172a', padding: '3.5px 4px', textAlign: 'center' }}></td>
                                  <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px 3.5px 16px', color: '#1e293b' }}>
                                    {param.description}
                                  </td>
                                  <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                    {Number(param.rate || 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}

                              {/* Subtotal Row */}
                              <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}></td>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                  Total ({group.category}):
                                </td>
                                <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                  {Number(groupTotal).toLocaleString('en-IN')}/-
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>

                    {renderStandardPageFooter(5)}
                  </div>

                  {/* PAGE 6 (IF NEEDED FOR OVERFLOW GROUPS) */}
                  {page6Groups.length > 0 && (
                    <div className="a4-sheet" style={{ width: '100%', minHeight: 'auto', padding: '12mm 15mm 10mm 15mm', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '11px', background: '#ffffff', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      {/* TOP HEADER: LOGO */}
                      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                        <img
                          src={getLogoUrl(masters.company)}
                          alt="Company Logo"
                          style={{ maxHeight: '85px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                          onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
                        />
                      </div>
                      <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '14px' }}></div>

                      {/* TITLE: Annexure -B (Contd.) */}
                      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textDecoration: 'underline', fontStyle: 'italic', letterSpacing: '0.04em', color: '#0f172a' }}>
                          Annexure -B (Contd.)
                        </h2>
                      </div>

                      {/* TABLE */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #0f172a', fontSize: '10.5px', color: '#0f172a', marginBottom: '14px' }}>
                        <thead>
                          <tr style={{ background: '#ffffff', borderBottom: '1.5px solid #0f172a' }}>
                            <th style={{ width: '8%', border: '1px solid #0f172a', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                              Sr. No.
                            </th>
                            <th style={{ width: '74%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                              DESCRIPTIONS
                            </th>
                            <th style={{ width: '18%', border: '1px solid #0f172a', padding: '6px 8px', textAlign: 'center', fontWeight: 800, fontSize: '10.5px' }}>
                              RATE
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {page6Groups.map((group, gIdx) => {
                            const groupTotal = calculateGroupTotal(group);
                            return (
                              <React.Fragment key={group.id || gIdx}>
                                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                                    {group.srNo}
                                  </td>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 8px', fontWeight: 800, color: '#0f172a' }}>
                                    {group.category}
                                  </td>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800 }}>
                                  </td>
                                </tr>

                                {(group.parameters || []).map((param, pIdx) => (
                                  <tr key={param.id || pIdx}>
                                    <td style={{ border: '1px solid #0f172a', padding: '3.5px 4px', textAlign: 'center' }}></td>
                                    <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px 3.5px 16px', color: '#1e293b' }}>
                                      {param.description}
                                    </td>
                                    <td style={{ border: '1px solid #0f172a', padding: '3.5px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                      {Number(param.rate || 0).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}

                                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 4px', textAlign: 'center' }}></td>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                    Total ({group.category}):
                                  </td>
                                  <td style={{ border: '1px solid #0f172a', padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                    {Number(groupTotal).toLocaleString('en-IN')}/-
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>

                      {renderStandardPageFooter(6)}
                    </div>
                  )}
                </>
              );
            })()}

              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisionalQuotationForm;
