/**
 * @file QuotationAnnexureBStep.jsx
 * @description Step 7: Annexure-B (Parameter-wise Rate Card & Rate Override).
 * Automatically derived from Annexure-A activities with support for quotation-specific rate overrides.
 */

import React, { useMemo } from 'react';
import { FaTable, FaEdit, FaCheckCircle, FaUndo, FaInfoCircle } from 'react-icons/fa';
import { generateAnnexureB } from '../utils/quotationCalculation.utils';

const QuotationAnnexureBStep = ({ formData, setFormData, allParameters = [] }) => {
  const activities = Array.isArray(formData.activities) ? formData.activities : [];
  const rateOverrides = formData.rateOverrides || {};

  // Dynamically generate Annexure-B list from selected activities
  const annexureBList = useMemo(() => {
    return generateAnnexureB(activities, allParameters, rateOverrides);
  }, [activities, allParameters, rateOverrides]);

  const handleRateOverrideToggle = (uniqueKey, masterRate) => {
    const current = rateOverrides[uniqueKey];
    if (current && current.isOverridden) {
      // Revert to master rate
      const updated = { ...rateOverrides };
      delete updated[uniqueKey];
      setFormData(prev => ({ ...prev, rateOverrides: updated }));
    } else {
      // Enable override
      setFormData(prev => ({
        ...prev,
        rateOverrides: {
          ...prev.rateOverrides,
          [uniqueKey]: {
            isOverridden: true,
            rate: masterRate,
          }
        }
      }));
    }
  };

  const handleRateValueChange = (uniqueKey, val) => {
    const num = parseFloat(val) || 0;
    setFormData(prev => ({
      ...prev,
      rateOverrides: {
        ...prev.rateOverrides,
        [uniqueKey]: {
          isOverridden: true,
          rate: num,
        }
      }
    }));
  };

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <div className="d-flex justify-between align-center">
          <div>
            <h3 className="step-title">
              <FaTable className="step-icon text-primary" /> Step 7: Annexure-B (Parameter-Wise Rate Card)
            </h3>
            <p className="step-subtitle">
              Dynamic rate schedule automatically populated from Annexure-A activities. Override specific test rates for this quotation if negotiated.
            </p>
          </div>
          <span className="badge badge-info font-bold text-base">
            {annexureBList.length} Testing Parameters Listed
          </span>
        </div>
      </div>

      {annexureBList.length === 0 ? (
        <div className="alert-warning-box text-center py-5">
          <FaInfoCircle size={28} className="mb-2 text-warning" />
          <h4 className="font-bold">No Parameters Selected in Annexure-A</h4>
          <p className="text-muted mb-0">
            Go back to Step 6 (Annexure-A) and click on the <strong>"Params"</strong> button next to any activity to associate test parameters. Annexure-B will auto-populate here.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr className="bg-slate-100">
                <th style={{ width: '50px' }}>Sr.</th>
                <th>Activity / Matrix</th>
                <th>Parameter Name</th>
                <th style={{ width: '160px' }}>Test Method</th>
                <th style={{ width: '90px' }}>Unit</th>
                <th style={{ width: '120px' }}>Master Rate (₹)</th>
                <th style={{ width: '160px' }}>Quotation Rate (₹)</th>
                <th style={{ width: '150px' }}>Override Mode</th>
              </tr>
            </thead>
            <tbody>
              {annexureBList.map((item, idx) => {
                const isOverridden = item.isOverridden;

                return (
                  <tr key={item.uniqueKey || idx} className={isOverridden ? 'bg-amber-soft' : ''}>
                    <td className="text-center font-bold">{idx + 1}</td>
                    <td className="font-semibold text-slate-700">{item.activityName}</td>
                    <td className="font-bold text-primary">{item.parameterName}</td>
                    <td>{item.testMethod || '-'}</td>
                    <td>{item.unit || '-'}</td>
                    <td className="text-right text-muted">₹{item.masterRate.toLocaleString('en-IN')}</td>
                    <td className="text-right">
                      {isOverridden ? (
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-amber-200">₹</span>
                          <input
                            type="number"
                            value={item.quotationRate}
                            onChange={(e) => handleRateValueChange(item.uniqueKey, e.target.value)}
                            className="form-control form-control-sm font-bold border-amber-400"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-dark">₹{item.quotationRate.toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        className={`btn btn-xs ${isOverridden ? 'btn-warning' : 'btn-outline-secondary'}`}
                        onClick={() => handleRateOverrideToggle(item.uniqueKey, item.masterRate)}
                      >
                        {isOverridden ? (
                          <>
                            <FaUndo /> Revert Master
                          </>
                        ) : (
                          <>
                            <FaEdit /> Override Rate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="alert-info-box mt-3">
        <FaInfoCircle />
        <span>
          <strong>Snapshot Safety:</strong> Overriding parameter rates here applies strictly to this Provisional Quotation and does not alter the global Parameter Master rate cards.
        </span>
      </div>
    </div>
  );
};

export default QuotationAnnexureBStep;
