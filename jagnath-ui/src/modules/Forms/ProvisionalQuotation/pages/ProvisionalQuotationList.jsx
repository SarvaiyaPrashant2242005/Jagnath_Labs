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
        <Link
          to="/quotations/provisional/add"
          className="btn btn-primary font-semibold"
        >
          <FaPlus /> New Quotation
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
                <th style={{ width: '110px' }}>Type</th>
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
              {filteredQuotations.map((q) => {
                const isGt = q.quotationType === 'general_testing';
                const editUrl = isGt
                  ? `/quotations/provisional/edit/${q.id}?type=general_testing`
                  : `/quotations/provisional/edit/${q.id}`;
                const previewUrl = `/quotations/provisional/preview/${q.id}`;
                const printUrl = `/quotations/provisional/print/${q.id}`;

                return (
                  <tr key={q.id}>
                    <td>
                      <Link
                        to={editUrl}
                        className="font-bold text-primary hover:underline d-block"
                      >
                        {q.quotationNumber || q.quotationNo || 'UNNAMED-QUOTE'}
                      </Link>
                      {q.referenceNo && (
                        <small className="text-muted d-block font-mono text-xs">
                          Ref: {q.referenceNo}
                        </small>
                      )}
                    </td>
                    <td>
                      {isGt ? (
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 700 }}>
                          General Testing
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                          General Quote
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800 d-block">
                        {q.clientName || q.client?.companyName || 'No Client Selected'}
                      </span>
                      <small className="text-muted d-block text-xs">
                        {q.clientCity ? `${q.clientCity}, ${q.clientState || ''}` : ''}
                      </small>
                    </td>
                    <td>
                      <span className="text-slate-700 font-medium">
                        {q.plantName || q.plantAddress || q.client?.serviceName || q.client?.address || '-'}
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
                          to={editUrl}
                          className="btn btn-icon btn-xs btn-outline-primary"
                          title="Edit Quotation"
                        >
                          <FaEdit />
                        </Link>
                        <Link
                          to={previewUrl}
                          className="btn btn-icon btn-xs btn-outline-secondary"
                          title="Live A4 Preview"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={printUrl}
                          className="btn btn-icon btn-xs btn-outline-info"
                          title="Print / Save PDF"
                        >
                          <FaPrint />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(q.id)}
                          className="btn btn-icon btn-xs btn-outline-secondary"
                          title="Duplicate Quotation"
                        >
                          <FaCopy />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevisionModal({ isOpen: true, quotation: q })}
                          className="btn btn-icon btn-xs btn-outline-warning"
                          title="Create Revision"
                        >
                          <FaHistory />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id, q.quotationNumber || q.quotationNo)}
                          className="btn btn-icon btn-xs btn-outline-danger"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQuotations.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    <div className="empty-state-box">
                      <FaFileInvoiceDollar size={36} className="text-muted mb-2" />
                      <h4 className="font-bold text-slate-700">No Quotations Found</h4>
                      <p className="text-muted text-sm mb-3">
                        {quotations.length === 0
                          ? 'You have not created any quotations yet.'
                          : 'No quotations match your current search or filter criteria.'}
                      </p>
                      <Link
                        to="/quotations/provisional/add"
                        className="btn btn-primary btn-sm"
                      >
                        <FaPlus /> Create First Quotation
                      </Link>
                    </div>
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-muted">
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

