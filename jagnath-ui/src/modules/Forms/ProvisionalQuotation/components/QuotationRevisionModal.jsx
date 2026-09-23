/**
 * @file QuotationRevisionModal.jsx
 * @description Modal for creating a new revision version and viewing historical changes.
 */

import React, { useState } from 'react';
import { FaHistory, FaTimes, FaCheck, FaInfoCircle } from 'react-icons/fa';

const QuotationRevisionModal = ({ isOpen, onClose, onCreateRevision, quotation }) => {
  const [changeSummary, setChangeSummary] = useState('');

  if (!isOpen || !quotation) return null;

  const nextVersion = (parseInt(quotation.version, 10) || 1) + 1;
  const revisions = Array.isArray(quotation.revisions) ? quotation.revisions : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!changeSummary.trim()) {
      alert('Please provide a brief change summary for this revision.');
      return;
    }
    onCreateRevision(changeSummary.trim());
    setChangeSummary('');
    onClose();
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom modal-md">
        <div className="modal-header-custom">
          <h4 className="modal-title-custom d-flex align-center gap-2">
            <FaHistory className="text-warning" /> Create Quotation Revision (v{nextVersion})
          </h4>
          <button type="button" className="btn-close-custom" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-custom">
            <div className="alert alert-info py-2 px-3 text-xs mb-3">
              <FaInfoCircle /> Creating a revision increments the version to <strong>v{nextVersion}</strong> and preserves Version {quotation.version} snapshot history intact.
            </div>

            <div className="form-group mb-3">
              <label className="form-label font-semibold required">Revision Change Summary</label>
              <textarea
                rows={3}
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Updated sampling frequencies from 3 to 4 visits based on client review..."
                className="form-control"
                required
              />
            </div>

            {/* Version History */}
            {revisions.length > 0 && (
              <div className="revision-history-section mt-3">
                <label className="form-label font-semibold">Prior Version History</label>
                <div className="revision-timeline">
                  {revisions.map((rev, idx) => (
                    <div key={idx} className="timeline-item">
                      <span className="badge badge-secondary text-xs">v{rev.version}</span>
                      <div className="timeline-content">
                        <span className="timeline-date text-xs text-muted">
                          {rev.date ? new Date(rev.date).toLocaleDateString() : 'N/A'}
                        </span>
                        <p className="timeline-summary mb-0 text-sm">{rev.changeSummary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer-custom">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning btn-sm font-semibold">
              <FaCheck /> Create Revision v{nextVersion}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuotationRevisionModal;
