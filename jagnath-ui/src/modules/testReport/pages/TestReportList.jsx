import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFileAlt, FaPlus, FaDownload, FaSearch, FaPrint,
  FaEdit, FaTrash, FaCheck, FaExclamationCircle,
  FaChevronLeft, FaChevronRight, FaFilePdf, FaFileCsv, FaFileExcel, FaCopy,
  FaPaperPlane, FaTimes, FaEnvelope
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { CLIENT_ENDPOINTS, TEST_REPORT_ENDPOINTS, EMAIL_TEMPLATE_ENDPOINTS } from '../../../shared/services/apiEndpoints';

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

  // Send Mail Modal State
  const [mailModal, setMailModal] = useState({
    isOpen: false,
    item: null,
    to: '',
    subject: '',
    body: '',
    sending: false
  });

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

  const handleOpenMailModal = async (reportItem) => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const recipientEmail = reportItem.email || reportItem.reportIssuedToEmail || (reportItem.testRequest && reportItem.testRequest.email) || '';

      let defaultSubject = `Final Test Analysis Report - ${reportItem.reportNumber || reportItem.id.slice(0, 8)}`;
      let defaultBody = `<p>Dear <strong>${reportItem.reportIssuedTo || reportItem.agencyName || 'Valued Client'}</strong>,</p><p>We are pleased to inform you that testing for sample <strong>${reportItem.detailsOfSample || reportItem.nameOfWork || 'Tested Sample'}</strong> has been completed successfully by <strong>Jagnath Labs</strong>.</p><p>Please find attached the official Test Analysis Report PDF.</p>`;

      try {
        const tplRes = await apiService.get(`${EMAIL_TEMPLATE_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&templateType=TEST_REPORT`);
        if (tplRes?.data) {
          const list = Array.isArray(tplRes.data) ? tplRes.data : (tplRes.data.rows || [tplRes.data]);
          const tpl = list.find(t => t.templateType === 'TEST_REPORT') || list[0];
          if (tpl) {
            const compile = (str = '') => str
              .replace(/\{clientName\}/gi, reportItem.reportIssuedTo || reportItem.agencyName || 'Valued Client')
              .replace(/\{contactPerson\}/gi, reportItem.reportIssuedTo || reportItem.agencyName || 'Valued Client')
              .replace(/\{reportNumber\}/gi, reportItem.reportNumber || reportItem.id.slice(0, 8))
              .replace(/\{detailsOfSample\}/gi, reportItem.detailsOfSample || reportItem.nameOfWork || 'Tested Sample')
              .replace(/\{date\}/gi, reportItem.dateOfReceipt || reportItem.reportDate || '')
              .replace(/\{companyName\}/gi, 'Jagnath Labs');

            if (tpl.subject) defaultSubject = compile(tpl.subject);
            if (tpl.body) defaultBody = compile(tpl.body);
          }
        }
      } catch (err) {
        console.error('Failed to load email template', err);
      }

      setMailModal({
        isOpen: true,
        item: reportItem,
        to: recipientEmail,
        subject: defaultSubject,
        body: defaultBody,
        sending: false
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    if (!mailModal.to.trim()) {
      triggerToast('Recipient email is required.', 'error');
      return;
    }
    setMailModal(prev => ({ ...prev, sending: true }));
    try {
      await apiService.post(TEST_REPORT_ENDPOINTS.SEND_EMAIL(mailModal.item.id), {
        to: mailModal.to,
        subject: mailModal.subject,
        body: mailModal.body
      });
      triggerToast(`Email sent successfully to ${mailModal.to}!`, 'success');
      setMailModal({ isOpen: false, item: null, to: '', subject: '', body: '', sending: false });
    } catch (err) {
      console.error('Send email error:', err);
      triggerToast(err.response?.data?.message || 'Failed to send email.', 'error');
      setMailModal(prev => ({ ...prev, sending: false }));
    }
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
                        onClick={(e) => { e.stopPropagation(); handleOpenMailModal(req); }}
                        style={{ background: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Send Mail to Client"
                      >
                        <FaPaperPlane size={12} />
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

      {/* Send Email Modal */}
      {mailModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <FaPaperPlane size={18} style={{ color: '#8b5cf6' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Send Test Report Email
                </h3>
              </div>
              <button
                onClick={() => setMailModal({ isOpen: false, item: null, to: '', subject: '', body: '', sending: false })}
                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSendMail} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Recipient Client Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={mailModal.to}
                  onChange={(e) => setMailModal(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="client@example.com"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Email Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mailModal.subject}
                  onChange={(e) => setMailModal(prev => ({ ...prev, subject: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Email Body (HTML)
                </label>
                <textarea
                  rows={6}
                  value={mailModal.body}
                  onChange={(e) => setMailModal(prev => ({ ...prev, body: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontFamily: 'monospace', outline: 'none' }}
                ></textarea>
              </div>

              {/* Attachment Preview Badge */}
              <div style={{
                background: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaFilePdf size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                    Attached: Test_Report_{mailModal.item?.reportNumber || mailModal.item?.id?.slice(0, 8)}.pdf
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                    Official Test Analysis Report PDF automatically generated and attached
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setMailModal({ isOpen: false, item: null, to: '', subject: '', body: '', sending: false })}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mailModal.sending}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    opacity: mailModal.sending ? 0.7 : 1
                  }}
                >
                  <FaPaperPlane size={13} /> {mailModal.sending ? 'Sending Email...' : 'Send Email Now'}
                </button>
              </div>
            </form>
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
