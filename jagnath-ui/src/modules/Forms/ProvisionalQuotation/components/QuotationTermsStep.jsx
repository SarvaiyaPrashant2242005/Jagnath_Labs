/**
 * @file QuotationTermsStep.jsx
 * @description Step 8: Terms & Conditions editor with reordering and dynamic addition.
 */

import React, { useState } from 'react';
import { FaGavel, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaUndo } from 'react-icons/fa';
import { DEFAULT_TERMS_ITEMS } from '../services/provisionalQuotationStorage.service';

const QuotationTermsStep = ({ formData, setFormData }) => {
  const [newTermText, setNewTermText] = useState('');
  const termsItems = Array.isArray(formData.termsItems) ? formData.termsItems : [];

  const handleTermChange = (index, value) => {
    const updated = [...termsItems];
    updated[index] = value;
    setFormData(prev => ({ ...prev, termsItems: updated }));
  };

  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setFormData(prev => ({
      ...prev,
      termsItems: [...termsItems, newTermText.trim()],
    }));
    setNewTermText('');
  };

  const handleDeleteTerm = (index) => {
    const updated = termsItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, termsItems: updated }));
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= termsItems.length) return;
    const updated = [...termsItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFormData(prev => ({ ...prev, termsItems: updated }));
  };

  const handleResetTerms = () => {
    if (window.confirm('Reset terms & conditions to standard 10 legal clauses?')) {
      setFormData(prev => ({
        ...prev,
        termsItems: [...DEFAULT_TERMS_ITEMS],
      }));
    }
  };

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <div className="d-flex justify-between align-center">
          <div>
            <h3 className="step-title">
              <FaGavel className="step-icon text-primary" /> Step 8: Terms & Conditions
            </h3>
            <p className="step-subtitle">
              Manage commercial terms, RTGS/NEFT payment rules, advance billing percentages, and hospitality requirements.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleResetTerms}
          >
            <FaUndo /> Reset to Default
          </button>
        </div>
      </div>

      {/* Terms List */}
      <div className="scope-list-wrapper">
        {termsItems.map((item, index) => (
          <div key={index} className="scope-item-row">
            <span className="scope-item-number">{index + 1}.</span>
            <div className="scope-item-content">
              <textarea
                rows={2}
                value={item}
                onChange={(e) => handleTermChange(index, e.target.value)}
                className="form-control"
              />
            </div>
            <div className="scope-item-actions">
              <button
                type="button"
                className="btn btn-icon btn-sm"
                title="Move Up"
                disabled={index === 0}
                onClick={() => handleMove(index, -1)}
              >
                <FaArrowUp />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                title="Move Down"
                disabled={index === termsItems.length - 1}
                onClick={() => handleMove(index, 1)}
              >
                <FaArrowDown />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm btn-danger-soft"
                title="Delete Term"
                onClick={() => handleDeleteTerm(index)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Term */}
      <div className="card-add-box mt-3">
        <label className="form-label font-semibold">Add Custom Term Clause</label>
        <div className="d-flex gap-2">
          <input
            type="text"
            value={newTermText}
            onChange={(e) => setNewTermText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTerm(); } }}
            placeholder="Type new commercial or legal clause and click Add..."
            className="form-control"
          />
          <button
            type="button"
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={handleAddTerm}
          >
            <FaPlus /> Add Term
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationTermsStep;
