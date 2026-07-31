/**
 * @file BulkImportModal.jsx
 * @description Universal modal for downloading Excel templates, uploading files, analyzing validation/duplication, inline editing, row removal, and importing to database.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  FaCloudUploadAlt, FaDownload, FaFileExcel, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaTrash, FaSyncAlt,
  FaFilter, FaInfoCircle
} from 'react-icons/fa';
import { downloadTemplate, parseExcelFile, validateMasterRows, exportFailedRowsToExcel, MASTER_SCHEMAS } from '../../services/excelService';

const BulkImportModal = ({
  isOpen,
  onClose,
  masterType, // 'client' | 'category' | 'parameter' | 'pricelist' | 'user'
  existingDbRecords = [],
  onImportSuccess
}) => {
  const schema = MASTER_SCHEMAS[masterType] || {};
  const fileInputRef = useRef(null);

  // Flow State
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Edit
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ERRORS' | 'NEW' | 'UPDATE'
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Reset modal state when closed/opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setRows([]);
      setFilter('ALL');
      setUploadError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle File selection or drop
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setUploadError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    try {
      setLoading(true);
      setUploadError('');
      setFile(selectedFile);

      // Parse Excel file
      const rawRows = await parseExcelFile(selectedFile);

      if (!rawRows || rawRows.length === 0) {
        setUploadError('The uploaded Excel file contains no data rows.');
        setLoading(false);
        return;
      }

      // Run Schema & Duplication Validation
      const evaluated = validateMasterRows(masterType, rawRows, existingDbRecords);
      setRows(evaluated);
      setStep(2);
    } catch (err) {
      setUploadError(err.message || 'Error processing Excel file.');
    } finally {
      setLoading(false);
    }
  };

  // Re-run validation whenever a row cell is edited
  const handleCellEdit = (rowId, fieldKey, newValue) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(r => {
        if (r._id === rowId) {
          const newRowData = { ...r.data, [fieldKey]: newValue };
          return { ...r, data: newRowData };
        }
        return r;
      });

      // Extract raw data format to re-validate
      const rawDataArray = updatedRows.map(r => r.data);
      const reEvaluated = validateMasterRows(masterType, rawDataArray, existingDbRecords);

      // Preserve IDs and DB match info
      return updatedRows.map((r, i) => ({
        ...reEvaluated[i],
        _id: r._id
      }));
    });
  };

  // Handle individual row removal
  const handleRemoveRow = (rowId) => {
    setRows(prevRows => {
      const filtered = prevRows.filter(r => r._id !== rowId);
      if (filtered.length === 0) {
        setStep(1);
        setFile(null);
        return [];
      }
      const rawDataArray = filtered.map(r => r.data);
      const reEvaluated = validateMasterRows(masterType, rawDataArray, existingDbRecords);
      return filtered.map((r, i) => ({
        ...reEvaluated[i],
        _id: r._id
      }));
    });
  };

  // Summary counts
  const totalCount = rows.length;
  const errorCount = rows.filter(r => r._status === 'ERROR').length;
  const newCount = rows.filter(r => r._status === 'NEW').length;
  const updateCount = rows.filter(r => r._status === 'UPDATE').length;

  // Filtered rows for preview table
  const displayedRows = rows.filter(r => {
    if (filter === 'ERRORS') return r._status === 'ERROR';
    if (filter === 'NEW') return r._status === 'NEW';
    if (filter === 'UPDATE') return r._status === 'UPDATE';
    return true;
  });

  // Handle final Submit / Sync to Database
  const handleFinalSubmit = async () => {
    if (errorCount > 0) {
      if (!window.confirm(`There are ${errorCount} rows with errors. Do you want to skip invalid rows and import the ${totalCount - errorCount} valid rows?`)) {
        return;
      }
    }

    const validRows = rows.filter(r => r._status !== 'ERROR');
    if (validRows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    try {
      setSubmitting(true);
      await onImportSuccess(validRows);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to bulk import records.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bulk-modal-overlay">
      <style>{`
        .bulk-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease-out;
        }

        .bulk-modal-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 1050px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bulk-modal-header {
          padding: 1.25rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bulk-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0;
        }

        .bulk-modal-close {
          background: none;
          border: none;
          color: #64748b;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .bulk-modal-close:hover {
          color: #0f172a;
          background: #e2e8f0;
        }

        .bulk-modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex-grow: 1;
        }

        .dropzone-area {
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 3rem 2rem;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dropzone-area:hover {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .template-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .stat-card {
          padding: 0.85rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .stat-card.error { border-left: 4px solid #ef4444; background: #fef2f2; }
        .stat-card.new { border-left: 4px solid #22c55e; background: #f0fdf4; }
        .stat-card.update { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .stat-card.total { border-left: 4px solid #3b82f6; background: #eff6ff; }

        .stat-title { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .stat-val { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-top: 0.2rem; }

        .filter-pills {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .pill-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          padding: 0.4rem 0.85rem;
          border-radius: 20px;
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pill-btn.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .preview-table-container {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow-x: auto;
          max-height: 400px;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .preview-table th {
          background: #f8fafc;
          padding: 0.75rem 0.85rem;
          text-align: left;
          font-weight: 600;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .preview-table td {
          padding: 0.5rem 0.65rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .cell-input {
          width: 100%;
          border: 1px solid transparent;
          border-radius: 6px;
          padding: 0.35rem 0.5rem;
          font-size: 0.825rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .cell-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .cell-input.has-error {
          border-color: #ef4444;
          background: #fef2f2;
          color: #991b1b;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.55rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-badge.NEW { background: #dcfce7; color: #15803d; }
        .status-badge.UPDATE { background: #fef3c7; color: #b45309; }
        .status-badge.ERROR { background: #fee2e2; color: #b91c1c; }

        .bulk-modal-footer {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-secondary {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 0.55rem 1.1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary:hover { background: #f1f5f9; }

        .btn-primary {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 0.55rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary:hover { background: #1d4ed8; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="bulk-modal-container">
        {/* Modal Header */}
        <div className="bulk-modal-header">
          <h3 className="bulk-modal-title">
            <FaFileExcel color="#16a34a" size={22} />
            Bulk Excel Import — {schema.title || 'Master'}
          </h3>
          <button className="bulk-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="bulk-modal-body">
          {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
          {step === 1 && (
            <div>
              {/* Template Banner */}
              <div className="template-banner">
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Need the formatted Excel template?
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                    Download the pre-structured Excel template with column headers and sample data.
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => downloadTemplate(masterType)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FaDownload color="#2563eb" /> Download Template
                </button>
              </div>

              {/* Dropzone */}
              <div
                className="dropzone-area"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx, .xls"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <FaCloudUploadAlt size={48} color="#3b82f6" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Click or drag Excel file here to upload
                </h4>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Supports .xlsx and .xls formats
                </p>
              </div>

              {uploadError && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaExclamationTriangle /> {uploadError}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW, VALIDATE & EDIT DATA */}
          {step === 2 && (
            <div>
              {/* Stats Bar */}
              <div className="stats-bar">
                <div className="stat-card total">
                  <div className="stat-title">Total Uploaded</div>
                  <div className="stat-val">{totalCount}</div>
                </div>
                <div className="stat-card new">
                  <div className="stat-title">New Records</div>
                  <div className="stat-val">{newCount}</div>
                </div>
                <div className="stat-card update">
                  <div className="stat-title">Will Update Existing</div>
                  <div className="stat-val">{updateCount}</div>
                </div>
                <div className="stat-card error">
                  <div className="stat-title">Validation Errors</div>
                  <div className="stat-val">{errorCount}</div>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className="filter-pills">
                  <button className={`pill-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
                    All Rows ({totalCount})
                  </button>
                  {errorCount > 0 && (
                    <button className={`pill-btn ${filter === 'ERRORS' ? 'active' : ''}`} onClick={() => setFilter('ERRORS')} style={{ color: '#ef4444' }}>
                      Errors Only ({errorCount})
                    </button>
                  )}
                  <button className={`pill-btn ${filter === 'NEW' ? 'active' : ''}`} onClick={() => setFilter('NEW')}>
                    New ({newCount})
                  </button>
                  <button className={`pill-btn ${filter === 'UPDATE' ? 'active' : ''}`} onClick={() => setFilter('UPDATE')}>
                    Updates ({updateCount})
                  </button>
                </div>

                <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setStep(1); setFile(null); }}>
                  <FaSyncAlt /> Upload Different File
                </button>
              </div>

              {/* Preview & Interactive Grid */}
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '110px' }}>Status</th>
                      {schema.headers.map(h => (
                        <th key={h.key}>{h.label}</th>
                      ))}
                      <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((r, idx) => (
                      <tr key={r._id} style={{ background: r._status === 'ERROR' ? '#fff1f2' : 'transparent' }}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                          {r._originalIndex}
                        </td>
                        <td>
                          <span className={`status-badge ${r._status}`}>
                            {r._status === 'NEW' && '✨ New'}
                            {r._status === 'UPDATE' && '⚠️ Update'}
                            {r._status === 'ERROR' && '❌ Error'}
                          </span>
                        </td>
                        {schema.headers.map(h => {
                          const cellErr = r._errors[h.key] || r._errors['_row'];
                          return (
                            <td key={h.key}>
                              <input
                                className={`cell-input ${cellErr ? 'has-error' : ''}`}
                                value={r.data[h.key] || ''}
                                title={cellErr || ''}
                                onChange={(e) => handleCellEdit(r._id, h.key, e.target.value)}
                              />
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                            title="Remove Row"
                            onClick={() => handleRemoveRow(r._id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bulk-modal-footer">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            {step === 2 && errorCount > 0 && (
              <button
                className="btn-secondary"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => exportFailedRowsToExcel(masterType, rows.filter(r => r._status === 'ERROR'))}
              >
                <FaDownload /> Download Failed Rows ({errorCount})
              </button>
            )}
          </div>
          {step === 2 && (
            <button
              className="btn-primary"
              onClick={handleFinalSubmit}
              disabled={submitting || (totalCount - errorCount) === 0}
            >
              {submitting
                ? 'Importing to DB...'
                : updateCount > 0
                  ? `Import ${newCount} records & update ${updateCount} ${masterType}s`
                  : `Import ${newCount} records to DB`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
