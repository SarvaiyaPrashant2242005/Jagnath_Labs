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
import excelService, { downloadTemplate, parseExcelFile, validateMasterRows, exportFailedRowsToExcel, MASTER_SCHEMAS } from '../../services/excelService';

const BulkImportModal = ({
  isOpen,
  onClose,
  masterType, // 'client' | 'category' | 'parameter' | 'pricelist' | 'user'
  existingDbRecords = [],
  onImportSuccess
}) => {
  const schema = MASTER_SCHEMAS[masterType] || {};
  const fileInputRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Drag-to-scroll state refs
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Flow State
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Edit
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ERRORS' | 'NEW' | 'UPDATE'
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [retainedErrorIds, setRetainedErrorIds] = useState(new Set());

  // Reset modal state when closed/opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setRows([]);
      setFilter('ALL');
      setUploadError('');
      setRetainedErrorIds(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Mouse Drag-to-Scroll handlers (scroll from anywhere in table)
  const handleMouseDown = (e) => {
    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (!tableContainerRef.current) return;
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - tableContainerRef.current.offsetLeft;
    scrollLeftRef.current = tableContainerRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

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

  // Handle filter selection and retain active error row IDs so editing an error row doesn't disappear mid-edit
  const handleSetFilter = (newFilter) => {
    if (newFilter === 'ERRORS') {
      const currentErrorIds = new Set(rows.filter(r => r._status === 'ERROR').map(r => r._id));
      setRetainedErrorIds(currentErrorIds);
    }
    setFilter(newFilter);
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

  // Handle removal of all errored rows at once
  const handleRemoveAllErrors = () => {
    if (errorCount === 0) return;
    setRows(prevRows => {
      const validOnly = prevRows.filter(r => r._status !== 'ERROR');
      if (validOnly.length === 0) {
        setStep(1);
        setFile(null);
        return [];
      }
      const rawDataArray = validOnly.map(r => r.data);
      const reEvaluated = validateMasterRows(masterType, rawDataArray, existingDbRecords);
      return validOnly.map((r, i) => ({
        ...reEvaluated[i],
        _id: r._id
      }));
    });
    setRetainedErrorIds(new Set());
    setFilter('ALL');
  };

  // Summary counts
  const totalCount = rows.length;
  const errorCount = rows.filter(r => r._status === 'ERROR').length;
  const newCount = rows.filter(r => r._status === 'NEW').length;
  const updateCount = rows.filter(r => r._status === 'UPDATE').length;
  const duplicateCount = rows.filter(r => {
    const errStr = Object.values(r._errors || {}).join(' ').toLowerCase();
    return errStr.includes('duplicate') || errStr.includes('exists');
  }).length;

  // Filtered rows for preview table
  const displayedRows = rows.filter(r => {
    if (filter === 'ERRORS') return r._status === 'ERROR' || retainedErrorIds.has(r._id);
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

  const getColumnMinWidth = (key) => {
    switch (key) {
      case 'clientName': return '190px';
      case 'email': return '210px';
      case 'contactNumber': return '150px';
      case 'address': return '200px';
      case 'city': return '130px';
      case 'state': return '130px';
      case 'categoryName': return '200px';
      case 'subCategoryName': return '180px';
      case 'locationOfSample': return '180px';
      case 'parameterName': return '200px';
      case 'testMethod': return '190px';
      case 'unit': return '100px';
      case 'isPermissibleLimitApplicable': return '190px';
      case 'permissibleLimit': return '150px';
      case 'description': return '220px';
      case 'gender': return '110px';
      case 'status': return '110px';
      default: return '140px';
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
          width: 95vw;
          max-width: 1400px;
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
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: auto;
          max-height: 420px;
          width: 100%;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }

        .preview-table {
          width: 100%;
          min-width: max-content;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .preview-table th {
          background: #f8fafc;
          padding: 0.75rem 0.85rem;
          text-align: left;
          font-weight: 700;
          color: #334155;
          border-bottom: 2px solid #cbd5e1;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
        }

        .preview-table td {
          padding: 0.5rem 0.65rem;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
        }

        .preview-table-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }

        .preview-table-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 999px;
          margin: 4px;
        }

        .preview-table-container::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 999px;
          border: 2px solid #f1f5f9;
          transition: background-color 0.2s ease-in-out;
        }

        .preview-table-container::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }

        .cell-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          font-size: 0.85rem;
          outline: none;
          background: #ffffff;
          transition: all 0.2s;
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

              {/* Filter Pills & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="filter-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className={`pill-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => handleSetFilter('ALL')}>
                    All Rows ({totalCount})
                  </button>
                  {errorCount > 0 && (
                    <button className={`pill-btn ${filter === 'ERRORS' ? 'active' : ''}`} onClick={() => handleSetFilter('ERRORS')} style={{ color: filter === 'ERRORS' ? '#ffffff' : '#ef4444', backgroundColor: filter === 'ERRORS' ? '#ef4444' : 'transparent', borderColor: '#ef4444' }}>
                      Errors Only ({errorCount})
                    </button>
                  )}
                  <button className={`pill-btn ${filter === 'NEW' ? 'active' : ''}`} onClick={() => handleSetFilter('NEW')}>
                    New ({newCount})
                  </button>
                  <button className={`pill-btn ${filter === 'UPDATE' ? 'active' : ''}`} onClick={() => handleSetFilter('UPDATE')}>
                    Updates ({updateCount})
                  </button>
                  {duplicateCount > 0 && (
                    <button className={`pill-btn ${filter === 'DUPLICATES' ? 'active' : ''}`} onClick={() => setFilter('DUPLICATES')} style={{ color: '#d97706', borderColor: '#fcd34d' }}>
                      Duplicates ({duplicateCount})
                    </button>
                  )}
                  {errorCount > 0 && (
                    <button className={`pill-btn ${filter === 'ERRORS' ? 'active' : ''}`} onClick={() => setFilter('ERRORS')} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
                      Errors Only ({errorCount})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {errorCount > 0 && (
                    <button
                      onClick={handleRemoveAllErrors}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Remove all rows with validation errors"
                    >
                      <FaTrash /> Remove All {errorCount} Error Rows
                    </button>
                  )}
                  <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setStep(1); setFile(null); }}>
                    <FaSyncAlt /> Upload Different File
                  </button>
                </div>
              </div>

              {/* Preview & Interactive Grid */}
              <div
                className="preview-table-container"
                ref={tableContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: 'grab' }}
              >
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                      <th style={{ minWidth: errorCount > 0 ? '260px' : '120px' }}>Status</th>
                      {schema.headers.map(h => (
                        <th key={h.key} style={{ minWidth: getColumnMinWidth(h.key) }}>{h.label}</th>
                      ))}
                      <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((r, idx) => (
                      <tr key={r._id} style={{ background: r._status === 'ERROR' ? '#fff1f2' : 'transparent' }}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b', verticalAlign: 'top', paddingTop: '0.75rem' }}>
                          {r._originalIndex}
                        </td>
                        <td style={{ minWidth: errorCount > 0 ? '260px' : '120px', verticalAlign: 'top', paddingTop: '0.6rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                            <span className={`status-badge ${r._status}`}>
                              {r._status === 'NEW' && '✨ New'}
                              {r._status === 'UPDATE' && '⚠️ Update'}
                              {r._status === 'ERROR' && '❌ Error'}
                            </span>
                            {r._status === 'ERROR' && r._errors && Object.keys(r._errors).filter(k => k !== '_row').length > 0 && (
                              <div
                                style={{
                                  fontSize: '0.725rem',
                                  color: '#991b1b',
                                  fontWeight: 600,
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.5rem',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.3',
                                  maxWidth: '250px',
                                  marginTop: '0.2rem'
                                }}
                              >
                                {Object.keys(r._errors).filter(k => k !== '_row').map(k => r._errors[k]).join(' • ')}
                              </div>
                            )}
                            {r._status === 'UPDATE' && r._errors && r._errors['_row'] && (
                              <div
                                style={{
                                  fontSize: '0.725rem',
                                  color: '#b45309',
                                  fontWeight: 600,
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.5rem',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.3',
                                  maxWidth: '250px',
                                  marginTop: '0.2rem'
                                }}
                              >
                                {r._errors['_row']}
                              </div>
                            )}
                          </div>
                        </td>
                        {schema.headers.map(h => {
                          const cellErr = r._errors ? r._errors[h.key] : null;
                          const width = getColumnMinWidth(h.key);
                          return (
                            <td key={h.key} style={{ position: 'relative', minWidth: width, verticalAlign: 'top', paddingTop: '0.6rem' }}>
                              <input
                                className={`cell-input ${cellErr ? 'has-error' : ''}`}
                                style={{ minWidth: width }}
                                value={r.data[h.key] || ''}
                                title={cellErr || ''}
                                onChange={(e) => handleCellEdit(r._id, h.key, e.target.value)}
                              />
                              {cellErr && (
                                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginTop: '4px', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: width }}>
                                  {cellErr}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '0.75rem' }}>
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
