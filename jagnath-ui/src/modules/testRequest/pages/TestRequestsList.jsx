import React, { useState, useMemo, useEffect } from 'react';
import {
  FaSearch, FaFilter, FaCalendarAlt, FaPlus,
  FaChevronLeft, FaChevronRight, FaTrash
} from 'react-icons/fa';
import testRequestService from '../../../shared/services/testRequestService';

const TestRequestsList = ({
  triggerNotification,
  requests,
  setRequests,
  onAddNewRequestClick
}) => {
  // Selected rows keys state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter settings states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination page state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract categories dynamically
  const categoriesList = useMemo(() => {
    const list = new Set(requests.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [requests]);

  // Filter requests dynamically
  const filteredRequests = requests.filter(row => {
    // 1. Search Query filter (TR ID, client, company)
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === '' ||
      row.id.toLowerCase().includes(q) ||
      (row.client && row.client.toLowerCase().includes(q)) ||
      (row.company && row.company.toLowerCase().includes(q));

    // 2. Category filter
    const matchCategory = categoryFilter === 'All' || row.category === categoryFilter;

    // 3. Status filter
    const matchStatus = statusFilter === 'All' || row.status === statusFilter;

    return matchQuery && matchCategory && matchStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, categoryFilter, statusFilter]);

  // Paginated requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));

  // Selection handlers
  const handleSelectAll = (e) => {
    const newSelected = new Set(selectedIds);
    const currentPageIds = paginatedRequests.map(r => r.id);

    if (e.target.checked) {
      // Add all visible rows on current page
      currentPageIds.forEach(id => newSelected.add(id));
    } else {
      // Remove all visible rows on current page
      currentPageIds.forEach(id => newSelected.delete(id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectRow = (id, isChecked) => {
    const newSelected = new Set(selectedIds);
    if (isChecked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isCurrentPageAllSelected = useMemo(() => {
    if (paginatedRequests.length === 0) return false;
    return paginatedRequests.every(r => selectedIds.has(r.id));
  }, [paginatedRequests, selectedIds]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test request?')) {
      setIsLoading(true);
      try {
        await testRequestService.deleteTestRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
        if (triggerNotification) {
          triggerNotification();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to delete test request.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="test-requests-container">
      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '1rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Table Main Card Panel */}
      <div className="tr-card">
        {/* Upper card options/filters */}
        <div className="tr-card-header">
          <div className="tr-filters-left">
            {/* Search inputs */}
            <div className="tr-search-wrapper">
              <FaSearch className="tr-search-icon" />
              <input
                type="text"
                className="tr-search-input"
                placeholder="Search TR number, client, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category selection filter */}
            <select
              className="tr-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Status select dropdown */}
            <select
              className="tr-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Generic filter buttons mimicking UI screenshot */}
            <button className="tr-filter-btn">
              <FaFilter />
              <span>Category</span>
            </button>

            <button className="tr-filter-btn">
              <FaCalendarAlt />
              <span>Date Range</span>
            </button>
          </div>

          <div className="tr-filters-right">
            <span className="tr-results-count">
              {filteredRequests.length} results
            </span>
            <button
              className="tr-new-request-card-btn"
              onClick={onAddNewRequestClick}
            >
              <FaPlus />
              <span>New Test Request</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="tr-table-wrapper">
          <table className="tr-table">
            <thead>
              <tr>
                <th className="tr-checkbox-cell">
                  <div className="tr-checkbox-wrapper">
                    <input
                      type="checkbox"
                      className="tr-checkbox"
                      checked={isCurrentPageAllSelected}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <th>TR Number</th>
                <th>Client / Company</th>
                <th>Title</th>
                <th>Collection Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading requests...
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No test requests found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((row) => (
                  <tr key={row.id} style={{ backgroundColor: selectedIds.has(row.id) ? '#F1F5F9' : 'transparent' }}>
                    <td className="tr-checkbox-cell">
                      <div className="tr-checkbox-wrapper">
                        <input
                          type="checkbox"
                          className="tr-checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        />
                      </div>
                    </td>
                    <td className="tr-id-cell" style={{ fontSize: '0.85rem' }}>
                      {`TR-${row.id.substring(0, 8).toUpperCase()}`}
                    </td>
                    <td>
                      <span className="tr-client-name">{row.client}</span>
                      <span className="tr-client-company">{row.company}</span>
                    </td>
                    <td className="tr-category-cell">{row.category}</td>
                    <td className="tr-date-cell">{row.date}</td>
                    <td>
                      <span className={`priority-badge normal`}>
                        Normal
                      </span>
                    </td>
                    <td>
                      <span className={`tr-status-pill ${row.status.toLowerCase().replace(' ', '-')}`}>
                        <span className="tr-status-dot"></span>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.25rem' }}
                        title="Delete Test Request"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls & Pagination */}
        <div className="tr-footer">
          <div className="tr-showing-text">
            Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
          </div>

          <div className="tr-pagination">
            <button
              className="tr-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <FaChevronLeft />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  className={`tr-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="tr-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRequestsList;
