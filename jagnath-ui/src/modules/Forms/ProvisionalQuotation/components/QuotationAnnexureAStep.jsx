/**
 * @file QuotationAnnexureAStep.jsx
 * @description Step 6: Annexure-A (Sampling & Analysis Activities).
 * Dynamic activity table with multi-parameter association and flexible calculation types.
 */

import React, { useState } from 'react';
import {
  FaFlask, FaPlus, FaTrash, FaCalculator, FaListUl,
  FaCheckSquare, FaSquare, FaInfoCircle
} from 'react-icons/fa';
import { calculateActivity, calculateAnnexureA } from '../utils/quotationCalculation.utils';

const QuotationAnnexureAStep = ({ formData, setFormData, categories = [], parameters = [] }) => {
  const activities = Array.isArray(formData.activities) ? formData.activities : [];
  const [selectedActivityForParams, setSelectedActivityForParams] = useState(null);
  const [paramSearch, setParamSearch] = useState('');

  const handleActivityChange = (index, field, val) => {
    const updated = [...activities];
    updated[index] = {
      ...updated[index],
      [field]: ['ratePerSample', 'samplesPerVisit', 'visits', 'locations', 'fixedAmount', 'customAmount'].includes(field)
        ? (parseFloat(val) || 0)
        : val
    };
    setFormData(prev => ({ ...prev, activities: updated }));
  };

  const addActivity = (catName = '') => {
    const newAct = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      category: catName || (categories[0]?.name ? categories[0].name : 'Effluent Water Analysis'),
      description: 'Sampling and laboratory parameter testing',
      calculationType: 'PER_SAMPLE', // 'PER_SAMPLE', 'PER_VISIT', 'PER_LOCATION', 'FIXED', 'CUSTOM'
      ratePerSample: 1500,
      samplesPerVisit: 1,
      visits: formData.annexureI?.transport?.visits || 3,
      locations: 1,
      fixedAmount: 0,
      customAmount: 0,
      parameters: [], // Array of parameter objects or IDs
    };
    setFormData(prev => ({
      ...prev,
      activities: [...activities, newAct]
    }));
  };

  const deleteActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, activities: updated }));
    if (selectedActivityForParams === index) {
      setSelectedActivityForParams(null);
    }
  };

  // Toggle parameter assignment to activity
  const toggleParamForActivity = (actIndex, param) => {
    const act = activities[actIndex];
    if (!act) return;

    const currentParams = Array.isArray(act.parameters) ? act.parameters : [];
    const exists = currentParams.some(p => (typeof p === 'object' ? p.id === param.id : p === param.id));

    let updatedParams;
    if (exists) {
      updatedParams = currentParams.filter(p => (typeof p === 'object' ? p.id !== param.id : p !== param.id));
    } else {
      updatedParams = [...currentParams, param];
    }

    const updated = [...activities];
    updated[actIndex] = { ...act, parameters: updatedParams };
    setFormData(prev => ({ ...prev, activities: updated }));
  };

  const annexureATotal = calculateAnnexureA(activities);

  const filteredParams = parameters.filter(p => {
    const term = paramSearch.toLowerCase();
    return (
      (p.parameterName && p.parameterName.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.testMethod && p.testMethod.toLowerCase().includes(term))
    );
  });

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <div className="d-flex justify-between align-center">
          <div>
            <h3 className="step-title">
              <FaFlask className="step-icon text-primary" /> Step 6: Annexure-A (Sampling & Analysis Charges)
            </h3>
            <p className="step-subtitle">
              Configure sampling activities, samples per visit, testing rates, and associate laboratory parameters for Annexure-B.
            </p>
          </div>
          <span className="badge badge-primary font-bold text-lg">
            Total Annexure-A: ₹{annexureATotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Quick Add from Categories */}
      {categories.length > 0 && (
        <div className="quick-category-picker mb-3 p-3 bg-light rounded border">
          <label className="form-label font-semibold mb-2">Quick Add Activity from Real Categories:</label>
          <div className="d-flex gap-2 flex-wrap">
            {categories.slice(0, 8).map(c => (
              <button
                key={c.id}
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => addActivity(c.name)}
              >
                <FaPlus size={11} /> {c.name}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => addActivity('')}
            >
              <FaPlus size={11} /> Add Custom Activity
            </button>
          </div>
        </div>
      )}

      {/* Activities Table */}
      <div className="table-responsive mb-4">
        <table className="table table-bordered align-middle">
          <thead>
            <tr className="bg-slate-100">
              <th style={{ width: '50px' }}>Sr.</th>
              <th>Activity / Category Name</th>
              <th style={{ width: '130px' }}>Calc Type</th>
              <th style={{ width: '110px' }}>Rate (₹)</th>
              <th style={{ width: '90px' }}>Samples/Visit</th>
              <th style={{ width: '80px' }}>Visits</th>
              <th style={{ width: '80px' }}>Locations</th>
              <th style={{ width: '130px' }}>Total (₹)</th>
              <th style={{ width: '130px' }}>Parameters</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, idx) => {
              const actTotal = calculateActivity(act);
              const paramCount = Array.isArray(act.parameters) ? act.parameters.length : 0;
              const isSelected = selectedActivityForParams === idx;

              return (
                <tr key={act.id || idx} className={isSelected ? 'bg-primary-soft' : ''}>
                  <td className="text-center font-bold">{idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={act.category || ''}
                      onChange={(e) => handleActivityChange(idx, 'category', e.target.value)}
                      placeholder="Activity / Matrix Name"
                      className="form-control form-control-sm font-semibold mb-1"
                    />
                    <input
                      type="text"
                      value={act.description || ''}
                      onChange={(e) => handleActivityChange(idx, 'description', e.target.value)}
                      placeholder="Description / notes"
                      className="form-control form-control-xs text-muted"
                    />
                  </td>
                  <td>
                    <select
                      value={act.calculationType || 'PER_SAMPLE'}
                      onChange={(e) => handleActivityChange(idx, 'calculationType', e.target.value)}
                      className="form-control form-control-sm"
                    >
                      <option value="PER_SAMPLE">Per Sample</option>
                      <option value="PER_VISIT">Per Visit</option>
                      <option value="PER_LOCATION">Per Location</option>
                      <option value="FIXED">Fixed Amount</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={act.ratePerSample || ''}
                      onChange={(e) => handleActivityChange(idx, 'ratePerSample', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={act.samplesPerVisit || ''}
                      disabled={act.calculationType === 'FIXED' || act.calculationType === 'PER_VISIT'}
                      onChange={(e) => handleActivityChange(idx, 'samplesPerVisit', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={act.visits || ''}
                      disabled={act.calculationType === 'FIXED'}
                      onChange={(e) => handleActivityChange(idx, 'visits', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={act.locations || ''}
                      disabled={act.calculationType !== 'PER_LOCATION'}
                      onChange={(e) => handleActivityChange(idx, 'locations', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td className="font-bold text-right text-primary">
                    ₹{actTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedActivityForParams(isSelected ? null : idx)}
                    >
                      <FaListUl /> {paramCount} Params
                    </button>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-icon btn-xs btn-danger-soft"
                      onClick={() => deleteActivity(idx)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
            {activities.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-muted py-4">
                  No sampling activities added to Annexure-A. Click "Add Custom Activity" or pick a category above.
                </td>
              </tr>
            )}
          </tbody>
          {activities.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={7} className="text-right">Annexure-A Subtotal (Sampling & Analysis):</td>
                <td className="text-right text-primary">₹{annexureATotal.toLocaleString('en-IN')}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* PARAMETER SELECTION MODAL / DRAWER PANEL */}
      {selectedActivityForParams !== null && activities[selectedActivityForParams] && (
        <div className="card-sub-section border-primary mt-3">
          <div className="d-flex justify-between align-center mb-3">
            <div>
              <h4 className="sub-section-title mb-0">
                <FaFlask /> Associate Parameters for: <strong>{activities[selectedActivityForParams].category}</strong>
              </h4>
              <small className="text-muted">
                Selecting parameters here links them to this activity and automatically builds Annexure-B (Parameter Rate Card).
              </small>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setSelectedActivityForParams(null)}
            >
              Done / Close
            </button>
          </div>

          <div className="form-group mb-3">
            <input
              type="text"
              placeholder="Search parameters by name or test method..."
              value={paramSearch}
              onChange={(e) => setParamSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="parameter-selector-grid">
            {filteredParams.map(param => {
              const currentParams = activities[selectedActivityForParams].parameters || [];
              const isChecked = currentParams.some(p => (typeof p === 'object' ? p.id === param.id : p === param.id));

              return (
                <div
                  key={param.id}
                  className={`param-checkbox-card ${isChecked ? 'selected' : ''}`}
                  onClick={() => toggleParamForActivity(selectedActivityForParams, param)}
                >
                  <div className="d-flex align-center gap-2">
                    {isChecked ? <FaCheckSquare className="text-primary" /> : <FaSquare className="text-muted" />}
                    <div>
                      <span className="param-name font-semibold d-block">
                        {param.parameterName || param.name}
                      </span>
                      <small className="text-muted d-block">
                        Method: {param.testMethod || '-'} | Unit: {param.unit || '-'} | Rate: ₹{param.price || 0}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredParams.length === 0 && (
              <div className="col-span-full text-center text-muted py-3">
                No matching parameters found in Parameter Master.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationAnnexureAStep;
