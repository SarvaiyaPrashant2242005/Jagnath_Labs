/**
 * @file QuotationBasicDetailsStep.jsx
 * @description Step 1: Basic details for Provisional Estimated Quotation.
 */

import React from 'react';
import { FaCalendarAlt, FaUserCheck, FaFileContract, FaHashtag } from 'react-icons/fa';

const QuotationBasicDetailsStep = ({ formData, onChange, users = [] }) => {
  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <h3 className="step-title">
          <FaFileContract className="step-icon text-primary" /> Step 1: Basic Quotation Details
        </h3>
        <p className="step-subtitle">Configure core reference numbers, audit type, dates, and authorization details.</p>
      </div>

      <div className="form-grid-3">
        {/* Quotation Type */}
        <div className="form-group">
          <label className="form-label">Quotation Type</label>
          <input
            type="text"
            name="quotationType"
            value={formData.quotationType || 'Provisional Estimated Quotation'}
            readOnly
            className="form-control bg-light cursor-not-allowed font-medium"
          />
        </div>

        {/* Quotation Date */}
        <div className="form-group">
          <label className="form-label required">Quotation Date</label>
          <div className="input-with-icon">
            <FaCalendarAlt className="field-icon" />
            <input
              type="date"
              name="quotationDate"
              value={formData.quotationDate || ''}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>
        </div>

        {/* Financial Year */}
        <div className="form-group">
          <label className="form-label">Financial Year</label>
          <input
            type="text"
            name="financialYear"
            value={formData.financialYear || ''}
            onChange={onChange}
            placeholder="e.g. 2026-27"
            className="form-control"
          />
        </div>

        {/* Reference No. */}
        <div className="form-group">
          <label className="form-label">Reference No.</label>
          <div className="input-with-icon">
            <FaHashtag className="field-icon" />
            <input
              type="text"
              name="referenceNo"
              value={formData.referenceNo || ''}
              onChange={onChange}
              placeholder="e.g. JLT/AUDIT/2026/042"
              className="form-control"
            />
          </div>
        </div>

        {/* Q.P.I. No. */}
        <div className="form-group">
          <label className="form-label">Q.P.I. No. (Provisional Quote ID)</label>
          <div className="input-with-icon">
            <FaHashtag className="field-icon" />
            <input
              type="text"
              name="qpiNo"
              value={formData.qpiNo || ''}
              onChange={onChange}
              placeholder="e.g. QPI-7890"
              className="form-control"
            />
          </div>
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">Quotation Status</label>
          <select
            name="status"
            value={formData.status || 'Draft'}
            onChange={onChange}
            className="form-control"
          >
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Finalized">Finalized</option>
            <option value="Revised">Revised</option>
          </select>
        </div>

        {/* Approved By (Real Users from API) */}
        <div className="form-group">
          <label className="form-label">Approved By / Auditor</label>
          <div className="input-with-icon">
            <FaUserCheck className="field-icon" />
            <select
              name="approvedBy"
              value={formData.approvedBy || ''}
              onChange={onChange}
              className="form-control"
            >
              <option value="">-- Select Approved By / Signatory --</option>
              {users.map(u => (
                <option key={u.id} value={u.name || u.email}>
                  {u.name} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
          </div>
          {users.length === 0 && (
            <small className="text-muted mt-1 d-block">
              (No users loaded from user master API. You can type or select when available.)
            </small>
          )}
        </div>

        {/* Contact Person */}
        <div className="form-group">
          <label className="form-label">Auditor Contact Person</label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson || ''}
            onChange={onChange}
            placeholder="e.g. Prashant Sarvaiya / Technical Head"
            className="form-control"
          />
        </div>

        {/* Quotation Flag */}
        <div className="form-group">
          <label className="form-label">Is Quotation Active?</label>
          <select
            name="isQuotation"
            value={formData.isQuotation || 'Yes'}
            onChange={onChange}
            className="form-control"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default QuotationBasicDetailsStep;
