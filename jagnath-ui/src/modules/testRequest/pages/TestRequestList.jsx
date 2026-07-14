import React, { useState, useEffect, useRef } from 'react';
import { 
  FaClipboardList, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv, 
  FaFilePdf, FaPrint, FaChevronDown, FaEye
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import { TEST_REQUEST_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';

const TestRequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
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
  const dropdownRef = useRef(null);

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
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  // Soft delete parameter (if API is available, assuming remove exists)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test request?')) return;
    try {
      await apiService.delete(`${TEST_REQUEST_ENDPOINTS.DELETE}/${id}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaClipboardList style={{ color: '#22c55e' }} />
          <span>Test Requests</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          <button 
            onClick={() => window.location.hash = '#/new-request'} 
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Requests: {totalItems}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

        {/* Data Grid Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>REPORT NO</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CLIENT</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COMPANY</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No test requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r, index) => (
                  <tr 
                    key={r.id} 
                    onClick={() => window.location.hash = `#/requests/edit/${r.id}`}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.location.hash = `#/requests/edit/${r.id}`; }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`#/test-requests/print/${r.id}`, '_blank'); }}
                        style={{ background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Print / PDF Preview"
                      >
                        <FaFilePdf size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{r.reportNumber || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                      {r.clientName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {r.companyName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        backgroundColor: (r.status || 'Active') === 'Active' ? '#dcfce7' : '#f1f5f9', 
                        color: (r.status || 'Active') === 'Active' ? '#16a34a' : '#64748b' 
                      }}>
                        {r.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};

export default TestRequestList;
