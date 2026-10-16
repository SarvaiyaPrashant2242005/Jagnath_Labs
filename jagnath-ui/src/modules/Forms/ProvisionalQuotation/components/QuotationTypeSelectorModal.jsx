/**
 * @file QuotationTypeSelectorModal.jsx
 * @description Accessible modal for selecting the quotation type when creating a new quotation.
 * Supports keyboard navigation (Esc to close, Enter to select, Arrow keys/Tab to toggle).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaFlask,
  FaCheck,
  FaArrowRight
} from 'react-icons/fa';

export const QuotationTypeSelectorModal = ({ isOpen, onClose, onSelect }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('general');
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedType('general_testing');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedType('general');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm(selectedType);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const handleConfirm = (type) => {
    if (onSelect) {
      onSelect(type);
    } else {
      if (type === 'general_testing') {
        navigate('/quotations/provisional/add?type=general_testing');
      } else {
        navigate('/quotations/provisional/add?type=general');
      }
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop-custom"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quotation-type-modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content-custom"
        style={{ maxWidth: '640px', padding: '0', borderRadius: '14px', overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div
          className="modal-header-custom"
          style={{
            padding: '1.15rem 1.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderBottom: 'none'
          }}
        >
          <div>
            <h4
              id="quotation-type-modal-title"
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaFileInvoiceDollar style={{ color: '#38bdf8' }} /> Create New Quotation
            </h4>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Select the quotation workflow that best matches your client proposal
            </span>
          </div>
          <button
            type="button"
            className="btn-close-custom"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body: Two Selectable Option Cards */}
        <div style={{ padding: '1.5rem', background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Option 1: General Quotation */}
            <div
              tabIndex={0}
              role="button"
              aria-pressed={selectedType === 'general'}
              onClick={() => setSelectedType('general')}
              onDoubleClick={() => handleConfirm('general')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.15rem',
                borderRadius: '10px',
                border: selectedType === 'general' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                background: selectedType === 'general' ? '#f0f9ff' : '#ffffff',
                boxShadow: selectedType === 'general' ? '0 4px 12px rgba(2, 132, 199, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: selectedType === 'general' ? '#0284c7' : '#e0f2fe',
                  color: selectedType === 'general' ? '#ffffff' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}
              >
                <FaFileInvoiceDollar />
              </div>

              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    1. General Quotation
                  </h5>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#166534'
                    }}
                  >
                    Environmental Audit
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                  Full multi-step audit proposal as per GPCB guidelines, including Logistics (Annexure-I), Sampling Activities (Annexure-A), and Detailed Parameters (Annexure-B).
                </p>
              </div>

              {selectedType === 'general' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}
                >
                  <FaCheck />
                </div>
              )}
            </div>

            {/* Option 2: General Testing / Consulting Quotation */}
            <div
              tabIndex={0}
              role="button"
              aria-pressed={selectedType === 'general_testing'}
              onClick={() => setSelectedType('general_testing')}
              onDoubleClick={() => handleConfirm('general_testing')}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.15rem',
                borderRadius: '10px',
                border: selectedType === 'general_testing' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                background: selectedType === 'general_testing' ? '#f0fdf4' : '#ffffff',
                boxShadow: selectedType === 'general_testing' ? '0 4px 12px rgba(5, 150, 105, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: selectedType === 'general_testing' ? '#059669' : '#dcfce7',
                  color: selectedType === 'general_testing' ? '#ffffff' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}
              >
                <FaFlask />
              </div>

              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    2. General Testing / Consulting Quotation
                  </h5>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#e0f2fe',
                      color: '#0369a1'
                    }}
                  >
                    Lab Testing &amp; Consulting
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                  Commercial proposal with real-time live preview, bundled test charges per sample, turnaround times, sample requirements, compliance clauses, and bank details.
                </p>
              </div>

              {selectedType === 'general_testing' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}
                >
                  <FaCheck />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Tip: Use arrow keys &amp; Enter, or Esc to close
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm font-semibold"
              style={{
                background: selectedType === 'general_testing' ? '#059669' : '#0284c7',
                borderColor: selectedType === 'general_testing' ? '#059669' : '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => handleConfirm(selectedType)}
            >
              Continue <FaArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationTypeSelectorModal;
