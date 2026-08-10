import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import apiService from '../../services/apiService';
import {
  CATEGORY_ENDPOINTS,
  SUB_CATEGORY_ENDPOINTS,
  LOCATION_SAMPLE_ENDPOINTS,
  PARAMETER_ENDPOINTS,
  CLIENT_ENDPOINTS,
  COMPANY_ENDPOINTS,
  CAUTION_ENDPOINTS
} from '../../services/apiEndpoints';

/**
 * Reusable modal for inline Master creation from dropdowns.
 */
const InlineMasterModal = ({
  isOpen,
  onClose,
  masterType, // 'category' | 'subCategory' | 'locationSample' | 'parameter' | 'client' | 'caution'
  parentData = {}, // e.g. { categoryId, subCategoryId, companyId }
  onSuccess // Callback called with (createdRecord)
}) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Reset form state on opening
  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setIsSaving(false);
    }
  }, [isOpen, masterType]);

  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (masterType) {
      case 'category':
        return {
          title: 'Add New Discipline Group',
          btnText: 'Create Discipline Group',
          endpoint: CATEGORY_ENDPOINTS.CREATE,
          fields: [
            { name: 'name', label: 'Discipline Group Name', type: 'text', required: true, placeholder: 'e.g. Environmental Water Test' }
          ]
        };
      case 'subCategory':
        return {
          title: 'Add New Sub Category',
          btnText: 'Create Sub Category',
          endpoint: SUB_CATEGORY_ENDPOINTS.CREATE,
          fields: [
            { name: 'name', label: 'Sub Category Name', type: 'text', required: true, placeholder: 'e.g. Heavy Metals' }
          ]
        };
      case 'locationSample':
        return {
          title: 'Add New Location of Sample',
          btnText: 'Create Location',
          endpoint: LOCATION_SAMPLE_ENDPOINTS.CREATE,
          fields: [
            { name: 'name', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g. Inlet, Outlet, Plant Entry' }
          ]
        };
      case 'client':
        return {
          title: 'Add New Client',
          btnText: 'Create Client',
          endpoint: CLIENT_ENDPOINTS.CREATE,
          fields: [
            { name: 'clientName', label: 'Client / Customer Name', type: 'text', required: true, placeholder: 'e.g. ABC Pvt Ltd' },
            { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g. Rajkot' },
            { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'client@example.com' },
            { name: 'contactNumber', label: 'Contact Number', type: 'text', required: false, placeholder: '9876543210' }
          ]
        };
      case 'parameter':
        return {
          title: 'Add New Parameter',
          btnText: 'Create Parameter',
          endpoint: PARAMETER_ENDPOINTS.CREATE,
          fields: [
            { name: 'parameterName', label: 'Parameter Name', type: 'text', required: true, placeholder: 'e.g. pH, Turbidity, Lead' },
            { name: 'testMethod', label: 'Test Method / Standard', type: 'text', required: false, placeholder: 'e.g. IS 3025 (Part 11)' },
            { name: 'unit', label: 'Unit', type: 'text', required: false, placeholder: 'e.g. mg/L, pH Unit' },
            { name: 'permissibleLimit', label: 'Permissible Limit', type: 'text', required: false, placeholder: 'e.g. 6.5 - 8.5' }
          ]
        };
      case 'caution':
        return {
          title: 'Add New Quotation Statement',
          btnText: 'Create Quotation Record',
          endpoint: CAUTION_ENDPOINTS.CREATE,
          fields: [
            { name: 'cautionText', label: 'Quotation / Note Text', type: 'textarea', required: true, placeholder: 'e.g. Terms and Conditions for Quotation...' }
          ]
        };
      default:
        return { title: 'Add Master Item', btnText: 'Create', fields: [] };
    }
  };

  const config = getModalConfig();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check parent constraints
    if (masterType === 'subCategory' && !parentData.categoryId) {
      triggerToast('Please select a Discipline Group first.', 'error');
      return;
    }

    const payload = {
      ...formData,
      status: 'Active'
    };

    const activeCompanyId = parentData.companyId || localStorage.getItem('selectedCompanyId');
    if (activeCompanyId) {
      payload.companyId = activeCompanyId;
    }

    if (masterType === 'subCategory' && parentData.categoryId) {
      payload.categoryId = parentData.categoryId;
    }
    if (masterType === 'category' && parentData.departmentId) {
      payload.departmentId = parentData.departmentId;
    }
    if (masterType === 'locationSample' && parentData.subCategoryId) {
      payload.subCategoryId = parentData.subCategoryId;
    }
    if (masterType === 'parameter') {
      if (parentData.categoryId) payload.categoryId = parentData.categoryId;
      if (parentData.subCategoryId) payload.subCategoryId = parentData.subCategoryId;
      if (parentData.locationSampleId) payload.locationSampleId = parentData.locationSampleId;
    }

    try {
      setIsSaving(true);
      const res = await apiService.post(config.endpoint, payload);
      const createdItem = res?.data || res?.data?.data || payload;

      triggerToast(`${config.title.replace('Add New ', '')} created successfully!`, 'success');
      onClose();
      if (onSuccess) {
        onSuccess(createdItem);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create item.';
      triggerToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(3px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '460px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {config.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {config.fields.map(f => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={formData[f.name] || ''}
                  onChange={(e) => handleInputChange(f.name, e.target.value)}
                  required={f.required}
                  style={{
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              ) : (
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={formData[f.name] || ''}
                  onChange={(e) => handleInputChange(f.name, e.target.value)}
                  required={f.required}
                  autoFocus={f === config.fields[0]}
                  style={{
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              )}
            </div>
          ))}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.45rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.45rem 1.2rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#22c55e',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? 'Creating...' : config.btnText}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification Banner */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 10000,
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheck />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default InlineMasterModal;
