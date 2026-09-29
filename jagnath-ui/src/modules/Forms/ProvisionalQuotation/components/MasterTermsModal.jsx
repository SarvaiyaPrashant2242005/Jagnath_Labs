/**
 * @file MasterTermsModal.jsx
 * @description Modal for configuring central default Terms & Conditions for General Testing quotations.
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUndo, FaCog, FaCheckCircle } from 'react-icons/fa';
import {
  DEFAULT_GENERAL_TESTING_TERMS,
  getGeneralTestingMasterTerms,
  saveGeneralTestingMasterTerms
} from '../services/provisionalQuotationStorage.service';

const MasterTermsModal = ({ isOpen, onClose, onSaved }) => {
  const [terms, setTerms] = useState({ ...DEFAULT_GENERAL_TESTING_TERMS });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTerms(getGeneralTestingMasterTerms());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetToFactory = () => {
    if (window.confirm('Reset all Master Terms to original factory defaults? This cannot be undone.')) {
      setTerms({ ...DEFAULT_GENERAL_TESTING_TERMS });
    }
  };

  const handleSave = () => {
    saveGeneralTestingMasterTerms(terms);
    setSavedSuccess(true);
    if (onSaved) onSaved(terms);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0f172a',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FaCog className="text-emerald-400" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              Manage Master Default Terms — General Testing / Consulting
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', flexGrow: 1 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#166534' }}>
            💡 Changes saved here become the automatic pre-filled defaults for all newly created <strong>General Testing / Consulting</strong> quotations.
          </div>

          {/* Core Numeric & Quick Text Configurations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label font-bold text-xs">Default Quotation Validity (Days)</label>
              <input
                type="number"
                value={terms.validityDays || 30}
                onChange={(e) => handleChange('validityDays', parseInt(e.target.value, 10) || 30)}
                className="form-control font-bold"
              />
            </div>
            <div>
              <label className="form-label font-bold text-xs">Overdue Annual Interest (%)</label>
              <input
                type="number"
                value={terms.overdueInterestPercent || 24}
                onChange={(e) => handleChange('overdueInterestPercent', parseFloat(e.target.value) || 24)}
                className="form-control font-bold"
              />
            </div>
            <div>
              <label className="form-label font-bold text-xs">Default GST Rate (%)</label>
              <input
                type="number"
                value={terms.gstPercent || 18}
                onChange={(e) => handleChange('gstPercent', parseFloat(e.target.value) || 18)}
                className="form-control font-bold"
              />
            </div>
          </div>

          {/* TAT & Sample Requirements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label font-bold text-xs">Default Turnaround Time (TAT) Text</label>
              <input
                type="text"
                value={terms.tatText || ''}
                onChange={(e) => handleChange('tatText', e.target.value)}
                className="form-control font-medium"
              />
            </div>
            <div>
              <label className="form-label font-bold text-xs">Default GST Note Text</label>
              <input
                type="text"
                value={terms.gstNote || ''}
                onChange={(e) => handleChange('gstNote', e.target.value)}
                className="form-control font-medium"
              />
            </div>
          </div>

          {/* Sample Requirements Note Box */}
          <div>
            <label className="form-label font-bold text-xs">Sample Requirement Notes (Page 1 Table Note)</label>
            <textarea
              rows={3}
              value={terms.sampleRequirementsText || ''}
              onChange={(e) => handleChange('sampleRequirementsText', e.target.value)}
              className="form-control font-medium text-xs"
            />
          </div>

          {/* Page 1 Clauses */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              📄 Page 1 Clauses
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label font-semibold text-xs">1. Validity of Quotation</label>
                <textarea
                  rows={3}
                  value={terms.p1_validity || ''}
                  onChange={(e) => handleChange('p1_validity', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">2. Payment Terms</label>
                <textarea
                  rows={5}
                  value={terms.p1_payment || ''}
                  onChange={(e) => handleChange('p1_payment', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
            </div>
          </div>

          {/* Page 2 Clauses */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              📄 Page 2 Clauses (Sampling, Handling, Compliance)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label font-semibold text-xs">3. Sampling Conditions</label>
                <textarea
                  rows={3}
                  value={terms.p2_samplingConditions || ''}
                  onChange={(e) => handleChange('p2_samplingConditions', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">4. Sample Handling & Disposal</label>
                <textarea
                  rows={3}
                  value={terms.p2_sampleHandling || ''}
                  onChange={(e) => handleChange('p2_sampleHandling', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">5. Suspension of Work</label>
                <textarea
                  rows={3}
                  value={terms.p2_suspensionOfWork || ''}
                  onChange={(e) => handleChange('p2_suspensionOfWork', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">6. Invoicing & Reports</label>
                <textarea
                  rows={3}
                  value={terms.p2_invoicingReports || ''}
                  onChange={(e) => handleChange('p2_invoicingReports', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
            </div>

            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginTop: '1rem', marginBottom: '0.5rem' }}>
              Management System Compliance Clauses
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label font-semibold text-xs">1. Confidentiality & Impartiality</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_confidentiality || ''}
                  onChange={(e) => handleChange('p2_compliance_confidentiality', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">2. Test Methods</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_testMethods || ''}
                  onChange={(e) => handleChange('p2_compliance_testMethods', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">3. External Service Providers</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_externalProviders || ''}
                  onChange={(e) => handleChange('p2_compliance_externalProviders', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">4. Statement of Conformity</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_conformity || ''}
                  onChange={(e) => handleChange('p2_compliance_conformity', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">5. Customer Cooperation</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_customerCooperation || ''}
                  onChange={(e) => handleChange('p2_compliance_customerCooperation', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div>
                <label className="form-label font-semibold text-xs">6. Delivery & Acceptance</label>
                <textarea
                  rows={3}
                  value={terms.p2_compliance_deliveryAcceptance || ''}
                  onChange={(e) => handleChange('p2_compliance_deliveryAcceptance', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
            </div>
          </div>

          {/* Page 3 Clauses */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              📄 Page 3 Clauses (Decision Rules, Continuation & Disposal)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label font-semibold text-xs">Continuation / Non-Conforming Disclaimer</label>
                <textarea
                  rows={3}
                  value={terms.p3_continuationClause || ''}
                  onChange={(e) => handleChange('p3_continuationClause', e.target.value)}
                  className="form-control text-xs"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label font-semibold text-xs">7. Sample Disposal</label>
                  <textarea
                    rows={3}
                    value={terms.p3_sampleDisposal || ''}
                    onChange={(e) => handleChange('p3_sampleDisposal', e.target.value)}
                    className="form-control text-xs"
                  />
                </div>
                <div>
                  <label className="form-label font-semibold text-xs">8. Decision Rule Application</label>
                  <textarea
                    rows={3}
                    value={terms.p3_decisionRule || ''}
                    onChange={(e) => handleChange('p3_decisionRule', e.target.value)}
                    className="form-control text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={handleResetToFactory}
            className="btn btn-outline-secondary font-semibold text-xs"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FaUndo /> Reset to Default Template
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {savedSuccess && (
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FaCheckCircle /> Saved Successfully!
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-secondary font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary font-bold"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', borderColor: '#22c55e' }}
            >
              <FaSave /> Save Master Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterTermsModal;
