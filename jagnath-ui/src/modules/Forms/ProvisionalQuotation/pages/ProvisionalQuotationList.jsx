/**
 * @file ProvisionalQuotationList.jsx
 * @description List and manage all Provisional Estimated Quotations.
 * Uses real Client Master data for filters and local snapshot storage for quotations.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaFileInvoiceDollar, FaPlus, FaSearch, FaFilter, FaEdit,
  FaPrint, FaTrash, FaHistory, FaCalendarAlt,
  FaBuilding, FaCheckCircle, FaExclamationCircle, FaFilePdf
} from 'react-icons/fa';
import {
  getSavedQuotations,
  deleteQuotation,
  fetchMasterData
} from '../services/provisionalQuotationStorage.service';
import QuotationRevisionModal from '../components/QuotationRevisionModal';
import { createQuotationRevision } from '../services/provisionalQuotationStorage.service';
import Pagination from '../../../../shared/components/Pagination';
import '../styles/provisionalQuotation.css';

const ProvisionalQuotationList = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

    const qCategory = (q.quotationCategoryType || q.categoryType || (q.quotationType?.toLowerCase().includes('regular') ? 'regular' : 'provisional')).toLowerCase();
    const matchType = !selectedTypeFilter || qCategory === selectedTypeFilter;

    const matchClient = !selectedClientFilter || q.clientId === selectedClientFilter || q.clientName === selectedClientFilter;

    const qDate = q.quotationDate ? q.quotationDate.split('T')[0] : '';
    const matchFromDate = !fromDateFilter || (qDate && qDate >= fromDateFilter);
    const matchToDate = !toDateFilter || (qDate && qDate <= toDateFilter);
    const matchDate = matchFromDate && matchToDate;

    return matchSearch && matchType && matchClient && matchDate;
  });

  // Pagination Slices
  const totalItems = filteredQuotations.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Finalized': return 'badge-success';
      case 'Ready': return 'badge-primary';
      case 'Revised': return 'badge-warning';
      case 'Draft':
      default: return 'badge-secondary';
    }
  };

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '-';
    const cleanStr = String(dateStr).split('T')[0];
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="module-page-container">
      {/* Top Header */}
      <div className="module-header d-flex justify-between align-center mb-4">
        <div>
          <h2 className="module-title d-flex align-center gap-2">
            <FaFileInvoiceDollar className="text-primary" /> Quotations Manager (Audit &amp; Regular)
          </h2>
          <p className="module-subtitle">
            Create, customize, calculate, and print Audit Proposals and Regular Sample Analysis Quotations.
          </p>
        </div>
        <Link to="/quotations/provisional/add" className="btn btn-primary font-semibold">
          <FaPlus /> New Quotation
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card p-3 mb-4 bg-white rounded border">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div className="form-group mb-0">
            <div className="input-with-icon">
              <FaSearch className="field-icon" />
              <input
                type="text"
                placeholder="Search by quote no, client, plant..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
              />
            </div>
          </div>

          {/* Quotation Type Filter */}
          <div className="form-group mb-0">
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-control font-semibold"
              style={{ borderColor: selectedTypeFilter === 'regular' ? '#38bdf8' : (selectedTypeFilter === 'provisional' ? '#86efac' : '#cbd5e1') }}
            >
              <option value="">-- Filter by Type (All) --</option>
              <option value="provisional">📋 Audit Quotations</option>
              <option value="regular">📄 Regular Quotations</option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="form-group mb-0">
            <select
              value={selectedClientFilter}
              onChange={(e) => {
                setSelectedClientFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-control"
            >
              <option value="">-- Filter by Client (All) --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div className="form-group mb-0">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '10px', color: '#64748b', pointerEvents: 'none', zIndex: 1 }} />
              <input
                type="date"
                value={fromDateFilter}
                onChange={(e) => {
                  setFromDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ paddingLeft: '32px', height: '38px', fontSize: '0.82rem' }}
                title="From Date"
              />
              {fromDateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDateFilter('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                  title="Clear from date"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* To Date Filter */}
          <div className="form-group mb-0">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '10px', color: '#64748b', pointerEvents: 'none', zIndex: 1 }} />
              <input
                type="date"
                value={toDateFilter}
                min={fromDateFilter || ''}
                onChange={(e) => {
                  setToDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ paddingLeft: '32px', height: '38px', fontSize: '0.82rem' }}
                title="To Date"
              />
              {toDateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setToDateFilter('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                  title="Clear to date"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Records Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-slate-100">
              <tr>
                <th style={{ width: '190px' }}>Quotation No. &amp; Type</th>
                <th>Client / Organization</th>
                <th>Plant / Unit</th>
                <th style={{ width: '105px', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ width: '80px' }}>Version</th>
                <th style={{ width: '90px' }}>Status</th>
                <th style={{ width: '130px' }} className="text-right">Grand Total</th>
                <th style={{ width: '160px' }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotations.map((q) => {
                const isRegular = (q.quotationCategoryType === 'regular' || q.categoryType === 'regular' || q.quotationType === 'Regular Quotation');
                const editUrl = isRegular
                  ? `/quotations/provisional/edit/${q.id}?type=regular`
                  : `/quotations/provisional/edit/${q.id}`;

                return (
                  <tr key={q.id}>
                    <td>
                      <Link
                        to={editUrl}
                        className="font-bold text-primary hover:underline d-block"
                      >
                        {q.quotationNumber || 'UNNAMED-QUOTE'}
                      </Link>
                      <div className="d-flex align-center gap-1 mt-1">
                        {isRegular ? (
                          <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FaFilePdf size={9} /> Regular Quote
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FaFileInvoiceDollar size={9} /> Audit Quote
                          </span>
                        )}
                        {q.referenceNo && (
                          <small className="text-muted font-mono text-xs" style={{ fontSize: '0.68rem' }}>
                            Ref: {q.referenceNo}
                          </small>
                        )}
                      </div>
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {formatDateDDMMYYYY(q.quotationDate)}
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
                        {isRegular ? (
                          <button
                            type="button"
                            onClick={() => window.open(`#/test-requests/quotation/${q.testRequestId || q.id}`, '_blank')}
                            className="btn btn-icon btn-xs btn-outline-info"
                            title="Print Regular Quotation PDF"
                          >
                            <FaPrint />
                          </button>
                        ) : (
                          <Link
                            to={`/quotations/provisional/print/${q.id}`}
                            className="btn btn-icon btn-xs btn-outline-info"
                            title="Print Provisional PDF"
                          >
                            <FaPrint />
                          </Link>
                        )}
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
                          className="btn btn-icon btn-xs btn-danger-soft"
                          title="Delete Quotation"
                          onClick={() => handleDelete(q.id, q.quotationNumber)}
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
                  <td colSpan={8} className="text-center py-5">
                    <div className="empty-state-box">
                      <FaFileInvoiceDollar size={36} className="text-muted mb-2" />
                      <h4 className="font-bold text-slate-700">No Quotations Found</h4>
                      <p className="text-muted text-sm mb-3">
                        {quotations.length === 0
                          ? 'You have not created any Quotations yet.'
                          : 'No quotations match your current search or filter criteria.'}
                      </p>
                      <Link to="/quotations/provisional/add" className="btn btn-primary btn-sm">
                        <FaPlus /> Create Your First Quotation
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

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
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
