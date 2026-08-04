import React, { useState, useEffect, useRef } from 'react';
import {
  FaShieldAlt, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { CAUTION_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

const CautionMaster = () => {
  const [cautions, setCautions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Form visibility and editing state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reportType: 'BOTH',
    status: 'Active',
    sortOrder: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch all Cautions
  const fetchCautions = async () => {
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

      const url = `${CAUTION_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);

      if (response && response.data) {
        if (response.data.rows !== undefined) {
          setCautions(response.data.rows);
          setTotalItems(response.data.total);
          setTotalPages(response.data.totalPages);
        } else {
          const list = Array.isArray(response.data) ? response.data : [response.data];
          setCautions(list);
          setTotalItems(list.length);
          setTotalPages(1);
        }
      } else {
        setCautions([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch caution records.', 'error');
      } else {
        setCautions([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCautions();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    const handleCompanyChange = () => {
      fetchCautions();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Caution title is required.';
    if (!formData.description.trim()) errors.description = 'Description / text is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open form for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      reportType: 'BOTH',
      status: 'Active',
      sortOrder: cautions.length + 1
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      reportType: item.reportType || item.report_type || 'BOTH',
      status: item.status === true || item.status === 'Active' ? 'Active' : 'Inactive',
      sortOrder: item.sortOrder || item.sort_order || 1
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    const activeCompId = localStorage.getItem('selectedCompanyId') || '';
    const payload = {
      title: formData.title,
      description: formData.description,
      reportType: formData.reportType,
      status: formData.status === 'Active',
      sortOrder: formData.sortOrder,
      companyId: activeCompId || undefined
    };

    try {
      if (editingId) {
        await apiService.put(CAUTION_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Caution record updated successfully.', 'success');
      } else {
        await apiService.post(CAUTION_ENDPOINTS.CREATE, payload);
        triggerToast('Caution record created successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchCautions();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status inline
  const handleToggleStatus = async (item, e) => {
    e.stopPropagation();
    const isCurrentlyActive = item.status === true || item.status === 'Active';
    const newStatus = !isCurrentlyActive;
    try {
      await apiService.put(CAUTION_ENDPOINTS.UPDATE(item.id), { status: newStatus });
      triggerToast(`Status changed to ${newStatus ? 'Active' : 'Inactive'}.`, 'success');
      fetchCautions();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to toggle status.', 'error');
    }
  };

  // Delete Handler
  const handleDelete = (id, name = '') => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await apiService.delete(CAUTION_ENDPOINTS.DELETE(deleteModal.id));
      triggerToast('Caution record deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchCautions();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete Caution record.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Export handlers
  const handleDownloadCSV = () => {
    if (cautions.length === 0) return;
    const headers = ['Title', 'Description', 'Report Type', 'Status'];
    const rows = cautions.map(c => [
      c.title,
      c.description || 'None',
      c.reportType || c.report_type || 'BOTH',
      (c.status === true || c.status === 'Active') ? 'Active' : 'Inactive'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Caution_Master_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadDropdown(false);
  };

  const handleDownloadExcel = () => {
    if (cautions.length === 0) return;
    const headers = ['Title', 'Description', 'Report Type', 'Status'];
    const rows = cautions.map(c => [
      c.title,
      c.description || 'None',
      c.reportType || c.report_type || 'BOTH',
      (c.status === true || c.status === 'Active') ? 'Active' : 'Inactive'
    ]);

    const htmlTable = `
      <table border="1">
        <thead>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(val => `<td>${val}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
    const excelBlob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
    const excelUrl = URL.createObjectURL(excelBlob);
    const link = document.createElement("a");
    link.setAttribute("href", excelUrl);
    link.setAttribute("download", "Caution_Master_Report.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadDropdown(false);
  };

  const handleCopy = () => {
    if (cautions.length === 0) return;
    const headers = ['Title', 'Description', 'Report Type', 'Status'];
    const rows = cautions.map(c => [
      c.title,
      c.description || 'None',
      c.reportType || c.report_type || 'BOTH',
      (c.status === true || c.status === 'Active') ? 'Active' : 'Inactive'
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard successfully.', 'success');
    setShowDownloadDropdown(false);
  };

  const handlePrintPDF = () => {
    if (cautions.length === 0) return;
    const printWindow = window.open('', '_blank');
    const rows = cautions.map(c => `
      <tr>
        <td>${c.title}</td>
        <td>${c.description || 'None'}</td>
        <td>${c.reportType || c.report_type || 'BOTH'}</td>
        <td>${(c.status === true || c.status === 'Active') ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Caution Master Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Caution Master Report</h2>
          <table>
            <thead>
              <tr><th>Title</th><th>Description</th><th>Report Type</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowDownloadDropdown(false);
  };

  const handlePrint = () => {
    window.print();
    setShowDownloadDropdown(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toast Notification Container */}
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
          transition: 'all 0.3s ease-in-out'
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar */}
      <div className="master-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaShieldAlt style={{ color: '#22c55e' }} />
          <span>Caution Master</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <button
              onClick={handleOpenCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <FaPlus />
              <span>Caution</span>
            </button>
          )}

          {/* Premium Download Button */}
          <button
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            disabled={cautions.length === 0}
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
              opacity: cautions.length === 0 ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
            }}
          >
            <FaDownload />
            <span>Download</span>
            <FaChevronDown style={{ fontSize: '0.75rem', opacity: 0.8 }} />
          </button>

          {/* Download Dropdown List Container */}
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
                { name: 'Excel', action: handleDownloadExcel, icon: <FaFileExcel style={{ color: '#16a34a' }} /> },
                { name: 'Copy', action: handleCopy, icon: <FaCopy style={{ color: '#475569' }} /> },
                { name: 'CSV', action: handleDownloadCSV, icon: <FaFileCsv style={{ color: '#2563eb' }} /> },
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

      {/* Inline Form Container Card (Matches Category Master / Parameter Master format) */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Caution Record' : 'Add New Caution Record'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

            {/* Caution Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                Caution Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter caution title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: formErrors.title ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {formErrors.title && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.title}</span>}
            </div>

            {/* Report Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Report Type</label>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="reportType"
                    value="REGULAR"
                    checked={formData.reportType === 'REGULAR'}
                    onChange={() => setFormData(prev => ({ ...prev, reportType: 'REGULAR' }))}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  Regular
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="reportType"
                    value="NABL"
                    checked={formData.reportType === 'NABL'}
                    onChange={() => setFormData(prev => ({ ...prev, reportType: 'NABL' }))}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  NABL
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="reportType"
                    value="BOTH"
                    checked={formData.reportType === 'BOTH'}
                    onChange={() => setFormData(prev => ({ ...prev, reportType: 'BOTH' }))}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  Both
                </label>
              </div>
            </div>

            {/* Status Radio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Status</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                    style={{ accentColor: '#22c55e' }}
                  />
                  Active
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))}
                    style={{ accentColor: '#ef4444' }}
                  />
                  Inactive
                </label>
              </div>
            </div>

            {/* Description / Text (Spans Full Width) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                Description / Text <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter cautionary notice details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: formErrors.description ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              {formErrors.description && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.description}</span>}
            </div>

            {/* Action Buttons */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#22c55e',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Caution' : 'Save Caution'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search cautions..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              maxWidth: '350px',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '0.9rem',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem 0.85rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)'
            }}
          >
            <FaTrash size={12} /> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
        <div className="master-table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 0.75rem', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={cautions.length > 0 && selectedIds.length === cautions.length}
                    onChange={handleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#475569', width: '22%' }}>Caution Title</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#475569', width: '42%' }}>Description</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#475569', width: '12%' }}>Report Type</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#475569', width: '10%' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#475569', width: '14%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading Cautions...
                  </td>
                </tr>
              ) : cautions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No Caution records found.
                  </td>
                </tr>
              ) : (
                cautions.map((item) => {
                  const isActive = item.status === true || item.status === 'Active';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {item.title}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: item.reportType === 'NABL' ? '#fef3c7' : item.reportType === 'REGULAR' ? '#e0f2fe' : '#f3e8ff',
                          color: item.reportType === 'NABL' ? '#92400e' : item.reportType === 'REGULAR' ? '#075985' : '#6b21a8'
                        }}>
                          {item.reportType || item.report_type || 'BOTH'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#166534' : '#991b1b'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#22c55e' : '#ef4444' }}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', alignItems: 'center' }}>
                          <button
                            onClick={(e) => handleToggleStatus(item, e)}
                            title={isActive ? 'Deactivate' : 'Activate'}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isActive ? '#16a34a' : '#94a3b8', fontSize: '1.1rem' }}
                          >
                            {isActive ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            title="Edit"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            title="Delete"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </div>

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Caution Record"
        message={
          deleteModal.name ? (
            <>Are you sure you want to delete caution record <strong>{deleteModal.name}</strong>? This action cannot be undone.</>
          ) : (
            'Are you sure you want to delete this Caution record? This action cannot be undone.'
          )
        }
        confirmText="Delete Caution"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

    </div>
  );
};

export default CautionMaster;
