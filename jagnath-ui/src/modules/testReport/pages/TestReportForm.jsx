import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaEye, FaEyeSlash, FaPlus, FaTrash,
  FaCheck, FaExclamationCircle, FaClipboardList, FaFlask, FaFilePdf, FaUserTie,
  FaFileArchive, FaCopy, FaLayerGroup
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import {
  TEST_REQUEST_ENDPOINTS,
  TEST_REPORT_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  BACKEND_ROOT_URL
} from '../../../shared/services/apiEndpoints';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';
import { validateReportDataIntegrity, groupParametersByLocationScope } from '../services/testReportValidation';
import CustomerReportImportModal from '../components/CustomerReportImportModal';
import ParameterSelectionModal from '../components/ParameterSelectionModal';
import MultiReportNavigator from '../components/MultiReportNavigator';
import { SimpleZip } from '../services/simpleZip';
import { TestReportDocument, generateTestReportHtml } from '../components/TestReportDocument';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';

/**
 * @component TestReportForm
 * @description Comprehensive Test Report creation & editing form with split-screen Live Preview,
 * auto-fill integration from existing Test Requests, dynamic parameter result entries, and printable A4 report format.
 */
const TestReportForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;

  // Multi-Report Session Management
  const queryParams = new URLSearchParams(location.search);
  const isMultiParamMode = queryParams.get('mode') === 'multiple';

  // Helper to generate distinct report numbers for new reports
  const generateNewReportNumber = (offset = 0) => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const suffix = String(Date.now() + offset).slice(-5);
    return `JLT01${mm}${yy}RR${suffix}`;
  };

  const initialReportItem = {
    _sessionReportId: `rep_${Date.now()}_0`,
    formData: {
      formatNo: 'Format No. 7.8 F-02',
      reportDate: new Date().toISOString().split('T')[0],
      reportNumber: generateNewReportNumber(0),
      nameOfWork: '',
      detailsOfSample: '',
      packingDetails: '',
      reportIssuedTo: '',
      referenceNo: '',
      dateOfSampling: '',
      dateOfReceipt: '',
      agencyName: '',
      agencyAddress: '',
      sampleQuantity: '',
      samplingLocation: '',
      conditionOnReceipt: '',
      sampleCollectedBy: '',
      startingDateOfTest: '',
      completionDateOfTest: '',
      sectionHeader: '',
      reviewedByAnalyst: '',
      authorizedSignatory: '',
      signatureImage: '',
      reviewedBySignature: '',
      termsAndConditions: 'The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT.',
      showPermissibleLimits: true
    },
    parametersList: [],
    selectedTRId: '',
    selectedCustomerDirect: null,
    selectedConditionSelect: 'Satisfactory',
    customConditionText: ''
  };

  const [sessionReports, setSessionReports] = useState([initialReportItem]);
  const [activeReportIndex, setActiveReportIndex] = useState(0);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [sessionValidationErrors, setSessionValidationErrors] = useState({});

  // Available Test Requests for Auto-Fill Dropdown
  const [testRequests, setTestRequests] = useState([]);
  const [selectedTRId, setSelectedTRId] = useState('');
  const [trLoading, setTrLoading] = useState(false);

  // Active Import Tab: 'tr' | 'customer'
  const [activeImportTab, setActiveImportTab] = useState('tr');

  // Customer & Previous Report Import State
  const [isCustomerImportModalOpen, setIsCustomerImportModalOpen] = useState(false);
  const [selectedCustomerDirect, setSelectedCustomerDirect] = useState(null);
  const [lastImportedSource, setLastImportedSource] = useState(null); // { type: 'tr' | 'customer', label: string }

  // Database Parameter Selection Modal State
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);

  // Condition of sample options state
  const [conditionOptions, setConditionOptions] = useState(['Satisfactory', 'Non-Satisfactory', 'Other']);
  const [selectedConditionSelect, setSelectedConditionSelect] = useState('Satisfactory');
  const [customConditionText, setCustomConditionText] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    formatNo: 'Format No. 7.8 F-02',
    reportDate: new Date().toISOString().split('T')[0],
    reportNumber: '',
    nameOfWork: '',
    detailsOfSample: '',
    packingDetails: '',
    reportIssuedTo: '',
    referenceNo: '',
    dateOfSampling: '',
    dateOfReceipt: '',
    agencyName: '',
    agencyAddress: '',
    sampleQuantity: '',
    samplingLocation: '',
    conditionOnReceipt: '',
    sampleCollectedBy: '',
    startingDateOfTest: '',
    completionDateOfTest: '',
    sectionHeader: '',
    reviewedByAnalyst: '',
    authorizedSignatory: '',
    signatureImage: '',
    reviewedBySignature: '',
    termsAndConditions: 'The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT.',
    showPermissibleLimits: true
  });

  // Dynamic Parameters Results Table State
  const [parametersList, setParametersList] = useState([]);

  // UI state
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [withHeaderFooter, setWithHeaderFooter] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null }); // For permissible limit confirmation
  const printRef = useRef();
  const signatureInputRef = useRef();
  const reviewedBySignatureInputRef = useRef();
  
  const [currentCompany, setCurrentCompany] = useState(null);

  // Fetch company data for dynamic logo
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const activeCompId = localStorage.getItem('selectedCompanyId') || '';
        const res = await apiService.get(COMPANY_ENDPOINTS.GET_MY);
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.rows || []);
          const match = list.find(c => c.id === activeCompId);
          if (match) {
            setCurrentCompany(match);
          }
        }
      } catch (err) {
        console.error('Failed to load company details for logo', err);
      }
    };
    fetchCompanyData();
  }, []);

  const getPreviewLogoUrl = () => {
    if (isEditing && formData.companyLogo) {
      const cleanPath = formData.companyLogo.replace(/\\/g, '/');
      const idx = cleanPath.lastIndexOf('uploads/');
      if (idx !== -1) {
        return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
      }
      return formData.companyLogo;
    }
    if (currentCompany) {
      const logoPath = currentCompany.test_report_logo || currentCompany.testReportLogo || currentCompany.logo;
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

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Fetch Test Requests for auto-fill selection
  useEffect(() => {
    const fetchTestRequests = async () => {
      setTrLoading(true);
      try {
        const activeCompId = localStorage.getItem('selectedCompanyId') || '';
        const url = activeCompId ? `${TEST_REQUEST_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : TEST_REQUEST_ENDPOINTS.GET_ALL;
        const res = await apiService.get(url);
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.rows || []);
          setTestRequests(list);
        }
      } catch (err) {
        console.error('Failed to load test requests for dropdown', err);
      } finally {
        setTrLoading(false);
      }
    };
    fetchTestRequests();
  }, []);

  // Fetch existing Test Report when editing
  const [fetchingReport, setFetchingReport] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const fetchTestReport = async () => {
        setFetchingReport(true);
        try {
          const res = await apiService.get(TEST_REPORT_ENDPOINTS.GET_BY_ID(id));
          if (res?.data) {
            const report = res.data;
            setFormData({
              formatNo: report.formatNo || 'Format No. 7.8 F-02',
              reportDate: report.reportDate || (report.created_at ? String(report.created_at).split('T')[0] : new Date().toISOString().split('T')[0]),
              reportNumber: report.reportNumber || '',
              nameOfWork: report.nameOfWork || '',
              detailsOfSample: report.detailsOfSample || '',
              packingDetails: report.packingDetails || '',
              reportIssuedTo: report.reportIssuedTo || report.agencyName || '',
              referenceNo: report.referenceNo || report.reportNumber || '',
              dateOfSampling: report.dateOfSampling || (report.testRequest ? report.testRequest.dateOfCollection : '') || '',
              dateOfReceipt: report.dateOfReceipt || '',
              agencyName: report.agencyName || report.reportIssuedTo || '',
              agencyAddress: report.agencyAddress || '',
              sampleQuantity: report.sampleQuantity || '',
              samplingLocation: report.samplingLocation || '',
              conditionOnReceipt: report.conditionOnReceipt || 'Satisfactory',
              sampleCollectedBy: report.sampleCollectedBy || '',
              startingDateOfTest: report.startingDateOfTest || '',
              completionDateOfTest: report.completionDateOfTest || '',
              sectionHeader: report.sectionHeader || (report.nameOfWork ? String(report.nameOfWork).toUpperCase() : ''),
              reviewedByAnalyst: report.reviewedBy || report.reviewedByAnalyst || 'Sr. Analyst',
              authorizedSignatory: report.authorizedSignatory || 'Mr. Ankit Rathod/ Mr. Purvin Raiyan',
              signatureImage: report.signatureImage || '',
              reviewedBySignature: report.reviewedBySignature || '',
              termsAndConditions: report.termsAndConditions || 'The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT.',
              showPermissibleLimits: report.showPermissibleLimits !== undefined ? report.showPermissibleLimits : true,
              companyLogo: report.companyLogo || ''
            });

            if (report.testRequestId) {
              setSelectedTRId(report.testRequestId);
            }

            if (Array.isArray(report.parametersList) && report.parametersList.length > 0) {
              setParametersList(report.parametersList);
            }

            if (report.conditionOnReceipt) {
              if (['Satisfactory', 'Non-Satisfactory'].includes(report.conditionOnReceipt)) {
                setSelectedConditionSelect(report.conditionOnReceipt);
              } else {
                setSelectedConditionSelect('Other');
                setCustomConditionText(report.conditionOnReceipt);
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch test report for editing:', err);
          triggerToast('Failed to load test report data.', 'error');
        } finally {
          setFetchingReport(false);
        }
      };
      fetchTestReport();
    }
  }, [id, isEditing]);

  // Handle selecting a Test Request from dropdown to auto-populate form
  const handleTestRequestSelect = async (trId) => {
    setSelectedTRId(trId);
    if (!trId) return;

    try {
      // 1. Fetch full Test Request record from server for complete metadata
      let targetTR = testRequests.find(tr => String(tr.id) === String(trId));
      try {
        const fullTrRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(trId));
        if (fullTrRes?.data) {
          targetTR = { ...targetTR, ...fullTrRes.data };
        }
      } catch (e) {
        console.warn('Failed to fetch detailed TR record, using dropdown data', e);
      }

      if (!targetTR) return;

      const trIndex = testRequests.findIndex(t => String(t.id) === String(trId));
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const fallbackReportNo = `JLT01${mm}${yy}RR${String(320 + (trIndex >= 0 ? trIndex : 0)).padStart(5, '0')}`;
      const reportNoDisplay = targetTR.reportNumber || fallbackReportNo;
      const receiptDate = targetTR.dateOfReceipt || targetTR.dateOfCollection || formData.dateOfReceipt || new Date().toISOString().split('T')[0];
      const isUuid = targetTR.sampleParticular && targetTR.sampleParticular.length === 36;
      const sampleParticularVal = (!isUuid && targetTR.sampleParticular) || targetTR.sampleParticularName || 'Water Sample';
      const packingDetailsVal = targetTR.packingDetails || 'Sample Sealed in Plastic Bottle';
      const trTitle = targetTR.formTitle || targetTR.title || formData.nameOfWork || 'WATER & WASTE WATER';
      const clientObj = targetTR.client || {};
      const clientName = clientObj.clientName || targetTR.clientName || '';
      const plantAddress = clientObj.plantAddress || '';
      const officeAddress = clientObj.officeAddress || '';

      const reportIssuedToVal = plantAddress ? `${clientName}\n${plantAddress}` : clientName;
      const agencyNameVal = clientName;
      const agencyAddressVal = officeAddress;
      const samplingDateVal = targetTR.dateOfCollection || targetTR.dateOfSampling || targetTR.samplingDate || '';

      setFormData(prev => ({
        ...prev,
        reportNumber: reportNoDisplay,
        referenceNo: reportNoDisplay,
        reportIssuedTo: reportIssuedToVal,
        agencyName: agencyNameVal,
        agencyAddress: agencyAddressVal,
        detailsOfSample: sampleParticularVal,
        packingDetails: packingDetailsVal,
        dateOfReceipt: receiptDate,
        dateOfSampling: samplingDateVal || prev.dateOfSampling || '',
        sampleQuantity: targetTR.sampleQuantity || 'Standard Bottle',
        samplingLocation: targetTR.locationOfSample || 'Site Location',
        sampleCollectedBy: targetTR.sampleCollectedBy || 'Client / Representative',
        nameOfWork: trTitle,
        startingDateOfTest: receiptDate,
        completionDateOfTest: receiptDate,
        sectionHeader: trTitle.toUpperCase()
      }));

      // 2. Fetch parameters checked in this Test Request
      try {
        const trpRes = await apiService.get(`${TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL}?testRequestId=${trId}`);
        if (trpRes?.data) {
          const trpList = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data?.rows || [trpRes.data]);
          if (trpList.length > 0) {
            // Sort by sequence to preserve the order selected in TRF
            trpList.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

            const distinctLocs = Array.from(new Set(trpList.map(p => (p.locationOfSample || p.location_of_sample || '').trim()).filter(Boolean)));
            if (distinctLocs.length > 0) {
              setFormData(prev => ({
                ...prev,
                samplingLocation: distinctLocs.join(', ')
              }));
            }

            const formatted = trpList.map((p, idx) => {
              const isLimitApp = p.isPermissibleLimitApplicable === true || p.is_permissible_limit_applicable === true;
              const limitVal = isLimitApp ? (p.permissibleLimit || p.permissible_limit || 'Applicable') : '-';
              const paramLoc = p.locationOfSample || p.location_of_sample || p.locationSampleName || p.location_sample_name || p.parameter?.locationSample?.name || targetTR.locationOfSample || '-';
              return {
                srNo: String(idx + 1).padStart(2, '0'),
                parameterName: p.parameterName || p.parameter_name || `Parameter ${idx + 1}`,
                locationOfSample: paramLoc,
                referenceMethod: p.testMethod || p.test_method || 'APHA, 24th Edition 2023',
                unit: p.unit || '-',
                result: p.result || '',
                permissibleLimit: limitVal
              };
            });
            setParametersList(formatted);
            setLastImportedSource({
              type: 'tr',
              label: `Test Request: ${reportNoDisplay} (${clientName || 'Client'})`
            });
            triggerToast(`Auto-filled details & ${formatted.length} parameters from Test Request #${reportNoDisplay}`, 'success');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch TR parameters:', err);
      }

      setLastImportedSource({
        type: 'tr',
        label: `Test Request: ${reportNoDisplay} (${clientName || 'Client'})`
      });
      triggerToast(`Auto-filled details from Test Request #${reportNoDisplay}`, 'success');
    } catch (err) {
      console.error('Error selecting test request:', err);
      triggerToast('Error auto-filling details from test request', 'error');
    }
  };

  // Auto-fill from a Customer's Previous Test Report
  const handleSelectCustomerPreviousReport = (prevReport, client) => {
    if (!prevReport) return;

    try {
      // 1. Generate new unique report number using standard convention if creating a new report
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const timestampSuffix = String(Date.now()).slice(-5);
      const generatedNewReportNo = isEditing 
        ? (formData.reportNumber || prevReport.reportNumber) 
        : `JLT01${mm}${yy}RR${timestampSuffix}`;

      // 2. Resolve client info
      const clientName = client?.clientName || prevReport.agencyName || prevReport.reportIssuedTo || '';
      const plantAddress = client?.plantAddress || '';
      const officeAddress = client?.officeAddress || prevReport.agencyAddress || '';
      const reportIssuedToVal = plantAddress ? `${clientName}\n${plantAddress}` : (prevReport.reportIssuedTo || clientName);

      // 3. Populate form fields from the selected previous report
      setFormData(prev => ({
        ...prev,
        formatNo: prevReport.formatNo || prev.formatNo || 'Format No. 7.8 F-02',
        reportDate: new Date().toISOString().split('T')[0], // Fresh date for the new report
        reportNumber: generatedNewReportNo,
        referenceNo: generatedNewReportNo,
        nameOfWork: prevReport.nameOfWork || prev.nameOfWork || 'WATER & WASTE WATER',
        detailsOfSample: prevReport.detailsOfSample || prev.detailsOfSample || 'Water Sample',
        packingDetails: prevReport.packingDetails || prev.packingDetails || 'Sample Sealed in Plastic Bottle',
        reportIssuedTo: reportIssuedToVal,
        dateOfSampling: prevReport.dateOfSampling || '',
        dateOfReceipt: prevReport.dateOfReceipt || new Date().toISOString().split('T')[0],
        agencyName: clientName,
        agencyAddress: officeAddress,
        sampleQuantity: prevReport.sampleQuantity || 'Standard Bottle',
        samplingLocation: prevReport.samplingLocation || 'Site Location',
        conditionOnReceipt: prevReport.conditionOnReceipt || 'Satisfactory',
        sampleCollectedBy: prevReport.sampleCollectedBy || 'Client / Representative',
        startingDateOfTest: prevReport.startingDateOfTest || new Date().toISOString().split('T')[0],
        completionDateOfTest: prevReport.completionDateOfTest || new Date().toISOString().split('T')[0],
        sectionHeader: prevReport.sectionHeader || (prevReport.nameOfWork ? String(prevReport.nameOfWork).toUpperCase() : 'WATER & WASTE WATER'),
        showPermissibleLimits: prevReport.showPermissibleLimits !== undefined ? prevReport.showPermissibleLimits : true
      }));

      // Update condition dropdown state if needed
      if (prevReport.conditionOnReceipt) {
        if (['Satisfactory', 'Non-Satisfactory'].includes(prevReport.conditionOnReceipt)) {
          setSelectedConditionSelect(prevReport.conditionOnReceipt);
        } else {
          setSelectedConditionSelect('Other');
          setCustomConditionText(prevReport.conditionOnReceipt);
        }
      }

      // 4. Import parameters list safely
      if (Array.isArray(prevReport.parametersList) && prevReport.parametersList.length > 0) {
        const importedParams = prevReport.parametersList.map((p, idx) => ({
          srNo: String(idx + 1).padStart(2, '0'),
          parameterName: p.parameterName || p.parameter_name || `Parameter ${idx + 1}`,
          locationOfSample: p.locationOfSample || p.location_of_sample || prevReport.samplingLocation || '-',
          referenceMethod: p.referenceMethod || p.reference_method || p.testMethod || p.test_method || 'APHA, 24th Edition 2023',
          unit: p.unit || '-',
          result: p.result || '',
          permissibleLimit: p.permissibleLimit || p.permissible_limit || '-'
        }));
        setParametersList(importedParams);
      }

      setIsCustomerImportModalOpen(false);
      setSelectedCustomerDirect(client || null);
      setLastImportedSource({
        type: 'customer',
        label: `Customer Report: ${prevReport.reportNumber || 'Previous'} (${clientName})`
      });
      triggerToast(
        `Successfully imported data from Report #${prevReport.reportNumber} for ${clientName}`,
        'success'
      );
    } catch (err) {
      console.error('Error importing previous report:', err);
      triggerToast('Failed to import previous report data.', 'error');
    }
  };

  // Direct report creation for newly added / selected customer without previous reports
  const handleSelectCustomerDirect = (client) => {
    if (!client) return;

    try {
      // 1. Generate new unique report number if creating fresh report
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const timestampSuffix = String(Date.now()).slice(-5);
      const generatedNewReportNo = isEditing 
        ? formData.reportNumber 
        : `JLT01${mm}${yy}RR${timestampSuffix}`;

      // 2. Resolve client info
      const clientName = client.clientName || client.name || '';
      const plantAddress = client.plantAddress || '';
      const officeAddress = client.officeAddress || '';
      const reportIssuedToVal = plantAddress ? `${clientName}\n${plantAddress}` : clientName;

      // 3. Populate form fields directly with customer data
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        reportNumber: prev.reportNumber || generatedNewReportNo,
        referenceNo: prev.referenceNo || generatedNewReportNo,
        reportIssuedTo: reportIssuedToVal,
        agencyName: clientName,
        agencyAddress: officeAddress,
        reportDate: prev.reportDate || new Date().toISOString().split('T')[0],
        dateOfReceipt: prev.dateOfReceipt || new Date().toISOString().split('T')[0],
        startingDateOfTest: prev.startingDateOfTest || new Date().toISOString().split('T')[0],
        completionDateOfTest: prev.completionDateOfTest || new Date().toISOString().split('T')[0],
        detailsOfSample: prev.detailsOfSample || 'Water Sample',
        nameOfWork: prev.nameOfWork || 'WATER & WASTE WATER',
        sectionHeader: prev.sectionHeader || 'WATER & WASTE WATER',
        conditionOnReceipt: prev.conditionOnReceipt || 'Satisfactory',
        sampleCollectedBy: prev.sampleCollectedBy || 'Client / Representative',
        samplingLocation: prev.samplingLocation || (client.city ? `Site at ${client.city}` : 'Site Location')
      }));

      setSelectedCustomerDirect(client);
      setIsCustomerImportModalOpen(false);
      setLastImportedSource({
        type: 'customer',
        label: `Customer: ${clientName}`
      });

      triggerToast(`Customer "${clientName}" selected! You can now complete the Test Report.`, 'success');
    } catch (err) {
      console.error('Error selecting customer:', err);
      triggerToast('Failed to select customer for test report.', 'error');
    }
  };

  // Condition of sample dropdown handler
  const handleConditionDropdownChange = (e) => {
    const val = e.target.value;
    setSelectedConditionSelect(val);
    if (val === 'Other') {
      setFormData(prev => ({ ...prev, conditionOnReceipt: customConditionText || '' }));
    } else {
      setFormData(prev => ({ ...prev, conditionOnReceipt: val }));
    }
  };

  // Custom condition text input handler (adds custom entry dynamically to options)
  const handleCustomConditionChange = (e) => {
    const text = e.target.value;
    setCustomConditionText(text);
    setFormData(prev => ({ ...prev, conditionOnReceipt: text }));

    if (text.trim() && !conditionOptions.includes(text.trim())) {
      setConditionOptions(prev => {
        const withoutOther = prev.filter(o => o !== 'Other');
        return [...withoutOther, text.trim(), 'Other'];
      });
    }
  };

  // Form Inputs Handler with Strict Date Validation Constraints
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startingDateOfTest') {
      const receiptDate = formData.dateOfReceipt;
      if (receiptDate && value < receiptDate) {
        triggerToast('Starting date of test must be on or after Date of Receipt/Collection.', 'error');
        setFormData(prev => ({
          ...prev,
          startingDateOfTest: receiptDate,
          completionDateOfTest: prev.completionDateOfTest < receiptDate ? receiptDate : prev.completionDateOfTest
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        startingDateOfTest: value,
        completionDateOfTest: prev.completionDateOfTest < value ? value : prev.completionDateOfTest
      }));
      return;
    }

    if (name === 'completionDateOfTest') {
      const minDate = formData.startingDateOfTest || formData.dateOfReceipt;
      if (minDate && value < minDate) {
        triggerToast('Completion date of test must be on or after Starting date.', 'error');
        setFormData(prev => ({ ...prev, completionDateOfTest: minDate }));
        return;
      }
      setFormData(prev => ({ ...prev, completionDateOfTest: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Parameter Table Input Handler
  const handleParamChange = (index, field, value) => {
    setParametersList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add parameter rows from database selection modal
  const handleAddParametersFromDb = (selectedParams) => {
    if (!selectedParams || selectedParams.length === 0) return;

    setParametersList(prev => {
      const currentLen = prev.length;
      const newRows = selectedParams.map((p, idx) => {
        const nextSrNo = String(currentLen + idx + 1).padStart(2, '0');
        const isLimitApp = p.isPermissibleLimitApplicable === true;
        const limitVal = isLimitApp ? (p.permissibleLimit || 'Applicable') : (p.permissibleLimit || '-');

        return {
          srNo: nextSrNo,
          parameterId: p.id,
          parameterName: p.parameterName || '',
          locationOfSample: p.locationOfSample || p.locationSample?.name || formData.samplingLocation || '-',
          referenceMethod: p.testMethod || p.referenceStandard || 'APHA, 24th Edition 2023',
          unit: p.unit || '-',
          result: '',
          permissibleLimit: limitVal
        };
      });

      return [...prev, ...newRows];
    });

    triggerToast(`Added ${selectedParams.length} parameter(s) from database!`, 'success');
  };

  // Add new parameter row - opens Parameter Selection Modal
  const handleAddParamRow = () => {
    setIsParamModalOpen(true);
  };

  // Delete parameter row and re-number serial numbers
  const handleDeleteParamRow = (index) => {
    setParametersList(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((row, i) => ({
        ...row,
        srNo: String(i + 1).padStart(2, '0')
      }));
    });
  };

  // Signature image upload handler — converts file to base64 data URL
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, signatureImage: ev.target.result }));
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleSignatureRemove = () => {
    setFormData(prev => ({ ...prev, signatureImage: '' }));
  };

  // Reviewed By Signature image upload handler
  const handleReviewedBySignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, reviewedBySignature: ev.target.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReviewedBySignatureRemove = () => {
    setFormData(prev => ({ ...prev, reviewedBySignature: '' }));
  };

  // Save Report Handler
  // Core save logic (called directly or after confirmation)
  const executeSave = async () => {
    setSubmitting(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId');
      const payload = {
        ...formData,
        reviewedBy: formData.reviewedByAnalyst || formData.reviewedBy || '',
        parametersList,
        clientId: formData.clientId || selectedCustomerDirect?.id || null,
        testRequestId: selectedTRId || formData.testRequestId || null,
        companyId: activeCompId || null
      };

      if (isEditing) {
        await apiService.put(TEST_REPORT_ENDPOINTS.UPDATE(id), payload);
        triggerToast('Test Report updated successfully!', 'success');
      } else {
        await apiService.post(TEST_REPORT_ENDPOINTS.CREATE, payload);
        triggerToast('Test Report saved successfully!', 'success');
      }

      setTimeout(() => {
        navigate('/test-reports');
      }, 500);
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to save test report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Core save-and-print logic
  const executeSaveAndPrint = async () => {
    setSubmitting(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId');
      const payload = {
        ...formData,
        reviewedBy: formData.reviewedByAnalyst || formData.reviewedBy || '',
        parametersList,
        clientId: formData.clientId || selectedCustomerDirect?.id || null,
        testRequestId: selectedTRId || formData.testRequestId || null,
        companyId: activeCompId || null
      };

      let savedReportId = id;
      if (isEditing) {
        const res = await apiService.put(TEST_REPORT_ENDPOINTS.UPDATE(id), payload);
        if (res?.data?.id) savedReportId = res.data.id;
      } else {
        const res = await apiService.post(TEST_REPORT_ENDPOINTS.CREATE, payload);
        if (res?.data?.id) savedReportId = res.data.id;
      }

      triggerToast('Report saved! Redirecting to PDF print view...', 'success');
      setTimeout(() => {
        if (savedReportId) {
          navigate(`/test-reports/print/${savedReportId}?noHeaderFooter=${!withHeaderFooter}`);
        } else {
          window.print();
        }
      }, 400);
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to generate PDF.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Public handlers — show validation errors & confirmation if permissible limits is OFF
  const handleSave = () => {
    const validation = validateReportDataIntegrity(formData, parametersList);
    if (!validation.isValid) {
      triggerToast(validation.errors[0], 'error');
      return;
    }
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('[TestReportForm Validation Warnings]:', validation.warnings);
    }

    if (!formData.showPermissibleLimits) {
      setConfirmModal({ show: true, action: 'save' });
    } else {
      executeSave();
    }
  };

  const handleSaveAndPrint = () => {
    const validation = validateReportDataIntegrity(formData, parametersList);
    if (!validation.isValid) {
      triggerToast(validation.errors[0], 'error');
      return;
    }
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('[TestReportForm Validation Warnings]:', validation.warnings);
    }

    if (!formData.showPermissibleLimits) {
      setConfirmModal({ show: true, action: 'saveAndPrint' });
    } else {
      executeSaveAndPrint();
    }
  };

  const handleConfirmYes = () => {
    setConfirmModal({ show: false, action: null });
    if (confirmModal.action === 'save') {
      executeSave();
    } else if (confirmModal.action === 'saveAndPrint') {
      executeSaveAndPrint();
    }
  };

  // ─── MULTI-REPORT SESSION HANDLERS ──────────────────────────────────
  // Switch to another report in session (auto-syncing current form state first)
  const handleSelectSessionReport = (newIdx) => {
    if (newIdx === activeReportIndex || !sessionReports[newIdx]) return;

    setSessionReports(prev => {
      const updated = [...prev];
      if (updated[activeReportIndex]) {
        updated[activeReportIndex] = {
          ...updated[activeReportIndex],
          formData: { ...formData },
          parametersList: [...parametersList],
          selectedTRId,
          selectedCustomerDirect,
          selectedConditionSelect,
          customConditionText
        };
      }
      return updated;
    });

    const target = sessionReports[newIdx];
    if (target) {
      setFormData(target.formData);
      setParametersList(target.parametersList || []);
      setSelectedTRId(target.selectedTRId || '');
      setSelectedCustomerDirect(target.selectedCustomerDirect || null);
      setSelectedConditionSelect(target.selectedConditionSelect || 'Satisfactory');
      setCustomConditionText(target.customConditionText || '');
    }
    setActiveReportIndex(newIdx);
  };

  // Add new report to session
  const handleAddNewSessionReport = (creationType = 'blank') => {
    // 1. Sync current report first
    const currentSynced = {
      ...sessionReports[activeReportIndex],
      formData: { ...formData },
      parametersList: [...parametersList],
      selectedTRId,
      selectedCustomerDirect,
      selectedConditionSelect,
      customConditionText
    };

    const nextIdx = sessionReports.length;
    const newReportNo = generateNewReportNumber(nextIdx);

    let newReportItem;
    if (creationType === 'reuse') {
      // Reuse customer, work, date info from current report, with fresh location and parameter copies
      newReportItem = {
        _sessionReportId: `rep_${Date.now()}_${nextIdx}`,
        formData: {
          ...formData,
          reportNumber: newReportNo,
          referenceNo: newReportNo,
          samplingLocation: `Sample Location 0${nextIdx + 1}`
        },
        parametersList: parametersList.map(p => ({ ...p, result: '' })), // keep parameters, clear results
        selectedTRId,
        selectedCustomerDirect,
        selectedConditionSelect,
        customConditionText
      };
    } else {
      // Option A: Start Blank
      newReportItem = {
        _sessionReportId: `rep_${Date.now()}_${nextIdx}`,
        formData: {
          formatNo: 'Format No. 7.8 F-02',
          reportDate: new Date().toISOString().split('T')[0],
          reportNumber: newReportNo,
          nameOfWork: formData.nameOfWork || '',
          detailsOfSample: '',
          packingDetails: 'Sample Sealed in Plastic Bottle',
          reportIssuedTo: '',
          referenceNo: newReportNo,
          dateOfSampling: '',
          dateOfReceipt: new Date().toISOString().split('T')[0],
          agencyName: '',
          agencyAddress: '',
          sampleQuantity: '01 (1 ltr)',
          samplingLocation: `Sample Location 0${nextIdx + 1}`,
          conditionOnReceipt: 'Satisfactory',
          sampleCollectedBy: 'Client / Representative',
          startingDateOfTest: new Date().toISOString().split('T')[0],
          completionDateOfTest: new Date().toISOString().split('T')[0],
          sectionHeader: formData.sectionHeader || '',
          reviewedByAnalyst: formData.reviewedByAnalyst || '',
          authorizedSignatory: formData.authorizedSignatory || '',
          signatureImage: formData.signatureImage || '',
          reviewedBySignature: formData.reviewedBySignature || '',
          termsAndConditions: formData.termsAndConditions || '',
          showPermissibleLimits: formData.showPermissibleLimits !== undefined ? formData.showPermissibleLimits : true
        },
        parametersList: [],
        selectedTRId: '',
        selectedCustomerDirect: null,
        selectedConditionSelect: 'Satisfactory',
        customConditionText: ''
      };
    }

    setSessionReports(prev => {
      const updated = [...prev];
      updated[activeReportIndex] = currentSynced;
      return [...updated, newReportItem];
    });

    // Switch form immediately to the new report
    setFormData(newReportItem.formData);
    setParametersList(newReportItem.parametersList);
    setSelectedTRId(newReportItem.selectedTRId);
    setSelectedCustomerDirect(newReportItem.selectedCustomerDirect);
    setSelectedConditionSelect(newReportItem.selectedConditionSelect);
    setCustomConditionText(newReportItem.customConditionText);
    setActiveReportIndex(nextIdx);

    triggerToast(`Added Report 0${nextIdx + 1}: ${newReportItem.formData.samplingLocation}`, 'success');
  };

  // Duplicate an existing report in session
  const handleDuplicateSessionReport = (idxToDup) => {
    const source = sessionReports[idxToDup];
    if (!source) return;

    // Sync active if duplicating active
    const sourceData = (idxToDup === activeReportIndex)
      ? {
          formData: { ...formData },
          parametersList: [...parametersList],
          selectedTRId,
          selectedCustomerDirect,
          selectedConditionSelect,
          customConditionText
        }
      : source;

    const nextIdx = sessionReports.length;
    const newReportNo = generateNewReportNumber(nextIdx);

    const duplicatedItem = {
      _sessionReportId: `rep_${Date.now()}_${nextIdx}`,
      formData: {
        ...sourceData.formData,
        reportNumber: newReportNo,
        referenceNo: newReportNo,
        samplingLocation: `${sourceData.formData.samplingLocation || 'Location'} (Copy)`
      },
      parametersList: (sourceData.parametersList || []).map(p => ({ ...p })),
      selectedTRId: sourceData.selectedTRId || '',
      selectedCustomerDirect: sourceData.selectedCustomerDirect || null,
      selectedConditionSelect: sourceData.selectedConditionSelect || 'Satisfactory',
      customConditionText: sourceData.customConditionText || ''
    };

    setSessionReports(prev => {
      const updated = [...prev];
      if (activeReportIndex < updated.length) {
        updated[activeReportIndex] = {
          ...updated[activeReportIndex],
          formData: { ...formData },
          parametersList: [...parametersList],
          selectedTRId,
          selectedCustomerDirect,
          selectedConditionSelect,
          customConditionText
        };
      }
      return [...updated, duplicatedItem];
    });

    // Switch to duplicate
    setFormData(duplicatedItem.formData);
    setParametersList(duplicatedItem.parametersList);
    setSelectedTRId(duplicatedItem.selectedTRId);
    setSelectedCustomerDirect(duplicatedItem.selectedCustomerDirect);
    setSelectedConditionSelect(duplicatedItem.selectedConditionSelect);
    setCustomConditionText(duplicatedItem.customConditionText);
    setActiveReportIndex(nextIdx);

    triggerToast(`Duplicated: ${duplicatedItem.formData.samplingLocation}`, 'success');
  };

  // Remove report from session
  const handleRemoveSessionReport = (idxToRemove) => {
    if (sessionReports.length <= 1) {
      triggerToast('At least one report must remain in workspace.', 'error');
      return;
    }

    const updatedList = sessionReports.filter((_, idx) => idx !== idxToRemove);
    let newActiveIdx = activeReportIndex;
    if (idxToRemove === activeReportIndex) {
      newActiveIdx = Math.max(0, activeReportIndex - 1);
    } else if (idxToRemove < activeReportIndex) {
      newActiveIdx = activeReportIndex - 1;
    }

    setSessionReports(updatedList);
    setActiveReportIndex(newActiveIdx);

    const nextTarget = updatedList[newActiveIdx];
    if (nextTarget) {
      setFormData(nextTarget.formData);
      setParametersList(nextTarget.parametersList || []);
      setSelectedTRId(nextTarget.selectedTRId || '');
      setSelectedCustomerDirect(nextTarget.selectedCustomerDirect || null);
      setSelectedConditionSelect(nextTarget.selectedConditionSelect || 'Satisfactory');
      setCustomConditionText(nextTarget.customConditionText || '');
    }

    triggerToast('Report removed from session.', 'info');
  };

  // Batch Save all session reports
  const handleSaveAllSessionReports = async () => {
    // 1. Snapshot all reports
    const allSnapshot = sessionReports.map((rep, idx) => {
      if (idx === activeReportIndex) {
        return {
          ...rep,
          formData: { ...formData },
          parametersList: [...parametersList],
          selectedTRId,
          selectedCustomerDirect
        };
      }
      return rep;
    });

    // 2. Validate all reports
    const errors = {};
    let hasErr = false;
    allSnapshot.forEach((rep, idx) => {
      const val = validateReportDataIntegrity(rep.formData, rep.parametersList);
      if (!val.isValid) {
        errors[idx] = val.errors;
        hasErr = true;
      }
    });

    setSessionValidationErrors(errors);
    if (hasErr) {
      const firstErrIdx = Object.keys(errors)[0];
      handleSelectSessionReport(Number(firstErrIdx));
      triggerToast(`Validation failed for Report 0${Number(firstErrIdx) + 1}: ${errors[firstErrIdx][0]}`, 'error');
      return;
    }

    setIsBatchSaving(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId');
      const batchSessionId = `BATCH_${Date.now()}`;

      const payloadReports = allSnapshot.map(item => ({
        ...item.formData,
        reviewedBy: item.formData.reviewedByAnalyst || item.formData.reviewedBy || '',
        parametersList: item.parametersList,
        clientId: item.formData.clientId || item.selectedCustomerDirect?.id || null,
        testRequestId: item.selectedTRId || item.formData.testRequestId || null,
        companyId: activeCompId || null,
        batchId: batchSessionId,
        referenceNo: item.formData.referenceNo || item.formData.reportNumber,
        status: 'Completed'
      }));

      const res = await apiService.post(TEST_REPORT_ENDPOINTS.CREATE_BATCH, {
        batchId: batchSessionId,
        reports: payloadReports
      });

      triggerToast(`Successfully saved all ${payloadReports.length} test reports!`, 'success');
      setTimeout(() => {
        navigate('/test-reports');
      }, 700);
    } catch (err) {
      console.error('Batch save error:', err);
      triggerToast(err?.response?.data?.message || err?.message || 'Failed to save all reports.', 'error');
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Helper to generate full printable A4 HTML for any report snapshot
  const generateReportHtml = (rData, pList, isSingleDoc = true) => {
    return generateTestReportHtml(rData, pList, {
      withHeaderFooter,
      company: currentCompany,
      isSingleDoc,
      pageBreak: !isSingleDoc
    });
  };

  const handlePrintAllCombined = () => {
    const allSnapshot = sessionReports.map((rep, idx) => {
      if (idx === activeReportIndex) {
        return {
          ...rep,
          formData: { ...formData },
          parametersList: [...parametersList]
        };
      }
      return rep;
    });

    const pagesHtml = allSnapshot.map(item => generateReportHtml(item.formData, item.parametersList, false)).join('');

    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>All Test Reports (${allSnapshot.length}) - Jagnath Lab Technologies</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
          }
          .test-report-page {
            page-break-after: always;
            break-after: page;
          }
          .test-report-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printDoc);
      printWin.document.close();
    } else {
      triggerToast('Popup blocked. Please allow popups to print/download reports.', 'error');
    }
  };

  // 2. Print Single Report
  const handlePrintSingleReport = (idx) => {
    const targetItem = idx === activeReportIndex
      ? { formData: { ...formData }, parametersList: [...parametersList] }
      : sessionReports[idx];

    if (!targetItem) return;

    const singlePageHtml = generateReportHtml(targetItem.formData, targetItem.parametersList, true);

    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Test Report - ${targetItem.formData.reportNumber || 'Report'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${singlePageHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printDoc);
      printWin.document.close();
    } else {
      triggerToast('Popup blocked. Please allow popups to print/download reports.', 'error');
    }
  };

  // 3. Download Single Report as standalone printable HTML / Document
  const handleDownloadSingleReport = (idx) => {
    const targetItem = idx === activeReportIndex
      ? { formData: { ...formData }, parametersList: [...parametersList] }
      : sessionReports[idx];

    if (!targetItem) return;

    const rData = targetItem.formData;
    const safeLoc = (rData.samplingLocation || `Location_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${rData.reportNumber || `Report_${idx + 1}`}_${safeLoc}.html`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Test Report - ${rData.reportNumber || 'Report'}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${generateReportHtml(rData, targetItem.parametersList, true)}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded report: ${filename}`, 'success');
  };

  // Download all session reports as a single ZIP
  const handleDownloadSessionZip = () => {
    const allSnapshot = sessionReports.map((rep, idx) => {
      if (idx === activeReportIndex) {
        return {
          ...rep,
          formData: { ...formData },
          parametersList: [...parametersList]
        };
      }
      return rep;
    });

    try {
      const zip = new SimpleZip();
      allSnapshot.forEach((item, idx) => {
        const rData = item.formData;
        const safeLoc = (rData.samplingLocation || `Location_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${rData.reportNumber || `Report_${idx + 1}`}_${safeLoc}.html`;

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Report - ${rData.reportNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${generateReportHtml(rData, item.parametersList, true)}
</body>
</html>`;

        zip.file(filename, html);
      });

      zip.download(`Jagnath_Labs_TestReports_${Date.now()}.zip`);
      triggerToast('Downloaded all reports in ZIP file!', 'success');
    } catch (e) {
      console.error('ZIP generation error:', e);
      triggerToast('Failed to create ZIP download.', 'error');
    }
  };

  const handleConfirmCancel = () => {
    setConfirmModal({ show: false, action: null });
  };

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'N/A';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const shouldBoldResult = (resultStr, limitStr) => {
    if (!resultStr || !limitStr) return false;
    const resClean = String(resultStr).trim();
    const limClean = String(limitStr).trim();
    if (resClean === limClean || limClean === '-' || limClean === 'N/A') return false;

    const parseNumber = (str) => {
      const match = str.replace(/,/g, '').match(/[-+]?[0-9]*\.?[0-9]+/);
      return match ? parseFloat(match[0]) : null;
    };

    const resVal = parseNumber(resClean);
    if (resVal === null) return false;

    // Range: "6.5 - 8.5" or "6.5 to 8.5"
    const rangeMatch = limClean.match(/([-+]?[0-9]*\.?[0-9]+)\s*(?:-|to)\s*([-+]?[0-9]*\.?[0-9]+)/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return resVal < min || resVal > max;
    }

    // Less than / Max limits
    if (/(?:<|<=|max|below|less)/i.test(limClean)) {
      const limVal = parseNumber(limClean);
      if (limVal !== null) return resVal > limVal;
    }

    // Greater than / Min limits
    if (/(?:>|>=|min|above|more)/i.test(limClean)) {
      const limVal = parseNumber(limClean);
      if (limVal !== null) return resVal < limVal;
    }

    // Simple numeric limit (assumed maximum limit)
    const simpleLimVal = parseNumber(limClean);
    if (simpleLimVal !== null && !isNaN(simpleLimVal)) {
      return resVal > simpleLimVal;
    }

    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

      {/* Toast Notification */}
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
          fontSize: '0.9rem'
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="master-top-bar hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/test-reports')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FaArrowLeft size={12} />
            <span>Back</span>
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEditing ? 'Edit Test Report' : 'New Test Report'}
          </h2>
        </div>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showLivePreview ? <FaEyeSlash /> : <FaEye />}
            <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>
          {sessionReports.length > 1 && (
            <button
              type="button"
              onClick={handleSaveAllSessionReports}
              disabled={isBatchSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#047857', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: isBatchSaving ? 'not-allowed' : 'pointer' }}
            >
              <FaLayerGroup />
              <span>{isBatchSaving ? 'Saving All...' : `Save All (${sessionReports.length})`}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaSave />
            <span>{submitting ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaPrint />
            <span>Save & Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area with Multi-Report Navigator */}
      <div className="premium-ui-form test-report-split-container hide-on-print" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

        {/* 1. Left Navigator Panel (Active whenever creating reports) */}
        {!isEditing && (
          <div style={{ flex: '0 0 240px', maxWidth: '240px', minWidth: '220px', position: 'sticky', top: '24px', zIndex: 10 }}>
            <MultiReportNavigator
              reports={sessionReports.map((r, i) => i === activeReportIndex ? {
                ...r,
                samplingLocation: formData.samplingLocation,
                reportIssuedTo: formData.reportIssuedTo,
                parametersList
              } : r.formData ? {
                ...r.formData,
                _sessionReportId: r._sessionReportId,
                parametersList: r.parametersList
              } : r)}
              activeReportIndex={activeReportIndex}
              onSelectReport={handleSelectSessionReport}
              onAddNewReport={handleAddNewSessionReport}
              onDuplicateReport={handleDuplicateSessionReport}
              onRemoveReport={handleRemoveSessionReport}
              onOpenCustomerImport={() => setIsCustomerImportModalOpen(true)}
              onSaveAll={handleSaveAllSessionReports}
              onPrintAllCombined={handlePrintAllCombined}
              onDownloadAllZip={handleDownloadSessionZip}
              onPrintSingleReport={handlePrintSingleReport}
              onDownloadSingleReport={handleDownloadSingleReport}
              isBatchSaving={isBatchSaving}
              validationErrors={sessionValidationErrors}
            />
          </div>
        )}

        {/* Center Column: Form Inputs */}
        <div style={{ flex: showLivePreview ? '1 1 48%' : '1 1 76%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'all 0.3s' }}>

          {/* Unified Card 1: Import Existing Details (Test Request & Customer Options) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px -2px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Unified Section Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem'
                    }}
                  >
                    <FaClipboardList />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Import Existing Details
                  </h3>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Choose a source to automatically populate customer, sample, and report information.
                </p>
              </div>

              {lastImportedSource && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <FaCheck size={10} />
                  <span>Imported from: {lastImportedSource.label}</span>
                </span>
              )}
            </div>

            {/* Segmented Control / Compact Tabs */}
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '10px',
                width: 'fit-content',
                border: '1px solid #e2e8f0'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveImportTab('tr')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: activeImportTab === 'tr' ? '#ffffff' : 'transparent',
                  color: activeImportTab === 'tr' ? '#1e3a8a' : '#64748b',
                  boxShadow: activeImportTab === 'tr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <FaClipboardList size={13} style={{ color: activeImportTab === 'tr' ? '#2563eb' : '#94a3b8' }} />
                <span>Option 1: Test Request</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveImportTab('customer')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: activeImportTab === 'customer' ? '#ffffff' : 'transparent',
                  color: activeImportTab === 'customer' ? '#047857' : '#64748b',
                  boxShadow: activeImportTab === 'customer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <FaUserTie size={13} style={{ color: activeImportTab === 'customer' ? '#047857' : '#94a3b8' }} />
                <span>Option 2: Customer & Previous Report</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Import from Test Request */}
            {activeImportTab === 'tr' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #bfdbfe'
                }}
              >
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: '#1e40af', fontWeight: 500 }}>
                  Select an existing Test Request to auto-fill sample metadata, client details, and report numbers:
                </p>
                <SearchableSelect
                  options={testRequests.map(tr => ({
                    id: tr.id,
                    label: `${tr.reportNumber ? `Report No: ${tr.reportNumber}` : `TR #${tr.id.slice(0, 8)}`} | ${tr.clientName || 'Client N/A'} (${tr.dateOfReceipt || 'Date N/A'})`
                  }))}
                  value={selectedTRId}
                  onChange={(selectedVal) => handleTestRequestSelect(selectedVal)}
                  placeholder="-- Select Test Request / Report No. --"
                  searchPlaceholder="Search test request or report number..."
                />
              </div>
            )}

            {/* TAB CONTENT 2: Import from Customer & Previous Report */}
            {activeImportTab === 'customer' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#065f46' }}>
                    Customer Report Import
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#047857' }}>
                    Browse existing customers, create new clients, and import previous test reports and parameters.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomerImportModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#065f46';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#047857';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaUserTie size={13} />
                  <span>Browse Customers & Past Reports</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Report Metadata Information */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #10b981, #059669)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Report Metadata & Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Format No.</label>
                <input type="text" name="formatNo" value={formData.formatNo} onChange={handleChange} className="premium-input" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Report Date</label>
                <input type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} className="premium-input" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Report No. / Reference No. (Auto-Fetched)</label>
                <input
                  type="text"
                  name="reportNumber"
                  value={formData.reportNumber}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Title (Auto-Fetched)</label>
                <input
                  type="text"
                  name="nameOfWork"
                  value={formData.nameOfWork}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Report Issued To / Agency Name (Auto-Fetched)</label>
                <input
                  type="text"
                  name="reportIssuedTo"
                  value={formData.reportIssuedTo}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Agency / Company Address (Auto-Fetched)</label>
                <textarea
                  name="agencyAddress"
                  value={formData.agencyAddress}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  rows={2}
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Details of Sample (Auto-Fetched)</label>
                  <input
                    type="text"
                    name="detailsOfSample"
                    value={formData.detailsOfSample}
                    onChange={handleChange}
                    readOnly
                    disabled
                    className="premium-input"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Mode of Packing (Auto-Fetched)</label>
                  <input
                    type="text"
                    name="packingDetails"
                    value={formData.packingDetails}
                    onChange={handleChange}
                    readOnly
                    disabled
                    className="premium-input"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Date of Sampling (Collection)</label>
                  <input
                    type="date"
                    name="dateOfSampling"
                    value={formData.dateOfSampling}
                    onChange={handleChange}
                    className="premium-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Date of Receipt of Sample (Auto-Fetched)</label>
                  <input
                    type="date"
                    name="dateOfReceipt"
                    value={formData.dateOfReceipt}
                    onChange={handleChange}
                    readOnly
                    disabled
                    className="premium-input"
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Sample Quantity (Auto-Fetched)</label>
                <input
                  type="text"
                  name="sampleQuantity"
                  value={formData.sampleQuantity}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Sampling Location / Type (Auto-Fetched)</label>
                <input
                  type="text"
                  name="samplingLocation"
                  value={formData.samplingLocation}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Condition of Sample during Receipt</label>
                <select
                  value={selectedConditionSelect}
                  onChange={handleConditionDropdownChange}
                  className="premium-input"
                  style={{ backgroundColor: '#ffffff', fontWeight: 600 }}
                >
                  {conditionOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {selectedConditionSelect === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom condition (e.g. Slightly Turbid)..."
                    value={customConditionText}
                    onChange={handleCustomConditionChange}
                    className="premium-input"
                    style={{ marginTop: '0.4rem', border: '1px solid #3b82f6' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Sample Collected / Submitted By (Auto-Fetched)</label>
                <input
                  type="text"
                  name="sampleCollectedBy"
                  value={formData.sampleCollectedBy}
                  onChange={handleChange}
                  readOnly
                  disabled
                  className="premium-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Starting Date Of Test / Analysis</label>
                <input
                  type="date"
                  name="startingDateOfTest"
                  min={formData.dateOfReceipt}
                  value={formData.startingDateOfTest}
                  onChange={handleChange}
                  className="premium-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Completion Date of Test</label>
                <input
                  type="date"
                  name="completionDateOfTest"
                  min={formData.startingDateOfTest || formData.dateOfReceipt}
                  value={formData.completionDateOfTest}
                  onChange={handleChange}
                  className="premium-input"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Dynamic Test Results Parameter Table */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaFlask style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Test Parameters & Results</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Permissible Limit Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'sans-serif' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Show Permissible Limit:</span>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={formData.showPermissibleLimits}
                      onChange={(e) => setFormData(prev => ({ ...prev, showPermissibleLimits: e.target.checked }))}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: formData.showPermissibleLimits ? '#22c55e' : '#cbd5e1',
                      transition: '.4s',
                      borderRadius: '34px'
                    }}>
                      <span className="slider-thumb" style={{
                        position: 'absolute',
                        height: '16px', width: '16px',
                        left: formData.showPermissibleLimits ? '20px' : '4px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAddParamRow}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <FaPlus size={11} /> Add Parameter Row
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Section Table Header Title</label>
              <input type="text" name="sectionHeader" value={formData.sectionHeader} onChange={handleChange} className="premium-input" placeholder="e.g. WASTE WATER ANALYSIS" />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '0.5rem', width: '50px' }}>SR.</th>
                    <th style={{ padding: '0.5rem' }}>TEST PARAMETER</th>
                    <th style={{ padding: '0.5rem' }}>REFERENCE METHOD</th>
                    <th style={{ padding: '0.5rem', width: '80px' }}>UNIT</th>
                    <th style={{ padding: '0.5rem', width: '100px' }}>RESULT</th>
                    {formData.showPermissibleLimits && <th style={{ padding: '0.5rem', width: '110px' }}>PERMISSIBLE LIMIT</th>}
                    <th style={{ padding: '0.5rem', width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parametersList.map((param, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.srNo}
                          readOnly
                          style={{ ...tableInputStyle, backgroundColor: '#f8fafc', textAlign: 'center', cursor: 'default' }}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={sanitizeSamplingParamName(param.parameterName)}
                          readOnly
                          title="Parameter loaded from database Parameter Master"
                          style={{ ...tableInputStyle, fontWeight: 600, backgroundColor: '#f8fafc', color: '#0f172a', cursor: 'default' }}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.referenceMethod}
                          onChange={(e) => handleParamChange(idx, 'referenceMethod', e.target.value)}
                          placeholder="Test method"
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                          placeholder="Unit"
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.result}
                          onChange={(e) => handleParamChange(idx, 'result', e.target.value)}
                          placeholder="Result"
                          style={{ ...tableInputStyle, fontWeight: 700, color: '#1e293b' }}
                        />
                      </td>
                      {formData.showPermissibleLimits && (
                        <td style={{ padding: '0.4rem' }}>
                          <input
                            type="text"
                            value={param.permissibleLimit}
                            onChange={(e) => handleParamChange(idx, 'permissibleLimit', e.target.value)}
                            placeholder="Limit"
                            style={tableInputStyle}
                          />
                        </td>
                      )}
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteParamRow(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.15s ease'
                          }}
                          title="Remove Parameter"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 4: Signatures & Remarks */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid #f8fafc' }}>
              Signatures & Authorizations
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Reviewed By (Sr. Analyst / Analyst)</label>
                <input type="text" name="reviewedByAnalyst" value={formData.reviewedByAnalyst} onChange={handleChange} className="premium-input" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Authorized Signatory Name(s)</label>
                <input type="text" name="authorizedSignatory" value={formData.authorizedSignatory} onChange={handleChange} className="premium-input" />
              </div>
            </div>

            {/* Digital Signature Upload Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {/* Reviewed By Digital Signature */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Digital Signature (Reviewed By)
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.78rem' }}>Optional</span>
                </label>

                {formData.reviewedBySignature ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{
                      background: '#f8fafc',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <img
                        src={formData.reviewedBySignature}
                        alt="Reviewed By Signature Preview"
                        style={{ maxHeight: '80px', maxWidth: '260px', objectFit: 'contain', borderRadius: '6px' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Current Signature</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => reviewedBySignatureInputRef.current && reviewedBySignatureInputRef.current.click()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                          borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.82rem',
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        🔄 Replace Signature
                      </button>
                      <button
                        type="button"
                        onClick={handleReviewedBySignatureRemove}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.82rem',
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => reviewedBySignatureInputRef.current && reviewedBySignatureInputRef.current.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '1.5rem 2rem',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      maxWidth: '380px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>✍️</div>
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>Click to upload Reviewed By signature</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>PNG, JPG — transparent background recommended</div>
                  </div>
                )}

                <input
                  ref={reviewedBySignatureInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={handleReviewedBySignatureUpload}
                />
              </div>

              {/* Authorized Signatory Digital Signature */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Digital Signature (Authorized Signatory)
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.78rem' }}>Optional</span>
                </label>

                {formData.signatureImage ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{
                      background: '#f8fafc',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <img
                        src={formData.signatureImage}
                        alt="Digital Signature Preview"
                        style={{ maxHeight: '80px', maxWidth: '260px', objectFit: 'contain', borderRadius: '6px' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Current Signature</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current && signatureInputRef.current.click()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                          borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.82rem',
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        🔄 Replace Signature
                      </button>
                      <button
                        type="button"
                        onClick={handleSignatureRemove}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '8px', padding: '0.45rem 1rem', fontSize: '0.82rem',
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => signatureInputRef.current && signatureInputRef.current.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '1.5rem 2rem',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      maxWidth: '380px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>✍️</div>
                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>Click to upload signatory signature</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>PNG, JPG — transparent background recommended</div>
                  </div>
                )}

                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={handleSignatureUpload}
                />
              </div>
            </div>
          </div>


          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#ffffff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaSave />
              <span>{submitting ? 'Saving...' : 'Save Report'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndPrint}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaPrint />
              <span>Save & Generate PDF</span>
            </button>
          </div>

        </div>

        {/* Right Column: Live Document Preview Panel */}
        {showLivePreview && (
          <div style={{ flex: '1 1 45%', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LIVE DOCUMENT PREVIEW
              </span>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#334155'
              }}>
                <input
                  type="checkbox"
                  checked={withHeaderFooter}
                  onChange={(e) => setWithHeaderFooter(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#22c55e',
                    cursor: 'pointer'
                  }}
                />
                <span>With Header/Footer</span>
              </label>
            </div>

            {/* A4 Document Box */}
            <div ref={printRef} style={{ width: '100%' }}>
              <TestReportDocument
                report={formData}
                parameters={parametersList}
                company={currentCompany}
                withHeaderFooter={withHeaderFooter}
                isPrintMode={false}
              />
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Permissible Limits */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem 2.5rem',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Save Without Permissible Limit?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              You have turned <strong>OFF</strong> the Permissible Limit column. The report will be saved and printed <strong>without</strong> the Permissible Limit section.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={handleConfirmCancel}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmYes}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                Yes, Save Without
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer & Previous Report Import Modal */}
      {isCustomerImportModalOpen && (
        <CustomerReportImportModal
          isOpen={isCustomerImportModalOpen}
          onClose={() => setIsCustomerImportModalOpen(false)}
          onSelectReport={handleSelectCustomerPreviousReport}
          onSelectCustomerOnly={handleSelectCustomerDirect}
          currentCompanyId={localStorage.getItem('selectedCompanyId') || ''}
        />
      )}

      {/* Database Parameter Selection Modal */}
      {isParamModalOpen && (
        <ParameterSelectionModal
          isOpen={isParamModalOpen}
          onClose={() => setIsParamModalOpen(false)}
          onAddParameters={handleAddParametersFromDb}
          companyId={localStorage.getItem('selectedCompanyId') || ''}
        />
      )}

    </div>
  );
};

// Styling Object Constants
const tableInputStyle = {
  width: '100%',
  padding: '0.35rem 0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  outline: 'none',
  fontSize: '0.82rem',
  backgroundColor: '#ffffff'
};

const a4DocumentSheetStyle = {
  background: '#ffffff',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e2e8f0',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  color: '#000000',
  boxSizing: 'border-box'
};

const borderedTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.72rem',
  border: '1px solid #000'
};

const tableCellKey = {
  padding: '0.25rem 0.4rem',
  border: '1px solid #000',
  fontWeight: 600,
  backgroundColor: '#ffffff'
};

const tableCellValue = {
  padding: '0.25rem 0.4rem',
  border: '1px solid #000',
  backgroundColor: '#ffffff'
};

const tableHeaderStyle = {
  padding: '0.35rem 0.4rem',
  border: '1px solid #000',
  fontSize: '0.68rem'
};

const tableCellStyle = {
  padding: '0.25rem 0.4rem',
  border: '1px solid #000',
  fontSize: '0.7rem'
};

const stampCircleStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  border: '2px dashed #1e3a8a',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '0.2rem',
  opacity: 0.85,
  transform: 'rotate(-8deg)'
};

export default TestReportForm;
