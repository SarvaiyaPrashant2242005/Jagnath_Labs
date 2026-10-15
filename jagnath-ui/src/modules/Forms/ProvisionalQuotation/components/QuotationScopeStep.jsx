/**
 * @file QuotationScopeStep.jsx
 * @description Step 4: Scope of Work editor with reordering and dynamic point management.
 */

import React, { useState } from 'react';
import { FaTasks, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaUndo } from 'react-icons/fa';
import { DEFAULT_SCOPE_ITEMS } from '../services/provisionalQuotationStorage.service';

const QuotationScopeStep = ({ formData, setFormData }) => {
  const [newPointText, setNewPointText] = useState('');

  const scopeItems = Array.isArray(formData.scopeItems) ? formData.scopeItems : [];

  const handlePointChange = (index, value) => {
    const updated = [...scopeItems];
    updated[index] = value;
    setFormData(prev => ({ ...prev, scopeItems: updated }));
  };

  const handleAddPoint = () => {
    if (!newPointText.trim()) return;
    setFormData(prev => ({
      ...prev,
      scopeItems: [...scopeItems, newPointText.trim()],
    }));
    setNewPointText('');
  };

  const handleDeletePoint = (index) => {
    const updated = scopeItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, scopeItems: updated }));
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= scopeItems.length) return;
    const updated = [...scopeItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setFormData(prev => ({ ...prev, scopeItems: updated }));
  };

  const handleResetScope = () => {
    if (window.confirm('Reset scope of work to standard 6 points?')) {
      setFormData(prev => ({
        ...prev,
        scopeItems: [...DEFAULT_SCOPE_ITEMS],
      }));
    }
  };

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <div className="d-flex justify-between align-center">
          <div>
            <h3 className="step-title">
              <FaTasks className="step-icon text-primary" /> Step 4: Scope of Work
            </h3>
            <p className="step-subtitle">
              Define regulatory compliance guidelines (GPCB/CPCB/MoEF&CC), collection procedures, and audit scope conditions.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleResetScope}
          >
            <FaUndo /> Reset to Default
          </button>
        </div>
      </div>

      {/* Scope Items List */}
      <div className="scope-list-wrapper">
        {scopeItems.map((item, index) => (
          <div key={index} className="scope-item-row">
            <span className="scope-item-number">{index + 1}.</span>
            <div className="scope-item-content">
              <textarea
                rows={2}
                value={item}
                onChange={(e) => handlePointChange(index, e.target.value)}
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
                disabled={index === scopeItems.length - 1}
                onClick={() => handleMove(index, 1)}
              >
                <FaArrowDown />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm btn-danger-soft"
                title="Delete Point"
                onClick={() => handleDeletePoint(index)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Scope Point */}
      <div className="card-add-box mt-3">
        <label className="form-label font-semibold">Add Custom Scope Point</label>
        <div className="d-flex gap-2">
          <input
            type="text"
            value={newPointText}
            onChange={(e) => setNewPointText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPoint(); } }}
            placeholder="Type new scope clause and click Add..."
            className="form-control"
          />
          <button
            type="button"
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={handleAddPoint}
          >
            <FaPlus /> Add Scope Point
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationScopeStep;
