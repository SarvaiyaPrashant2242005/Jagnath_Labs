import React, { useState, useEffect, useMemo } from 'react';
import {
  FaTimes,
  FaSearch,
  FaFlask,
  FaCheck,
  FaSpinner,
  FaPlus,
  FaCheckSquare,
  FaSquare
} from 'react-icons/fa';
import apiService from '../../../shared/services/apiService';
import { PARAMETER_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';

/**
 * ParameterSelectionModal
 * Fetches parameters from database filtered by Parameter Company (companyId).
 * Supports search, multi-selection, and adding selected parameters to Test Report.
 */
const ParameterSelectionModal = ({
  isOpen,
  onClose,
  onAddParameters, // callback receiving array of selected parameter objects
  companyId
}) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIds(new Set());
      setErrorMsg('');
      fetchParameters();
    }
  }, [isOpen, companyId]);

  const fetchParameters = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const activeCompId = companyId || localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ limit: 5000 });
      if (activeCompId) {
        params.append('companyId', activeCompId);
      }

      const res = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || [res.data]);
        setParameters(list.filter(Boolean));
      } else {
        setParameters([]);
      }
    } catch (err) {
      console.error('Failed to load database parameters:', err);
      setErrorMsg('Failed to load parameters from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter parameters by search term
  const filteredParameters = useMemo(() => {
    if (!searchTerm.trim()) return parameters;
    const q = searchTerm.toLowerCase();
    return parameters.filter(p => {
      const name = (p.parameterName || '').toLowerCase();
      const method = (p.testMethod || p.referenceStandard || '').toLowerCase();
      const unit = (p.unit || '').toLowerCase();
      const limit = (p.permissibleLimit || '').toLowerCase();
      return name.includes(q) || method.includes(q) || unit.includes(q) || limit.includes(q);
    });
  }, [parameters, searchTerm]);

  // Toggle selection for a single parameter
  const toggleSelect = (paramId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(paramId)) {
        next.delete(paramId);
      } else {
        next.add(paramId);
      }
      return next;
    });
  };

  // Select all or deselect all visible
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredParameters.length && filteredParameters.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParameters.map(p => p.id)));
    }
  };

  // Submit selected parameters
  const handleConfirmAdd = () => {
    const selectedList = parameters.filter(p => selectedIds.has(p.id));
    if (selectedList.length === 0) return;
    onAddParameters(selectedList);
    onClose();
  };

  if (!isOpen) return null;

  const isAllSelected = filteredParameters.length > 0 && selectedIds.size === filteredParameters.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}
            >
              <FaFlask />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Select Parameters from Database
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                Choose parameters configured in Parameter Master for this company to add to the report.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <FaSearch
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search parameters by name, reference method, unit, or limit..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={filteredParameters.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: filteredParameters.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isAllSelected ? <FaCheckSquare style={{ color: '#047857' }} /> : <FaSquare style={{ color: '#94a3b8' }} />}
            <span>{isAllSelected ? 'Deselect All' : 'Select All Filtered'}</span>
          </button>
        </div>

        {/* Modal Body: Parameter Table */}
        <div style={{ padding: '1rem 1.75rem', flex: 1, overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            >
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
              <FaSpinner className="fa-spin" style={{ fontSize: '1.75rem', color: '#047857', marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading company parameters...</p>
            </div>
          ) : filteredParameters.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}
            >
              <FaFlask style={{ fontSize: '2.25rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontSize: '1rem' }}>No Parameters Found</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                {searchTerm
                  ? 'No parameters matched your search term.'
                  : 'No parameters found for this company in Parameter Master.'}
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 0.85rem', width: '40px', textAlign: 'center' }}></th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>PARAMETER NAME</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>REFERENCE METHOD</th>
                    <th style={{ padding: '0.65rem 0.85rem', width: '90px' }}>UNIT</th>
                    <th style={{ padding: '0.65rem 0.85rem', width: '130px' }}>PERMISSIBLE LIMIT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParameters.map((param) => {
                    const isSelected = selectedIds.has(param.id);
                    const isLimitApp = param.isPermissibleLimitApplicable === true;
                    const limitVal = isLimitApp ? (param.permissibleLimit || 'Applicable') : (param.permissibleLimit || '-');

                    return (
                      <tr
                        key={param.id}
                        onClick={() => toggleSelect(param.id)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: isSelected ? '#ecfdf5' : '#ffffff',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(param.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', accentColor: '#047857' }}
                          />
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                          {sanitizeSamplingParamName(param.parameterName)}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                          {param.testMethod || param.referenceStandard || '-'}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>
                          {param.unit || '-'}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#334155' }}>
                          {limitVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
            {selectedIds.size} of {filteredParameters.length} parameter(s) selected
          </span>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={selectedIds.size === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: selectedIds.size === 0 ? '#94a3b8' : '#047857',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedIds.size === 0 ? 'none' : '0 2px 4px rgba(4, 120, 87, 0.25)'
              }}
            >
              <FaPlus size={11} />
              <span>Add Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterSelectionModal;

