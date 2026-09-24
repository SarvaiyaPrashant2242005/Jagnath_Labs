/**
 * @file QuotationAnnexureIStep.jsx
 * @description Step 5: Main Charges & Annexure-I (Audit Fee, Transportation Modes, DA, Accommodation).
 * All calculations are dynamic and transparent with live formula indicators.
 */

import React from 'react';
import {
  FaCar, FaUserTie, FaHotel, FaFileInvoiceDollar, FaPlus,
  FaTrash, FaCalculator, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import {
  calculateTransport,
  calculateDA,
  calculateAccommodation,
  calculateAnnexureI,
  calculateMainCharges,
} from '../utils/quotationCalculation.utils';

const QuotationAnnexureIStep = ({ formData, setFormData }) => {
  const annexureI = formData.annexureI || {};
  const transport = annexureI.transport || { mode: 'STATIC', ratePerDay: 5000, days: 4, visits: 3, dynamicRows: [] };
  const da = annexureI.da || { teamMembers: 4, daysPerVisit: 4, visits: 3, ratePerPersonPerDay: 520 };
  const accommodation = annexureI.accommodation || { rooms: 2, roomRate: 3000, nights: 3, visits: 3 };
  const mainCharges = Array.isArray(formData.mainCharges) ? formData.mainCharges : [];

  // 1. Audit Fee
  const handleAuditFeeChange = (val) => {
    const fee = parseFloat(val) || 0;
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        auditFee: fee,
      }
    }));
  };

  // 2. Transport Mode & Inputs
  const handleTransportModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          mode,
        }
      }
    }));
  };

  const handleStaticTransportChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          [field]: parseFloat(val) || 0,
        }
      }
    }));
  };

  const handleDynamicRowChange = (index, field, val) => {
    const updatedRows = [...(transport.dynamicRows || [])];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: field === 'vehicle' ? val : (parseFloat(val) || 0)
    };
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          dynamicRows: updatedRows,
        }
      }
    }));
  };

  const addDynamicTransportRow = () => {
    const newRow = {
      id: 'dyn_' + Date.now(),
      vehicle: 'Inspection Vehicle',
      distanceKm: 150,
      ratePerKm: 18,
      days: 3,
      visits: transport.visits || 3,
    };
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          dynamicRows: [...(transport.dynamicRows || []), newRow],
        }
      }
    }));
  };

  const deleteDynamicTransportRow = (index) => {
    const updatedRows = (transport.dynamicRows || []).filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        transport: {
          ...prev.annexureI.transport,
          dynamicRows: updatedRows,
        }
      }
    }));
  };

  // 3. DA Inputs
  const handleDAChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        da: {
          ...prev.annexureI.da,
          [field]: parseFloat(val) || 0,
        }
      }
    }));
  };

  // 4. Accommodation Inputs
  const handleAccChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      annexureI: {
        ...prev.annexureI,
        accommodation: {
          ...prev.annexureI.accommodation,
          [field]: parseFloat(val) || 0,
        }
      }
    }));
  };

  // 5. Main Charges Handlers
  const handleMainChargeChange = (index, field, val) => {
    const updated = [...mainCharges];
    updated[index] = {
      ...updated[index],
      [field]: ['qty', 'rate'].includes(field) ? (parseFloat(val) || 0) : val
    };
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(field === 'qty' ? val : updated[index].qty) || 0;
      const r = parseFloat(field === 'rate' ? val : updated[index].rate) || 0;
      updated[index].amount = Math.round(q * r);
    }
    setFormData(prev => ({ ...prev, mainCharges: updated }));
  };

  const addMainChargeRow = () => {
    const newRow = {
      id: 'mc_' + Date.now(),
      srNo: mainCharges.length + 1,
      description: 'Additional Environmental Compliance Service',
      calculationType: 'FIXED',
      qty: 1,
      unit: 'Job',
      rate: 10000,
      amount: 10000,
    };
    setFormData(prev => ({ ...prev, mainCharges: [...mainCharges, newRow] }));
  };

  const deleteMainChargeRow = (index) => {
    const updated = mainCharges.filter((_, i) => i !== index).map((row, idx) => ({ ...row, srNo: idx + 1 }));
    setFormData(prev => ({ ...prev, mainCharges: updated }));
  };

  // Calculated Totals
  const transportTotal = calculateTransport(transport);
  const daTotal = calculateDA(da);
  const accTotal = calculateAccommodation(accommodation);
  const annexureITotal = calculateAnnexureI(annexureI);
  const mainChargesTotal = calculateMainCharges(mainCharges);

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <h3 className="step-title">
          <FaCalculator className="step-icon text-primary" /> Step 5: Main Charges & Annexure-I (Site Logistics)
        </h3>
        <p className="step-subtitle">
          Configure Environment Audit fees, live vehicle transportation modes, Dearness Allowance (DA), and auditor hotel accommodation.
        </p>
      </div>

      {/* SECTION A: AUDIT FEE */}
      <div className="card-section mb-4">
        <div className="d-flex justify-between align-center mb-3">
          <h4 className="section-heading mb-0">
            <FaFileInvoiceDollar className="text-primary" /> A. Environment Audit Report Fee
          </h4>
          <span className="badge badge-primary font-bold text-base">
            ₹{Number(annexureI.auditFee || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">Audit Fee Amount (₹)</label>
            <input
              type="number"
              value={annexureI.auditFee || ''}
              onChange={(e) => handleAuditFeeChange(e.target.value)}
              placeholder="e.g. 25000"
              className="form-control font-semibold"
            />
          </div>
          <div className="form-group full-width-sm">
            <label className="form-label">Scale Preset Suggestions</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleAuditFeeChange(15000)}
              >
                Small Scale (₹15,000)
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleAuditFeeChange(20000)}
              >
                Medium Scale (₹20,000)
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleAuditFeeChange(25000)}
              >
                Large Scale (₹25,000)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: TRANSPORTATION */}
      <div className="card-section mb-4">
        <div className="d-flex justify-between align-center mb-3">
          <div>
            <h4 className="section-heading mb-0">
              <FaCar className="text-primary" /> B. Transportation Charges
            </h4>
            <small className="text-muted">Mode of transport for audit team and sampling instruments</small>
          </div>
          <span className="badge badge-info font-bold text-base">
            ₹{transportTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="mode-toggle-group mb-3">
          <label className="form-label mb-1 font-semibold d-block">Calculation Mode:</label>
          <div className="radio-pills">
            <button
              type="button"
              className={`pill-btn ${transport.mode === 'STATIC' ? 'active' : ''}`}
              onClick={() => handleTransportModeChange('STATIC')}
            >
              Static (Rate/Day × Days × Visits)
            </button>
            <button
              type="button"
              className={`pill-btn ${transport.mode === 'DYNAMIC' ? 'active' : ''}`}
              onClick={() => handleTransportModeChange('DYNAMIC')}
            >
              Dynamic (Vehicle Distance / KM Based)
            </button>
            <button
              type="button"
              className={`pill-btn ${transport.mode === 'CLIENT_PROVIDED' ? 'active' : ''}`}
              onClick={() => handleTransportModeChange('CLIENT_PROVIDED')}
            >
              Client Provided (NIL / ₹0)
            </button>
          </div>
        </div>

        {/* Mode Content */}
        {transport.mode === 'STATIC' && (
          <div className="bg-light p-3 rounded border">
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Rate / Day (₹)</label>
                <input
                  type="number"
                  value={transport.ratePerDay || ''}
                  onChange={(e) => handleStaticTransportChange('ratePerDay', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Days per Visit</label>
                <input
                  type="number"
                  value={transport.days || ''}
                  onChange={(e) => handleStaticTransportChange('days', e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Visits per Year</label>
                <input
                  type="number"
                  value={transport.visits || ''}
                  onChange={(e) => handleStaticTransportChange('visits', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="calculation-formula-box mt-2">
              <FaCalculator />
              <span>
                Calculation Formula: ₹{transport.ratePerDay || 0} (Rate/Day) × {transport.days || 0} (Days) × {transport.visits || 0} (Visits) = <strong>₹{transportTotal.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>
        )}

        {transport.mode === 'DYNAMIC' && (
          <div className="bg-light p-3 rounded border">
            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th>Vehicle / Resource</th>
                    <th style={{ width: '110px' }}>Distance (KM)</th>
                    <th style={{ width: '110px' }}>Rate / KM (₹)</th>
                    <th style={{ width: '90px' }}>Days</th>
                    <th style={{ width: '90px' }}>Visits</th>
                    <th style={{ width: '120px' }}>Subtotal (₹)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(transport.dynamicRows || []).map((row, idx) => {
                    const rowSub = (row.distanceKm || 0) * (row.ratePerKm || 0) * (row.days || 1) * (row.visits || 1);
                    return (
                      <tr key={row.id || idx}>
                        <td>
                          <input
                            type="text"
                            value={row.vehicle || ''}
                            onChange={(e) => handleDynamicRowChange(idx, 'vehicle', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.distanceKm || ''}
                            onChange={(e) => handleDynamicRowChange(idx, 'distanceKm', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.ratePerKm || ''}
                            onChange={(e) => handleDynamicRowChange(idx, 'ratePerKm', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.days || ''}
                            onChange={(e) => handleDynamicRowChange(idx, 'days', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.visits || ''}
                            onChange={(e) => handleDynamicRowChange(idx, 'visits', e.target.value)}
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td className="font-semibold text-right">
                          ₹{rowSub.toLocaleString('en-IN')}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-icon btn-xs btn-danger-soft"
                            onClick={() => deleteDynamicTransportRow(idx)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={addDynamicTransportRow}
            >
              <FaPlus /> Add Vehicle Option
            </button>
          </div>
        )}

        {transport.mode === 'CLIENT_PROVIDED' && (
          <div className="alert alert-success d-flex align-center gap-2 mb-0">
            <FaCheckCircle />
            <span>
              <strong>Client Provided:</strong> Transportation will be arranged directly by the client unit. Transportation charge is set to <strong>₹0 (NIL)</strong>.
            </span>
          </div>
        )}
      </div>

      {/* SECTION C: DEARNESS ALLOWANCE (DA) */}
      <div className="card-section mb-4">
        <div className="d-flex justify-between align-center mb-3">
          <div>
            <h4 className="section-heading mb-0">
              <FaUserTie className="text-primary" /> C. Dearness Allowance (DA)
            </h4>
            <small className="text-muted">Daily allowance for Class-1 cadre certified environmental audit officers</small>
          </div>
          <span className="badge badge-info font-bold text-base">
            ₹{daTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-light p-3 rounded border">
          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">Team Members</label>
              <input
                type="number"
                value={da.teamMembers || ''}
                onChange={(e) => handleDAChange('teamMembers', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Days per Visit</label>
              <input
                type="number"
                value={da.daysPerVisit || ''}
                onChange={(e) => handleDAChange('daysPerVisit', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Visits per Year</label>
              <input
                type="number"
                value={da.visits || ''}
                onChange={(e) => handleDAChange('visits', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rate / Person / Day (₹)</label>
              <input
                type="number"
                value={da.ratePerPersonPerDay || ''}
                onChange={(e) => handleDAChange('ratePerPersonPerDay', e.target.value)}
                className="form-control font-semibold"
              />
            </div>
          </div>

          <div className="calculation-formula-box mt-2">
            <FaCalculator />
            <span>
              Calculation: {da.teamMembers || 0} Persons × {da.daysPerVisit || 0} Days/Visit × {da.visits || 0} Visits × ₹{da.ratePerPersonPerDay || 0}/Day = <strong>₹{daTotal.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION D: ACCOMMODATION */}
      <div className="card-section mb-4">
        <div className="d-flex justify-between align-center mb-3">
          <div>
            <h4 className="section-heading mb-0">
              <FaHotel className="text-primary" /> D. Accommodation Charges
            </h4>
            <small className="text-muted">Hotel room accommodation for audit team during on-site visits</small>
          </div>
          <span className="badge badge-info font-bold text-base">
            ₹{accTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-light p-3 rounded border">
          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">Rooms</label>
              <input
                type="number"
                value={accommodation.rooms || ''}
                onChange={(e) => handleAccChange('rooms', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room Rate / Night (₹)</label>
              <input
                type="number"
                value={accommodation.roomRate || ''}
                onChange={(e) => handleAccChange('roomRate', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nights per Visit</label>
              <input
                type="number"
                value={accommodation.nights || ''}
                onChange={(e) => handleAccChange('nights', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Visits per Year</label>
              <input
                type="number"
                value={accommodation.visits || ''}
                onChange={(e) => handleAccChange('visits', e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="calculation-formula-box mt-2">
            <FaCalculator />
            <span>
              Calculation: {accommodation.rooms || 0} Rooms × ₹{accommodation.roomRate || 0}/Night × {accommodation.nights || 0} Nights × {accommodation.visits || 0} Visits = <strong>₹{accTotal.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SUMMARY OF ANNEXURE-I */}
      <div className="summary-banner p-3 rounded mb-4">
        <div className="d-flex justify-between align-center">
          <span className="font-bold text-base">Total Annexure-I (Site Logistics & Audit Fee):</span>
          <span className="font-extrabold text-xl text-primary">₹{annexureITotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* MAIN CHARGES TABLE (Other line items) */}
      <div className="card-section">
        <div className="d-flex justify-between align-center mb-3">
          <div>
            <h4 className="section-heading mb-0">
              <FaFileInvoiceDollar className="text-primary" /> Additional Main Charges Table
            </h4>
            <small className="text-muted">Primary itemized invoice charges listed on main quotation page</small>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={addMainChargeRow}
          >
            <FaPlus /> Add Charge Row
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr className="bg-slate-100">
                <th style={{ width: '60px' }}>Sr.</th>
                <th>Description</th>
                <th style={{ width: '120px' }}>Calc Type</th>
                <th style={{ width: '80px' }}>Qty</th>
                <th style={{ width: '100px' }}>Unit</th>
                <th style={{ width: '130px' }}>Rate (₹)</th>
                <th style={{ width: '140px' }}>Amount (₹)</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {mainCharges.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="text-center font-bold">{row.srNo || idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => handleMainChargeChange(idx, 'description', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <select
                      value={row.calculationType || 'FIXED'}
                      onChange={(e) => handleMainChargeChange(idx, 'calculationType', e.target.value)}
                      className="form-control form-control-sm"
                    >
                      <option value="FIXED">FIXED</option>
                      <option value="STATIC">STATIC</option>
                      <option value="DYNAMIC">DYNAMIC</option>
                      <option value="ACTUAL">ACTUAL</option>
                      <option value="ESTIMATED">ESTIMATED</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.qty || ''}
                      onChange={(e) => handleMainChargeChange(idx, 'qty', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.unit || ''}
                      onChange={(e) => handleMainChargeChange(idx, 'unit', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.rate || ''}
                      onChange={(e) => handleMainChargeChange(idx, 'rate', e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <td className="font-bold text-right">
                    ₹{Number(row.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-icon btn-xs btn-danger-soft"
                      onClick={() => deleteMainChargeRow(idx)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {mainCharges.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-3">
                    No additional main charges added. Click "Add Charge Row" above.
                  </td>
                </tr>
              )}
            </tbody>
            {mainCharges.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={6} className="text-right">Main Charges Subtotal:</td>
                  <td className="text-right text-primary">₹{mainChargesTotal.toLocaleString('en-IN')}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationAnnexureIStep;
