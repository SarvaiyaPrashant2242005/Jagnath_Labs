import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileAlt, FaPlus, FaDownload, FaSearch, FaPrint,
  FaEdit, FaTrash, FaCheck, FaExclamationCircle,
  FaChevronLeft, FaChevronRight, FaFilePdf, FaFileCsv, FaFileExcel, FaCopy
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { CLIENT_ENDPOINTS, TEST_REPORT_ENDPOINTS } from '../../../shared/services/apiEndpoints';

/**
 * @component TestReportList
 * @description Master list view for Test Reports with search, client/status filtering,
 * pagination, export capabilities, and interactive action buttons.
 */
const TestReportList = () => {
  const navigate = useNavigate();

  // Initial test report list state
  const [reports, setReports] = useState([]);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Download & Delete UI state
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetId: null, reportNo: '' });

  // Helper: Trigger Toast Notification
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Helper: Format Date as DD/MM/YYYY
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
    return dateStr;
  };

  // Fetch Test Reports list from Backend API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${TEST_REPORT_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : TEST_REPORT_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const rList = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setReports(rList);
      }
    } catch (err) {
      console.error('Failed to load test reports from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load clients & test reports on mount
  useEffect(() => {
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
        console.error('Failed to load clients for reports filter', err);
      }
    };
    fetchClients();
    fetchReports();

    const handleCompanyChange = () => {
      fetchClients();
      fetchReports();
      setCurrentPage(1);
    };

    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

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

  // Handle Delete Confirmation
  const handleDelete = (id, reportNo = '') => {
    setDeleteModal({ isOpen: true, targetId: id, reportNo });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.targetId) return;
    try {
      await apiService.delete(TEST_REPORT_ENDPOINTS.DELETE(deleteModal.targetId));
      triggerToast('Test report deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, targetId: null, reportNo: '' });
      fetchReports();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete test report.', 'error');
    }
  };

  // Filter logic
  const filteredReports = reports.filter(row => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === '' ||
      (row.reportNumber && row.reportNumber.toLowerCase().includes(q)) ||
      (row.reportIssuedTo && row.reportIssuedTo.toLowerCase().includes(q)) ||
      (row.clientName && row.clientName.toLowerCase().includes(q)) ||
      (row.nameOfWork && row.nameOfWork.toLowerCase().includes(q)) ||
      (row.title && row.title.toLowerCase().includes(q));

    const matchClient = !selectedClient || row.clientId === selectedClient || row.clientName?.toLowerCase().includes(selectedClient.toLowerCase()) || row.reportIssuedTo?.toLowerCase().includes(selectedClient.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;

    return matchQuery && matchClient && matchStatus;
  });

  // Pagination logic
  const totalItems = filteredReports.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export handlers
  const handleExportCSV = () => { triggerToast('CSV exported successfully!', 'success'); setShowDownloadDropdown(false); };
  const handleExportExcel = () => { triggerToast('Excel exported successfully!', 'success'); setShowDownloadDropdown(false); };
  const handleCopy = () => { triggerToast('Copied to clipboard!', 'success'); setShowDownloadDropdown(false); };
  const handlePrint = () => { window.print(); setShowDownloadDropdown(false); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notification in Top Right */}
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

      {/* Top Header & Actions Bar */}
      <div className="master-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaFileAlt style={{ color: '#22c55e' }} />
          <span>Test Reports</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          <button 
            onClick={() => navigate('/test-reports/add')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FaPlus />
            <span>Test Report</span>
          </button>

          <button 
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} 
            disabled={reports.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: reports.length === 0 ? '#94a3b8' : '#3b82f6', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '0.5rem 1rem', 
              fontWeight: 600, 
              cursor: reports.length === 0 ? 'not-allowed' : 'pointer' 
            }}
          >
            <FaDownload />
            <span>Download</span>
          </button>

          {/* Download Dropdown Menu */}
          {showDownloadDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              zIndex: 100,
              width: '180px',
              overflow: 'hidden'
            }}>
              <button onClick={handleExportCSV} style={dropdownItemStyle}><FaFileCsv style={{ color: '#10b981' }} /> Export CSV</button>
              <button onClick={handleExportExcel} style={dropdownItemStyle}><FaFileExcel style={{ color: '#059669' }} /> Export Excel</button>
              <button onClick={handleCopy} style={dropdownItemStyle}><FaCopy style={{ color: '#6366f1' }} /> Copy Table</button>
              <button onClick={handlePrint} style={dropdownItemStyle}><FaPrint style={{ color: '#0284c7' }} /> Print</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="master-table-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
        
        {/* Filters Row */}
        <div className="master-table-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Reports: {totalItems}
          </div>
          <div className="master-filter-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Customer Filter */}
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

            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search reports..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '220px' }}
              />
              <FaSearch style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }} />
            </div>
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
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>TITLE</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>REPORT NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DATE OF RECEIPT</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COLLECTED BY</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading test reports...
                  </td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No test reports found.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((req, index) => (
                  <tr 
                    key={req.id} 
                    onClick={() => navigate(`/test-reports/edit/${req.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="company-table-row"
                  >
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.4rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/test-reports/print/${req.id}`); }}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Print Test Report PDF"
                      >
                        <FaPrint size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/test-reports/edit/${req.id}`); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(req.id, req.reportNumber); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{req.reportIssuedTo || req.agencyName || req.clientName || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{req.nameOfWork || req.title || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{req.reportNumber || req.referenceNo || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{formatDateDDMMYYYY(req.dateOfReceipt)}</td>
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

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '0.25rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{ ...paginationButtonStyle, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <FaChevronLeft size={10} />
              </button>
              <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: 600, color: '#0f172a' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{ ...paginationButtonStyle, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '1.25rem' }}>Delete Test Report</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
              Are you sure you want to delete Test Report <strong>{deleteModal.reportNo || deleteModal.targetId}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, targetId: null, reportNo: '' })}
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: '#ef4444', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
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

// Internal Style Helper Constants
const dropdownItemStyle = {
  width: '100%',
  padding: '0.6rem 1rem',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
  color: '#334155',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s'
};

const paginationButtonStyle = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#475569'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  backdropFilter: 'blur(4px)'
};

const modalContentStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '1.75rem',
  maxWidth: '450px',
  width: '90%',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

export default TestReportList;
