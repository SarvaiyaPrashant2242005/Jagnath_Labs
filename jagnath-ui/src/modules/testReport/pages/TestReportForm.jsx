import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaEye, FaEyeSlash, FaPlus, FaTrash,
  FaCheck, FaExclamationCircle, FaClipboardList, FaFlask, FaFilePdf
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import {
  TEST_REQUEST_ENDPOINTS,
  TEST_REPORT_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  PARAMETER_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';

/**
 * @component TestReportForm
 * @description Comprehensive Test Report creation & editing form with split-screen Live Preview,
 * auto-fill integration from existing Test Requests, dynamic parameter result entries, and printable A4 report format.
 */
const TestReportForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Available Test Requests for Auto-Fill Dropdown
  const [testRequests, setTestRequests] = useState([]);
  const [selectedTRId, setSelectedTRId] = useState('');
  const [trLoading, setTrLoading] = useState(false);

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
        return `http://localhost:5000/${cleanPath.substring(idx)}`;
      }
      return formData.companyLogo;
    }
    if (currentCompany) {
      const logoPath = currentCompany.test_report_logo || currentCompany.testReportLogo || currentCompany.logo;
      if (logoPath) {
        const cleanPath = logoPath.replace(/\\/g, '/');
        const idx = cleanPath.lastIndexOf('uploads/');
        if (idx !== -1) {
          return `http://localhost:5000/${cleanPath.substring(idx)}`;
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
      const clientNameVal = targetTR.clientName || targetTR.client?.clientName || formData.reportIssuedTo;
      const clientAddressVal = targetTR.address || targetTR.client?.address || formData.agencyAddress;

      setFormData(prev => ({
        ...prev,
        reportNumber: reportNoDisplay,
        referenceNo: reportNoDisplay,
        reportIssuedTo: clientNameVal,
        agencyName: clientNameVal,
        agencyAddress: clientAddressVal,
        detailsOfSample: sampleParticularVal,
        packingDetails: packingDetailsVal,
        dateOfReceipt: receiptDate,
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
            triggerToast(`Auto-filled details & ${formatted.length} parameters from Test Request #${reportNoDisplay}`, 'success');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch TR parameters:', err);
      }

      triggerToast(`Auto-filled details from Test Request #${reportNoDisplay}`, 'success');
    } catch (err) {
      console.error('Error selecting test request:', err);
      triggerToast('Error auto-filling details from test request', 'error');
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

  // Add new parameter row
  const handleAddParamRow = () => {
    const nextSrNo = String(parametersList.length + 1).padStart(2, '0');
    setParametersList(prev => [
      ...prev,
      {
        srNo: nextSrNo,
        parameterName: '',
        locationOfSample: formData.samplingLocation || '-',
        referenceMethod: '',
        unit: 'mg/L',
        result: '',
        permissibleLimit: '-'
      }
    ]);
  };

  // Delete parameter row
  const handleDeleteParamRow = (index) => {
    setParametersList(prev => prev.filter((_, i) => i !== index));
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

  // Public handlers — show confirmation if permissible limits is OFF
  const handleSave = () => {
    if (!formData.showPermissibleLimits) {
      setConfirmModal({ show: true, action: 'save' });
    } else {
      executeSave();
    }
  };

  const handleSaveAndPrint = () => {
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

      {/* Main Split Screen Area */}
      <div className="premium-ui-form test-report-split-container hide-on-print" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Left Column: Form Inputs */}
        <div style={{ flex: showLivePreview ? '1 1 55%' : '1 1 100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.3s' }}>

          {/* Card 1: Auto-Fill from Test Request Selection */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #bfdbfe', boxShadow: '0 4px 15px -2px rgba(59, 130, 246, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <FaClipboardList style={{ color: '#2563eb', fontSize: '1.2rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Import Details from Test Request</h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#3b82f6' }}>
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
                  </tr>
                </thead>
                <tbody>
                  {parametersList.map((param, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.srNo}
                          onChange={(e) => handleParamChange(idx, 'srNo', e.target.value)}
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.parameterName}
                          onChange={(e) => handleParamChange(idx, 'parameterName', e.target.value)}
                          placeholder="Parameter name"
                          style={{ ...tableInputStyle, fontWeight: 600 }}
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
              <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setWithHeaderFooter(true)}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: withHeaderFooter ? '#ffffff' : 'transparent',
                    color: withHeaderFooter ? '#1e293b' : '#64748b',
                    boxShadow: withHeaderFooter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  With Header/Footer
                </button>
                <button
                  type="button"
                  onClick={() => setWithHeaderFooter(false)}
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: !withHeaderFooter ? '#ffffff' : 'transparent',
                    color: !withHeaderFooter ? '#1e293b' : '#64748b',
                    boxShadow: !withHeaderFooter ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Without Header/Footer
                </button>
              </div>
            </div>

            {/* A4 Document Box */}
            <div ref={printRef} className="printable-report-sheet" style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '0.4rem 0.6rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: '1.2',
              boxSizing: 'border-box'
            }}>

              {/* 1. Header with Logo ONLY */}
              {withHeaderFooter ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div>
                      <img src={getPreviewLogoUrl()} alt="Company Logo" style={{ height: '52px', objectFit: 'contain' }} />
                    </div>
                  </div>
                  {/* Horizontal Line */}
                  <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '2px' }}></div>
                </>
              ) : (
                <div style={{ height: '40px', marginBottom: '2px' }}></div> // Blank space to clear letterhead top
              )}

              {/* 2. Document Title */}
              <div style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px' }}>
                TEST REPORT
              </div>

              {/* Horizontal Divider Line */}
              <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '4px' }}></div>

              {/* 3. Metadata Grid Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', border: '1px solid #000000', marginBottom: '0' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td colSpan={4} style={{ padding: '0.2rem 0.35rem', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                      {formData.formatNo || 'Format No. 7.8 F-02'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td colSpan={2} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold', fontSize: '0.78rem', borderBottom: '1px solid #000' }}>
                      {formData.reportNumber || formData.referenceNo || 'JLT010726RR00307'}
                    </td>
                    <td colSpan={2} style={{ padding: '0.2rem 0.35rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.78rem', borderBottom: '1px solid #000' }}>
                      Date: - {formatDateDDMMYYYY(formData.formatDate || formData.dateOfReceipt || new Date().toISOString())}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ width: '32%', padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Name Of Work</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{formData.nameOfWork || 'Waste Water Analysis'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Details of sample</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.detailsOfSample || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Mode of Packing</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.packingDetails || 'Sample Sealed in Plastic Bottle'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Report Issued To</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{formData.reportIssuedTo || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Reference No. / Report No.</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem', fontWeight: 'bold' }}>{formData.reportNumber || formData.referenceNo || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Date Of Receipt Of Sample</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formatDateDDMMYYYY(formData.dateOfReceipt)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Name Of Agency/Company</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{formData.agencyName || formData.reportIssuedTo}</div>
                      {formData.agencyAddress && <div style={{ fontSize: '0.68rem', marginTop: '1px' }}>{formData.agencyAddress}</div>}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Sample Quantity</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.sampleQuantity || '01 (1 ltr)'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Sampling Location / Type</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.samplingLocation || 'Inlet CETP'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Condition of sample during receipt</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.conditionOnReceipt || 'Satisfactory'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Sample Collected / Submitted by.</td>
                    <td colSpan={3} style={{ padding: '0.2rem 0.35rem' }}>{formData.sampleCollectedBy || 'By Party'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ width: '32%', padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Starting Date Of Test/ Analysis</td>
                    <td style={{ width: '28%', padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>{formatDateDDMMYYYY(formData.startingDateOfTest)}</td>
                    <td style={{ width: '22%', padding: '0.2rem 0.35rem', borderRight: '1px solid #000000' }}>Completion Date of Test</td>
                    <td style={{ width: '18%', padding: '0.2rem 0.35rem' }}>{formatDateDDMMYYYY(formData.completionDateOfTest)}</td>
                  </tr>
                </tbody>
              </table>

              {/* 4. Section Sub-Header Banner */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.78rem', border: '1px solid #000000', borderTop: 'none', padding: '0.18rem 0', textTransform: 'uppercase' }}>
                {formData.sectionHeader || 'WASTE WATER ANALYSIS'}
              </div>

              {/* 5. Test Parameters Results Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', border: '1px solid #000000', borderTop: 'none', marginBottom: '0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>
                    <th style={{ width: '8%', padding: '0.25rem', borderRight: '1px solid #000000' }}>SR.NO.</th>
                    <th style={{ width: formData.showPermissibleLimits ? '28%' : '34%', padding: '0.25rem', borderRight: '1px solid #000000', textAlign: 'left' }}>TESTS PARAMETERS</th>
                    <th style={{ width: formData.showPermissibleLimits ? '32%' : '37%', padding: '0.25rem', borderRight: '1px solid #000000', textAlign: 'center' }}>REFERENCE METHOD</th>
                    <th style={{ width: '10%', padding: '0.25rem', borderRight: '1px solid #000000', textAlign: 'center' }}>UNIT</th>
                    <th style={{ width: formData.showPermissibleLimits ? '11%' : '11%', padding: '0.25rem', borderRight: formData.showPermissibleLimits ? '1px solid #000000' : 'none', textAlign: 'center' }}>RESULTS</th>
                    {formData.showPermissibleLimits && <th style={{ width: '11%', padding: '0.25rem', textAlign: 'center' }}>PERMISIBLE LIMITS</th>}
                  </tr>
                </thead>
                <tbody>
                  {parametersList.map((p, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #000000' }}>
                      <td style={{ padding: '0.25rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{p.srNo || String(index + 1).padStart(2, '0')}</td>
                      <td style={{ padding: '0.25rem 0.35rem', borderRight: '1px solid #000000', fontWeight: 'bold' }}>{p.parameterName}</td>
                      <td style={{ padding: '0.25rem 0.35rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{p.referenceMethod}</td>
                      <td style={{ padding: '0.25rem', borderRight: '1px solid #000000', textAlign: 'center' }}>{p.unit}</td>
                      <td style={{
                        padding: '0.25rem',
                        borderRight: formData.showPermissibleLimits ? '1px solid #000000' : 'none',
                        textAlign: 'center',
                        fontWeight: shouldBoldResult(p.result, p.permissibleLimit) ? 'bold' : 'normal'
                      }}>{p.result}</td>
                      {formData.showPermissibleLimits && <td style={{ padding: '0.25rem', textAlign: 'center' }}>{p.permissibleLimit || '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 6. Terms & Conditions Box */}
              <div style={{ border: '1px solid #000000', borderTop: 'none', padding: '0.25rem 0.4rem', fontSize: '0.58rem', lineHeight: '1.2', textAlign: 'justify' }}>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '0.1rem' }}>
                  This Report is Issued Under Following Terms & Conditions: -
                </div>
                <div>{formData.termsAndConditions}</div>
              </div>

              {/* 7. Signatures Block (NO STAMP) */}
              <div style={{ border: '1px solid #000000', borderTop: 'none', padding: '0.4rem 0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '90px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>Reviewed by,</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#334155' }}>(Sr. Analyst/Analyst)</div>
                  <div style={{ marginTop: '2.5rem', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    Lab Incharge Signatory.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>Thanking you in anticipation!</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>For Jagnath Lab Technologies,</div>
                  <div style={{ marginTop: '2rem', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    ({formData.authorizedSignatory || 'Technical/Quality Manager'})
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                    (Mr. Ankit Rathod/ Mr. Purvin Raiyan)
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>Authorized Signatory</div>
                </div>
              </div>

              {/* 8. End of Test Report Marker */}
              <div style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 'bold', margin: '0.4rem 0' }}>
                --------------------------------- END OF TEST REPORT ---------------------------------
              </div>

              {/* 9. Footer Info */}
              {withHeaderFooter ? (
                <div style={{ borderTop: '1px solid #64748b', paddingTop: '0.3rem', fontSize: '0.58rem', fontFamily: 'sans-serif' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#047857', fontWeight: 600 }}>📍 5-6/B, Nayanjyot Chambers, First Floor, Opp. Vachhera Vada, Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
                    <div style={{ color: '#047857', fontWeight: 600 }}>✉ jagnathtechnologies@yahoo.com</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px' }}>
                    <div style={{ color: '#047857', fontWeight: 600 }}>🌐 www.jagnath.com</div>
                    <div style={{ color: '#047857', fontWeight: 600 }}>📞 +91 8140 5555 15</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
                    Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
                  </div>
                </div>
              ) : (
                <div style={{ height: '30px' }}></div>
              )}

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
