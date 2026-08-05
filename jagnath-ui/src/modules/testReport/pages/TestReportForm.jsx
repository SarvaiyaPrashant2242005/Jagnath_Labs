import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaEye, FaEyeSlash, FaPlus, FaTrash,
  FaCheck, FaExclamationCircle, FaClipboardList, FaFlask, FaFilePdf
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import {
  TEST_REQUEST_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  PARAMETER_ENDPOINTS
} from '../../../shared/services/apiEndpoints';

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
    reportNumber: 'JLT010726RR00307',
    nameOfWork: 'Waste Water Analysis',
    detailsOfSample: 'Waste Water Sample',
    packingDetails: 'Sample Sealed in Plastic Bottle',
    reportIssuedTo: 'M/S Nature Sprout Environmental Services',
    referenceNo: 'JLT010726RR00307',
    dateOfReceipt: '2026-07-17',
    agencyName: 'M/S Nature Sprout Environmental Services',
    agencyAddress: 'Office no 216-217, Shree Raj Paradise, Phase-3, Dared GIDC, Jamnagar.',
    sampleQuantity: '01 (1 ltr)',
    samplingLocation: 'Inlet CETP',
    conditionOnReceipt: 'Satisfactory',
    sampleCollectedBy: 'By Party',
    startingDateOfTest: '2026-07-17',
    completionDateOfTest: '2026-07-19',
    sectionHeader: 'WASTE WATER ANALYSIS',
    reviewedByAnalyst: 'Sr. Analyst',
    authorizedSignatory: 'Mr. Ankit Rathod/ Mr. Purvin Raiyan',
    termsAndConditions: 'The report is analyzed with the quality standards. These results are related to sample collection as specified above. This report in full or part, shall not be published advertised, used for any legal action, unless written consent and prior permission has been secured from the owner, JAGNATH LAB TECHNOLOGIES, GONDAL-RAJKOT.'
  });

  // Dynamic Parameters Results Table State
  const [parametersList, setParametersList] = useState([
    {
      srNo: '01',
      parameterName: 'pH @28° C',
      referenceMethod: 'APHA, 24th Edition 2023/4500-H+ B',
      unit: '-',
      result: '3.50',
      permissibleLimit: '-'
    },
    {
      srNo: '02',
      parameterName: 'Total Suspended solids',
      referenceMethod: 'APHA, 24th Edition 2023/ 2540-D',
      unit: 'mg/L',
      result: '82.3',
      permissibleLimit: '-'
    },
    {
      srNo: '03',
      parameterName: 'Chemical Oxygen Demand',
      referenceMethod: 'IS 3025 (Part 58):2006/Reaffirmed 2023',
      unit: 'mg/L',
      result: '448.97',
      permissibleLimit: '-'
    },
    {
      srNo: '04',
      parameterName: 'Total Dissolved solids',
      referenceMethod: 'APHA, 24th Edition 2023/ 2540-C',
      unit: 'mg/L',
      result: '7954.4',
      permissibleLimit: '-'
    }
  ]);

  // UI state
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const printRef = useRef();

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

  // Handle selecting a Test Request from dropdown to auto-populate form
  const handleTestRequestSelect = async (trId) => {
    setSelectedTRId(trId);
    if (!trId) return;

    const targetTR = testRequests.find(tr => String(tr.id) === String(trId));
    if (targetTR) {
      const receiptDate = targetTR.dateOfReceipt || targetTR.dateOfCollection || formData.dateOfReceipt;
      const sampleParticularVal = targetTR.sampleParticularName || targetTR.sampleParticular || 'N/A';
      const packingDetailsVal = targetTR.packingDetails || 'Sample Sealed in Plastic Bottle';
      const trTitle = targetTR.formTitle || targetTR.title || formData.nameOfWork;

      setFormData(prev => ({
        ...prev,
        reportNumber: targetTR.reportNumber || prev.reportNumber,
        referenceNo: targetTR.reportNumber || prev.reportNumber,
        reportIssuedTo: targetTR.clientName || prev.reportIssuedTo,
        agencyName: targetTR.clientName || prev.agencyName,
        agencyAddress: targetTR.address || prev.agencyAddress,
        detailsOfSample: sampleParticularVal,
        packingDetails: packingDetailsVal,
        dateOfReceipt: receiptDate,
        sampleQuantity: targetTR.sampleQuantity || prev.sampleQuantity,
        samplingLocation: targetTR.locationOfSample || prev.samplingLocation,
        sampleCollectedBy: targetTR.sampleCollectedBy || prev.sampleCollectedBy,
        nameOfWork: trTitle,
        startingDateOfTest: receiptDate > prev.startingDateOfTest ? receiptDate : prev.startingDateOfTest,
        completionDateOfTest: receiptDate > prev.completionDateOfTest ? receiptDate : prev.completionDateOfTest,
        sectionHeader: trTitle.toUpperCase()
      }));

      // Dynamically fetch parameters associated with selected Test Request / Category
      try {
        let fetchedParams = [];
        const activeCatId = targetTR.categoryId || (targetTR.sampleParticular && targetTR.sampleParticular.length > 20 ? targetTR.sampleParticular : null);

        if (activeCatId) {
          const paramRes = await apiService.get(CATEGORY_PARAMETER_ENDPOINTS.GET_BY_CATEGORY(activeCatId));
          if (paramRes?.data) {
            fetchedParams = Array.isArray(paramRes.data) ? paramRes.data : (paramRes.data?.rows || [paramRes.data]);
          }
        }

        // Cross-reference with selected test request parameters
        const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
        if (trpRes?.data) {
          const trps = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data?.rows || [trpRes.data]);
          const matchingTrps = trps.filter(t => String(t.testRequestId) === String(targetTR.id));
          if (matchingTrps.length > 0 && fetchedParams.length > 0) {
            const checks = {};
            matchingTrps.forEach(t => { if (t.parameterId) checks[t.parameterId] = true; });
            const checkedOnly = fetchedParams.filter(p => checks[p.id]);
            if (checkedOnly.length > 0) fetchedParams = checkedOnly;
          }
        }

        // If parameters are found, populate parametersList dynamically
        if (fetchedParams.length > 0) {
          const formatted = fetchedParams.map((p, idx) => {
            const isLimitApp = p.isPermissibleLimitApplicable === true || p.is_permissible_limit_applicable === true;
            const limitVal = isLimitApp ? (p.permissibleLimit || p.permissible_limit || p.limit || 'Applicable') : '-';
            return {
              srNo: String(idx + 1).padStart(2, '0'),
              parameterName: p.parameterName || p.name || p.parameter_name || `Parameter ${idx + 1}`,
              referenceMethod: p.referenceMethod || p.testing_method || p.method || 'APHA, 24th Edition 2023',
              unit: p.unit || '-',
              result: '',
              permissibleLimit: limitVal
            };
          });
          setParametersList(formatted);
        }
      } catch (err) {
        console.error('Dynamic parameters fetch error for selected TR:', err);
      }

      triggerToast(`Auto-filled details & dynamic parameters from Test Request #${targetTR.reportNumber || targetTR.id.slice(0, 6)}`, 'success');
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
  const handleSave = async () => {
    setSubmitting(true);
    try {
      // Frontend mock save delay
      await new Promise(res => setTimeout(res, 400));
      triggerToast('Test Report saved successfully!', 'success');
      setTimeout(() => {
        navigate('/test-reports');
      }, 500);
    } catch (err) {
      triggerToast('Failed to save test report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    setSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 300));
      triggerToast('Saving & generating PDF report...', 'success');
      window.print();
      setTimeout(() => {
        navigate('/test-reports');
      }, 500);
    } catch (err) {
      triggerToast('Failed to generate PDF.', 'error');
    } finally {
      setSubmitting(false);
    }
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
            <select
              value={selectedTRId}
              onChange={(e) => handleTestRequestSelect(e.target.value)}
              className="premium-input"
              style={{ width: '100%', backgroundColor: '#ffffff', fontWeight: 600, color: '#1e293b' }}
            >
              <option value="">-- Select Test Request / Report No. --</option>
              {testRequests.map(tr => (
                <option key={tr.id} value={tr.id}>
                  {tr.reportNumber ? `Report No: ${tr.reportNumber}` : `TR #${tr.id.slice(0, 8)}`} | {tr.clientName || 'Client N/A'} ({tr.dateOfReceipt || 'Date N/A'})
                </option>
              ))}
            </select>
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
              <button
                type="button"
                onClick={handleAddParamRow}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.85rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaPlus size={11} /> Add Parameter Row
              </button>
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
                    <th style={{ padding: '0.5rem', width: '110px' }}>PERMISSIBLE LIMIT</th>
                    <th style={{ padding: '0.5rem', width: '40px' }}></th>
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
                      <td style={{ padding: '0.4rem' }}>
                        <input
                          type="text"
                          value={param.permissibleLimit}
                          onChange={(e) => handleParamChange(idx, 'permissibleLimit', e.target.value)}
                          placeholder="Limit"
                          style={tableInputStyle}
                        />
                      </td>
                      <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteParamRow(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
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
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                A4 Format
              </span>
            </div>

            {/* A4 Document Box */}
            <div ref={printRef} className="printable-report-sheet" style={a4DocumentSheetStyle}>
              
              {/* Header Logo & Header Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <img src="/Images/Navbar_Logo.png" alt="Jagnath Lab" style={{ height: '52px', objectFit: 'contain' }} />
                <div style={{ border: '1px solid #000', padding: '0.25rem 0.5rem', textAlign: 'right', fontSize: '0.7rem' }}>
                  <div style={{ fontWeight: 700 }}>{formData.formatNo}</div>
                  <div>Date: - {formatDateDDMMYYYY(formData.reportDate)}</div>
                </div>
              </div>

              {/* Centered Document Title */}
              <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, textDecoration: 'underline', marginBottom: '0.5rem' }}>
                TEST REPORT
              </div>

              {/* Reference ID Banner */}
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {formData.reportNumber}
              </div>

              {/* Sample Metadata Key-Value Bordered Table */}
              <table style={borderedTableStyle}>
                <tbody>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Title</td>
                    <td colSpan={3} style={{ ...tableCellValue, width: '78%' }}>{formData.nameOfWork}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Details of sample</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.detailsOfSample}</td>
                    <td style={{ ...tableCellKey, width: '22%' }}>Mode of Packing</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.packingDetails}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Report Issued To</td>
                    <td colSpan={3} style={{ ...tableCellValue, fontWeight: 700 }}>{formData.reportIssuedTo}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Reference No. / Report No.</td>
                    <td colSpan={3} style={{ ...tableCellValue, fontWeight: 700 }}>{formData.referenceNo}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Date Of Receipt Of Sample</td>
                    <td colSpan={3} style={tableCellValue}>{formatDateDDMMYYYY(formData.dateOfReceipt)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Name Of Agency/Company</td>
                    <td colSpan={3} style={tableCellValue}>
                      <div style={{ fontWeight: 700 }}>{formData.agencyName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#475569' }}>{formData.agencyAddress}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Sample Quantity</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.sampleQuantity}</td>
                    <td style={{ ...tableCellKey, width: '22%' }}>Sampling Location</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.samplingLocation}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Condition of sample</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.conditionOnReceipt}</td>
                    <td style={{ ...tableCellKey, width: '22%' }}>Sample Collected By</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formData.sampleCollectedBy}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tableCellKey, width: '22%' }}>Starting Date Of Test</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formatDateDDMMYYYY(formData.startingDateOfTest)}</td>
                    <td style={{ ...tableCellKey, width: '22%' }}>Completion Date Of Test</td>
                    <td style={{ ...tableCellValue, width: '28%' }}>{formatDateDDMMYYYY(formData.completionDateOfTest)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Section Sub-Header Banner */}
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', background: '#f1f5f9', border: '1px solid #000', borderTop: 'none', padding: '0.25rem' }}>
                {formData.sectionHeader}
              </div>

              {/* Test Parameters Results Table */}
              <table style={{ ...borderedTableStyle, borderTop: 'none' }}>
                <thead>
                  <tr style={{ background: '#fafafa', textAlign: 'center', fontWeight: 800 }}>
                    <th style={{ ...tableHeaderStyle, width: '40px' }}>SR.NO.</th>
                    <th style={tableHeaderStyle}>TESTS PARAMETERS</th>
                    <th style={tableHeaderStyle}>REFERENCE METHOD</th>
                    <th style={{ ...tableHeaderStyle, width: '60px' }}>UNIT</th>
                    <th style={{ ...tableHeaderStyle, width: '70px' }}>RESULTS</th>
                    <th style={{ ...tableHeaderStyle, width: '90px' }}>PERMISSIBLE LIMITS</th>
                  </tr>
                </thead>
                <tbody>
                  {parametersList.map((p, index) => (
                    <tr key={index}>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.srNo || String(index + 1).padStart(2, '0')}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>{p.parameterName}</td>
                      <td style={tableCellStyle}>{p.referenceMethod}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.unit}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 800 }}>{p.result}</td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.permissibleLimit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Terms & Conditions Notice Box */}
              <div style={{ border: '1px solid #000', borderTop: 'none', padding: '0.35rem 0.5rem', fontSize: '0.6rem', lineHeight: '1.2', background: '#ffffff' }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '0.1rem' }}>
                  This Report is Issued Under Following Terms & Conditions: -
                </div>
                <div>{formData.termsAndConditions}</div>
              </div>

              {/* Signatures & Stamp Block */}
              <div style={{ border: '1px solid #000', borderTop: 'none', padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: '85px' }}>
                <div style={{ fontSize: '0.68rem' }}>
                  <div style={{ fontWeight: 700 }}>Reviewed by,</div>
                  <div style={{ fontStyle: 'italic', color: '#475569' }}>({formData.reviewedByAnalyst})</div>
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #000', paddingTop: '0.1rem', fontWeight: 700 }}>
                    Lab Incharge Signatory.
                  </div>
                </div>

                {/* Round Stamp Visual */}
                <div style={stampCircleStyle}>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800, textAlign: 'center' }}>Jagnath Lab Technologies</div>
                  <div style={{ fontSize: '0.5rem', color: '#1e3a8a', textAlign: 'center', fontWeight: 700 }}>Environment Audit Cell</div>
                  <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>★ Gondal - 360311 ★</div>
                </div>

                <div style={{ fontSize: '0.68rem', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>Thanking you in anticipation!</div>
                  <div style={{ fontWeight: 700 }}>For Jagnath Lab Technologies,</div>
                  <div style={{ marginTop: '1.25rem', fontWeight: 700 }}>({formData.authorizedSignatory})</div>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '0.1rem', fontWeight: 800 }}>Authorized Signatory</div>
                </div>
              </div>

              {/* End of Report Indicator */}
              <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, margin: '0.5rem 0' }}>
                --------------------- END OF TEST REPORT ---------------------
              </div>

              {/* Footer Information */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.4rem', fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <div>📍 5-6/B, Nayanjyot Chambers, First Floor, Opp. Vachhera Vada, Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
                <div>✉ jagnathtechnologies@yahoo.com | 🌐 www.jagnath.com | 📞 +91 8140 5555 15</div>
              </div>
              <div style={{ fontSize: '0.55rem', color: '#475569', textAlign: 'center', marginTop: '0.2rem', fontWeight: 700 }}>
                Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
              </div>

            </div>
          </div>
        )}

      </div>

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
