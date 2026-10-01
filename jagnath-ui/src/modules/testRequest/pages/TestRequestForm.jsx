import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCheck, FaExclamationCircle, FaEye, FaEyeSlash,
  FaSave, FaPrint, FaPlus, FaTrash, FaTimes, FaSpinner, FaFilePdf,
  FaSearch, FaChevronLeft, FaChevronRight, FaUpload
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  DEPARTMENT_ENDPOINTS,
  PARAMETER_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  CAUTION_ENDPOINTS,
  PRICE_MASTER_ENDPOINTS,
  SUB_CATEGORY_ENDPOINTS,
  LOCATION_SAMPLE_ENDPOINTS,
  BACKEND_ROOT_URL,
  API_BASE_URL
} from '../../../shared/services/apiEndpoints';
import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';
import AddMasterButton from '../../../shared/components/InlineMasterModal/AddMasterButton';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';
import { INDUSTRY_TYPES, INDUSTRY_PRICES, INDUSTRY_LABELS } from '../../../shared/constants/industryConstants';

const DEFAULT_INTRO_TEXT = `With the reference to above subject we are herewith sending our offer.

JLTs - A state of art laboratory facility and an independent company offering high quality technical services in the chemical and biological sciences. Services are provided in the disciplines of environmental consulting, Water and Waste water treatment, field sampling and environmental monitoring. The firm is a privately held corporation and is not a subsidiary of another company. With adequate expertise, trained man power and dedicated team work, its product is accurate and timely technical information provided confidentially at a reasonable cost.

Also It is our proud privilege to inform you that--

We are accredited by NABL ; ISO17025:2017 and also recognized by Gujarat Pollution Control Board, Government of Gujarat - Gandhinagar, along with the recognition as Schedule - II Environmental Auditors wide letter no. GPCB/EAC/SCH-II/124/852220 under the Honorable High Court; Gujarat orders.`;

const DEFAULT_SCOPE_TEXT = `• Method of collection and analysis must be approved / recognized by GPCB / CPCB / MoEF&CC.
• Collection of sample and preservation of sample be made as per GPCB/CPCB or IS/APHA guidelines.
• Mode of Transportation for instruments and Dearness Allowance for Audit Officers to your Unit.
• If any one of above is provided by you to the auditors, which are arranged by you then charges for same as mentioned below is not to be considered.
• For the audit fee, Rs. 15,000/- for small scale, Rs. 20,000/- for medium scale and Rs. 25,000/- for large scale shall be considered.
• Final Quote is to be submitted at a time after our first visit to your UNIT, Below Quote is just a Provisional Estimated Quote that is made as per your units Consent by GPCB.`;

const DEFAULT_TERMS_TEXT = `1. The unit shall supply all the data as and when required by Environment Auditor.
2. The sample collection will be made in each visit.
3. During our visit to your site, our vehicle shall be allowed in your premises and one skilled male labour to be provided by you for our assistance.
4. Charges for sampling & analysis of various samples including water, wastewater, air, stack, hazardous waste, solid waste & noise level etc. will be paid extra as actual as per GPCB guidelines after completion of each visit work.
5. Payment shall be made as per the actual works completed after each visit.
6. The payments should be made by RTGS/NEFT drawn in favours of "JAGNATH LAB TECHNOLOGIES" payable at GONDAL. (Refer - As docs submitted by our side (JLTs) at a time of vendor Registration)
7. 100% payment in advance (Including 18% GST) or 50% of the payments + Applicable GST 18% at the time of awarding the job is to be given, balance of the payment remaining from your side is to be submitted after our draft report procedure BUT BEFORE the final (FAR) report submission.
8. Our Environment Audit Team members are highly qualified. They are of professional degree holder and class -1 cadre so, they deserve "A" Grade residential, travelling and other hospitality.
9. For any late payment charges penalty is to be raised at 24% of invoice. (Payment Terms - 30 Days)
10. Dearness Allowance is to be provided by your unit.`;

const DEFAULT_CHARGES = [
  { srNo: 1, description: "Environment audit report charges (As per GPCB Guidelines)", qty: 1, unit: "No.", rate: 25000, amount: 25000 },
  { srNo: 2, description: "Transportation charges for monitoring instrument/material for six days. (3 visits per year (3 X 3 Days/Visit))", qty: 3, unit: "Visit", rate: 15000, amount: 45000 },
  { srNo: 3, description: "Dearness allowance for audit team members. (4 persons per day X 9 days per year). (520 rate per person per day)", qty: 3, unit: "Visit", rate: 6240, amount: 18720 },
  { srNo: 4, description: "Accommodation For Auditors (4 persons per day X 9 days per year). (Stay in Hotel as 3000/- x 2 Rooms per day = 6000*2Nights i.e. 12000 Per Visit)", qty: 3, unit: "Visit", rate: 12000, amount: 36000 },
  { srNo: 5, description: "Charges for sampling & analysis of various samples including Water, Wastewater, Stack Emission, and Ambient air quality, Solid waste & Noise level etc. (See Annexure A)", qty: 1, unit: "L.S.", rate: 629490, amount: 629490 }
];

