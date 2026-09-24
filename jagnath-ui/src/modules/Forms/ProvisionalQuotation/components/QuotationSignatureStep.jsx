/**
 * @file QuotationSignatureStep.jsx
 * @description Step 9: Authorized Signatures, Company Seal, Discount, and Final Tax Calculation.
 */

import React, { useRef } from 'react';
import {
  FaSignature, FaStamp, FaUpload, FaPercent,
  FaCalculator, FaTrash, FaCheckCircle
} from 'react-icons/fa';
import {
  calculateMainCharges,
  calculateAnnexureI,
  calculateAnnexureA,
  calculateSubtotal,
  calculateGST,
  calculateGrandTotal,
} from '../utils/quotationCalculation.utils';

const QuotationSignatureStep = ({ formData, setFormData, company = {} }) => {
  const sigInputRef = useRef();
  const stampInputRef = useRef();

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['discount', 'gstPercentage'].includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, signatorySignature: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, stampImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Live calculations
  const mainChargesTotal = calculateMainCharges(formData.mainCharges || []);
  const annexureITotal = calculateAnnexureI(formData.annexureI);
  const annexureATotal = calculateAnnexureA(formData.activities || []);
  const discount = parseFloat(formData.discount) || 0;
  const taxableAmount = calculateSubtotal(mainChargesTotal, annexureITotal, annexureATotal, discount);
  const gstPct = parseFloat(formData.gstPercentage !== undefined ? formData.gstPercentage : 18);
  const gstAmount = calculateGST(taxableAmount, gstPct);
  const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <h3 className="step-title">
          <FaSignature className="step-icon text-primary" /> Step 9: Authorization, Seal & Final Grand Total
        </h3>
        <p className="step-subtitle">
          Attach digital signature & company seal, adjust commercial discount, and verify live tax calculations.
        </p>
      </div>

      <div className="form-grid-2 mb-4">
        {/* Signatory Details */}
        <div className="card-sub-section">
          <h4 className="sub-section-title">
            <FaSignature /> Authorized Signatory
          </h4>
          <div className="form-group">
            <label className="form-label required">Signatory Name</label>
            <input
              type="text"
              name="signatoryName"
              value={formData.signatoryName || ''}
              onChange={handleFieldChange}
              placeholder="e.g. Dr. J. K. Patel"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Designation</label>
            <input
              type="text"
              name="signatoryDesignation"
              value={formData.signatoryDesignation || ''}
              onChange={handleFieldChange}
              placeholder="e.g. Technical Director / Lead Environmental Auditor"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Digital Signature Image</label>
            <div className="signature-upload-box">
              {formData.signatorySignature ? (
                <div className="signature-preview-wrapper">
                  <img src={formData.signatorySignature} alt="Signature Preview" className="signature-img-preview" />
                  <button
                    type="button"
                    className="btn btn-danger btn-xs"
                    onClick={() => setFormData(prev => ({ ...prev, signatorySignature: '' }))}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              ) : (
                <div
                  className="upload-dropzone"
                  onClick={() => sigInputRef.current && sigInputRef.current.click()}
                >
                  <FaUpload className="text-muted mb-1" />
                  <span className="text-xs text-muted d-block">Click to upload signature (PNG/JPG)</span>
                </div>
              )}
              <input
                type="file"
                ref={sigInputRef}
                onChange={handleSignatureUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Company Stamp / Seal */}
        <div className="card-sub-section">
          <h4 className="sub-section-title">
            <FaStamp /> Company Stamp & Seal
          </h4>
          <div className="form-group">
            <label className="form-label">Laboratory Seal Image</label>
            <div className="stamp-upload-box">
              {formData.stampImage ? (
                <div className="signature-preview-wrapper">
                  <img src={formData.stampImage} alt="Stamp Preview" className="stamp-img-preview" />
                  <button
                    type="button"
                    className="btn btn-danger btn-xs"
                    onClick={() => setFormData(prev => ({ ...prev, stampImage: '' }))}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              ) : (
                <div
                  className="upload-dropzone"
                  onClick={() => stampInputRef.current && stampInputRef.current.click()}
                >
                  <FaUpload className="text-muted mb-1" />
                  <span className="text-xs text-muted d-block">Click to upload company stamp/seal</span>
                </div>
              )}
              <input
                type="file"
                ref={stampInputRef}
                onChange={handleStampUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Discount (₹)</label>
            <input
              type="number"
              name="discount"
              value={formData.discount || ''}
              onChange={handleFieldChange}
              placeholder="0"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">GST Rate (%)</label>
            <div className="input-group">
              <input
                type="number"
                name="gstPercentage"
                value={formData.gstPercentage !== undefined ? formData.gstPercentage : 18}
                onChange={handleFieldChange}
                placeholder="18"
                className="form-control font-bold"
              />
              <span className="input-group-text"><FaPercent size={12} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE FINANCIAL SUMMARY CARD */}
      <div className="financial-summary-card p-4 rounded border bg-slate-900 text-white">
        <h4 className="text-lg font-bold text-white mb-3 d-flex align-center gap-2">
          <FaCalculator className="text-emerald-400" /> Complete Financial Breakdown
        </h4>

        <div className="summary-table-breakdown">
          <div className="summary-row">
            <span className="text-slate-300">1. Main Proposal Charges:</span>
            <span className="font-semibold text-white">₹{mainChargesTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span className="text-slate-300">2. Annexure-I (Audit Fee + Logistics + DA + Stay):</span>
            <span className="font-semibold text-white">₹{annexureITotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span className="text-slate-300">3. Annexure-A (Sampling & Analysis):</span>
            <span className="font-semibold text-white">₹{annexureATotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row text-rose-400">
              <span>Less: Commercial Discount:</span>
              <span className="font-semibold">- ₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <hr className="border-slate-700 my-2" />
          <div className="summary-row font-bold text-base">
            <span className="text-emerald-400">Taxable Subtotal:</span>
            <span className="text-emerald-400">₹{taxableAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-row">
            <span className="text-slate-300">Applicable GST ({gstPct}%):</span>
            <span className="font-semibold text-white">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <hr className="border-slate-700 my-2" />
          <div className="summary-row grand-total-row text-xl font-extrabold text-amber-300">
            <span>Estimated Grand Total (Inc. Taxes):</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationSignatureStep;
