/**
 * @file ProvisionalQuotationList.jsx
 * @description List and manage all Provisional Estimated Quotations.
 * Uses real Client Master data for filters and local snapshot storage for quotations.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaFileInvoiceDollar, FaPlus, FaSearch, FaFilter, FaEdit,
  FaCopy, FaPrint, FaEye, FaTrash, FaHistory, FaCalendarAlt,
  FaBuilding, FaCheckCircle, FaExclamationCircle, FaFilePdf
} from 'react-icons/fa';
import {
  getSavedQuotations,
  deleteQuotation,
  duplicateQuotation,
  fetchMasterData
} from '../services/provisionalQuotationStorage.service';
import QuotationRevisionModal from '../components/QuotationRevisionModal';
import { createQuotationRevision } from '../services/provisionalQuotationStorage.service';
import '../styles/provisionalQuotation.css';

const ProvisionalQuotationList = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Revision Modal State
  const [revisionModal, setRevisionModal] = useState({ isOpen: false, quotation: null });

  // Load saved quotations & real clients on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const saved = getSavedQuotations();
      setQuotations(saved);

      const masters = await fetchMasterData();
      setClients(masters.clients || []);
    } catch (err) {
      console.error('Failed to load quotation records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, quoteNo) => {
    if (window.confirm(`Are you sure you want to delete quotation "${quoteNo}"?`)) {
      deleteQuotation(id);
      loadData();
    }
  };

  const handleDuplicate = (id) => {
    const duplicated = duplicateQuotation(id);
    if (duplicated) {
      loadData();
      alert(`Quotation duplicated as ${duplicated.quotationNumber}`);
    }
  };

  const handleCreateRevision = (changeSummary) => {
    if (revisionModal.quotation) {
      const revised = createQuotationRevision(revisionModal.quotation.id, changeSummary);
      if (revised) {
        loadData();
        navigate(`/quotations/provisional/edit/${revised.id}`);
      }
    }
  };

  // Filter Logic
  const filteredQuotations = quotations.filter(q => {
    const term = searchQuery.toLowerCase();
    const matchSearch =
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
      (q.clientName && q.clientName.toLowerCase().includes(term)) ||
      (q.plantName && q.plantName.toLowerCase().includes(term)) ||
      (q.referenceNo && q.referenceNo.toLowerCase().includes(term)) ||
      (q.qpiNo && q.qpiNo.toLowerCase().includes(term));

    const matchClient = !selectedClientFilter || q.clientId === selectedClientFilter || q.clientName === selectedClientFilter;
    const matchStatus = !selectedStatusFilter || q.status === selectedStatusFilter;

    return matchSearch && matchClient && matchStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Finalized': return 'badge-success';
      case 'Ready': return 'badge-primary';
      case 'Revised': return 'badge-warning';
      case 'Draft':
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="module-page-container">
      {/* Top Header */}
      <div className="module-header d-flex justify-between align-center mb-4">
        <div>
          <h2 className="module-title d-flex align-center gap-2">
            <FaFileInvoiceDollar className="text-primary" /> Provisional Estimated Quotations
          </h2>
          <p className="module-subtitle">
            Create, customize, calculate, and print Schedule-II Environmental Audit & Sampling Provisional Proposals.
          </p>
        </div>
        <Link to="/quotations/provisional/add" className="btn btn-primary font-semibold">
          <FaPlus /> New Provisional Quote
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card p-3 mb-4 bg-white rounded border">
        <div className="form-grid-3">
          {/* Search Box */}
          <div className="form-group mb-0">
            <div className="input-with-icon">
              <FaSearch className="field-icon" />
              <input
                type="text"
                placeholder="Search by quote no, client, plant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* Client Filter */}
          <div className="form-group mb-0">
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="form-control"
            >
              <option value="">-- Filter by Client (All) --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-group mb-0">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="form-control"
            >
              <option value="">-- Filter by Status (All) --</option>
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Finalized">Finalized</option>
              <option value="Revised">Revised</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotation Records Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-slate-100">
              <tr>
                <th style={{ width: '160px' }}>Quotation No.</th>
                <th>Client / Organization</th>
                <th>Plant / Unit</th>
                <th style={{ width: '120px' }}>Date</th>
                <th style={{ width: '90px' }}>Version</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '140px' }} className="text-right">Grand Total</th>
                <th style={{ width: '180px' }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link
                      to={`/quotations/provisional/edit/${q.id}`}
                      className="font-bold text-primary hover:underline d-block"
                    >
                      {q.quotationNumber || 'UNNAMED-QUOTE'}
                    </Link>
                    {q.referenceNo && (
                      <small className="text-muted d-block font-mono text-xs">
                        Ref: {q.referenceNo}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className="font-semibold text-slate-800 d-block">
                      {q.clientName || 'No Client Selected'}
                    </span>
                    <small className="text-muted d-block text-xs">
                      {q.clientCity ? `${q.clientCity}, ${q.clientState || ''}` : ''}
                    </small>
                  </td>
                  <td>
                    <span className="text-slate-700 font-medium">
                      {q.plantName || q.plantAddress || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-slate-600">
                      {q.quotationDate || '-'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-secondary text-xs">v{q.version || 1}</span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(q.status)}`}>
                      {q.status || 'Draft'}
                    </span>
                  </td>
                  <td className="text-right font-bold text-slate-900">
                    ₹{Number(q.grandTotal || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-center gap-1">
                      <Link
                        to={`/quotations/provisional/edit/${q.id}`}
                        className="btn btn-icon btn-xs btn-outline-primary"
                        title="Edit Quotation"
                      >
                        <FaEdit />
                      </Link>
                      <Link
                        to={`/quotations/provisional/preview/${q.id}`}
                        className="btn btn-icon btn-xs btn-outline-secondary"
                        title="Live A4 Preview"
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/quotations/provisional/print/${q.id}`}
                        className="btn btn-icon btn-xs btn-outline-info"
                        title="Print / Save PDF"
                      >
                        <FaPrint />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-icon btn-xs btn-outline-warning"
                        title="Create Revision"
                        onClick={() => setRevisionModal({ isOpen: true, quotation: q })}
                      >
                        <FaHistory />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon btn-xs btn-outline-dark"
                        title="Duplicate Quotation"
                        onClick={() => handleDuplicate(q.id)}
                      >
                        <FaCopy />
                      </button>
                      <button
                        type="button"
                        className="btn btn-icon btn-xs btn-danger-soft"
                        title="Delete Quotation"
                        onClick={() => handleDelete(q.id, q.quotationNumber)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuotations.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-5">
                    <div className="empty-state-box">
                      <FaFileInvoiceDollar size={36} className="text-muted mb-2" />
                      <h4 className="font-bold text-slate-700">No Provisional Quotations Found</h4>
                      <p className="text-muted text-sm mb-3">
                        {quotations.length === 0
                          ? 'You have not created any Provisional Estimated Quotations yet.'
                          : 'No quotations match your current search or filter criteria.'}
                      </p>
                      <Link to="/quotations/provisional/add" className="btn btn-primary btn-sm">
                        <FaPlus /> Create Your First Provisional Quotation
                      </Link>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    Loading quotation records and master data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision Modal */}
      <QuotationRevisionModal
        isOpen={revisionModal.isOpen}
        onClose={() => setRevisionModal({ isOpen: false, quotation: null })}
        onCreateRevision={handleCreateRevision}
        quotation={revisionModal.quotation}
      />
    </div>
  );
};

export default ProvisionalQuotationList;