const DEFAULT_ANNEXURE = [
  { category: "1. Effluent Water Analysis (Inlet)", description: "Sample Preparation Charges to send fri", ratePerSample: 700, samplePerVisit: 1, chargesPerVisit: 700, total: 2100 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Temperature", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Colour (pt.co.scale)", ratePerSample: 175, samplePerVisit: 1, chargesPerVisit: 175, total: 525 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Oil And Grease", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "COD", ratePerSample: 420, samplePerVisit: 1, chargesPerVisit: 420, total: 1260 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "BOD (3 days at 27 C)", ratePerSample: 560, samplePerVisit: 1, chargesPerVisit: 560, total: 1680 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Chloride", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Sulphate", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "1. Effluent Water Analysis (Inlet)", description: "Total Dissolved Solids", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "2. Treatment plant stage wise sampling", description: "pH", ratePerSample: 110, samplePerVisit: 4, chargesPerVisit: 440, total: 1320 },
  { category: "2. Treatment plant stage wise sampling", description: "TSS", ratePerSample: 180, samplePerVisit: 4, chargesPerVisit: 720, total: 2160 },
  { category: "2. Treatment plant stage wise sampling", description: "TDS", ratePerSample: 270, samplePerVisit: 4, chargesPerVisit: 1080, total: 3240 },
  { category: "2. Treatment plant stage wise sampling", description: "COD", ratePerSample: 420, samplePerVisit: 4, chargesPerVisit: 1680, total: 5040 },
  { category: "2. Treatment plant stage wise sampling", description: "BOD", ratePerSample: 560, samplePerVisit: 4, chargesPerVisit: 2240, total: 6720 },
  { category: "2. Treatment plant stage wise sampling", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "A. Integrated Sample Collection Charges (For Physical & Chemical Parameters)", ratePerSample: 1500, samplePerVisit: 1, chargesPerVisit: 1500, total: 4500 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Temperature", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Colour (pt.co.scale)", ratePerSample: 175, samplePerVisit: 1, chargesPerVisit: 175, total: 525 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Oil And Grease", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Phenolic Compound", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Ammonical Nitrogen", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "BOD (3days at 27 C)", ratePerSample: 560, samplePerVisit: 1, chargesPerVisit: 560, total: 1680 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "COD", ratePerSample: 420, samplePerVisit: 1, chargesPerVisit: 420, total: 1260 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Chlorides", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sulphates", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Total dissolved solids", ratePerSample: 270, samplePerVisit: 1, chargesPerVisit: 270, total: 810 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sodium Absorption Ratio", ratePerSample: 1850, samplePerVisit: 1, chargesPerVisit: 1850, total: 5550 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Percent Sodium", ratePerSample: 1850, samplePerVisit: 1, chargesPerVisit: 1850, total: 5550 },
  { category: "3. Effluent Water Analysis (Outlet)", description: "Sulphides", ratePerSample: 350, samplePerVisit: 1, chargesPerVisit: 350, total: 1050 },
  { category: "3-B. STP Water Analysis", description: "BOD", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "3-B. STP Water Analysis", description: "Suspended Solids", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3-B. STP Water Analysis", description: "Fecal Coliform", ratePerSample: 700, samplePerVisit: 1, chargesPerVisit: 700, total: 2100 },
  { category: "3-B. STP Water Analysis", description: "pH", ratePerSample: 110, samplePerVisit: 1, chargesPerVisit: 110, total: 330 },
  { category: "3-B. STP Water Analysis", description: "TSS", ratePerSample: 180, samplePerVisit: 1, chargesPerVisit: 180, total: 540 },
  { category: "3-B. STP Water Analysis", description: "Grab Sampling", ratePerSample: 960, samplePerVisit: 1, chargesPerVisit: 960, total: 2880 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Sampling 24 hrs", ratePerSample: 11500, samplePerVisit: 1, chargesPerVisit: 11500, total: 34500 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for SO2", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for NOx", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for PM 10", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "4. Ambient Air Quality Quality Monitoring (24 hrs)", description: "Analysis for PM 2.5", ratePerSample: 1800, samplePerVisit: 1, chargesPerVisit: 1800, total: 5400 },
  { category: "5. Stack Emission Monitoring", description: "Sampling/ Measurements charges for stack", ratePerSample: 9600, samplePerVisit: 1, chargesPerVisit: 9600, total: 28800 },
  { category: "5. Stack Emission Monitoring", description: "Sampling of SO2/NOx", ratePerSample: 3500, samplePerVisit: 1, chargesPerVisit: 3500, total: 10500 },
  { category: "5. Stack Emission Monitoring", description: "Analysis SPM", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "5. Stack Emission Monitoring", description: "Analysis of SO2", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "5. Stack Emission Monitoring", description: "Analysis of NOx", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "6. Process Stack Emission", description: "Sampling/ Measurements charges for stack", ratePerSample: 9600, samplePerVisit: 1, chargesPerVisit: 9600, total: 28800 },
  { category: "6. Process Stack Emission", description: "Analysis SPM", ratePerSample: 1050, samplePerVisit: 1, chargesPerVisit: 1050, total: 3150 },
  { category: "7. Noise", description: "For 08 Hours continuous monitoring", ratePerSample: 18000, samplePerVisit: 1, chargesPerVisit: 18000, total: 54000 }
];

const TestRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Inline Master Modal State
  const [inlineModal, setInlineModal] = useState({ isOpen: false, type: null, parentData: {} });

  // State for dropdown options
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [cautions, setCautions] = useState([]);
  const [locationSamples, setLocationSamples] = useState([]);
  const [priceMasterMap, setPriceMasterMap] = useState({});
  const [paramMetaMap, setParamMetaMap] = useState({});

  // Multi-Sample / Location Groups State for Testing Parameters & Quotation
  const [sampleGroups, setSampleGroups] = useState([
    {
      id: 'grp_1',
      title: 'Location 1',
      locationOfSample: '',
      departmentId: '',
      categoryIds: [],
      subCategoryId: '',
      checkedParameters: {},
      selectedParamSequence: []
    }
  ]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // State for dynamic parameter checklist & pagination
  const [isGpcbOnly, setIsGpcbOnly] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [checkedParameters, setCheckedParameters] = useState({});
  const [selectedParamSequence, setSelectedParamSequence] = useState([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [paramPage, setParamPage] = useState(1);
  const [paramSearch, setParamSearch] = useState('');
  const [paramPageSize, setParamPageSize] = useState(10);
  const [clientEmails, setClientEmails] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const emailDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(event.target)) {
        setShowEmailDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    companyId: '',
    clientId: '',
    address: '',
    email: '',
    locationOfSample: '',
    contactPerson: '',
    contactNumber: '',
    dateOfCollection: '',
    dateOfReceipt: '',
    sampleCollectedBy: '',
    sampleQuantity: '',
    fieldDataSheet: 'Not Available',
    packingDetails: '',
    sampleIdNumber: '',
    reportNumber: '',
    sampleParticular: '',
    categoryId: '',
    subCategoryId: '',
    departmentId: '',
    equipmentAvailability: 'Available',
    referenceStandardAvailability: 'Available',
    sampleAdequacy: 'Adequate',
    testMethodAvailability: 'Available',
    trainedPersonAvailability: 'Available',
    tentativeDays: '',
    sampleTestingFacilityReviewedBy: '',
    customerRepresentativeName: '',
    sampleReceiverName: '',
    testProtocol: '',
    remarks: '',
    formTitle: '',
    formType: 'Regular',
    includeCaution: false,
    cautionId: '',
    quotationRequired: 'No',
    quotationType: '',
    industryType: '',
    industryPrice: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [savedRequestId, setSavedRequestId] = useState(id || null);
  const printRef = useRef();

  const [activePreviewTab, setActivePreviewTab] = useState('TRF');
  const [quotationData, setQuotationData] = useState({
    id: '',
    testRequestId: '',
    companyId: '',
    clientId: '',
    quotationNumber: '',
    quotationDate: '',
    revisedDate: '',
    financialYear: '',
    reference: '',
    subject: '',
    introText: '',
    accreditationText: '',
    scopeText: '',
    termsText: '',
    charges: [],
    annexure: [],
    contactPerson: '',
    signatoryName: '',
    signatoryDesignation: '',
    signatorySignature: '',
    stampImage: '',
  });

  const signatureInputRef = useRef();
  const stampInputRef = useRef();

  const formatDateLocal = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const handleQuotationChange = (e) => {
    const { name, value } = e.target;
    setQuotationData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuotationChargeRowChange = (index, field, val) => {
    setQuotationData(prev => {
      const updated = [...prev.charges];
      updated[index] = { ...updated[index], [field]: val };
      if (field === 'qty' || field === 'rate') {
        const qty = parseFloat(field === 'qty' ? val : updated[index].qty) || 0;
        const rate = parseFloat(field === 'rate' ? val : updated[index].rate) || 0;
        updated[index].amount = Math.round(qty * rate);
      }
      return { ...prev, charges: updated };
    });
  };

  const addQuotationChargeRow = () => {
    setQuotationData(prev => ({
      ...prev,
      charges: [
        ...prev.charges,
        { srNo: prev.charges.length + 1, description: '', qty: 1, unit: 'No.', rate: 0, amount: 0 }
      ]
    }));
  };

  const removeQuotationChargeRow = (index) => {
    setQuotationData(prev => {
      const filtered = prev.charges.filter((_, i) => i !== index);
      const updated = filtered.map((item, idx) => ({ ...item, srNo: idx + 1 }));
      return { ...prev, charges: updated };
    });
  };

  const handleQuotationAnnexureRowChange = (index, field, val) => {
    setQuotationData(prev => {
      const updated = [...prev.annexure];
      updated[index] = { ...updated[index], [field]: val };
      if (field === 'ratePerSample' || field === 'samplePerVisit' || field === 'chargesPerVisit') {
        const rate = parseFloat(field === 'ratePerSample' ? val : updated[index].ratePerSample) || 0;
        const samples = parseInt(field === 'samplePerVisit' ? val : updated[index].samplePerVisit) || 0;
        updated[index].chargesPerVisit = rate * samples;
        updated[index].total = rate * samples * 3;
      }
      return { ...prev, annexure: updated };
    });
  };

  const handleQuotationFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setQuotationData(prev => ({ ...prev, [field]: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQuotationImage = (field) => {
    setQuotationData(prev => ({ ...prev, [field]: '' }));
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    fetchCautions();
    fetchLocationSamples();
    fetchInitialData();

    const handleCompanyChange = () => {
      fetchInitialData();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Handle Audit Quotation loading or default pre-population
  useEffect(() => {
    const initializeAuditQuotation = async () => {
      if (formData.quotationRequired === 'Yes' && formData.quotationType === 'Audit') {
        // Automatically switch right preview tab to Quotation
        setActivePreviewTab('Quotation');

        // Check if we need to load or initialize
        const targetId = id || savedRequestId;
        if (targetId) {
          try {
            const qRes = await apiService.get(`${API_BASE_URL}/audit-quotation/test-request/${targetId}`);
            if (qRes?.data) {
              const q = qRes.data;
              setQuotationData({
                id: q.id || '',
                testRequestId: q.testRequestId || targetId,
                companyId: q.companyId || formData.companyId,
                clientId: q.clientId || formData.clientId,
                quotationNumber: q.quotationNumber || '',
                quotationDate: q.quotationDate || '',
                revisedDate: q.revisedDate || '',
                financialYear: q.financialYear || '',
                reference: q.reference || '',
                subject: q.subject || '',
                introText: q.introText || '',
                accreditationText: q.accreditationText || '',
                scopeText: q.scopeText || '',
                termsText: q.termsText || '',
                charges: q.charges || [],
                annexure: q.annexure || [],
                contactPerson: q.contactPerson || '',
                signatoryName: q.signatoryName || '',
                signatoryDesignation: q.signatoryDesignation || '',
                signatorySignature: q.signatorySignature || '',
                stampImage: q.stampImage || '',
              });
              return;
            }
          } catch (e) {
            console.log("No existing quotation found for test request, applying defaults", e);
          }
        }

        // Initialize with default values if not found or no ID yet
        const currentYear = new Date().getFullYear();
        const nextYearShort = String(currentYear + 1).slice(-2);
        const finYear = `YEAR ${currentYear}-${nextYearShort}`;
        const subject = `PROVISIONAL ESTIMATED QUOTATION FOR CARRYING OUT ENVIRONMENTAL AUDIT OF YOUR UNIT [PCBID- ] FOR ${finYear}.`;

        const mm = String(new Date().getMonth() + 1).padStart(2, '0');
        const yy = String(new Date().getFullYear()).slice(-2);
        const quotationNumber = `Q-P.I :- JLT/EAC/${mm}${yy}/AH111`;

        setQuotationData(prev => {
          // If already initialized for this test request, keep it
          const currentTrId = targetId || 'temp';
          if (prev.testRequestId === currentTrId && prev.quotationNumber) {
            return prev;
          }
          return {
            id: '',
            testRequestId: currentTrId,
            companyId: formData.companyId || '',
            clientId: formData.clientId || '',
            quotationNumber: prev.quotationNumber || quotationNumber,
            quotationDate: prev.quotationDate || formatDateLocal(new Date()),
            revisedDate: prev.revisedDate || '',
            financialYear: prev.financialYear || finYear,
            reference: prev.reference || "GPCB - ENVIRONMENT AUDIT CELL (As per order of Hon'ble High Court of Gujarat)",
            subject: prev.subject || subject,
            introText: prev.introText || DEFAULT_INTRO_TEXT,
            accreditationText: prev.accreditationText || '',
            scopeText: prev.scopeText || DEFAULT_SCOPE_TEXT,
            termsText: prev.termsText || DEFAULT_TERMS_TEXT,
            charges: prev.charges?.length ? prev.charges : DEFAULT_CHARGES,
            annexure: prev.annexure?.length ? prev.annexure : DEFAULT_ANNEXURE,
            contactPerson: prev.contactPerson || "Ankit Mistry (+91 72260-57978)",
            signatoryName: prev.signatoryName || "Purvin Raiyani",
            signatoryDesignation: prev.signatoryDesignation || "Proprietor",
            signatorySignature: prev.signatorySignature || '',
            stampImage: prev.stampImage || '',
          };
        });
      } else {
        setActivePreviewTab('TRF');
      }
    };

    initializeAuditQuotation();
  }, [formData.quotationRequired, formData.quotationType, formData.clientId, formData.companyId, id, savedRequestId, clients]);


  // Helper to generate next Report No in format JLT01[MM][YY]RR[XXXXX] starting at 00320
  const generateNextReportNumber = (allRequests) => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateStr = `${mm}${yy}`;
    const prefix = `JLT01${dateStr}RR`;

    if (!allRequests || allRequests.length === 0) {
      return `${prefix}00320`;
    }

    const validReportNos = allRequests
      .map(r => r.reportNumber || r.report_number || '')
      .filter(num => num && num.startsWith(prefix));

    let maxNum = 319; // next will be 320

    validReportNos.forEach(repNo => {
      const parts = repNo.split('RR');
      if (parts.length === 2) {
        const seqVal = parseInt(parts[1], 10);
        if (!isNaN(seqVal) && seqVal > maxNum) {
          maxNum = seqVal;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  };

  const getSelectedCompanyLogo = () => {
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    if (selectedCompany) {
      const logoPath = selectedCompany.test_request_logo || selectedCompany.testRequestLogo || selectedCompany.logo;
      if (logoPath) {
        const cleanPath = logoPath.replace(/\\/g, '/');
        const idx = cleanPath.lastIndexOf('uploads/');
        if (idx !== -1) {
          return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
        }
        return logoPath;
      }
    }
    return '/Images/Navbar_Logo.png';
  };

  const fetchCategories = async () => {
    try {
      const activeCompId = formData.companyId || localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CATEGORY_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CATEGORY_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const catList = Array.isArray(res.data) ? res.data : [res.data];
        setCategories(catList.filter(cat => cat.status === 'Active'));
      }
    } catch (err) {
      console.error("Error fetching categories", err);
    }
  };

  const fetchClients = async (companyId = formData.companyId) => {
    try {
      const targetCompanyId = companyId || localStorage.getItem('selectedCompanyId') || '';
      const url = targetCompanyId ? `${CLIENT_ENDPOINTS.GET_ALL}?companyId=${targetCompanyId}` : CLIENT_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const clList = Array.isArray(res.data) ? res.data : [res.data];
        setClients(clList.filter(c => c.status === 'Active'));
      }
    } catch (err) {
      console.error("Error fetching clients", err);
    }
  };

  const fetchCautions = async () => {
    try {
      const activeCompId = formData.companyId || localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CAUTION_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CAUTION_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setCautions(list.filter(c => c.status === 'Active'));
      }
    } catch (err) {
      console.error("Error fetching cautions", err);
    }
  };

  const fetchLocationSamples = async () => {
    try {
      const activeCompId = formData.companyId || localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&status=Active` : `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?status=Active`;
      const res = await apiService.get(url);
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || [res.data]);
        setLocationSamples(list);
      }
    } catch (err) {
      console.error("Error fetching location samples", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      let tr = null;
      let targetCompanyId = '';

      // 1. If editing, load the test request details first to determine target company ID
      if (isEditing) {
        try {
          const trRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(id));
          if (trRes?.data) {
            tr = trRes.data;
            if (tr.companyId) {
              targetCompanyId = tr.companyId;
            }
          }
        } catch (e) {
          console.error("Error loading test request details", e);
        }
      }

      if (!targetCompanyId) {
        targetCompanyId = localStorage.getItem('selectedCompanyId') || '';
      }

      // 2. Fetch other resources concurrently using the target company context
      const [compRes, cautionRes, priceRes, deptRes, catRes] = await Promise.all([
        apiService.get(COMPANY_ENDPOINTS.GET_MY),
        apiService.get(CAUTION_ENDPOINTS.GET_ALL),
        apiService.get(PRICE_MASTER_ENDPOINTS.GET_ALL),
        apiService.get(`${DEPARTMENT_ENDPOINTS.GET_ALL}?companyId=${targetCompanyId}&status=Active&limit=500&gpcbOnly=false&isGpcb=false`),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL)
      ]);

      const cList = Array.isArray(compRes?.data) ? compRes.data : [compRes?.data];
      if (compRes?.data) setCompanies(cList);

      if (deptRes?.data) {
        setDepartments(deptRes.data.rows || deptRes.data || []);
      }

      if (catRes?.data) {
        const catList = Array.isArray(catRes.data) ? catRes.data : [catRes.data];
        setCategories(catList.filter(cat => cat.status === 'Active'));
      }

      if (cautionRes?.data) {
        const cautionList = Array.isArray(cautionRes.data) ? cautionRes.data : [cautionRes.data];
        setCautions(cautionList.filter(c => c.status === true || c.status === 'Active'));
      }

      if (priceRes?.data) {
        const priceList = Array.isArray(priceRes.data) ? priceRes.data : [priceRes.data];
        const pMap = {};
        priceList.forEach(p => {
          if (p.parameterId && (p.status === 'Active' || p.status === true)) {
            pMap[p.parameterId] = parseFloat(p.price || 0);
          }
        });
        setPriceMasterMap(pMap);
      }

      // Fetch all parameters metadata to globally cache names and test methods across all testing location groups
      try {
        const allParamsRes = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true`);
        const allParamsList = Array.isArray(allParamsRes?.data) ? allParamsRes.data : (allParamsRes?.data?.rows || []);
        const metaObj = {};
        allParamsList.forEach(p => {
          if (p.id) {
            metaObj[p.id] = {
              id: p.id,
              parameterName: p.parameterName || p.name || 'Parameter',
              testMethod: p.testMethod || p.defaultTestMethod || p.test_method || '',
              price: parseFloat(p.price || 0),
              categoryId: p.categoryId,
              subCategoryId: p.subCategoryId
            };
          }
        });
        setParamMetaMap(metaObj);
      } catch (e) {
        console.error("Error fetching all parameters metadata", e);
      }

      // Finalize targetCompanyId fallback check
      if (!targetCompanyId && cList.length > 0) {
        targetCompanyId = cList[0].id;
      }

      // 3. Fetch clients for that target company (not the system default company)
      const clientRes = await apiService.get(
        targetCompanyId
          ? `${CLIENT_ENDPOINTS.GET_ALL}?companyId=${targetCompanyId}`
          : CLIENT_ENDPOINTS.GET_ALL
      );
      const clList = Array.isArray(clientRes?.data) ? clientRes.data : [clientRes?.data];
      if (clientRes?.data) {
        setClients(clList.filter(client => client.status === 'Active'));
      }

      // 4. If editing, pre-fill form fields
      if (isEditing && tr) {
        const matchingComp = cList.find(c => c.id === tr.companyId || (c.companyName || c.company_name) === tr.companyName) || {};
        const matchingClient = clList.find(c => c.id === tr.clientId || c.clientName === tr.clientName) || {};
        const emailsList = (matchingClient.emails && matchingClient.emails.length > 0)
          ? matchingClient.emails
          : (matchingClient.email ? matchingClient.email.split(',').map(e => e.trim()).filter(Boolean) : []);
        setClientEmails(emailsList);

        let savedSubCatId = tr.subCategoryId || tr.sub_category_id || '';
        let savedCategoryId = tr.categoryId || tr.category_id || (tr.sampleParticular && tr.sampleParticular.length === 36 ? tr.sampleParticular : '');
        let savedDepartmentId = tr.departmentId || tr.department_id || '';
        const savedSampleParticular = (tr.sampleParticular && tr.sampleParticular.length === 36) ? '' : (tr.sampleParticular || '');

        if (!savedDepartmentId && savedCategoryId) {
          const matchedCat = (catRes?.data?.rows || catRes?.data || []).find(c => String(c.id) === String(savedCategoryId));
          if (matchedCat) {
            savedDepartmentId = matchedCat.departmentId || matchedCat.department_id || '';
          }
        }

        // Fetch checked parameters and construct sample groups
        const rawGroups = tr.sampleGroups || tr.sample_groups;
        let initialSampleGroups = [];
        if (Array.isArray(rawGroups) && rawGroups.length > 0) {
          initialSampleGroups = rawGroups.map((g, idx) => ({
            id: g.id || `grp_${Date.now()}_${idx}`,
            title: g.title || `${idx + 1}. ${g.locationOfSample || 'Sample Location ' + (idx + 1)}`,
            locationOfSample: g.locationOfSample || '',
            departmentId: g.departmentId || '',
            categoryIds: Array.isArray(g.categoryIds) ? g.categoryIds : (g.categoryId ? [g.categoryId] : []),
            subCategoryId: g.subCategoryId || '',
            checkedParameters: {},
            selectedParamSequence: []
          }));
        }

        try {
          const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
          if (trpRes?.data) {
            const trps = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data.rows || [trpRes.data]);
            const matchingTrps = trps.filter(t => String(t.testRequestId) === String(id));
            matchingTrps.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

            if (initialSampleGroups.length > 0) {
              matchingTrps.forEach(t => {
                const pId = t.parameterId;
                if (!pId) return;
                let targetGrp = null;
                if (t.groupId) {
                  targetGrp = initialSampleGroups.find(g => g.id === t.groupId);
                }
                if (!targetGrp && t.locationOfSample) {
                  targetGrp = initialSampleGroups.find(g => (g.locationOfSample || '').trim().toUpperCase() === (t.locationOfSample || '').trim().toUpperCase());
                }
                if (!targetGrp) {
                  targetGrp = initialSampleGroups[0];
                }
                if (targetGrp) {
                  targetGrp.checkedParameters[pId] = true;
                  targetGrp.checkedParameters[`_id_${pId}`] = t.id;
                  if (!targetGrp.selectedParamSequence.includes(pId)) {
                    targetGrp.selectedParamSequence.push(pId);
                  }
                }
              });
            } else {
              // Legacy single-location TRF
              const legacyChecks = {};
              const legacySeq = [];
              matchingTrps.forEach(t => {
                if (t.parameterId) {
                  legacyChecks[t.parameterId] = true;
                  legacyChecks[`_id_${t.parameterId}`] = t.id;
                  if (!legacySeq.includes(t.parameterId)) {
                    legacySeq.push(t.parameterId);
                  }
                }
              });
              const singleLoc = tr.locationOfSample || '';
              initialSampleGroups = [{
                id: 'grp_1',
                title: singleLoc ? singleLoc : 'Location 1',
                locationOfSample: singleLoc,
                departmentId: savedDepartmentId,
                categoryIds: savedCategoryId ? [savedCategoryId] : [],
                subCategoryId: savedSubCatId,
                checkedParameters: legacyChecks,
                selectedParamSequence: legacySeq
              }];
            }
          }
        } catch (e) {
          console.error("Error fetching request parameters", e);
        }

        if (initialSampleGroups.length === 0) {
          const singleLoc = tr.locationOfSample || '';
          initialSampleGroups = [{
            id: 'grp_1',
            title: singleLoc ? singleLoc : 'Location 1',
            locationOfSample: singleLoc,
            departmentId: savedDepartmentId,
            categoryIds: savedCategoryId ? [savedCategoryId] : [],
            subCategoryId: savedSubCatId,
            checkedParameters: {},
            selectedParamSequence: []
          }];
        }

        setSampleGroups(initialSampleGroups);
        setActiveGroupIndex(0);

        setFormData({
          companyId: matchingComp.id || tr.companyId || '',
          clientId: matchingClient.id || tr.clientId || '',
          address: tr.address || matchingClient.plantAddress || matchingClient.plant_address || matchingClient.officeAddress || matchingClient.office_address || matchingClient.address || '',
          email: tr.email || '',
          locationOfSample: tr.locationOfSample || '',
          contactPerson: tr.contactPerson || '',
          contactNumber: tr.contactNumber || '',
          dateOfCollection: tr.dateOfCollection || '',
          dateOfReceipt: tr.dateOfReceipt || '',
          sampleCollectedBy: tr.sampleCollectedBy || '',
          sampleQuantity: tr.sampleQuantity || '',
          fieldDataSheet: tr.fieldDataSheet || 'Not Available',
          packingDetails: tr.packingDetails || '',
          sampleIdNumber: tr.sampleIdNumber || '',
          reportNumber: tr.reportNumber || '',
          sampleParticular: savedSampleParticular,
          categoryId: savedCategoryId,
          subCategoryId: savedSubCatId,
          departmentId: savedDepartmentId,
          equipmentAvailability: tr.equipmentAvailability || 'Available',
          referenceStandardAvailability: tr.referenceStandardAvailability || 'Available',
          sampleAdequacy: tr.sampleAdequacy || 'Adequate',
          testMethodAvailability: tr.testMethodAvailability || 'Available',
          trainedPersonAvailability: tr.trainedPersonAvailability || 'Available',
          tentativeDays: tr.reportIssueDays || '15-20 Days',
          sampleTestingFacilityReviewedBy: tr.reviewedBy || 'Quality Manager /Technical Manager',
          customerRepresentativeName: tr.customerRepresentativeName || '',
          sampleReceiverName: tr.sampleReceiverName || '',
          remarks: tr.remarks || '',
          testProtocol: tr.testProtocol || 'Ground Water/Surface Water/Drinking Water: APHA 23rd Edition 2017\nWaste Water: APHA 23rd Edition 2017',
          formTitle: (tr.formTitle || 'WATER & WASTE WATER').replace(/^TEST REQUEST FORM FOR /i, ''),
          formType: tr.formType || 'Regular',
          includeCaution: tr.includeCaution !== undefined ? !!tr.includeCaution : false,
          cautionId: tr.cautionId || '',
          quotationRequired: tr.quotationRequired || 'No',
          quotationType: tr.quotationType || '',
          industryType: tr.industryType || tr.industry_type || '',
          industryPrice: tr.industryPrice || tr.industry_price || ''
        });

        const activeInitialGrp = initialSampleGroups[0];
        const activeInitDeptId = activeInitialGrp.departmentId || savedDepartmentId;
        const activeInitCatIds = activeInitialGrp.categoryIds?.length ? activeInitialGrp.categoryIds : (savedCategoryId ? [savedCategoryId] : []);
        const activeInitSubCatId = activeInitialGrp.subCategoryId || savedSubCatId;
        const activeInitCheckedIds = Object.keys(activeInitialGrp.checkedParameters || {}).filter(k => !k.startsWith('_id_') && activeInitialGrp.checkedParameters[k]);

        if (activeInitDeptId) {
          fetchCategoriesForDepartment(activeInitDeptId);
        }
        if (activeInitCatIds.length > 0) {
          fetchSubCategoriesForCategories(activeInitCatIds);
        }
        fetchParameters(activeInitSubCatId, activeInitCatIds, activeInitCheckedIds);
      } else {
        // Pre-select company if we resolved one and auto-generate next Report No (e.g. JLT010826RR00320)
        const nowForFallback = new Date();
        const mmForFallback = String(nowForFallback.getMonth() + 1).padStart(2, '0');
        const yyForFallback = String(nowForFallback.getFullYear()).slice(-2);
        let autoReportNo = `JLT01${mmForFallback}${yyForFallback}RR00320`;
        try {
          const allTrsRes = await apiService.get(`${TEST_REQUEST_ENDPOINTS.GET_ALL}?limit=1000${targetCompanyId ? `&companyId=${targetCompanyId}` : ''}`);
          const trsList = Array.isArray(allTrsRes?.data) ? allTrsRes.data : (allTrsRes?.data?.rows || []);
          autoReportNo = generateNextReportNumber(trsList);
        } catch (e) {
          console.error("Error auto-generating report number", e);
        }

        setFormData(prev => ({
          ...prev,
          companyId: targetCompanyId || prev.companyId,
          reportNumber: autoReportNo
        }));
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchDepartmentsList = async (gpcbOnlyFlag = isGpcbOnly) => {
    try {
      const activeCompId = formData.companyId || localStorage.getItem('selectedCompanyId') || '';
      let url = `${DEPARTMENT_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&status=Active&limit=500&gpcbOnly=${gpcbOnlyFlag ? 'true' : 'false'}&isGpcb=${gpcbOnlyFlag ? 'true' : 'false'}`;
      const res = await apiService.get(url);
      if (res?.data) {
        setDepartments(res.data.rows || res.data || []);
      }
    } catch (e) {
      console.error("Error fetching departments", e);
    }
  };

  const fetchCategoriesForDepartment = async (departmentId, gpcbOnlyFlag = isGpcbOnly) => {
    if (!departmentId) {
      setCategories([]);
      return;
    }
    setCategoriesLoading(true);
    try {
      const activeCompId = formData.companyId || localStorage.getItem('selectedCompanyId') || '';
      let url = `${CATEGORY_ENDPOINTS.GET_ALL}?departmentId=${departmentId}&companyId=${activeCompId}&status=Active&limit=1000&all=true&gpcbOnly=${gpcbOnlyFlag ? 'true' : 'false'}&isGpcb=${gpcbOnlyFlag ? 'true' : 'false'}`;
      const res = await apiService.get(url);
      const raw = res?.data;
      let list = Array.isArray(raw) ? raw : (raw?.rows || raw?.categories || raw?.data || []);
      setCategories(list.filter(c => c.status === 'Active' || c.status === true || !c.status));
    } catch (e) {
      console.error("Error fetching categories for department", e);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchSubCategoriesForCategories = async (categoryIds, gpcbOnlyFlag = isGpcbOnly) => {
    const idsArray = Array.isArray(categoryIds)
      ? categoryIds.filter(Boolean)
      : (categoryIds ? [categoryIds] : []);

    if (idsArray.length === 0) {
      setSubCategories([]);
      return;
    }
    setSubCategoriesLoading(true);
    try {
      let url = `${SUB_CATEGORY_ENDPOINTS.GET_ALL}?categoryId=${idsArray.join(',')}&status=Active&all=true&gpcbOnly=${gpcbOnlyFlag ? 'true' : 'false'}&isGpcb=${gpcbOnlyFlag ? 'true' : 'false'}`;
      const res = await apiService.get(url);
      const raw = res?.data;
      let list = Array.isArray(raw) ? raw : (raw?.rows || raw?.subCategories || raw?.data || []);
      if (!Array.isArray(list)) list = [];

      setSubCategories(list.filter(s => s.status === 'Active' || s.status === true || !s.status));
    } catch (e) {
      console.error("Error fetching subcategories", e);
      setSubCategories([]);
    } finally {
      setSubCategoriesLoading(false);
    }
  };

  const fetchParameters = async (subCategoryId, categoryIds, extraIncludeIds = [], gpcbOnlyFlag = isGpcbOnly) => {
    const idsArray = Array.isArray(categoryIds)
      ? categoryIds.filter(Boolean)
      : (typeof categoryIds === 'string' && categoryIds ? categoryIds.split(',').map(s => s.trim()).filter(Boolean) : []);

    const checkedIds = (extraIncludeIds && extraIncludeIds.length > 0)
      ? extraIncludeIds
      : Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && checkedParameters[k]);

    if (!subCategoryId && idsArray.length === 0 && checkedIds.length === 0) {
      setParameters([]);
      setParametersLoading(false);
      return;
    }
    setParametersLoading(true);
    try {
      let url = `${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true&gpcbOnly=${gpcbOnlyFlag ? 'true' : 'false'}&isGpcb=${gpcbOnlyFlag ? 'true' : 'false'}`;
      if (subCategoryId) {
        url += `&subCategoryId=${subCategoryId}`;
      }
      if (idsArray.length > 0) {
        url += `&categoryId=${idsArray.join(',')}`;
      }
      const res = await apiService.get(url);
      let list = [];
      if (res?.data?.rows) {
        list = res.data.rows;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (res?.data) {
        list = [res.data];
      }

      let activeList = list.filter(p => {
        const isActive = p.status === 'Active' || p.status === true || !p.status;
        const isGpcb = p.isGpcb === true || p.is_gpcb === true || p.type === 'GPCB' || p.type === 'gpcb';
        const matchesGpcb = gpcbOnlyFlag ? isGpcb : !isGpcb;
        return isActive && matchesGpcb;
      });

      // If there are extra parameter IDs already checked (from previously selected discipline groups or saved request), merge them
      if (checkedIds.length > 0) {
        const missingIds = checkedIds.filter(id => !activeList.some(p => p.id === id));
        if (missingIds.length > 0) {
          try {
            const allRes = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true&gpcbOnly=${gpcbOnlyFlag ? 'true' : 'false'}&isGpcb=${gpcbOnlyFlag ? 'true' : 'false'}`);
            const allList = Array.isArray(allRes?.data) ? allRes.data : (allRes?.data?.rows || []);
            const extraParams = allList.filter(p => {
              const isGpcb = p.isGpcb === true || p.is_gpcb === true || p.type === 'GPCB' || p.type === 'gpcb';
              const matchesGpcb = gpcbOnlyFlag ? isGpcb : !isGpcb;
              return missingIds.includes(p.id) && matchesGpcb;
            });
            activeList = [...activeList, ...extraParams];
          } catch (err) {
            console.error("Error loading checked extra parameters", err);
          }
        }
      }

      // Deduplicate activeList by parameter id
      const seenMap = new Map();
      const uniqueParams = [];
      for (const p of activeList) {
        if (!seenMap.has(p.id)) {
          seenMap.set(p.id, true);
          uniqueParams.push(p);
        }
      }

      setParameters(uniqueParams);
      setParamMetaMap(prev => {
        const next = { ...prev };
        uniqueParams.forEach(p => {
          if (p.id) {
            next[p.id] = {
              id: p.id,
              parameterName: p.parameterName || p.name || 'Parameter',
              testMethod: p.testMethod || p.defaultTestMethod || p.test_method || '',
              price: parseFloat(p.price || 0),
              categoryId: p.categoryId,
              subCategoryId: p.subCategoryId
            };
          }
        });
        return next;
      });
      setParamPage(1);
    } catch (e) {
      console.error("Error fetching parameters", e);
      setParameters([]);
    } finally {
      setParametersLoading(false);
    }
  };

  // Active group accessor
  const currentGroup = sampleGroups[activeGroupIndex] || sampleGroups[0] || {
    id: 'grp_1',
    title: '1. Effluent Water Analysis (Inlet)',
    locationOfSample: 'Inlet',
    departmentId: '',
    categoryIds: [],
    subCategoryId: '',
    checkedParameters: {},
    selectedParamSequence: []
  };

  const updateActiveGroup = (updates) => {
    setSampleGroups(prev => {
      const next = [...prev];
      const targetIdx = activeGroupIndex >= 0 && activeGroupIndex < next.length ? activeGroupIndex : 0;
      next[targetIdx] = { ...next[targetIdx], ...updates };
      return next;
    });
  };

  const handleAddSampleGroup = () => {
    const newIdx = sampleGroups.length;
    const nextGroupNum = newIdx + 1;
    const newGroup = {
      id: `grp_${Date.now()}_${newIdx}`,
      title: `Location ${nextGroupNum}`,
      locationOfSample: '',
      departmentId: currentGroup.departmentId || '',
      categoryIds: currentGroup.categoryIds ? [...currentGroup.categoryIds] : [],
      subCategoryId: currentGroup.subCategoryId || '',
      checkedParameters: {},
      selectedParamSequence: []
    };

    setSampleGroups(prev => [...prev, newGroup]);
    setActiveGroupIndex(newIdx);
    setParamPage(1);
    setParamSearch('');

    if (newGroup.departmentId) {
      fetchCategoriesForDepartment(newGroup.departmentId, isGpcbOnly);
    }
    if (newGroup.categoryIds && newGroup.categoryIds.length > 0) {
      fetchSubCategoriesForCategories(newGroup.categoryIds, isGpcbOnly);
      fetchParameters(newGroup.subCategoryId, newGroup.categoryIds, [], isGpcbOnly);
    } else {
      setParameters([]);
    }
  };

  const handleRemoveSampleGroup = (idx, e) => {
    if (e) e.stopPropagation();
    if (sampleGroups.length <= 1) {
      triggerToast('At least one sample location / group is required.', 'error');
      return;
    }
    setSampleGroups(prev => prev.filter((_, i) => i !== idx));
    if (activeGroupIndex >= idx) {
      setActiveGroupIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleDuplicateSampleGroup = (idx, e) => {
    if (e) e.stopPropagation();
    const source = sampleGroups[idx];
    if (!source) return;
    const newGroup = {
      ...source,
      id: `grp_${Date.now()}_dup`,
      title: `${source.title || 'Sample Group'} (Copy)`,
      locationOfSample: source.locationOfSample ? `${source.locationOfSample}` : '',
      checkedParameters: { ...source.checkedParameters },
      selectedParamSequence: [...(source.selectedParamSequence || [])]
    };
    setSampleGroups(prev => [...prev, newGroup]);
    setActiveGroupIndex(sampleGroups.length);
  };

  const handleSwitchActiveGroup = (idx) => {
    setActiveGroupIndex(idx);
    setParamPage(1);
    setParamSearch('');
    const target = sampleGroups[idx];
    if (target) {
      if (target.departmentId) {
        fetchCategoriesForDepartment(target.departmentId, isGpcbOnly);
      }
      const catIds = target.categoryIds || [];
      if (catIds.length > 0) {
        fetchSubCategoriesForCategories(catIds, isGpcbOnly);
        const checkedIds = Object.keys(target.checkedParameters || {}).filter(k => !k.startsWith('_id_') && target.checkedParameters[k]);
        fetchParameters(target.subCategoryId, catIds, checkedIds, isGpcbOnly);
      } else {
        setSubCategories([]);
        const checkedIds = Object.keys(target.checkedParameters || {}).filter(k => !k.startsWith('_id_') && target.checkedParameters[k]);
        if (checkedIds.length > 0) {
          fetchParameters('', [], checkedIds, isGpcbOnly);
        } else {
          setParameters([]);
        }
      }
    }
  };

  const handleToggleGpcb = async (e) => {
    const nextGpcb = e.target.checked;
    setIsGpcbOnly(nextGpcb);

    updateActiveGroup({
      departmentId: '',
      categoryIds: [],
      subCategoryId: ''
    });
    setCategories([]);
    setSubCategories([]);
    setParamPage(1);
    setParamSearch('');

    const currentCheckedIds = Object.keys(currentGroup.checkedParameters || {}).filter(k => !k.startsWith('_id_') && currentGroup.checkedParameters[k]);
    if (currentCheckedIds.length > 0) {
      fetchParameters('', [], currentCheckedIds, nextGpcb);
    } else {
      setParameters([]);
    }

    await fetchDepartmentsList(nextGpcb);
  };

  const handleGroupDepartmentChange = (selectedDeptId) => {
    updateActiveGroup({
      departmentId: selectedDeptId,
      categoryIds: [],
      subCategoryId: ''
    });
    setParamPage(1);
    setParamSearch('');
    if (selectedDeptId) {
      fetchCategoriesForDepartment(selectedDeptId, isGpcbOnly);
    } else {
      setCategories([]);
    }
    const currentCheckedIds = Object.keys(currentGroup.checkedParameters || {}).filter(k => !k.startsWith('_id_') && currentGroup.checkedParameters[k]);
    if (currentCheckedIds.length > 0) {
      fetchParameters('', [], currentCheckedIds, isGpcbOnly);
    } else {
      setParameters([]);
    }
  };

  const handleGroupCategoryChange = (selectedVals) => {
    const catIdsArray = Array.isArray(selectedVals)
      ? selectedVals.filter(Boolean)
      : (selectedVals ? [selectedVals] : []);

    updateActiveGroup({
      categoryIds: catIdsArray,
      subCategoryId: ''
    });
    setParamPage(1);

    const currentCheckedIds = Object.keys(currentGroup.checkedParameters || {}).filter(k => !k.startsWith('_id_') && currentGroup.checkedParameters[k]);

    if (catIdsArray.length > 0) {
      fetchSubCategoriesForCategories(catIdsArray, isGpcbOnly);
      fetchParameters(currentGroup.subCategoryId, catIdsArray, currentCheckedIds, isGpcbOnly);
    } else {
      setSubCategories([]);
      if (currentCheckedIds.length > 0) {
        fetchParameters('', [], currentCheckedIds, isGpcbOnly);
      } else {
        setParameters([]);
      }
    }
  };

  const handleGroupSubCategoryChange = (selectedVal) => {
    const subId = selectedVal;
    updateActiveGroup({
      subCategoryId: subId
    });
    setParamPage(1);
    const currentCheckedIds = Object.keys(currentGroup.checkedParameters || {}).filter(k => !k.startsWith('_id_') && currentGroup.checkedParameters[k]);
    fetchParameters(subId, currentGroup.categoryIds || [], currentCheckedIds, isGpcbOnly);
  };

  const handleGroupLocationChange = (selectedLocation) => {
    updateActiveGroup({
      locationOfSample: selectedLocation
    });
  };

  const handleGroupTitleChange = (newTitle) => {
    updateActiveGroup({
      title: newTitle
    });
  };

  const handleToggleSelectAllParameters = () => {
    const displayedParams = parameters.filter(param => {
      if (currentGroup.subCategoryId) {
        return param.subCategoryId === currentGroup.subCategoryId || param.subCategory?.id === currentGroup.subCategoryId || currentGroup.checkedParameters?.[param.id];
      }
      return true;
    });
    if (displayedParams.length === 0) return;

    const currentChecks = currentGroup.checkedParameters || {};
    const allChecked = displayedParams.every(p => !!currentChecks[p.id]);
    const displayedIds = displayedParams.map(p => p.id);

    const nextChecks = { ...currentChecks };
    displayedParams.forEach(p => {
      if (allChecked) {
        delete nextChecks[p.id];
      } else {
        nextChecks[p.id] = true;
      }
    });

    let nextSeq = currentGroup.selectedParamSequence || [];
    if (allChecked) {
      nextSeq = nextSeq.filter(id => !displayedIds.includes(id));
    } else {
      const newIds = displayedIds.filter(id => !nextSeq.includes(id));
      nextSeq = [...nextSeq, ...newIds];
    }

    updateActiveGroup({
      checkedParameters: nextChecks,
      selectedParamSequence: nextSeq
    });
  };

  const handleParameterCheck = (paramId) => {
    const currentChecks = currentGroup.checkedParameters || {};
    const isCurrentlyChecked = !!currentChecks[paramId];

    const updatedChecks = {
      ...currentChecks,
      [paramId]: !isCurrentlyChecked
    };

    let updatedSeq = currentGroup.selectedParamSequence || [];
    if (!isCurrentlyChecked) {
      updatedSeq = updatedSeq.includes(paramId) ? updatedSeq : [...updatedSeq, paramId];
    } else {
      updatedSeq = updatedSeq.filter(id => id !== paramId);
    }

    updateActiveGroup({
      checkedParameters: updatedChecks,
      selectedParamSequence: updatedSeq
    });
  };

  // Overall stats and structured breakdown across all sample groups for Quotation Summary
  const overallGroupStats = useMemo(() => {
    let totalParamCount = 0;
    let totalPrice = 0;
    const allUniqueParamIds = new Set();
    const groupBreakdown = [];

    sampleGroups.forEach((grp, gIdx) => {
      const pIds = Object.keys(grp.checkedParameters || {}).filter(k => !k.startsWith('_id_') && grp.checkedParameters[k]);
      let groupSubtotal = 0;
      const groupParamDetails = [];

      pIds.forEach(pId => {
        totalParamCount++;
        allUniqueParamIds.add(pId);
        const paramObj = parameters.find(p => p.id === pId) || paramMetaMap[pId];
        const price = priceMasterMap[pId] !== undefined ? priceMasterMap[pId] : (parseFloat(paramObj?.price) || 0);
        groupSubtotal += price;
        totalPrice += price;
        groupParamDetails.push({
          id: pId,
          name: paramObj?.parameterName || paramObj?.name || 'Parameter',
          parameterName: paramObj?.parameterName || paramObj?.name || 'Parameter',
          testMethod: paramObj?.testMethod || paramObj?.defaultTestMethod || paramObj?.test_method || '',
          price
        });
      });

      const matchedDept = departments.find(d => d.id === grp.departmentId);
      const matchedCats = categories.filter(c => (grp.categoryIds || []).includes(c.id));
      const catNames = matchedCats.map(c => c.name).join(', ');

      groupBreakdown.push({
        groupIndex: gIdx,
        id: grp.id || `grp_${gIdx}`,
        groupId: grp.id || `grp_${gIdx}`,
        title: grp.title || `${gIdx + 1}. ${grp.locationOfSample || 'Location ' + (gIdx + 1)}`,
        location: grp.locationOfSample || `Location ${gIdx + 1}`,
        departmentName: matchedDept?.name || 'WATER TESTING',
        disciplineName: catNames || 'WASTE WATER (EFFLUENT ETP)',
        paramCount: pIds.length,
        parameters: groupParamDetails,
        subtotal: groupSubtotal
      });
    });

    return {
      totalGroups: sampleGroups.length,
      totalParamCount,
      uniqueParamCount: allUniqueParamIds.size,
      totalPrice,
      groupBreakdown
    };
  }, [sampleGroups, parameters, paramMetaMap, priceMasterMap, departments, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'industryType') {
      const price = INDUSTRY_PRICES[value] !== undefined ? INDUSTRY_PRICES[value] : '';
      setFormData(prev => ({ ...prev, industryType: value, industryPrice: price }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'clientId') {
      if (!value) {
        setClientEmails([]);
        setFormData(prev => ({
          ...prev,
          clientId: '',
          address: '',
          email: '',
          contactNumber: ''
        }));
      } else {
        // Fetch latest client details from backend to resolve emails
        apiService.get(CLIENT_ENDPOINTS.GET_BY_ID(value))
          .then(res => {
            const selectedClient = res.data;
            if (selectedClient) {
              const clientPlantAddress = selectedClient.plantAddress || selectedClient.plant_address || selectedClient.officeAddress || selectedClient.office_address || selectedClient.address || '';
              const emailsList = (selectedClient.emails && selectedClient.emails.length > 0)
                ? selectedClient.emails
                : (selectedClient.email ? selectedClient.email.split(',').map(e => e.trim()).filter(Boolean) : []);
              setClientEmails(emailsList);
              const primaryEmail = emailsList.length > 0 ? emailsList[0] : '';
              setFormData(prev => ({
                ...prev,
                address: clientPlantAddress,
                email: primaryEmail,
                contactNumber: selectedClient.contactNumber || prev.contactNumber
              }));
            }
          })
          .catch(err => {
            console.error("Error fetching latest client details:", err);
            const selectedClient = clients.find(c => c.id === value);
            if (selectedClient) {
              const clientPlantAddress = selectedClient.plantAddress || selectedClient.plant_address || selectedClient.officeAddress || selectedClient.office_address || selectedClient.address || '';
              const emailsList = (selectedClient.emails && selectedClient.emails.length > 0)
                ? selectedClient.emails
                : (selectedClient.email ? selectedClient.email.split(',').map(e => e.trim()).filter(Boolean) : []);
              setClientEmails(emailsList);
              const primaryEmail = emailsList.length > 0 ? emailsList[0] : '';
              setFormData(prev => ({
                ...prev,
                address: clientPlantAddress,
                email: primaryEmail,
                contactNumber: selectedClient.contactNumber || prev.contactNumber
              }));
            }
          });
      }
    }
  };

  const handleToggleEmail = (email) => {
    const currentEmails = formData.email ? formData.email.split(',').map(e => e.trim()).filter(Boolean) : [];
    let updated;
    if (currentEmails.includes(email)) {
      updated = currentEmails.filter(e => e !== email);
    } else {
      updated = [...currentEmails, email];
    }
    setFormData(prev => ({ ...prev, email: updated.join(', ') }));
  };

  const handleSelectAllEmails = () => {
    const currentEmails = formData.email ? formData.email.split(',').map(e => e.trim()).filter(Boolean) : [];
    const allSelected = clientEmails.every(e => currentEmails.includes(e));
    if (allSelected) {
      setFormData(prev => ({ ...prev, email: '' }));
    } else {
      setFormData(prev => ({ ...prev, email: clientEmails.join(', ') }));
    }
  };

  const validateForm = () => {
    if (!formData.companyId) {
      triggerToast('Please select a Company.', 'error');
      return false;
    }
    if (!formData.clientId) {
      triggerToast('Please select a Client.', 'error');
      return false;
    }
    if (!sampleGroups || sampleGroups.length === 0) {
      triggerToast('At least one testing location / group is required.', 'error');
      return false;
    }

    for (let i = 0; i < sampleGroups.length; i++) {
      const grp = sampleGroups[i];
      const grpLabel = grp.locationOfSample || grp.title || `Location #${i + 1}`;
      if (!grp.locationOfSample && !grp.title) {
        triggerToast(`Testing Group ${i + 1}: Please select or enter Location / Stage.`, 'error');
        return false;
      }
      if (!grp.departmentId) {
        triggerToast(`Location "${grpLabel}": Please select a Department.`, 'error');
        return false;
      }
      if (!grp.categoryIds || grp.categoryIds.length === 0) {
        triggerToast(`Location "${grpLabel}": Please select at least one Discipline Group.`, 'error');
        return false;
      }
      const checkedCount = Object.keys(grp.checkedParameters || {}).filter(k => !k.startsWith('_id_') && grp.checkedParameters[k]).length;
      if (checkedCount === 0) {
        triggerToast(`Location "${grpLabel}": Please select at least one Testing Parameter.`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return false;
    setSubmitting(true);

    try {
      const allLocations = sampleGroups.map(g => g.locationOfSample).filter(Boolean);
      const combinedLocationStr = allLocations.length > 0 ? allLocations.join(', ') : (formData.locationOfSample || '');
      const primaryCatId = sampleGroups[0]?.categoryIds?.[0] || formData.categoryId || (formData.sampleParticular && formData.sampleParticular.length === 36 ? formData.sampleParticular : null);
      const primaryDeptId = sampleGroups[0]?.departmentId || formData.departmentId || null;
      const primarySubCatId = sampleGroups[0]?.subCategoryId || formData.subCategoryId || null;
      const textSampleParticular = (formData.sampleParticular && formData.sampleParticular.length === 36) ? '' : formData.sampleParticular;

      const payload = {
        ...formData,
        sampleGroups: sampleGroups,
        locationOfSample: combinedLocationStr,
        categoryId: primaryCatId,
        departmentId: primaryDeptId,
        sampleParticular: textSampleParticular,
        subCategoryId: primarySubCatId,
        includeCaution: Boolean(formData.includeCaution),
        cautionId: formData.includeCaution && formData.cautionId ? formData.cautionId : null,
        reportIssueDays: formData.tentativeDays,
        reviewedBy: formData.sampleTestingFacilityReviewedBy,
        quotationRequired: 'No',
        quotationType: null
      };
      delete payload.tentativeDays;
      delete payload.sampleTestingFacilityReviewedBy;
      delete payload.categoryIds;

      const targetId = savedRequestId || id;
      let savedTrId = targetId;
      if (targetId) {
        await apiService.put(TEST_REQUEST_ENDPOINTS.UPDATE(targetId), payload);
      } else {
        const res = await apiService.post(TEST_REQUEST_ENDPOINTS.CREATE, payload);
        savedTrId = res?.data?.id || res?.data?.data?.id;
      }

      if (!savedTrId) {
        triggerToast('Failed to retrieve saved request ID.', 'error');
        setSubmitting(false);
        return false;
      }

      setSavedRequestId(savedTrId);

      // Collect all checked parameters per group
      const allTrpItems = [];
      const updatedSampleGroups = JSON.parse(JSON.stringify(sampleGroups));

      sampleGroups.forEach((grp, gIdx) => {
        const seq = grp.selectedParamSequence || [];
        const pIds = Object.keys(grp.checkedParameters || {}).filter(k => !k.startsWith('_id_') && grp.checkedParameters[k]);
        const orderedPIds = [
          ...seq.filter(id => pIds.includes(id)),
          ...pIds.filter(id => !seq.includes(id))
        ];
        orderedPIds.forEach((pId, sIdx) => {
          allTrpItems.push({
            groupIndex: gIdx,
            groupId: grp.id,
            locationOfSample: grp.locationOfSample || grp.title,
            departmentId: grp.departmentId || null,
            categoryId: grp.categoryIds?.[0] || null,
            subCategoryId: grp.subCategoryId || null,
            parameterId: pId,
            sequence: sIdx + 1,
            existingTrpId: grp.checkedParameters[`_id_${pId}`] || null
          });
        });
      });

      // Find database transactions to delete
      const allActiveExistingTrpIds = allTrpItems.map(item => item.existingTrpId).filter(Boolean);
      sampleGroups.forEach(grp => {
        Object.keys(grp.checkedParameters || {}).forEach(k => {
          if (k.startsWith('_id_')) {
            const trpId = grp.checkedParameters[k];
            if (trpId && !allActiveExistingTrpIds.includes(trpId)) {
              apiService.delete(TEST_REQUEST_PARAMETER_ENDPOINTS.DELETE(trpId)).catch(err => {
                console.error("Error deleting unchecked parameter", err);
              });
            }
          }
        });
      });

      // Save/update transactions
      for (const item of allTrpItems) {
        const targetParam = parameters.find(p => p.id === item.parameterId) || paramMetaMap[item.parameterId];
        const price = priceMasterMap[item.parameterId] !== undefined ? priceMasterMap[item.parameterId] : (targetParam?.price || 0);
        const testMethod = targetParam ? (targetParam.testMethod || targetParam.defaultTestMethod) : null;

        if (!item.existingTrpId) {
          const createRes = await apiService.post(TEST_REQUEST_PARAMETER_ENDPOINTS.CREATE, {
            testRequestId: savedTrId,
            parameterId: item.parameterId,
            sequence: item.sequence,
            testMethod: testMethod,
            price: price,
            groupId: item.groupId,
            locationOfSample: item.locationOfSample,
            departmentId: item.departmentId,
            categoryId: item.categoryId,
            subCategoryId: item.subCategoryId
          });
          if (createRes?.data?.id) {
            updatedSampleGroups[item.groupIndex].checkedParameters[`_id_${item.parameterId}`] = createRes.data.id;
          }
        } else {
          await apiService.put(TEST_REQUEST_PARAMETER_ENDPOINTS.UPDATE(item.existingTrpId), {
            sequence: item.sequence,
            groupId: item.groupId,
            locationOfSample: item.locationOfSample,
            departmentId: item.departmentId,
            categoryId: item.categoryId,
            subCategoryId: item.subCategoryId,
            price: price
          });
        }
      }

      setSampleGroups(updatedSampleGroups);

      // Build dynamic Annexure-B for Audit Quotation
      const dynamicAnnexure = [];
      sampleGroups.forEach((grp, gIdx) => {
        const seq = grp.selectedParamSequence || [];
        const pIds = Object.keys(grp.checkedParameters || {}).filter(k => !k.startsWith('_id_') && grp.checkedParameters[k]);
        const ordered = [
          ...seq.filter(id => pIds.includes(id)),
          ...pIds.filter(id => !seq.includes(id))
        ];
        if (ordered.length > 0) {
          const groupTitle = grp.title || (grp.locationOfSample ? `${gIdx + 1}. Analysis (${grp.locationOfSample})` : `Sample Group ${gIdx + 1}`);
          ordered.forEach(pId => {
            const paramObj = parameters.find(p => p.id === pId) || paramMetaMap[pId];
            const price = priceMasterMap[pId] !== undefined ? priceMasterMap[pId] : (parseFloat(paramObj?.price) || 0);
            dynamicAnnexure.push({
              category: groupTitle,
              description: paramObj?.parameterName || paramObj?.name || 'Parameter Analysis',
              ratePerSample: price,
              samplePerVisit: 1,
              chargesPerVisit: price,
              total: price * 3
            });
          });
        }
      });

      if (formData.quotationRequired === 'Yes' && formData.quotationType === 'Audit') {
        const qPayload = {
          ...quotationData,
          annexure: dynamicAnnexure.length > 0 ? dynamicAnnexure : quotationData.annexure,
          testRequestId: savedTrId,
          companyId: formData.companyId,
          clientId: formData.clientId
        };
        await apiService.post(`${API_BASE_URL}/audit-quotation`, qPayload);
      }

      triggerToast('Test Request saved successfully!', 'success');
      return savedTrId;
    } catch (err) {
      const errorMsg = err?.messageToShow || err?.message || err?.errorMessage || err?.error || (typeof err === 'string' ? err : 'Failed to save test request.');
      triggerToast(errorMsg, 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndNavigate = async () => {
    const savedId = await handleSave();
    if (savedId) {
      setTimeout(() => {
        navigate('/test-requests');
      }, 500);
    }
  };

  const handleSaveAndPrint = async () => {
    const savedId = await handleSave();
    if (savedId) {
      window.open(`#/test-requests/print/${savedId}`, '_blank');
      setTimeout(() => {
        navigate('/test-requests');
      }, 500);
    }
  };

  const handleSaveAndPrintTRF = async () => {
    const savedId = await handleSave();
    if (savedId) {
      window.open(`#/test-requests/print/${savedId}`, '_blank');
    }
  };

  const handleSaveAndPrintQuotation = async () => {
    const savedId = await handleSave();
    if (savedId) {
      window.open(`#/test-requests/quotation/${savedId}`, '_blank');
    }
  };

  const handleSaveAndQuotation = async () => {
    const savedId = await handleSave();
    if (savedId) {
      if (formData.quotationType === 'Provisional') {
        window.open(`#/quotations/provisional/add?trfId=${savedId}&type=provisional`, '_blank');
      } else {
        window.open(`#/test-requests/quotation/${savedId}`, '_blank');
      }
      setTimeout(() => {
        navigate('/test-requests');
      }, 500);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading Form Data...</div>;

  // Selected entities for display in print format
  const selCompany = companies.find(c => c.id === formData.companyId) || {};
  const selClient = clients.find(c => c.id === formData.clientId) || {};
  const selCategory = categories.find(c => c.id === formData.sampleParticular) || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.3s ease-in-out',
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar */}
      <div className="master-top-bar hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/test-requests')} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaArrowLeft />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEditing ? 'Edit Test Request' : 'New Test Request'}
          </h2>
        </div>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showLivePreview ? <FaEyeSlash /> : <FaEye />}
            <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>
          <button
            onClick={handleSaveAndNavigate}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaSave />
            <span>{submitting ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaPrint />
            <span>Save & Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area (Screen Only) */}
      <div className="premium-ui-form test-request-split-container hide-on-print" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Left Column: Form Inputs */}
        <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* General Information Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>General Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>

              {/* Document Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Document Title Postfix <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="test-request-title-prefix" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>TEST REQUEST FORM FOR </span>
                  <input
                    type="text"
                    name="formTitle"
                    value={formData.formTitle}
                    onChange={handleChange}
                    className="premium-input"
                    placeholder="e.g. WATER & WASTE WATER"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Customer / Client <span style={{ color: '#ef4444' }}>*</span></label>
                  <AddMasterButton label="Add New Client" onClick={() => setInlineModal({ isOpen: true, type: 'client', parentData: { companyId: formData.companyId } })} />
                </div>
                <SearchableSelect
                  options={[...clients].sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''))}
                  value={formData.clientId}
                  onChange={(selectedVal) => {
                    handleChange({ target: { name: 'clientId', value: selectedVal } });
                  }}
                  placeholder="Select Client"
                  searchPlaceholder="Search client name..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Form Type <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="formType"
                      value="Regular"
                      checked={formData.formType === 'Regular'}
                      onChange={handleChange}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    Regular
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="formType"
                      value="NABL"
                      checked={formData.formType === 'NABL'}
                      onChange={handleChange}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    NABL
                  </label>
                </div>
              </div>



              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Address for Communication</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className="premium-input" rows={2} placeholder="Enter full address..."></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }} ref={emailDropdownRef}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email ID</label>
                {clientEmails.length > 1 ? (
                  <>
                    <div
                      onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                      className="premium-input"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: '#ffffff',
                        minHeight: '42px',
                        padding: '0.5rem 0.75rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', color: formData.email ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formData.email || 'Select Emails'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>▼</span>
                    </div>

                    {showEmailDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          zIndex: 50,
                          padding: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {/* Select All Option */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={clientEmails.every(e => (formData.email ? formData.email.split(',').map(x => x.trim()) : []).includes(e))}
                            onChange={handleSelectAllEmails}
                            style={{ accentColor: '#22c55e', cursor: 'pointer' }}
                          />
                          Select All ({clientEmails.length})
                        </label>

                        {/* Individual Email Options */}
                        {clientEmails.map((email, idx) => {
                          const isChecked = (formData.email ? formData.email.split(',').map(x => x.trim()) : []).includes(email);
                          return (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleEmail(email)}
                                style={{ accentColor: '#22c55e', cursor: 'pointer' }}
                              />
                              {email}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="premium-input"
                    placeholder="e.g. contact@client.com, contact2@client.com"
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Contact Person</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="premium-input" placeholder="Name of contact" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Contact Number</label>
                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="premium-input" placeholder="+91 00000 00000" />
              </div>
            </div>
          </div>

          {/* Sample Details Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #10b981, #34d399)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sample Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Date of Collection</label>
                <input type="date" name="dateOfCollection" value={formData.dateOfCollection} onChange={handleChange} className="premium-input" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Industry Type</label>
                <select
                  name="industryType"
                  value={formData.industryType}
                  onChange={handleChange}
                  className="premium-input"
                  style={{
                    backgroundColor: '#ffffff',
                    color: formData.industryType ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" style={{ color: '#94a3b8' }}>Select Industry Type</option>
                  {Object.values(INDUSTRY_TYPES).map(type => (
                    <option key={type} value={type} style={{ color: '#0f172a' }}>
                      {INDUSTRY_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Price</label>
                <input
                  type="text"
                  name="industryPrice"
                  value={formData.industryPrice ? `₹${Number(formData.industryPrice).toLocaleString('en-IN')}` : ''}
                  className="premium-input"
                  readOnly={true}
                  disabled={true}
                  style={{
                    backgroundColor: '#f1f5f9',
                    cursor: 'not-allowed',
                    color: '#475569',
                    fontWeight: 600
                  }}
                  placeholder="₹0"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Date of Receipt</label>
                <input type="date" name="dateOfReceipt" value={formData.dateOfReceipt} onChange={handleChange} className="premium-input" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Collected By</label>
                <input type="text" name="sampleCollectedBy" value={formData.sampleCollectedBy} onChange={handleChange} className="premium-input" placeholder="Name of collector" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Quantity</label>
                <input type="text" name="sampleQuantity" value={formData.sampleQuantity} onChange={handleChange} className="premium-input" placeholder="e.g. 500ml" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Field Data Sheet</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input type="radio" name="fieldDataSheet" value="Available" checked={formData.fieldDataSheet === 'Available'} onChange={handleChange} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input type="radio" name="fieldDataSheet" value="Not Available" checked={formData.fieldDataSheet === 'Not Available'} onChange={handleChange} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                    Not Available
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Packing details</label>
                <input type="text" name="packingDetails" value={formData.packingDetails} onChange={handleChange} className="premium-input" placeholder="e.g. Sealed glass bottle" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample ID No.</label>
                <input type="text" name="sampleIdNumber" value={formData.sampleIdNumber} onChange={handleChange} className="premium-input" placeholder="e.g. SPL-1002" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Report No. (Auto-Generated)</label>
                <input
                  type="text"
                  name="reportNumber"
                  value={formData.reportNumber}
                  onChange={handleChange}
                  className="premium-input"
                  placeholder="Auto-generated (e.g. JLT010826RR00320)"
                  readOnly={true}
                  disabled={true}
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569', fontWeight: 600 }}
                />
              </div>

              {/* Sample Particular Field (Long Text Input) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Particular</label>
                <textarea
                  name="sampleParticular"
                  value={formData.sampleParticular}
                  onChange={handleChange}
                  className="premium-input"
                  rows={3}
                  placeholder="Enter sample particulars / description..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Testing Parameters / Multi-Sample Location Groups Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', borderRadius: '6px' }}></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Testing Parameters</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Configure multiple sample locations (Inlet, Outlet, Stage-wise, Stack, etc.) for TRF &amp; Quotation Annexure-B</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Overall Summary Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 700 }}>
                    {overallGroupStats.totalGroups} Location{overallGroupStats.totalGroups > 1 ? 's' : ''} • {overallGroupStats.totalParamCount} Test{overallGroupStats.totalParamCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 700 }}>
                    Total: ₹{overallGroupStats.totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* GPCB Toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  backgroundColor: isGpcbOnly ? '#f0fdf4' : '#f8fafc',
                  border: isGpcbOnly ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    id="gpcb-toggle"
                    checked={isGpcbOnly}
                    onChange={handleToggleGpcb}
                    style={{
                      width: '1.1rem',
                      height: '1.1rem',
                      accentColor: '#16a34a',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: isGpcbOnly ? 700 : 600,
                    color: isGpcbOnly ? '#15803d' : '#475569'
                  }}>
                    GPCB Only
                  </span>
                </label>
              </div>
            </div>



            {/* Active Group Header & Details Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    Location {activeGroupIndex + 1}: {currentGroup.locationOfSample || 'New Location'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicateSampleGroup(activeGroupIndex, e)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    📋 Duplicate Location
                  </button>
                  {sampleGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSampleGroup(activeGroupIndex, e)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      🗑️ Remove Location
                    </button>
                  )}
                </div>
              </div>

              {/* 4-column Selector Grid for Active Group */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

                {/* 1. Location / Stage Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Location / Stage <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <AddMasterButton
                      label="Add Location"
                      onClick={() => setInlineModal({ isOpen: true, type: 'locationSample', parentData: { companyId: formData.companyId } })}
                    />
                  </div>
                  <SearchableSelect
                    options={[
                      { id: '', name: 'Select Location / Stage' },
                      ...Array.from(new Set(
                        [...locationSamples.map(l => (l?.name || '').trim()), (currentGroup.locationOfSample || '').trim()]
                          .filter(Boolean)
                      )).sort((a, b) => a.localeCompare(b)).map(name => ({ id: name, name }))
                    ]}
                    value={currentGroup.locationOfSample || ''}
                    onChange={handleGroupLocationChange}
                    placeholder="Select Location / Stage"
                    searchPlaceholder="Search location..."
                  />
                </div>

                {/* 2. Department Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Department <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <SearchableSelect
                    options={[...departments].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                    value={currentGroup.departmentId || ''}
                    onChange={handleGroupDepartmentChange}
                    placeholder="Select Department"
                    searchPlaceholder="Search department..."
                  />
                </div>

                {/* 3. Discipline Group Dropdown (Multi-Select) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Discipline Group <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <AddMasterButton label="Add New Group" onClick={() => setInlineModal({ isOpen: true, type: 'category', parentData: { companyId: formData.companyId, departmentId: currentGroup.departmentId } })} />
                  </div>
                  <SearchableSelect
                    options={[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                    value={currentGroup.categoryIds || []}
                    onChange={handleGroupCategoryChange}
                    placeholder="Select Discipline Group(s)"
                    searchPlaceholder="Search discipline group..."
                    disabled={!currentGroup.departmentId}
                    isMulti={true}
                  />
                </div>

                {/* 4. Sub Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Sub Category {subCategoriesLoading && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Loading...)</span>}
                    </label>
                    <AddMasterButton
                      label="Add Sub Category"
                      onClick={() => {
                        const activeCatId = currentGroup.categoryIds?.[0];
                        if (!activeCatId) {
                          triggerToast('Please select a Discipline Group first.', 'error');
                          return;
                        }
                        setInlineModal({ isOpen: true, type: 'subCategory', parentData: { categoryId: activeCatId, companyId: formData.companyId } });
                      }}
                    />
                  </div>
                  <SearchableSelect
                    options={[...subCategories].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                    value={currentGroup.subCategoryId || ''}
                    onChange={handleGroupSubCategoryChange}
                    placeholder="Select Sub Category (Optional)"
                    searchPlaceholder="Search sub category..."
                    disabled={(!currentGroup.categoryIds || currentGroup.categoryIds.length === 0) || subCategoriesLoading}
                  />
                </div>
              </div>
            </div>

            {(!currentGroup.categoryIds || currentGroup.categoryIds.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontWeight: 500 }}>
                Please select a Discipline Group for "{currentGroup.title || 'this location'}" to view and select parameters.
              </div>
            ) : parametersLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                Loading parameters...
              </div>
            ) : parameters.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                No parameters mapped to this selection
              </div>
            ) : (() => {
              const currentChecks = currentGroup.checkedParameters || {};
              const categoryFilteredParams = parameters.filter(param => {
                const matchesSubCat = !currentGroup.subCategoryId ||
                  param.subCategoryId === currentGroup.subCategoryId ||
                  param.subCategory?.id === currentGroup.subCategoryId ||
                  currentChecks[param.id];
                return matchesSubCat;
              });
              const searchFilteredParams = categoryFilteredParams
                .filter(param => {
                  if (!paramSearch.trim()) return true;
                  const q = paramSearch.toLowerCase();
                  return (param.parameterName || '').toLowerCase().includes(q) ||
                    (param.testMethod || '').toLowerCase().includes(q) ||
                    (param.categoryName || '').toLowerCase().includes(q);
                })
                .sort((a, b) => (a.parameterName || '').localeCompare(b.parameterName || ''));

              const totalParamItems = searchFilteredParams.length;
              const totalParamPages = Math.ceil(totalParamItems / paramPageSize) || 1;
              const safeParamPage = Math.min(Math.max(1, paramPage), totalParamPages);
              const startParamItem = totalParamItems === 0 ? 0 : (safeParamPage - 1) * paramPageSize + 1;
              const endParamItem = Math.min(safeParamPage * paramPageSize, totalParamItems);

              const paginatedParams = searchFilteredParams.slice(
                (safeParamPage - 1) * paramPageSize,
                safeParamPage * paramPageSize
              );

              const checkedParamIdsList = Object.keys(currentChecks).filter(k => !k.startsWith('_id_') && currentChecks[k]);
              const totalCheckedPrice = checkedParamIdsList.reduce((sum, pId) => {
                const paramObj = parameters.find(p => p.id === pId);
                const price = priceMasterMap[pId] !== undefined ? priceMasterMap[pId] : (paramObj?.price || 0);
                return sum + parseFloat(price || 0);
              }, 0);

              return categoryFilteredParams.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  {/* Top Bar / Header */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #ffffff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Select Test Parameters for</span>
                      <span style={{ color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                        {currentGroup.title || currentGroup.locationOfSample || 'Current Location'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Search box */}
                      <div style={{ position: 'relative', width: '220px' }}>
                        <input
                          type="text"
                          placeholder="Search parameters..."
                          value={paramSearch}
                          onChange={(e) => {
                            setParamSearch(e.target.value);
                            setParamPage(1);
                          }}
                          style={{
                            padding: '0.35rem 0.65rem 0.35rem 2rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                            width: '100%',
                            outline: 'none',
                            backgroundColor: '#ffffff'
                          }}
                        />
                        <FaSearch size={12} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        {paramSearch && (
                          <button
                            type="button"
                            onClick={() => setParamSearch('')}
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleSelectAllParameters}
                        style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!currentChecks[p.id])
                          ? 'Deselect All' : 'Select All'}
                      </button>

                      <span style={{ fontSize: '0.85rem', background: '#dcfce7', color: '#166534', padding: '0.3rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>
                        {currentGroup.locationOfSample || 'Group'} Total: ₹{totalCheckedPrice.toFixed(2)}
                      </span>

                      <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.65rem', borderRadius: '999px', fontWeight: 600 }}>
                        {checkedParamIdsList.length} Selected
                      </span>
                    </div>
                  </div>

                  {/* Clean Parameters Table */}
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.925rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '70px', color: '#64748b', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!currentChecks[p.id])}
                              onChange={handleToggleSelectAllParameters}
                              title={categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!currentChecks[p.id]) ? "Deselect All" : "Select All"}
                              style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: '#22c55e' }}
                            />
                          </th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Parameter Name</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Test Method</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 600, width: '130px' }}>Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedParams.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                              No parameters match your search criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedParams.map(param => {
                            const isChecked = !!currentChecks[param.id];
                            const paramPrice = priceMasterMap[param.id] !== undefined ? priceMasterMap[param.id] : (parseFloat(param.price) || 0);
                            const seqIndex = (currentGroup.selectedParamSequence || []).indexOf(param.id);
                            const seqNumber = seqIndex >= 0 ? seqIndex + 1 : null;
                            const catLabel = param.categoryName || param.category?.name || '';
                            const subCatLabel = param.subCategoryName || param.subCategory?.name || '';

                            return (
                              <tr
                                key={param.id}
                                onClick={() => handleParameterCheck(param.id)}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  backgroundColor: isChecked ? '#f0fdf4' : '#ffffff'
                                }}
                                onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                                onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = '#ffffff' }}
                              >
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: isChecked ? 'none' : '2px solid #cbd5e1', background: isChecked ? '#22c55e' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.15s ease' }}>
                                      {isChecked && <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>✓</span>}
                                    </div>
                                    {isChecked && seqNumber !== null && (
                                      <span style={{
                                        display: 'inline-flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minWidth: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: '#3b82f6',
                                        color: '#ffffff',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        lineHeight: 1
                                      }}>
                                        {seqNumber}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ color: isChecked ? '#166534' : '#1e293b', fontWeight: isChecked ? 600 : 500 }}>
                                    {param.parameterName}
                                  </div>
                                  {(catLabel || subCatLabel) && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap' }}>
                                      {catLabel && (
                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 7px', borderRadius: '4px', fontWeight: 500, border: '1px solid #e2e8f0' }}>
                                          {catLabel}
                                        </span>
                                      )}
                                      {subCatLabel && (
                                        <span style={{ background: '#f8fafc', color: '#64748b', padding: '1px 7px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                          {subCatLabel}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: isChecked ? '#15803d' : '#64748b' }}>
                                  {param.testMethod || 'N/A'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: isChecked ? '#15803d' : '#334155', fontWeight: 600 }}>
                                  ₹{paramPrice.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Clean Pagination Footer */}
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Showing <strong style={{ color: '#0f172a' }}>{startParamItem}</strong> to <strong style={{ color: '#0f172a' }}>{endParamItem}</strong> of <strong style={{ color: '#0f172a' }}>{totalParamItems}</strong> parameters
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>Rows per page:</span>
                        <select
                          value={paramPageSize}
                          onChange={(e) => {
                            setParamPageSize(Number(e.target.value));
                            setParamPage(1);
                          }}
                          style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', outline: 'none' }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={() => setParamPage(p => Math.max(1, p - 1))}
                          disabled={safeParamPage <= 1}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: safeParamPage <= 1 ? '#f1f5f9' : '#ffffff',
                            color: safeParamPage <= 1 ? '#94a3b8' : '#334155',
                            cursor: safeParamPage <= 1 ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <FaChevronLeft size={10} /> Prev
                        </button>

                        {/* Smart Page Pill Buttons */}
                        {Array.from({ length: totalParamPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalParamPages || Math.abs(page - safeParamPage) <= 1)
                          .map((page, idx, arr) => {
                            const prevPage = arr[idx - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && <span style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.15rem' }}>...</span>}
                                <button
                                  type="button"
                                  onClick={() => setParamPage(page)}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    border: page === safeParamPage ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                                    backgroundColor: page === safeParamPage ? '#8b5cf6' : '#ffffff',
                                    color: page === safeParamPage ? '#ffffff' : '#334155',
                                    fontWeight: page === safeParamPage ? 700 : 500,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    minWidth: '28px'
                                  }}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}

                        <button
                          type="button"
                          onClick={() => setParamPage(p => Math.min(totalParamPages, p + 1))}
                          disabled={safeParamPage >= totalParamPages}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: safeParamPage >= totalParamPages ? '#f1f5f9' : '#ffffff',
                            color: safeParamPage >= totalParamPages ? '#94a3b8' : '#334155',
                            cursor: safeParamPage >= totalParamPages ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          Next <FaChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quotation Summary Section */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #10b981, #059669)', borderRadius: '6px' }}></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Quotation Summary</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Consolidated testing groups, parameter counts, and pricing for this TRF</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSaveAndQuotation}
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <FaFilePdf />
                  <span>Generate Quotation</span>
                </button>
              </div>
            </div>

            {/* Breakdown List of Location Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {overallGroupStats.groupBreakdown.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  No testing parameters selected yet. Add a location and select parameters above.
                </div>
              ) : (
                overallGroupStats.groupBreakdown.map((grp, idx) => (
                  <div
                    key={`quotation_summary_g${idx}_${grp.groupId || grp.id || 'grp'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                          {grp.title || `${idx + 1}. ${grp.location}`}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {grp.location}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {grp.departmentName || 'Dept'} • {grp.disciplineName || 'Discipline'}{grp.subCategoryName ? ` • ${grp.subCategoryName}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                          {grp.paramCount} Parameter{grp.paramCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ minWidth: '110px', textAlign: 'right' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                          ₹{grp.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: '12px',
              color: '#ffffff',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Total Testing Locations: <strong style={{ color: '#ffffff' }}>{overallGroupStats.totalGroups}</strong>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  Total Testing Parameters: <strong style={{ color: '#38bdf8' }}>{overallGroupStats.totalParamCount}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Grand Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80' }}>
                    ₹{overallGroupStats.totalPrice.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAndQuotation}
                  disabled={submitting || overallGroupStats.totalParamCount === 0}
                  style={{
                    backgroundColor: overallGroupStats.totalParamCount === 0 ? '#475569' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: (submitting || overallGroupStats.totalParamCount === 0) ? 'not-allowed' : 'pointer',
                    boxShadow: overallGroupStats.totalParamCount === 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Generate Quotation →
                </button>
              </div>
            </div>
          </div>

          {/* Facility & Technical Feasibility Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #f59e0b, #fbbf24)', borderRadius: '6px' }}></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Facility & Feasibility</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    equipmentAvailability: 'Available',
                    referenceStandardAvailability: 'Available',
                    sampleAdequacy: 'Adequate',
                    testMethodAvailability: 'Available',
                    trainedPersonAvailability: 'Available'
                  }));
                }}
                style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                ✓ Quick Set All Available
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>

              {/* Availability of Equipments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Equipments</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.equipmentAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="equipmentAvailability" value="Available" checked={(formData.equipmentAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.equipmentAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="equipmentAvailability" value="Not Available" checked={formData.equipmentAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Availability of Reference Standards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Reference Standards</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.referenceStandardAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="referenceStandardAvailability" value="Available" checked={(formData.referenceStandardAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.referenceStandardAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="referenceStandardAvailability" value="Not Available" checked={formData.referenceStandardAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Adequacy of Sample Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Adequacy of Sample Quantity</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.sampleAdequacy || 'Adequate') === 'Adequate' ? '#166534' : '#475569' }}>
                    <input type="radio" name="sampleAdequacy" value="Adequate" checked={(formData.sampleAdequacy || 'Adequate') === 'Adequate'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Adequate
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.sampleAdequacy === 'Not Adequate' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="sampleAdequacy" value="Not Adequate" checked={formData.sampleAdequacy === 'Not Adequate'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Adequate
                  </label>
                </div>
              </div>

              {/* Availability of Test Method */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Test Method</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.testMethodAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="testMethodAvailability" value="Available" checked={(formData.testMethodAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.testMethodAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="testMethodAvailability" value="Not Available" checked={formData.testMethodAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Availability of Trained Person */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Trained Person</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.trainedPersonAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="trainedPersonAvailability" value="Available" checked={(formData.trainedPersonAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.trainedPersonAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="trainedPersonAvailability" value="Not Available" checked={formData.trainedPersonAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Tentative Days of Issuing Report</label>
                <input type="text" name="tentativeDays" value={formData.tentativeDays} onChange={handleChange} className="premium-input" placeholder="e.g. 15-20 Days" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Testing Facility Reviewed By</label>
                <input type="text" name="sampleTestingFacilityReviewedBy" value={formData.sampleTestingFacilityReviewedBy} onChange={handleChange} className="premium-input" placeholder="Quality Manager /Technical Manager" />
              </div>
            </div>
          </div>

          {/* Signatures & Adoption Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #ec4899, #f472b6)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Signatures & Adoption</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Name & Designation of Customer Representative</label>
                <input type="text" name="customerRepresentativeName" value={formData.customerRepresentativeName} onChange={handleChange} className="premium-input" placeholder="Enter representative name..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Name & Designation of Sample Receiver</label>
                <input type="text" name="sampleReceiverName" value={formData.sampleReceiverName} onChange={handleChange} className="premium-input" placeholder="Enter receiver name..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Test Protocol / Method to be Adopted</label>
                <textarea name="testProtocol" value={formData.testProtocol} onChange={handleChange} className="premium-input" rows={3} placeholder="Ground Water/Surface Water/Drinking Water: APHA..."></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Remarks / Additional Notes</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="premium-input" rows={3} placeholder="Enter any extra remarks..."></textarea>
              </div>
            </div>
          </div>



          {/* HIDE MULTIPLE QUOTATIONS FUNCTIONALITY (DISABLED) */}
          {false && (
            <>
              {formData.quotationRequired === 'Yes' && formData.quotationType === 'Audit' && (
                <div style={{ marginTop: '2rem' }}>
                  {/* Card 1: Basic details */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Basic Quotation Details</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Quotation Reference Number</label>
                        <input type="text" name="quotationNumber" value={quotationData.quotationNumber} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Quotation Date</label>
                        <input type="text" name="quotationDate" placeholder="dd/mm/yyyy" value={quotationData.quotationDate} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Revised Date (Optional)</label>
                        <input type="text" name="revisedDate" placeholder="dd/mm/yyyy" value={quotationData.revisedDate} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Financial Year / Year</label>
                        <input type="text" name="financialYear" value={quotationData.financialYear} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Audit Reference</label>
                        <input type="text" name="reference" value={quotationData.reference} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Subject Heading</label>
                        <textarea name="subject" value={quotationData.subject} onChange={handleQuotationChange} className="premium-input" rows={2}></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Letter Content */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Page 1 - Letter Content</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Introductory & Accreditation Paragraphs</label>
                      <textarea name="introText" value={quotationData.introText} onChange={handleQuotationChange} className="premium-input" rows={6} style={{ fontSize: '0.85rem' }}></textarea>
                    </div>
                  </div>

                  {/* Card 3: Scope of Work */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Page 2 - Scope of Work</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Scope Points Text</label>
                      <textarea name="scopeText" value={quotationData.scopeText} onChange={handleQuotationChange} className="premium-input" rows={5} style={{ fontSize: '0.85rem' }}></textarea>
                    </div>
                  </div>

                  {/* Card 4: Charges Table */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Page 2 - Detail of Charges</h3>
                      </div>
                      <button type="button" onClick={addQuotationChargeRow} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                        <FaPlus /> Add Row
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {quotationData.charges?.map((item, index) => (
                        <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Row #{item.srNo}</span>
                            <button type="button" onClick={() => removeQuotationChargeRow(index)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                              <FaTrash size={12} /> Remove
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Description of Work</label>
                              <input type="text" value={item.description} onChange={(e) => handleQuotationChargeRowChange(index, 'description', e.target.value)} className="premium-input" style={{ fontSize: '0.85rem', height: '36px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                              <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Qty</label>
                                <input type="number" value={item.qty} onChange={(e) => handleQuotationChargeRowChange(index, 'qty', e.target.value)} className="premium-input" style={{ fontSize: '0.85rem', height: '36px' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Unit</label>
                                <input type="text" value={item.unit} onChange={(e) => handleQuotationChargeRowChange(index, 'unit', e.target.value)} className="premium-input" style={{ fontSize: '0.85rem', height: '36px' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Rate (Rs.)</label>
                                <input type="number" value={item.rate} onChange={(e) => handleQuotationChargeRowChange(index, 'rate', e.target.value)} className="premium-input" style={{ fontSize: '0.85rem', height: '36px' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Amount (Rs.)</label>
                                <input type="number" value={item.amount} onChange={(e) => handleQuotationChargeRowChange(index, 'amount', e.target.value)} className="premium-input" style={{ fontSize: '0.85rem', height: '36px' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 5: Terms and Conditions */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Page 3 - Terms & Conditions</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Terms text list</label>
                        <textarea name="termsText" value={quotationData.termsText} onChange={handleQuotationChange} className="premium-input" rows={6} style={{ fontSize: '0.85rem' }}></textarea>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Contact Person Details</label>
                        <input type="text" name="contactPerson" value={quotationData.contactPerson} onChange={handleQuotationChange} className="premium-input" />
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Signatory details */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Signatory & Stamp Configuration</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Signatory Name</label>
                          <input type="text" name="signatoryName" value={quotationData.signatoryName} onChange={handleQuotationChange} className="premium-input" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Signatory Designation</label>
                          <input type="text" name="signatoryDesignation" value={quotationData.signatoryDesignation} onChange={handleQuotationChange} className="premium-input" />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Authorized Digital Signature</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="file" ref={signatureInputRef} onChange={(e) => handleQuotationFileUpload(e, 'signatorySignature')} accept="image/*" style={{ display: 'none' }} />
                            <button type="button" onClick={() => signatureInputRef.current.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                              <FaUpload /> Upload Signature
                            </button>
                            {quotationData.signatorySignature && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <img src={quotationData.signatorySignature} alt="Signature Preview" style={{ maxHeight: '36px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                <button type="button" onClick={() => removeQuotationImage('signatorySignature')} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Company Round Stamp</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="file" ref={stampInputRef} onChange={(e) => handleQuotationFileUpload(e, 'stampImage')} accept="image/*" style={{ display: 'none' }} />
                            <button type="button" onClick={() => stampInputRef.current.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                              <FaUpload /> Upload Stamp
                            </button>
                            {quotationData.stampImage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <img src={quotationData.stampImage} alt="Stamp Preview" style={{ maxHeight: '36px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                <button type="button" onClick={() => removeQuotationImage('stampImage')} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Annexure Rates */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
                      <div style={{ width: '8px', height: '18px', background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', borderRadius: '4px' }}></div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Annexure-B Rates Editor</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {quotationData.annexure?.map((item, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.4rem' }}>
                            <span>{item.category}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#475569' }}>Description</label>
                              <input type="text" value={item.description} onChange={(e) => handleQuotationAnnexureRowChange(index, 'description', e.target.value)} className="premium-input" style={{ fontSize: '0.8rem', height: '32px' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#475569' }}>Rate/Sample</label>
                              <input type="number" value={item.ratePerSample} onChange={(e) => handleQuotationAnnexureRowChange(index, 'ratePerSample', e.target.value)} className="premium-input" style={{ fontSize: '0.8rem', height: '32px' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#475569' }}>Sample/Visit</label>
                              <input type="number" value={item.samplePerVisit} onChange={(e) => handleQuotationAnnexureRowChange(index, 'samplePerVisit', e.target.value)} className="premium-input" style={{ fontSize: '0.8rem', height: '32px' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bottom Action Bar */}
          <div className="test-request-bottom-actions hide-on-print" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 2rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {showLivePreview ? <FaEyeSlash /> : <FaEye />}
              <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndNavigate}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaSave />
              <span>{submitting ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndPrint}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaPrint />
              <span>Save &amp; TRF PDF</span>
            </button>
            {formData.quotationRequired === 'Yes' && (
              <button
                type="button"
                onClick={handleSaveAndQuotation}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                <FaFilePdf />
                <span>Generate Quotation</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Live Preview Simulator */}
        {showLivePreview && (
          <div className="live-preview-container hide-on-mobile" style={{
            width: '460px',
            flexShrink: 0,
            position: 'sticky',
            top: '24px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Document Preview</span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', background: '#e8fdf0', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #b8ffd0', fontWeight: 'bold' }}>A4 Format</span>
            </div>

            {/* HIDE MULTIPLE QUOTATIONS FUNCTIONALITY (DISABLED)
            formData.quotationRequired === 'Yes' && formData.quotationType === 'Audit' && (
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('TRF')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: activePreviewTab === 'TRF' ? '#ffffff' : 'transparent',
                    color: activePreviewTab === 'TRF' ? '#0f172a' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  TRF Form Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('Quotation')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: activePreviewTab === 'Quotation' ? '#ffffff' : 'transparent',
                    color: activePreviewTab === 'Quotation' ? '#0f172a' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Audit Quotation Preview
                </button>
              </div>
            )*/}

            {activePreviewTab === 'Quotation' && formData.quotationRequired === 'Yes' && formData.quotationType === 'Audit' ? (
              // Audit Quotation Preview
              (() => {
                const getQuotationLogoUrl = () => {
                  const logoPath = selCompany.quotationLogo || selCompany.quotation_logo || selCompany.logo;
                  if (!logoPath) return '/Images/Navbar_Logo.png';
                  const cleanPath = logoPath.replace(/\\/g, '/');
                  const idx = cleanPath.lastIndexOf('uploads/');
                  if (idx !== -1) {
                    return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
                  }
                  return logoPath;
                };

                const pageStyle = {
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  padding: '1.25rem',
                  fontSize: '9px',
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  color: '#000000',
                  lineHeight: '1.4',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '1.5rem',
                  position: 'relative',
                  minHeight: '580px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                };

                const tableStyle = {
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000000',
                  fontSize: '8px',
                  marginBottom: '10px'
                };

                const thTdStyle = {
                  border: '1px solid #000000',
                  padding: '3px 4px',
                  verticalAlign: 'middle'
                };

                const companyLogo = getQuotationLogoUrl();
                const quotationSubtotal = (quotationData.charges || []).reduce((sum, item) => {
                  const amt = parseFloat(item.amount);
                  return sum + (isNaN(amt) ? 0 : amt);
                }, 0);
                const quotationGst = Math.round(quotationSubtotal * 0.18);
                const quotationGrandTotal = quotationSubtotal + quotationGst;

                const quotationGroupedAnnexure = (quotationData.annexure || []).reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {});

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Page 1 */}
                    <div style={pageStyle}>
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                          <img src={companyLogo} alt="Logo" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                          <hr style={{ border: 'none', borderTop: '1px solid #000000', margin: '4px 0 8px 0' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '8px', marginBottom: '10px' }}>
                          Date: {quotationData.quotationDate}
                        </div>
                        <div style={{ marginBottom: '12px', fontSize: '9px' }}>
                          <div style={{ fontWeight: 'bold' }}>To,</div>
                          <div style={{ fontWeight: 'bold' }}>M/s. {selClient.companyName || selClient.clientName || 'CLIENT NAME'}</div>
                          <div style={{ whiteSpace: 'pre-line', marginTop: '2px', color: '#334155' }}>
                            {selClient.plantAddress || selClient.officeAddress || selClient.address || 'Plant Address'}
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px' }}>
                          SUBJECT: - <span style={{ textDecoration: 'underline' }}>{quotationData.subject}</span>
                        </div>
                        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Dear Sir,</div>
                        <div style={{ textAlign: 'justify', whiteSpace: 'pre-line', fontSize: '8px', color: '#1e293b', marginBottom: '12px' }}>
                          {quotationData.introText}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div>Thanking you</div>
                          <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <div>For, {selCompany.companyName?.toUpperCase() || selCompany.company_name?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}.</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '6px 0' }}>
                            {quotationData.signatorySignature && (
                              <img src={quotationData.signatorySignature} alt="Signature" style={{ maxHeight: '35px', objectFit: 'contain' }} />
                            )}
                            {quotationData.stampImage && (
                              <img src={quotationData.stampImage} alt="Stamp" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                            )}
                          </div>
                          <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{quotationData.signatoryName || 'Purvin Raiyani'}</div>
                          <div>({quotationData.signatoryDesignation || 'Proprietor'})</div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center', fontSize: '6px', color: '#64748b', marginTop: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#0f172a' }}>"NURTURING THE NATURE FOR HUMAN RACE"</div>
                        <div>5-6/B, Nayan Jyot Chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist.- Rajkot (GUJ.) +91 81405 55515</div>
                        <div>Email: jagnathtechnologies@yahoo.com / www.jagnathlabtechnologies.com</div>
                      </div>
                    </div>

                    {/* Page 2 */}
                    <div style={pageStyle}>
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                          <img src={companyLogo} alt="Logo" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                          <hr style={{ border: 'none', borderTop: '1px solid #000000', margin: '4px 0 8px 0' }} />
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                          <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '10px', margin: 0 }}>PROVISIONAL ESTIMATED QUOTE</h3>
                        </div>
                        <table style={{ ...tableStyle, border: '1px solid #000000', width: '100%', marginBottom: '12px' }}>
                          <tbody>
                            <tr>
                              <td style={{ ...thTdStyle, width: '50%', fontWeight: 'bold' }}>CLIENT NAME:- <span style={{ fontWeight: 'normal' }}>M/s. {selClient.companyName || selClient.clientName || 'CLIENT NAME'}</span></td>
                              <td style={{ ...thTdStyle, width: '50%', fontWeight: 'bold' }}>REFERENCE:- <span style={{ fontWeight: 'normal' }}>{quotationData.reference}</span></td>
                            </tr>
                            <tr>
                              <td style={{ ...thTdStyle, fontWeight: 'bold' }}>ADDRESS:- <span style={{ fontWeight: 'normal' }}>{selClient.plantAddress || selClient.officeAddress || selClient.address || 'Address'}</span></td>
                              <td style={{ ...thTdStyle, fontWeight: 'bold' }}>APPROVED BY:- <span style={{ fontWeight: 'normal' }}>{quotationData.signatoryName || 'Mr. Purvin Patel'}</span></td>
                            </tr>
                            <tr>
                              <td style={{ ...thTdStyle, fontWeight: 'bold' }}>Q-P.I :- <span style={{ fontWeight: 'normal' }}>{quotationData.quotationNumber}</span></td>
                              <td style={{ ...thTdStyle, fontWeight: 'bold' }}>
                                DATE:- <span style={{ fontWeight: 'normal' }}>{quotationData.quotationDate}</span>
                                {quotationData.revisedDate && <div>REVISED DATE:- <span style={{ fontWeight: 'normal' }}>{quotationData.revisedDate}</span></div>}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ marginBottom: '10px' }}>
                          <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '9px' }}>SCOPE OF WORK</h4>
                          <div style={{ whiteSpace: 'pre-line', fontSize: '7.5px', lineHeight: '1.3', textAlign: 'justify' }}>
                            {quotationData.scopeText}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '9px' }}>Detail of Charges:</h4>
                          <table style={tableStyle}>
                            <thead>
                              <tr style={{ backgroundColor: '#f1f5f9' }}>
                                <th style={{ ...thTdStyle, width: '8%', textAlign: 'center' }}>Sr. No.</th>
                                <th style={{ ...thTdStyle, width: '47%', textAlign: 'left' }}>Description of work</th>
                                <th style={{ ...thTdStyle, width: '10%', textAlign: 'center' }}>Qty.</th>
                                <th style={{ ...thTdStyle, width: '10%', textAlign: 'center' }}>Unit</th>
                                <th style={{ ...thTdStyle, width: '12%', textAlign: 'right' }}>Rate</th>
                                <th style={{ ...thTdStyle, width: '13%', textAlign: 'right' }}>Amount Rs.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quotationData.charges?.map((item, index) => (
                                <tr key={index}>
                                  <td style={{ ...thTdStyle, textAlign: 'center' }}>{item.srNo || index + 1}</td>
                                  <td style={thTdStyle}>{item.description}</td>
                                  <td style={{ ...thTdStyle, textAlign: 'center' }}>{item.qty}</td>
                                  <td style={{ ...thTdStyle, textAlign: 'center' }}>{item.unit}</td>
                                  <td style={{ ...thTdStyle, textAlign: 'right' }}>{parseFloat(item.rate || 0).toLocaleString('en-IN')}/-</td>
                                  <td style={{ ...thTdStyle, textAlign: 'right' }}>{parseFloat(item.amount || 0).toLocaleString('en-IN')}/-</td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                                <td colSpan={5} style={{ ...thTdStyle, textAlign: 'right' }}>Total Subtotal:</td>
                                <td style={{ ...thTdStyle, textAlign: 'right' }}>{quotationSubtotal.toLocaleString('en-IN')}/-</td>
                              </tr>
                              <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                                <td colSpan={5} style={{ ...thTdStyle, textAlign: 'right' }}>GST (18%):</td>
                                <td style={{ ...thTdStyle, textAlign: 'right' }}>{quotationGst.toLocaleString('en-IN')}/-</td>
                              </tr>
                              <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', fontSize: '9px' }}>
                                <td colSpan={5} style={{ ...thTdStyle, textAlign: 'right' }}>Grand Total (Rs.):</td>
                                <td style={{ ...thTdStyle, textAlign: 'right' }}>{quotationGrandTotal.toLocaleString('en-IN')}/-</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div style={{ fontSize: '7px', fontStyle: 'italic' }}>
                          Note: - Tax will be paid extra (GST 18%) apart from above rate/amount.
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#64748b' }}>
                        <span style={{ fontWeight: 'bold' }}>Page 2</span>
                        <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#0f172a' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                        <span style={{ width: '20px' }}></span>
                      </div>
                    </div>

                    {/* Page 3 */}
                    <div style={pageStyle}>
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                          <img src={companyLogo} alt="Logo" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                          <hr style={{ border: 'none', borderTop: '1px solid #000000', margin: '4px 0 8px 0' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '10px' }}>Terms and conditions:</h4>
                          <div style={{ whiteSpace: 'pre-line', fontSize: '7.5px', lineHeight: '1.4', textAlign: 'justify' }}>
                            {quotationData.termsText}
                          </div>
                        </div>
                        <div style={{ fontSize: '7px', fontStyle: 'italic', marginBottom: '12px', background: '#f8fafc', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          (Note: - We have briefly studied all your scope of work and accordingly we are tied and committed to uphold highest standards of honesty & integrity for accuracy to the work order.)
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div>Thanking you in anticipation!</div>
                          <div style={{ fontWeight: 'bold' }}>For, {selCompany.companyName?.toUpperCase() || selCompany.company_name?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                          {quotationData.signatorySignature && (
                            <img src={quotationData.signatorySignature} alt="Signature" style={{ maxHeight: '35px', objectFit: 'contain' }} />
                          )}
                          {quotationData.stampImage && (
                            <img src={quotationData.stampImage} alt="Stamp" style={{ maxHeight: '45px', objectFit: 'contain' }} />
                          )}
                        </div>
                        <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
                        <div style={{ marginTop: '10px', fontSize: '8px', fontWeight: 'bold' }}>
                          Contact Person: - {quotationData.contactPerson}
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#64748b' }}>
                        <span style={{ fontWeight: 'bold' }}>Page 3</span>
                        <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#0f172a' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                        <span style={{ width: '20px' }}></span>
                      </div>
                    </div>

                    {/* Page 4 */}
                    <div style={pageStyle}>
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                          <img src={companyLogo} alt="Logo" style={{ maxHeight: '40px', objectFit: 'contain' }} />
                          <hr style={{ border: 'none', borderTop: '1px solid #000000', margin: '2px 0 4px 0' }} />
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                          <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '9px', margin: 0 }}>Annexure - B</h3>
                        </div>
                        <table style={{ ...tableStyle, fontSize: '6.5px', marginBottom: '8px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                              <th style={{ ...thTdStyle, width: '6%', padding: '2px' }}>Sr. No.</th>
                              <th style={{ ...thTdStyle, width: '36%', padding: '2px', textAlign: 'left' }}>DESCRIPTIONS</th>
                              <th style={{ ...thTdStyle, width: '13%', padding: '2px' }}>Rate per sample</th>
                              <th style={{ ...thTdStyle, width: '13%', padding: '2px' }}>Sample per visit</th>
                              <th style={{ ...thTdStyle, width: '16%', padding: '2px' }}>Charges per visit / order</th>
                              <th style={{ ...thTdStyle, width: '16%', padding: '2px' }}>Total (3 visit)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(quotationGroupedAnnexure).map((catName, catIdx) => {
                              const items = quotationGroupedAnnexure[catName];
                              return (
                                <React.Fragment key={catIdx}>
                                  <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>
                                    <td style={{ ...thTdStyle, textAlign: 'center', padding: '2px' }}>{catIdx + 1}</td>
                                    <td colSpan={5} style={{ ...thTdStyle, padding: '2px', textTransform: 'uppercase' }}>{catName}</td>
                                  </tr>
                                  {items.map((item, itemIdx) => (
                                    <tr key={itemIdx}>
                                      <td style={thTdStyle}></td>
                                      <td style={{ ...thTdStyle, padding: '2px 4px' }}>{item.description}</td>
                                      <td style={{ ...thTdStyle, textAlign: 'center', padding: '2px' }}>{parseFloat(item.ratePerSample || 0).toLocaleString('en-IN')}/-</td>
                                      <td style={{ ...thTdStyle, textAlign: 'center', padding: '2px' }}>{item.samplePerVisit}</td>
                                      <td style={{ ...thTdStyle, textAlign: 'right', padding: '2px' }}>{parseFloat(item.chargesPerVisit || 0).toLocaleString('en-IN')}/-</td>
                                      <td style={{ ...thTdStyle, textAlign: 'right', padding: '2px', fontWeight: 'bold' }}>{parseFloat(item.total || 0).toLocaleString('en-IN')}/-</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ fontSize: '6.5px', fontStyle: 'italic', background: '#f8fafc', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                          Note: At the time of visit if any extra stack found then extra charges will be included in invoice and if any parameters found to be added for testing then their charges are to be included at the time of reporting and invoice.
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '6px', color: '#64748b' }}>
                        <span style={{ fontWeight: 'bold' }}>Page 4</span>
                        <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#0f172a' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                        <span style={{ width: '20px' }}></span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Original TRF Preview
              <>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  padding: '1.25rem',
                  fontSize: '10px',
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  color: '#000000',
                  lineHeight: '1.3'
                }}>
                  {/* Header block */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginBottom: '8px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '45%', border: '1px solid #000000', padding: '0px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <img src={getSelectedCompanyLogo()} alt="Logo" style={{ height: '75px', width: '100%', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '25%', border: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                          FORMATS
                        </td>
                        <td style={{ width: '30%', border: '1px solid #000000', padding: '0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7px' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment No.</td><td style={{ padding: '2px 3px' }}>00</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment Date</td><td style={{ padding: '2px 3px' }}>--</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue No.</td><td style={{ padding: '2px 3px' }}>01</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue Date</td><td style={{ padding: '2px 3px' }}>01/09/2018</td></tr>
                              <tr><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No.</td><td style={{ padding: '2px 3px' }}>7.1 F-01</td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Document Title */}
                  <div style={{ border: '1px solid #000000', borderTop: 'none', background: '#f8fafc', padding: '3px', textAlign: 'center', fontWeight: 'bold', fontSize: '8px', marginBottom: '8px' }}>
                    TEST REQUEST FORM FOR {formData.formTitle || 'WATER & WASTE WATER'}
                  </div>

                  {/* Form Fields Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '8px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ width: '32%', padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Name of Company / Customer</td>
                        <td style={{ padding: '3px 4px' }}>{selCompany.companyName || selCompany.company_name || '(Select Company)'} {selClient.clientName ? `- ${selClient.clientName}` : ''}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Address for Communication</td>
                        <td style={{ padding: '3px 4px' }}>{formData.address || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Email ID</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{formData.email || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Location of Sample</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.locationOfSample || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Contact Person</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{formData.contactPerson || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Contact No.</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.contactNumber || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Date of Collection</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{formData.dateOfCollection || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Date of Receipt</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.dateOfReceipt || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample Collected By</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{formData.sampleCollectedBy || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Sample Quantity</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.sampleQuantity || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Field Data Sheet</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formData.fieldDataSheet}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px' }}>Packing details</span>
                            <span>{formData.packingDetails || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Form Type</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.formType || 'Regular'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample ID No.</td>
                        <td style={{ padding: '3px 4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{formData.sampleIdNumber || 'N/A'}</span>
                            <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Report No.</span>
                            <span style={{ paddingLeft: '6px' }}>{formData.reportNumber || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample Particular</td>
                        <td style={{ padding: '3px 4px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{formData.sampleParticular || selCategory.name || 'N/A'}</td>
                      </tr>

                      {/* Feasibility table inner block */}
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '0', fontWeight: '600' }} colSpan={2}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7.5px' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #000000' }}>
                                <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Equip.</td>
                                <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.equipmentAvailability}</td>
                                <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Ref Std.</td>
                                <td style={{ width: '25%', padding: '2px 3px' }}>{formData.referenceStandardAvailability}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Test Method</td>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.testMethodAvailability}</td>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Trained Person</td>
                                <td style={{ padding: '2px 3px' }}>{formData.trainedPersonAvailability}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Adequacy of sample qty</td>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.sampleAdequacy}</td>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Tentative Report Days</td>
                                <td style={{ padding: '2px 3px' }}>{formData.tentativeDays}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Facility reviewed by</td>
                        <td style={{ padding: '3px 4px' }}>{formData.sampleTestingFacilityReviewedBy}</td>
                      </tr>

                      {/* Signatures space */}
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '0', fontWeight: '600' }} colSpan={2}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7.5px' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #000000', height: '20px' }}>
                                <td style={{ width: '50%', padding: '2px 3px', borderRight: '1px solid #000000', verticalAlign: 'top', fontWeight: 'bold' }}>Signature of Customer Representative:</td>
                                <td style={{ width: '50%', padding: '2px 3px', verticalAlign: 'top', fontWeight: 'bold' }}>Signature of Sample Received By:</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>
                                  Name & Designation: <span style={{ fontWeight: 'normal' }}>{formData.customerRepresentativeName || 'N/A'}</span>
                                </td>
                                <td style={{ padding: '2px 3px', fontWeight: 'bold' }}>
                                  Name & Designation: <span style={{ fontWeight: 'normal' }}>{formData.sampleReceiverName || 'N/A'}</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000', verticalAlign: 'top' }}>Test Protocol adopted</td>
                        <td style={{ padding: '3px 4px', whiteSpace: 'pre-wrap' }}>{formData.testProtocol}</td>
                      </tr>

                      <tr>
                        <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000', verticalAlign: 'top' }}>Remarks / Notes</td>
                        <td style={{ padding: '3px 4px', whiteSpace: 'pre-wrap' }}>
                          <ol style={{ margin: 0, paddingLeft: '1rem', fontSize: '7px' }}>
                            <li>Please mention specific tests to be applied</li>
                            <li>All the test procedures are followed as per National & International Standards.</li>
                            <li>In case of sampling conducted by JLT, sampling plan is followed as per National & International Standards.</li>
                            <li>If due to any unavoidable condition, testing will be sub-contracted only to NABL-complying competent agencies.</li>
                          </ol>
                          {formData.remarks && <div style={{ marginTop: '3px', borderTop: '1px dashed #cbd5e1', paddingTop: '3px' }}><strong>Additional:</strong> {formData.remarks}</div>}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer Page 1 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '7px', marginTop: 'auto' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}>Doc No: JLT/ 7.1 F-01</td>
                        <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}></td>
                        <td style={{ width: '33.33%', padding: '2px 3px', textAlign: 'right' }}>Page 1 of 2</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No. 7.1 F-01</td>
                        <td colSpan={2} style={{ padding: '2px 3px' }}>Format: Test Request Form (Water & Waste Water)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Prepared By: TM</td>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Approved By: QM</td>
                        <td style={{ padding: '2px 3px' }}>Issue By/Reviewed By: TM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PAGE BREAK / SPACER */}
                <div style={{ margin: '2rem 0', borderTop: '2px dashed #cbd5e1', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#f8fafc', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Page 2 Preview</span>
                </div>

                {/* PAGE 2 */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #000000',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  padding: '1.25rem',
                  fontSize: '10px',
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  color: '#000000',
                  lineHeight: '1.3',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '297mm',
                  boxSizing: 'border-box'
                }}>
                  {/* Header block (repeated from Page 1) */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginBottom: '8px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '45%', border: '1px solid #000000', padding: '0px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <img src={getSelectedCompanyLogo()} alt="Logo" style={{ height: '75px', width: '100%', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
                        </td>
                        <td style={{ width: '25%', border: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                          FORMATS
                        </td>
                        <td style={{ width: '30%', border: '1px solid #000000', padding: '0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7px' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment No.</td><td style={{ padding: '2px 3px' }}>00</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment Date</td><td style={{ padding: '2px 3px' }}>--</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue No.</td><td style={{ padding: '2px 3px' }}>01</td></tr>
                              <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue Date</td><td style={{ padding: '2px 3px' }}>01/09/2018</td></tr>
                              <tr><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No.</td><td style={{ padding: '2px 3px' }}>7.1 F-01</td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '8px', border: '1px solid #000000', borderTop: 'none', background: '#f8fafc', padding: '3px', textAlign: 'center' }}>
                    Test Parameters to Be Analyzed ({overallGroupStats.totalGroups} Testing Location{overallGroupStats.totalGroups > 1 ? 's' : ''}, {overallGroupStats.totalParamCount} Parameter{overallGroupStats.totalParamCount !== 1 ? 's' : ''})
                  </div>

                  {/* Parameters Grid */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '8px', marginBottom: '8px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000' }}>
                        <th style={{ width: '8%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'center' }}>Sr. No.</th>
                        <th style={{ width: '42%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'left' }}>Test Parameters</th>
                        <th style={{ width: '10%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'center' }}>Tick √</th>
                        <th style={{ width: '40%', padding: '3px', textAlign: 'center' }}>Test Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overallGroupStats.totalParamCount > 0 ? (
                        overallGroupStats.groupBreakdown.flatMap((grp, gIdx) => {
                          const grpRows = grp.parameters.map((p, pIdx) => (
                            <tr key={`row_g${gIdx}_${grp.groupId || grp.id || 'grp'}_p${pIdx}_${p.id || 'param'}`} style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center' }}>{pIdx + 1}.</td>
                              <td style={{ padding: '2px 4px', borderRight: '1px solid #000000', textAlign: 'left' }}>{p.parameterName || p.name}</td>
                              <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', color: '#15803d' }}>√</td>
                              <td style={{ padding: '2px 4px', textAlign: 'left' }}>{p.testMethod || ''}</td>
                            </tr>
                          ));

                          if (overallGroupStats.totalGroups > 1) {
                            return [
                              <tr key={`hdr_g${gIdx}_${grp.groupId || grp.id || 'grp'}`} style={{ background: '#f1f5f9', borderBottom: '1px solid #000000', fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ padding: '3px 6px', fontSize: '7.5px', color: '#0f172a' }}>
                                  📍 {grp.title || `${gIdx + 1}. ${grp.location}`} {grp.departmentName ? `(${grp.departmentName} - ${grp.disciplineName || ''})` : ''}
                                </td>
                              </tr>,
                              ...grpRows
                            ];
                          }
                          return grpRows;
                        })
                      ) : (
                        Array.from({ length: Math.max(20, parameters.length) }).map((_, i) => {
                          const param = parameters[i];
                          const isChecked = param ? !!checkedParameters[param.id] : false;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #000000' }}>
                              <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center' }}>{i + 1}.</td>
                              <td style={{ padding: '2px 4px', borderRight: '1px solid #000000', textAlign: 'left' }}>{param ? (param.parameterName || param.name) : ''}</td>
                              <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', color: '#15803d' }}>{isChecked ? '√' : ''}</td>
                              <td style={{ padding: '2px 4px', textAlign: 'left' }}>{param ? (param.testMethod || '') : ''}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Approved By Technical Manager */}
                  <div style={{ textAlign: 'right', marginTop: '1.5rem', fontWeight: 'bold', fontSize: '8px', paddingRight: '1.5rem' }}>
                    Approved By<br />
                    Technical Manager
                  </div>

                  {/* Footer Page 2 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '7px', marginTop: 'auto' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}>Doc No: JLT/ 7.1 F-01</td>
                        <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}></td>
                        <td style={{ width: '33.33%', padding: '2px 3px', textAlign: 'right' }}>Page 2 of 2</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No. 7.1 F-01</td>
                        <td colSpan={2} style={{ padding: '2px 3px' }}>Format: Test Request Form (Water & Waste Water)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Prepared By: TM</td>
                        <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Approved By: QM</td>
                        <td style={{ padding: '2px 3px' }}>Issue By/Reviewed By: TM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Inline Master Creation Modal */}
        <InlineMasterModal
          isOpen={inlineModal.isOpen}
          onClose={() => setInlineModal({ isOpen: false, type: null, parentData: {} })}
          masterType={inlineModal.type}
          parentData={inlineModal.parentData}
          onSuccess={(createdItem) => {
            if (inlineModal.type === 'category') {
              fetchCategories();
              if (createdItem?.id) {
                setFormData(prev => ({ ...prev, categoryId: createdItem.id, subCategoryId: '' }));
                setSelectedSubCategory('');
                fetchSubCategoriesForCategory(createdItem.id);
                fetchParameters('', createdItem.id);
              }
            } else if (inlineModal.type === 'subCategory') {
              const catId = inlineModal.parentData?.categoryId || formData.categoryId;
              if (catId) {
                fetchSubCategoriesForCategory(catId);
              }
              if (createdItem?.id) {
                setSelectedSubCategory(createdItem.id);
                setFormData(prev => ({ ...prev, subCategoryId: createdItem.id }));
                fetchParameters(createdItem.id);
              }
            } else if (inlineModal.type === 'locationSample') {
              fetchLocationSamples();
              if (createdItem?.id) {
                setSelectedParamLocation(createdItem.id);
                setFormData(prev => ({ ...prev, locationOfSample: createdItem.name || prev.locationOfSample }));
              }
            } else if (inlineModal.type === 'client') {
              fetchClients();
              if (createdItem?.id) {
                setFormData(prev => ({
                  ...prev,
                  clientId: createdItem.id,
                  address: createdItem.plantAddress || createdItem.plant_address || createdItem.officeAddress || createdItem.office_address || createdItem.address || prev.address,
                  email: createdItem.email || prev.email,
                  contactNumber: createdItem.contactNumber || prev.contactNumber
                }));
              }
            } else if (inlineModal.type === 'caution') {
              fetchCautions();
              if (createdItem?.id) {
                setFormData(prev => ({ ...prev, includeCaution: true, cautionId: createdItem.id }));
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default TestRequestForm;
