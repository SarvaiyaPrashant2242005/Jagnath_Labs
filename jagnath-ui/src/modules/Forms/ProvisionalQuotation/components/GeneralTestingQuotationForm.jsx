/**
 * @file GeneralTestingQuotationForm.jsx
 * @description Dedicated Form Workspace for General Testing / Consulting Quotation.
 * Features:
 * - Split-view layout (60% Form Editor on Left, 40% Sticky Live A4 Preview on Right).
 * - Responsive stacked mode below 1100px with Live Preview toggle.
 * - 6 Comprehensive Cards matching real physical quotation spec.
 * - Inline field validation (Client Company Name & Line item description).
 * - Number inputs protected against mouse-wheel scrolling.
 * - Signature image upload with file size limit (~1MB) stored as Data URL.
 * - Reset to default clauses with user confirmation.
 * - Clean integration with saveQuotationSnapshot and browser print.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPrint, FaPlus, FaTrash, FaCopy,
  FaArrowUp, FaArrowDown, FaUpload, FaTimes, FaUndo, FaEye, FaEyeSlash,
  FaClipboardList, FaFileInvoiceDollar
} from 'react-icons/fa';

import {
  saveQuotationSnapshot,
  getQuotationById,
  getSavedQuotations,
  fetchMasterData
} from '../services/provisionalQuotationStorage.service';

import {
  calculatePricingRow,
  calculateGeneralTestingTotals,
  formatIndianCurrency,
  generateGTQuotationNumber
} from '../utils/gtCalculation.utils';

import {
  createInitialGeneralTestingData,
  DEFAULT_GENERAL_TESTING_SECTIONS
} from '../services/generalTestingDefaults';

import GTRichTextEditor from './GTRichTextEditor';
import GeneralTestingDocument from './GeneralTestingDocument';
import '../styles/generalTestingPrint.css';

export const GeneralTestingQuotationForm = ({ quotationId = null }) => {
  const navigate = useNavigate();
  const isEditing = !!quotationId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testRequests, setTestRequests] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const sigInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState(() => createInitialGeneralTestingData());

  // Load existing quotation or initialize new one
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const masters = await fetchMasterData().catch(() => ({}));
        setTestRequests(masters.testRequests || []);
        const existingList = getSavedQuotations();

        if (isEditing) {
          const existing = getQuotationById(quotationId);
          if (existing) {
            setFormData({
              ...createInitialGeneralTestingData(masters.company || {}),
              ...existing,
              quotationType: 'general_testing',
              lineItems: (existing.lineItems || []).map(calculatePricingRow),
              sections: Array.isArray(existing.sections) && existing.sections.length > 0
                ? existing.sections
                : DEFAULT_GENERAL_TESTING_SECTIONS.map((s, i) => ({ ...s, id: `sec_${Date.now()}_${i}` })),
            });
          } else {
            setToast({ show: true, message: 'Quotation not found. Initialized new draft.', type: 'warning' });
            setFormData(createInitialGeneralTestingData(masters.company || {}, existingList.length + 1));
          }
        } else {
          setFormData(createInitialGeneralTestingData(masters.company || {}, existingList.length + 1));
        }
      } catch (err) {
        console.error('Error initializing General Testing Form:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [quotationId, isEditing]);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Prevent scroll wheel from changing number inputs
  const handleWheelPrevent = (e) => {
    e.target.blur();
  };

  // Auto-fill client from TRF selection
  const handleSelectTRF = (trId) => {
    if (!trId) return;
    const selectedTR = (testRequests || []).find(r => r.id === trId);
    if (!selectedTR) return;
    const trClient = selectedTR.client || {};
    const plantAddr = trClient.plantAddress || trClient.plant_address || selectedTR.plantAddress || selectedTR.address || trClient.officeAddress || '';
    const regAddr = trClient.officeAddress || trClient.office_address || selectedTR.address || plantAddr;

    setFormData(prev => ({
      ...prev,
      testRequestId: trId,
      client: {
        ...(prev.client || {}),
        companyName: trClient.clientName || prev.client?.companyName || '',
        contactPerson: trClient.contactPerson || prev.client?.contactPerson || '',
        contactNo: trClient.contactPhone || trClient.phone || prev.client?.contactNo || '',
        email: trClient.email || prev.client?.email || '',
        address: regAddr || prev.client?.address || '',
        serviceName: selectedTR.sampleParticular || selectedTR.plantName || prev.client?.serviceName || ''
      }
    }));
    triggerToast(`Auto-fetched details for ${trClient.clientName || 'selected TRF'}`, 'success');
  };

  // Line Item Handlers
  const handlePricingRowChange = (index, field, value) => {
    setFormData(prev => {
      const lineItems = [...(prev.lineItems || [])];
      const updated = { ...lineItems[index], [field]: value };
      lineItems[index] = calculatePricingRow(updated);
      return { ...prev, lineItems };
    });

    if (errors[`lineItem_${index}`] && value.trim()) {
      setErrors(prev => ({ ...prev, [`lineItem_${index}`]: null }));
    }
  };

  const handleAddPricingRow = () => {
    setFormData(prev => {
      const current = prev.lineItems || [];
      const newRow = calculatePricingRow({
        id: 'li_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        sampleName: '',
        noOfSamples: 1,
        chargesPerSample: 0,
        discountPercent: 0,
      });
      return { ...prev, lineItems: [...current, newRow] };
    });
  };

  const handleDuplicatePricingRow = (index) => {
    setFormData(prev => {
      const current = [...(prev.lineItems || [])];
      const target = current[index];
      if (!target) return prev;
      const copy = calculatePricingRow({
        ...target,
        id: 'li_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      });
      current.splice(index + 1, 0, copy);
      return { ...prev, lineItems: current };
    });
  };

  const handleDeletePricingRow = (index) => {
    setFormData(prev => {
      const current = [...(prev.lineItems || [])];
      if (current.length <= 1) {
        triggerToast('At least one line item is required.', 'warning');
        return prev;
      }
      current.splice(index, 1);
      return { ...prev, lineItems: current };
    });
  };

  // Section Handlers
  const handleAddSection = () => {
    setFormData(prev => {
      const currentSections = prev.sections || [];
      const newSection = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        presetKey: 'custom',
        pageNumber: 2,
        title: 'New Terms Section',
        content: '<p>Enter section clause details here...</p>',
      };
      return { ...prev, sections: [...currentSections, newSection] };
    });
    triggerToast('Added new section', 'info');
  };

  const handleUpdateSection = (index, field, value) => {
    setFormData(prev => {
      const currentSections = [...(prev.sections || [])];
      if (currentSections[index]) {
        currentSections[index] = { ...currentSections[index], [field]: value };
      }
      return { ...prev, sections: currentSections };
    });
  };

  const handleMoveSection = (index, direction) => {
    setFormData(prev => {
      const currentSections = [...(prev.sections || [])];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= currentSections.length) return prev;
      const temp = currentSections[index];
      currentSections[index] = currentSections[targetIdx];
      currentSections[targetIdx] = temp;
      return { ...prev, sections: currentSections };
    });
  };

  const handleDuplicateSection = (index) => {
    setFormData(prev => {
      const currentSections = [...(prev.sections || [])];
      const target = currentSections[index];
      if (!target) return prev;
      const duplicate = {
        ...target,
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: `${target.title} (Copy)`,
      };
      currentSections.splice(index + 1, 0, duplicate);
      return { ...prev, sections: currentSections };
    });
    triggerToast('Section duplicated', 'info');
  };

  const handleDeleteSection = (index) => {
    setFormData(prev => {
      const currentSections = [...(prev.sections || [])];
      currentSections.splice(index, 1);
      return { ...prev, sections: currentSections };
    });
    triggerToast('Section removed', 'info');
  };

  const handleResetSections = () => {
    if (window.confirm('Reset all clauses and terms to the standard 8 default clauses? Custom edits will be replaced.')) {
      setFormData(prev => ({
        ...prev,
        sections: DEFAULT_GENERAL_TESTING_SECTIONS.map((s, idx) => ({ ...s, id: `sec_${Date.now()}_${idx}` }))
      }));
      triggerToast('Reset to default clauses!', 'info');
    }
  };

  // Signature Image Upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      alert('Signature image file size must be less than 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        signature: {
          ...(prev.signature || {}),
          required: true,
          signatureImage: reader.result,
        }
      }));
      triggerToast('Signature image uploaded!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({
      ...prev,
      signature: {
        ...(prev.signature || {}),
        signatureImage: '',
      }
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.client?.companyName?.trim()) {
      newErrors.companyName = 'Client Company Name is required.';
    }

    const items = formData.lineItems || [];
    if (items.length === 0) {
      newErrors.lineItems = 'At least one line item is required.';
    } else {
      items.forEach((item, idx) => {
        if (!item.sampleName?.trim()) {
          newErrors[`lineItem_${idx}`] = 'Sample name / parameter description is required.';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Record
  const handleSave = (silent = false) => {
    if (!validateForm()) {
      triggerToast('Please resolve the highlighted validation errors.', 'warning');
      return null;
    }

    setSaving(true);
    try {
      const gstConfig = {
        enabled: formData.notes?.gstEnabled ?? true,
        percent: formData.notes?.gstPercent ?? 18,
      };
      const totals = calculateGeneralTestingTotals(formData.lineItems || [], gstConfig);

      const record = {
        ...formData,
        id: formData.id || ('gtq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
        quotationType: 'general_testing',
        quotationCategoryType: 'general_testing',
        categoryType: 'general_testing',
        quotationNumber: formData.quotationNo || formData.quotationNumber || generateGTQuotationNumber(),
        quotationNo: formData.quotationNo || formData.quotationNumber || generateGTQuotationNumber(),
        lineItems: totals.rows,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        clientName: formData.client?.companyName || '',
        plantName: formData.client?.serviceName || '',
        plantAddress: formData.client?.address || '',
        status: formData.status || 'Draft',
        updatedAt: new Date().toISOString()
      };

      const saved = saveQuotationSnapshot(record);
      setFormData(saved);

      if (!silent) {
        triggerToast('General Testing / Consulting Quotation saved successfully!', 'success');
      }

      if (!isEditing && saved.id) {
        navigate(`/quotations/provisional/edit/${saved.id}?type=general_testing`, { replace: true });
      }

      return saved;
    } catch (err) {
      console.error('Error saving quotation:', err);
      triggerToast('Failed to save quotation', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const saved = handleSave(true);
    if (!saved) return;
    window.open(`#/quotations/provisional/print/${saved.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading General Testing Quotation...</p>
      </div>
    );
  }

  return (
    <div className="module-page-container gt-workspace-root" style={{ minHeight: '100vh', padding: '1rem', background: '#f1f5f9' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : (toast.type === 'warning' ? '#f59e0b' : '#10b981'),
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div
        className="gt-form-actions-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/quotations/provisional" className="btn btn-outline-secondary btn-sm" title="Back to Quotations List">
            <FaArrowLeft /> Back
          </Link>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>📑</span> General Testing / Consulting Quotation
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              3-Page Commercial Proposal with Bundled Tests, Sample Requirements, Compliance Rules &amp; Bank Details
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Mobile Preview Toggle */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-xl-none"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            style={{ display: 'none' }} /* will be shown via media query if needed */
          >
            {showMobilePreview ? <FaEyeSlash /> : <FaEye />} {showMobilePreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm font-semibold"
            onClick={handlePrint}
            title="Open Clean Vector Print PDF"
          >
            <FaPrint /> Print / Download PDF
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm font-semibold"
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>
      </div>

      {/* Split-View Workspace */}
      <div
        className="gt-split-view-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* ================= LEFT COLUMN: FORM EDITOR (6 CARDS) ================= */}
        <div className="gt-form-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. Quotation Type & TRF Hero Card */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '10px',
              padding: '1rem',
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.08)'
            }}
          >
            {/* Quotation Type Selector Dropdown */}
            <div className="form-group mb-3 pb-3" style={{ borderBottom: testRequests.length ? '1.5px dashed #86efac' : 'none' }}>
              <label className="form-label font-bold text-slate-800 mb-1 d-flex align-center gap-2" style={{ fontSize: '0.88rem' }}>
                <FaFileInvoiceDollar style={{ color: '#16a34a' }} /> Select Quotation Type:
              </label>
              <select
                className="form-control font-bold"
                style={{
                  height: '40px',
                  fontSize: '0.92rem',
                  borderColor: '#22c55e',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
                value="general_testing"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'general') {
                    if (isEditing) {
                      navigate(`/quotations/provisional/edit/${quotationId}?type=general`);
                    } else {
                      navigate('/quotations/provisional/add');
                    }
                  }
                }}
              >
                <option value="general">1) General Quotation</option>
                <option value="general_testing">2) General Testing / Consulting Quotation</option>
              </select>
              <small className="text-muted d-block mt-1 font-medium">
                Choose between General Quotation (Schedule-II Environmental Audit) or General Testing / Consulting Quotation.
              </small>
            </div>

            {testRequests.length > 0 && (
              <div>
                <label className="form-label font-bold text-primary mb-1 d-flex align-center gap-2" style={{ fontSize: '0.9rem' }}>
                  <FaClipboardList /> 1. Select Test Request (TRF) to Auto-Fetch Everything:
                </label>
                <select
                  className="form-control font-bold"
                  style={{ height: '42px', fontSize: '0.92rem', borderColor: '#22c55e', backgroundColor: '#ffffff' }}
                  value={formData.testRequestId || ''}
                  onChange={(e) => handleSelectTRF(e.target.value)}
                >
                  <option value="">-- Choose TRF Number to Auto-Populate ({testRequests.length} available) --</option>
                  {testRequests.map(tr => (
                    <option key={tr.id} value={tr.id}>
                      TRF: {tr.reportNumber || tr.sampleIdNumber || tr.id.slice(0, 8)} • {tr.client?.clientName || 'Client'} ({tr.sampleParticular || 'Environmental Matrix'})
                    </option>
                  ))}
                </select>
                <small className="text-muted d-block mt-1">
                  Selecting a TRF automatically fetches the Client, Office Address, Plant Site, and Parameters.
                </small>
              </div>
            )}
          </div>

          {/* Card 1: Quotation Identification & Meta Details */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>🏷️</span> Quotation Identification &amp; Meta Details (Page 1)
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {/* Quotation No */}
              <div>
                <label className="form-label font-bold text-xs">Quotation No.</label>
                <input
                  type="text"
                  name="quotationNo"
                  value={formData.quotationNo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quotationNo: e.target.value, quotationNumber: e.target.value }))}
                  className="form-control font-bold font-mono"
                  style={{ height: '36px' }}
                  placeholder="e.g. AAPL/Q/2305000126/2026-27"
                />
              </div>

              {/* Revision No */}
              <div>
                <label className="form-label font-bold text-xs">Rev No.</label>
                <input
                  type="text"
                  name="revNo"
                  value={formData.revNo || '00'}
                  onChange={(e) => setFormData(prev => ({ ...prev, revNo: e.target.value }))}
                  className="form-control font-bold text-center"
                  style={{ height: '36px' }}
                />
              </div>

              {/* Quotation Date */}
              <div>
                <label className="form-label font-bold text-xs">Quotation Date</label>
                <input
                  type="date"
                  name="quotationDate"
                  value={formData.quotationDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quotationDate: e.target.value }))}
                  className="form-control font-medium"
                  style={{ height: '36px' }}
                />
              </div>

              {/* Valid Till Duration */}
              <div>
                <label className="form-label font-bold text-xs">Validity Period</label>
                <input
                  type="text"
                  name="validTillText"
                  value={formData.validTillText || '1 Month from quotation date'}
                  onChange={(e) => setFormData(prev => ({ ...prev, validTillText: e.target.value }))}
                  className="form-control font-medium"
                  style={{ height: '36px' }}
                  placeholder="e.g. 1 Month from quotation date"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Parties / Address Info Box */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>👥</span> Parties / Address Info Box ("Direct To" &amp; "Direct Enquiries To")
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Left Column: Direct To */}
              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0369a1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🏢</span> Direct To (Client Side)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label text-xs font-semibold">
                      Company Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.client?.companyName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), companyName: val } }));
                        if (errors.companyName && val.trim()) setErrors(prev => ({ ...prev, companyName: null }));
                      }}
                      className="form-control font-bold"
                      style={{ borderColor: errors.companyName ? '#ef4444' : undefined }}
                      placeholder="e.g. BEIL Infrastructure Ltd. – ASARMA Surat"
                    />
                    {errors.companyName && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                        {errors.companyName}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label text-xs font-semibold">Contact Person</label>
                      <input
                        type="text"
                        value={formData.client?.contactPerson || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), contactPerson: e.target.value } }))}
                        className="form-control font-medium"
                        placeholder="e.g. M/s Sunil Patel sir,"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs font-semibold">Contact No.</label>
                      <input
                        type="text"
                        value={formData.client?.contactNo || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), contactNo: e.target.value } }))}
                        className="form-control font-medium"
                        placeholder="e.g. +91 – 8530550524"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-xs font-semibold">Email ID</label>
                    <input
                      type="email"
                      value={formData.client?.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), email: e.target.value } }))}
                      className="form-control font-medium"
                      placeholder="e.g. sunil.patel@beil.co.in"
                    />
                  </div>

                  <div>
                    <label className="form-label text-xs font-semibold">Office / Factory Address</label>
                    <textarea
                      rows={2}
                      value={formData.client?.address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), address: e.target.value } }))}
                      className="form-control font-medium text-xs"
                      placeholder="e.g. (Work Office) 612-613, 7X Business Hub, Bholav Bharuch-392001"
                    />
                  </div>

                  <div>
                    <label className="form-label text-xs font-semibold">Service Name / Plant Details</label>
                    <input
                      type="text"
                      value={formData.client?.serviceName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: { ...(prev.client || {}), serviceName: e.target.value } }))}
                      className="form-control font-medium"
                      placeholder="e.g. 37.5 MLD Sewage Treatment Plant for SURAT..."
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Enquiries To */}
              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>🔬</span> Direct Enquiries To (Our Lab Profile)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label text-xs font-semibold">Lab Company Name</label>
                    <input
                      type="text"
                      value={formData.labProfile?.companyName || 'AKSHAAR ANALYTICAL LABORATORIES PRIVATE LTD.'}
                      onChange={(e) => setFormData(prev => ({ ...prev, labProfile: { ...(prev.labProfile || {}), companyName: e.target.value } }))}
                      className="form-control font-bold"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-semibold">HO &amp; Central Laboratory Address</label>
                    <textarea
                      rows={2}
                      value={formData.labProfile?.labAddress || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, labProfile: { ...(prev.labProfile || {}), labAddress: e.target.value } }))}
                      className="form-control font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-semibold">Email ID</label>
                    <input
                      type="email"
                      value={formData.labProfile?.email || 'info.akshaarlabs@gmail.com'}
                      onChange={(e) => setFormData(prev => ({ ...prev, labProfile: { ...(prev.labProfile || {}), email: e.target.value } }))}
                      className="form-control font-medium"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label text-xs font-semibold">Contact Person</label>
                      <input
                        type="text"
                        value={formData.labProfile?.contactPerson || 'Mr. HITARTH'}
                        onChange={(e) => setFormData(prev => ({ ...prev, labProfile: { ...(prev.labProfile || {}), contactPerson: e.target.value } }))}
                        className="form-control font-medium"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs font-semibold">Phone</label>
                      <input
                        type="text"
                        value={formData.labProfile?.contactPhone || '9537766446'}
                        onChange={(e) => setFormData(prev => ({ ...prev, labProfile: { ...(prev.labProfile || {}), contactPhone: e.target.value } }))}
                        className="form-control font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Sample Parameter Pricing Table */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>📊</span> Sample Parameter Pricing Table (Page 1)
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Formula: Total = Samples × Charges/Sample × (1 − Discount% / 100). Auto-calculated.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddPricingRow}
                className="btn btn-primary btn-xs font-bold"
                style={{ background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FaPlus size={10} /> Add Sample Row
              </button>
            </div>

            {errors.lineItems && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {errors.lineItems}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(formData.lineItems || []).map((item, idx) => {
                const rowData = calculatePricingRow(item);
                const hasRowError = !!errors[`lineItem_${idx}`];

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      background: '#ffffff',
                      border: hasRowError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Top Tier: Index, Description, and Actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div style={{
                        fontWeight: 800,
                        color: '#0284c7',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.82rem',
                        minWidth: '32px',
                        textAlign: 'center',
                        marginTop: '1.25rem',
                        flexShrink: 0
                      }}>
                        #{idx + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label className="text-muted text-xs d-block mb-1 font-semibold">
                          Sample Name / Test / Parameter <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.sampleName || ''}
                          onChange={(e) => handlePricingRowChange(idx, 'sampleName', e.target.value)}
                          className="form-control text-xs font-medium"
                          placeholder="e.g. pH, COD, BOD, SUSPENDED SOLID, TOTAL NITROGEN..."
                          style={{ resize: 'vertical', minHeight: '38px', width: '100%' }}
                        />
                        {hasRowError && (
                          <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                            {errors[`lineItem_${idx}`]}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1.25rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicatePricingRow(idx)}
                          className="btn btn-outline-secondary btn-xs"
                          title="Duplicate Row"
                          style={{ padding: '5px 7px', borderRadius: '6px' }}
                        >
                          <FaCopy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePricingRow(idx)}
                          className="btn btn-outline-danger btn-xs"
                          title="Delete Row"
                          style={{ padding: '5px 7px', borderRadius: '6px' }}
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Tier: 4 Metric Columns */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: '0.55rem',
                      background: '#f8fafc',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <label className="text-muted text-xs d-block mb-1 font-semibold" style={{ whiteSpace: 'nowrap' }}>No. of Samples</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.noOfSamples ?? 1}
                          onWheel={handleWheelPrevent}
                          onChange={(e) => handlePricingRowChange(idx, 'noOfSamples', e.target.value)}
                          className="form-control text-xs font-bold text-center"
                          style={{ height: '32px', background: '#ffffff' }}
                        />
                      </div>
                      <div>
                        <label className="text-muted text-xs d-block mb-1 font-semibold" style={{ whiteSpace: 'nowrap' }}>Charges/Sample (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.chargesPerSample ?? 0}
                          onWheel={handleWheelPrevent}
                          onChange={(e) => handlePricingRowChange(idx, 'chargesPerSample', e.target.value)}
                          className="form-control text-xs font-bold text-right"
                          style={{ height: '32px', background: '#ffffff' }}
                        />
                      </div>
                      <div>
                        <label className="text-muted text-xs d-block mb-1 font-semibold" style={{ whiteSpace: 'nowrap' }}>Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discountPercent ?? 0}
                          onWheel={handleWheelPrevent}
                          onChange={(e) => handlePricingRowChange(idx, 'discountPercent', e.target.value)}
                          className="form-control text-xs font-bold text-center text-primary"
                          placeholder="0%"
                          style={{ height: '32px', background: '#ffffff' }}
                        />
                      </div>
                      <div>
                        <label className="text-muted text-xs d-block mb-1 font-semibold" style={{ whiteSpace: 'nowrap' }}>Total (₹) [Read-Only]</label>
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            textAlign: 'right',
                            color: '#0f172a',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            boxSizing: 'border-box'
                          }}
                        >
                          {formatIndianCurrency(rowData.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pricing Table Settings & GST Summary */}
              {(() => {
                const gstConfig = {
                  enabled: formData.notes?.gstEnabled ?? true,
                  percent: formData.notes?.gstPercent ?? 18,
                };
                const gtTotals = calculateGeneralTestingTotals(formData.lineItems || [], gstConfig);

                return (
                  <div style={{ background: '#f1f5f9', padding: '0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, margin: 0, fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.notes?.showSubtotal ?? true}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: { ...(prev.notes || {}), showSubtotal: e.target.checked } }))}
                          />
                          Show Subtotal Row in Pricing Table
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, margin: 0, fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.notes?.gstEnabled ?? true}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: { ...(prev.notes || {}), gstEnabled: e.target.checked } }))}
                          />
                          Enable GST Calculation
                        </label>

                        {formData.notes?.gstEnabled !== false && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>GST %:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              onWheel={handleWheelPrevent}
                              value={formData.notes?.gstPercent ?? 18}
                              onChange={(e) => {
                                const pct = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({
                                  ...prev,
                                  notes: {
                                    ...(prev.notes || {}),
                                    gstPercent: pct,
                                    gstNote: `${pct}% GST will be charged as applicable (extra).`
                                  }
                                }));
                              }}
                              className="form-control form-control-sm font-bold"
                              style={{ width: '65px', height: '28px', padding: '2px 6px' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Totals Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: '#64748b' }}>Subtotal:</span>{' '}
                          <strong>{formatIndianCurrency(gtTotals.subtotal)}</strong>
                        </div>
                        {gtTotals.gstEnabled && (
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b' }}>GST ({gtTotals.gstPercent}%):</span>{' '}
                            <strong>{formatIndianCurrency(gtTotals.gstAmount)}</strong>
                          </div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 800 }}>
                          <span>Grand Total:</span> {formatIndianCurrency(gtTotals.grandTotal)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="form-label text-xs font-semibold mb-1">GST Display Note (Page 1)</label>
                      <input
                        type="text"
                        value={formData.notes?.gstNote || '18% GST will be charged as applicable (extra).'}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: { ...(prev.notes || {}), gstNote: e.target.value } }))}
                        className="form-control form-control-sm"
                        placeholder="e.g. 18% GST will be charged as applicable (extra)."
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Card 4: Flexible Sections & Clauses */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>📜</span> Quotation Sections &amp; Clauses (Rich-Text)
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Add, delete, duplicate, and reorder any section. Tab / Shift+Tab supported for bullet lists.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleResetSections}
                  className="btn btn-outline-secondary btn-xs font-semibold"
                  title="Reset to 8 default standard clauses"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FaUndo size={10} /> Reset Clauses
                </button>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="btn btn-primary btn-xs font-bold"
                  style={{ background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FaPlus size={10} /> Add Section
                </button>
              </div>
            </div>

            {/* Sections List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(formData.sections || []).map((sec, sIdx, allSecs) => (
                <div
                  key={sec.id || sIdx}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Section Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1 }}>
                      <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 7px', borderRadius: '4px' }}>
                        #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={sec.title || ''}
                        onChange={(e) => handleUpdateSection(sIdx, 'title', e.target.value)}
                        className="form-control form-control-sm font-bold"
                        style={{ maxWidth: '420px', height: '30px', fontSize: '0.85rem', color: '#0f172a' }}
                        placeholder="Section Heading Title..."
                      />
                    </div>

                    {/* Section Action Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Page Hint:</span>
                        <select
                          value={sec.pageNumber || 2}
                          onChange={(e) => handleUpdateSection(sIdx, 'pageNumber', parseInt(e.target.value, 10))}
                          className="form-select form-select-sm font-bold"
                          style={{ height: '26px', fontSize: '0.74rem', padding: '1px 5px', borderColor: '#0284c7', color: '#0369a1', cursor: 'pointer' }}
                        >
                          <option value={1}>Page 1</option>
                          <option value={2}>Page 2</option>
                          <option value={3}>Page 3</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => handleMoveSection(sIdx, 'up')}
                        className="btn btn-outline-secondary btn-xs"
                        title="Move Up"
                        style={{ padding: '3px 6px', opacity: sIdx === 0 ? 0.4 : 1 }}
                      >
                        <FaArrowUp size={10} /> Up
                      </button>
                      <button
                        type="button"
                        disabled={sIdx === allSecs.length - 1}
                        onClick={() => handleMoveSection(sIdx, 'down')}
                        className="btn btn-outline-secondary btn-xs"
                        title="Move Down"
                        style={{ padding: '3px 6px', opacity: sIdx === allSecs.length - 1 ? 0.4 : 1 }}
                      >
                        <FaArrowDown size={10} /> Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSection(sIdx)}
                        className="btn btn-outline-primary btn-xs"
                        title="Duplicate Section"
                        style={{ padding: '3px 6px' }}
                      >
                        <FaCopy size={10} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sIdx)}
                        className="btn btn-outline-danger btn-xs"
                        title="Delete Section"
                        style={{ padding: '3px 6px' }}
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Section Rich-Text Body */}
                  <GTRichTextEditor
                    value={sec.content || ''}
                    onChange={(e) => handleUpdateSection(sIdx, 'content', e.target.value)}
                    placeholder="Type section clause details, lists, bullets..."
                    minHeight="110px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Bank Details & Tax Information */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>🏦</span> Quotation Prepared By &amp; Bank Details
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label text-xs font-semibold">Service Tax / GSTIN No.</label>
                <input
                  type="text"
                  value={formData.labProfile?.serviceTaxNo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: { ...(prev.labProfile || {}), serviceTaxNo: e.target.value }
                  }))}
                  className="form-control font-bold text-xs"
                  placeholder="24AAZCA8021D1ZO"
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold">PAN No.</label>
                <input
                  type="text"
                  value={formData.labProfile?.panNo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: { ...(prev.labProfile || {}), panNo: e.target.value }
                  }))}
                  className="form-control font-bold text-xs"
                  placeholder="AAZCA8021D"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
              <div>
                <label className="form-label text-xs font-semibold">Bank Name</label>
                <input
                  type="text"
                  value={formData.labProfile?.bankDetails?.bankName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: {
                      ...(prev.labProfile || {}),
                      bankDetails: { ...(prev.labProfile?.bankDetails || {}), bankName: e.target.value }
                    }
                  }))}
                  className="form-control font-medium text-xs"
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold">Account Name</label>
                <input
                  type="text"
                  value={formData.labProfile?.bankDetails?.accountName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: {
                      ...(prev.labProfile || {}),
                      bankDetails: { ...(prev.labProfile?.bankDetails || {}), accountName: e.target.value }
                    }
                  }))}
                  className="form-control font-medium text-xs"
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold">Account No.</label>
                <input
                  type="text"
                  value={formData.labProfile?.bankDetails?.accountNo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: {
                      ...(prev.labProfile || {}),
                      bankDetails: { ...(prev.labProfile?.bankDetails || {}), accountNo: e.target.value }
                    }
                  }))}
                  className="form-control font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold">IFSC Code</label>
                <input
                  type="text"
                  value={formData.labProfile?.bankDetails?.ifsc || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    labProfile: {
                      ...(prev.labProfile || {}),
                      bankDetails: { ...(prev.labProfile?.bankDetails || {}), ifsc: e.target.value }
                    }
                  }))}
                  className="form-control font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div style={{ marginTop: '0.65rem' }}>
              <label className="form-label text-xs font-semibold">Bank Branch Address</label>
              <input
                type="text"
                value={formData.labProfile?.bankDetails?.bankAddress || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  labProfile: {
                    ...(prev.labProfile || {}),
                    bankDetails: { ...(prev.labProfile?.bankDetails || {}), bankAddress: e.target.value }
                  }
                }))}
                className="form-control font-medium text-xs"
                placeholder="Bank branch address..."
              />
            </div>
          </div>

          {/* Card 6: Signature & Watermark Settings */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>✍️</span> Signature &amp; Watermark Settings
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, margin: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.signature?.required || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        signature: {
                          ...(prev.signature || {}),
                          required: checked,
                        }
                      }));
                    }}
                  />
                  Manual Signature Box Required
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 700, margin: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.watermarkEnabled ?? true}
                    onChange={(e) => setFormData(prev => ({ ...prev, watermarkEnabled: e.target.checked }))}
                  />
                  Show Background Logo Watermark
                </label>
              </div>

              {formData.signature?.required ? (
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label text-xs font-semibold">Signatory Name</label>
                      <input
                        type="text"
                        value={formData.signature?.name || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          signature: { ...(prev.signature || {}), name: e.target.value }
                        }))}
                        className="form-control text-xs font-bold"
                        placeholder="e.g. Mr. HITARTH"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs font-semibold">Signatory Designation</label>
                      <input
                        type="text"
                        value={formData.signature?.designation || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          signature: { ...(prev.signature || {}), designation: e.target.value }
                        }))}
                        className="form-control text-xs font-medium"
                        placeholder="e.g. Authorized Signatory"
                      />
                    </div>
                  </div>

                  {/* Signature Upload */}
                  <div>
                    <label className="form-label text-xs font-semibold">Signature Image (Max ~1 MB)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        ref={sigInputRef}
                        accept="image/png, image/jpeg"
                        onChange={handleSignatureUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => sigInputRef.current && sigInputRef.current.click()}
                        className="btn btn-outline-primary btn-xs"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FaUpload size={10} /> Upload Image
                      </button>

                      {formData.signature?.signatureImage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <img
                            src={formData.signature.signatureImage}
                            alt="Signature Preview"
                            style={{ maxHeight: '28px', maxWidth: '80px', objectFit: 'contain' }}
                          />
                          <button
                            type="button"
                            onClick={handleRemoveSignature}
                            className="btn btn-outline-danger btn-xs"
                            title="Remove Signature"
                            style={{ padding: '1px 5px', fontSize: '0.7rem' }}
                          >
                            <FaTimes size={9} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  Default footer note: "{formData.signature?.disclaimer || 'As the enquiry is system generated signature is not required.'}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STICKY REAL-TIME A4 LIVE PREVIEW ================= */}
        <div
          className="gt-preview-column"
          style={{
            position: 'sticky',
            top: '15px',
            maxHeight: 'calc(100vh - 30px)',
            overflowY: 'auto',
            background: '#e2e8f0',
            padding: '1rem',
            borderRadius: '10px',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
              📄 Live A4 Document Preview
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Real-time synchronization
            </span>
          </div>

          {/* Document Renderer */}
          <GeneralTestingDocument
            data={formData}
            isPrintMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralTestingQuotationForm;
