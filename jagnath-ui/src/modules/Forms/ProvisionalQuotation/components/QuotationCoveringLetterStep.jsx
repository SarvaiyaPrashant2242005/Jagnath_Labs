/**
 * @file QuotationCoveringLetterStep.jsx
 * @description Step 3: Covering Letter & Introduction editor.
 */

import React from 'react';
import { FaEnvelopeOpenText, FaUndo, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { DEFAULT_INTRO_TEXT } from '../services/provisionalQuotationStorage.service';

const QuotationCoveringLetterStep = ({ formData, setFormData }) => {
  const handleResetDefault = () => {
    if (window.confirm('Reset covering letter to standard Jagnath Labs accreditation text?')) {
      setFormData(prev => ({
        ...prev,
        introText: DEFAULT_INTRO_TEXT,
      }));
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <h3 className="step-title">
          <FaEnvelopeOpenText className="step-icon text-primary" /> Step 3: Covering Letter & Introduction
        </h3>
        <p className="step-subtitle">
          Customize the official introductory letter, environmental accreditation statement (NABL / ISO 17025 / GPCB), and proposal subject.
        </p>
      </div>

      <div className="form-group mb-4">
        <label className="form-label required">Quotation Subject</label>
        <input
          type="text"
          name="subject"
          value={formData.subject || ''}
          onChange={handleFieldChange}
          placeholder="e.g. Submission of Provisional Estimated Quotation for Environmental Audit (2026-27)"
          className="form-control font-semibold text-dark"
          required
        />
      </div>

      <div className="form-group">
        <div className="d-flex justify-between align-center mb-2">
          <label className="form-label mb-0 required">
            Covering Letter & Accreditation Body Text
          </label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleResetDefault}
              title="Reset to default company template"
            >
              <FaUndo /> Reset to Template
            </button>
          </div>
        </div>

        <textarea
          name="introText"
          rows={12}
          value={formData.introText || ''}
          onChange={handleFieldChange}
          placeholder="Enter covering letter text..."
          className="form-control text-content-area"
          style={{ lineHeight: 1.6, fontSize: '0.92rem' }}
          required
        />
      </div>

      <div className="alert-info-box mt-3">
        <FaInfoCircle />
        <span>
          <strong>Pro-Tip:</strong> The covering letter will be formatted on Page 1 of the official quotation document, featuring your company letterhead and authorized signatory block.
        </span>
      </div>
    </div>
  );
};

export default QuotationCoveringLetterStep;
