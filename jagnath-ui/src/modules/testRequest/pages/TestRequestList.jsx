import React, { useState, useEffect, useRef } from 'react';
import { 
  FaClipboardList, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv, 
  FaFilePdf, FaPrint, FaChevronDown, FaEye, FaExclamationTriangle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REQUEST_ENDPOINTS, CATEGORY_ENDPOINTS, CLIENT_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';

const TestRequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetId: null });
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchClients();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiService.get(CATEGORY_ENDPOINTS.GET_ALL);
      if (res?.data) {
        setCategories(Array.isArray(res.data) ? res.data : (res.data.rows || []));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchClients = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CLIENT_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CLIENT_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const clList = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setClients(clList.filter(c => c.status === 'Active'));
      }
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  const getCategoryName = (req) => {
    if (req.sampleParticularName && !req.sampleParticularName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) {
      return req.sampleParticularName;
    }
    if (req.category && req.category.name) return req.category.name;
    const match = categories.find(c => c.id === req.sampleParticular);
    if (match) return match.name;
    if (req.sampleParticular && !req.sampleParticular.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) {
      return req.sampleParticular;
    }
    return 'N/A';
  };

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4 && month.length === 2 && day.length === 2) {
        return `${day}/${month}/${year}`;
      }
    }
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateStr;
  };

  // Trigger Toast helper
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all test requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter
      });
      if (activeCompId) {
        params.append('companyId', activeCompId);
      }
      if (selectedClient) {
        params.append('clientId', selectedClient);
      }
      
      const url = `${TEST_REQUEST_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        if (response.data.rows !== undefined) {
           setRequests(response.data.rows);
           setTotalItems(response.data.total);
           setTotalPages(response.data.totalPages);
        } else {
           const trList = Array.isArray(response.data) ? response.data : [response.data];
           setRequests(trList);
           setTotalItems(trList.length);
           setTotalPages(1);
        }
      } else {
        setRequests([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      triggerToast('Failed to load Test Requests', 'error');
      setRequests([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, pageSize, searchQuery, statusFilter, selectedClient]);

  // Soft delete parameter (trigger confirmation modal)
  const handleDelete = (id) => {
    setDeleteModal({ isOpen: true, targetId: id });
  };

  // Perform backend delete on confirmation
  const handleConfirmDelete = async () => {
    const id = deleteModal.targetId;
    setDeleteModal({ isOpen: false, targetId: null });
    try {
      await apiService.delete(TEST_REQUEST_ENDPOINTS.DELETE(id));
      triggerToast('Test request deleted successfully.', 'success');
      fetchRequests();
    } catch (err) {
      triggerToast(err?.messageToShow || 'Failed to delete test request.', 'error');
    }
  };

  // Export functions...
  const handleExportCSV = () => { /* Add logic */ setShowDownloadDropdown(false); };
  const handleExportExcel = () => { /* Add logic */ setShowDownloadDropdown(false); };
  const handleCopy = () => { /* Add logic */ setShowDownloadDropdown(false); };
  const handlePrintPDF = () => { /* Add logic */ setShowDownloadDropdown(false); };
  const handlePrint = () => { window.print(); setShowDownloadDropdown(false); };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification Container in Top Right Corner */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.3s ease-in-out',
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar */}
      <div className="master-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaClipboardList style={{ color: '#22c55e' }} />
          <span>Test Requests</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          <button 
            onClick={() => navigate('/test-requests/add')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FaPlus />
            <span>Test Request</span>
          </button>

          <button 
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} 
            disabled={requests.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#22c55e', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '0.5rem 1.25rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              opacity: requests.length === 0 ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
            }}
          >
            <FaDownload />
            <span>Download</span>
            <FaChevronDown style={{ fontSize: '0.75rem', opacity: 0.8 }} />
          </button>

          {showDownloadDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              width: '160px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 100,
              overflow: 'hidden',
              padding: '4px 0'
            }}>
              {[
                { name: 'Excel', action: handleExportExcel, icon: <FaFileExcel style={{ color: '#16a34a' }} /> },
                { name: 'Copy', action: handleCopy, icon: <FaCopy style={{ color: '#475569' }} /> },
                { name: 'CSV', action: handleExportCSV, icon: <FaFileCsv style={{ color: '#2563eb' }} /> },
                { name: 'PDF', action: handlePrintPDF, icon: <FaFilePdf style={{ color: '#dc2626' }} /> },
                { name: 'Print', action: handlePrint, icon: <FaPrint style={{ color: '#7c3aed' }} /> }
              ].map(opt => (
                <button
                  key={opt.name}
                  onClick={opt.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.625rem 1rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#334155',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Table view matching CompanyMaster */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Filters Row */}
        <div className="master-table-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Requests: {totalItems}
          </div>
          <div className="master-filter-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Customer / Client Filter */}
            <select
              value={selectedClient}
              onChange={(e) => { setSelectedClient(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
            >
              <option value="">ALL CUSTOMERS</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.clientName}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
            >
              <option value="ALL">ALL STATUS</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '220px' }}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="show-on-desktop master-table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CLIENT / CUSTOMER</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CATEGORY</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DATE OF RECEIPT</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COLLECTED BY</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading test requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No test requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req, index) => (
                  <tr 
                    key={req.id} 
                    onClick={() => navigate(`/test-requests/edit/${req.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="company-table-row"
                  >
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.4rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/test-requests/print/${req.id}`); }}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Print TRF PDF"
                      >
                        <FaPrint size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`#/test-requests/quotation/${req.id}`, '_blank'); }}
                        style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Generate Quotation PDF"
                      >
                        <FaFilePdf size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/test-requests/edit/${req.id}`); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{req.clientName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{getCategoryName(req)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{formatDateDDMMYYYY(req.dateOfReceipt || req.dateOfCollection)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{req.sampleCollectedBy || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '12px',
                        backgroundColor: req.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: req.status === 'Active' ? '#15803d' : '#991b1b'
                      }}>
                        {req.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="show-on-mobile">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading test requests...
            </div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No test requests found.
            </div>
          ) : (
            <div className="master-card-grid">
              {requests.map((req, index) => (
                <div key={req.id} className="master-record-card" onClick={() => navigate(`/test-requests/edit/${req.id}`)}>
                  <div className="master-record-card-header">
                    <div>
                      <div className="master-record-title">{req.clientName || 'N/A'}</div>
                      <div className="master-record-subtitle">#{ (currentPage - 1) * pageSize + index + 1 } • {getCategoryName(req)}</div>
                    </div>
                    <span style={{ 
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      backgroundColor: req.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: req.status === 'Active' ? '#15803d' : '#991b1b'
                    }}>
                      {req.status || 'Active'}
                    </span>
                  </div>

                  <div className="master-record-details">
                    <div className="master-record-detail-item">
                      <span className="master-record-label">Date Receipt</span>
                      <span className="master-record-value">{formatDateDDMMYYYY(req.dateOfReceipt || req.dateOfCollection)}</span>
                    </div>
                    <div className="master-record-detail-item">
                      <span className="master-record-label">Collected By</span>
                      <span className="master-record-value">{req.sampleCollectedBy || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="master-record-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/test-requests/print/${req.id}`); }}
                      style={{ background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FaPrint size={12} /> Print
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/test-requests/edit/${req.id}`); }}
                      style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(req.id); }}
                      style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FaTrash size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => setDeleteModal({ isOpen: false, targetId: null })}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxSizing: 'border-box'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FaExclamationTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Delete Test Request</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>This action cannot be undone.</p>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to delete this test request? All associated parameter analysis records will be permanently removed.
            </div>

            {/* Modal Footer/Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetId: null })}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRequestList;
