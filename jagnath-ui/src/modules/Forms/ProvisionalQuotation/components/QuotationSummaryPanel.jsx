/**
 * @file QuotationSummaryPanel.jsx
 * @description Real-time live financial summary side panel.
 */

import React from 'react';
import { FaCalculator, FaFilePdf, FaSave, FaEye, FaPrint, FaHistory } from 'react-icons/fa';
import {
  calculateMainCharges,
  calculateAnnexureI,
  calculateAnnexureA,
  calculateSubtotal,
  calculateGST,
  calculateGrandTotal,
} from '../utils/quotationCalculation.utils';

const QuotationSummaryPanel = ({
  formData,
  onSave,
  onPreview,
  onPrint,
  onOpenRevision,
  saving = false,
  isEditing = false
}) => {
  const mainChargesTotal = calculateMainCharges(formData.mainCharges || []);
  const annexureITotal = calculateAnnexureI(formData.annexureI);
  const annexureATotal = calculateAnnexureA(formData.activities || []);
  const discount = parseFloat(formData.discount) || 0;
  const taxableAmount = calculateSubtotal(mainChargesTotal, annexureITotal, annexureATotal, discount);
  const gstPct = parseFloat(formData.gstPercentage !== undefined ? formData.gstPercentage : 18);
  const gstAmount = calculateGST(taxableAmount, gstPct);
  const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);

  return (
    <div className="quotation-sticky-summary">
      <div className="summary-header">
        <h4 className="summary-title">
          <FaCalculator /> Live Calculation Summary
        </h4>
        <span className="badge badge-info text-xs font-semibold">
          v{formData.version || 1} • {formData.status || 'Draft'}
        </span>
      </div>

      <div className="summary-body">
        <div className="summary-line">
          <span className="text-muted">Main Charges:</span>
          <span className="font-semibold">₹{mainChargesTotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-line">
          <span className="text-muted">Annexure-I:</span>
          <span className="font-semibold">₹{annexureITotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-line">
          <span className="text-muted">Annexure-A:</span>
          <span className="font-semibold">₹{annexureATotal.toLocaleString('en-IN')}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line text-danger">
            <span>Discount:</span>
            <span>- ₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="summary-divider"></div>
        <div className="summary-line font-bold">
          <span>Taxable Amount:</span>
          <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-line text-muted">
          <span>GST ({gstPct}%):</span>
          <span>₹{gstAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-line summary-grand-total">
          <span className="text-primary font-bold">Grand Total:</span>
          <span className="text-primary font-extrabold text-lg">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="summary-actions">
        <button
          type="button"
          className="btn btn-primary btn-block mb-2 font-semibold"
          onClick={() => onSave('Finalized')}
          disabled={saving}
        >
          <FaSave /> {saving ? 'Saving...' : 'Save Quotation'}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary btn-block mb-2"
          onClick={() => onSave('Draft')}
          disabled={saving}
        >
          Save Draft
        </button>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm flex-1"
            onClick={onPreview}
          >
            <FaEye /> Preview
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm flex-1"
            onClick={onPrint}
          >
            <FaPrint /> Print
          </button>
        </div>

        {isEditing && (
          <button
            type="button"
            className="btn btn-outline-warning btn-block btn-sm mt-2"
            onClick={onOpenRevision}
          >
            <FaHistory /> Create Revision (v{(formData.version || 1) + 1})
          </button>
        )}
      </div>
    </div>
  );
};

export default QuotationSummaryPanel;
