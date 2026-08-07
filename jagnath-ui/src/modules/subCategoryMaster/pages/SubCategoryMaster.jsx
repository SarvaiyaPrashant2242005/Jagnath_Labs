import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaFolder, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { SUB_CATEGORY_ENDPOINTS, CATEGORY_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import BulkImportModal from '../../../shared/components/BulkImport/BulkImportModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';
import AddMasterButton from '../../../shared/components/InlineMasterModal/AddMasterButton';

/**
 * @component SubCategoryMaster
 * @description Master management UI for Sub Categories. Matches exact UI/UX color schemes & structure of Discipline Group Master.
 */
const SubCategoryMaster = () => {
  // Inline Master Modal State
  const [inlineModal, setInlineModal] = useState({ isOpen: false, type: null, parentData: {} });
  // State
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Form visibility and editing state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); // 'asc', 'desc', or null

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    status: 'Active'
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

  // Fetch parent Discipline Groups (Categories)
  const fetchCategories = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ limit: 1000, status: 'Active', all: 'true' });
      if (activeCompId) params.append('companyId', activeCompId);

      const response = await apiService.get(`${CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        const raw = response.data;
        const catList = Array.isArray(raw) ? raw : (raw.rows || raw.categories || raw.data || []);
        setCategories(Array.isArray(catList) ? catList : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setCategories([]);
    }
  };

  // Fetch all Sub Categories once (UI-side filtering)
  const fetchSubCategories = async () => {
    setLoading(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ limit: 5000, all: 'true' });
      if (activeCompId) params.append('companyId', activeCompId);

      const url = `${SUB_CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);

      if (response && response.data) {
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw.rows || raw.subCategories || raw.data || []);
        setSubCategories(Array.isArray(list) ? list : []);
      } else {
        setSubCategories([]);
      }
    } catch (err) {
      triggerToast('Failed to fetch sub categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pure UI-side Filtering
  const filteredSubCategories = useMemo(() => {
    return subCategories.filter(s => {
      // 1. Category / Discipline Group Filter
      if (categoryFilter) {
        const sCatId = s.categoryId || s.category_id || (s.category ? s.category.id : '');
        if (String(sCatId) !== String(categoryFilter)) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const statusStr = (s.status || 'Active').toString().toLowerCase();
        if (statusStr !== statusFilter.toLowerCase()) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const descMatch = (s.description || '').toLowerCase().includes(q);
        const catNameMatch = (s.category?.name || s.category?.categoryName || '').toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !catNameMatch) return false;
      }

      return true;
    });
  }, [subCategories, categoryFilter, statusFilter, searchQuery]);

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortField(null);
      setSortDirection(null);
    }
  };

  const renderSortableHeader = (label, field) => {
    const isSorted = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          padding: '0.75rem 1rem',
          color: '#475569',
          fontWeight: 600,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>{label}</span>
          <span style={{ fontSize: '0.7rem', color: isSorted ? '#2563eb' : '#cbd5e1', transition: 'color 0.15s' }}>
            {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const sortedSubCategories = useMemo(() => {
    if (!sortField || !sortDirection) return filteredSubCategories;
    const sorted = [...filteredSubCategories];
    sorted.sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'categoryId') {
        valA = a.category?.name || a.category?.categoryName || '';
        valB = b.category?.name || b.category?.categoryName || '';
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredSubCategories, sortField, sortDirection]);

  const totalItems = sortedSubCategories.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedSubCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSubCategories.slice(start, start + pageSize);
  }, [sortedSubCategories, currentPage, pageSize]);


  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories();
  }, [currentPage, pageSize, searchQuery, categoryFilter, statusFilter]);

  // Listen to company switch
  useEffect(() => {
    const handleCompanySwitch = () => {
      setCurrentPage(1);
      fetchCategories();
      fetchSubCategories();
    };
    window.addEventListener('companyChanged', handleCompanySwitch);
    return () => window.removeEventListener('companyChanged', handleCompanySwitch);
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : '',
      name: '',
      description: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      categoryId: item.categoryId || (item.category ? item.category.id : ''),
      name: item.name || '',
      description: item.description || '',
      status: item.status || 'Active'
    });
    setFormErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.categoryId) errors.categoryId = 'Discipline Group is required';
    if (!formData.name.trim()) errors.name = 'Sub Category Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const payload = {
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        status: formData.status,
        companyId: activeCompId
      };

      if (editingId) {
        await apiService.put(SUB_CATEGORY_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Sub Category updated successfully.', 'success');
      } else {
        await apiService.post(SUB_CATEGORY_ENDPOINTS.CREATE, payload);
        triggerToast('Sub Category created successfully.', 'success');
      }

      setIsFormOpen(false);
      fetchSubCategories();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name = '') => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await apiService.delete(SUB_CATEGORY_ENDPOINTS.DELETE(deleteModal.id));
      triggerToast('Sub Category deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchSubCategories();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete sub category.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Export handlers matching CategoryMaster
  const handleDownloadExcel = () => {
    if (filteredSubCategories.length === 0) return;
    const headers = ['Discipline Group', 'Sub Category Name', 'Description', 'Status'];
    const rows = filteredSubCategories.map(sc => [
      sc.category ? sc.category.name : 'N/A',
      sc.name,
      sc.description || 'None',
      sc.status
    ]);
    downloadExcel(headers, rows, 'Sub_Categories_Report.xlsx');
    setShowDownloadDropdown(false);
  };

  const handleDownloadCSV = () => {
    if (filteredSubCategories.length === 0) return;
    const headers = ['Discipline Group', 'Sub Category Name', 'Description', 'Status'];
    const rows = filteredSubCategories.map(sc => [
      sc.category ? sc.category.name : 'N/A',
      sc.name,
      sc.description || 'None',
      sc.status
    ]);
    downloadCSV(headers, rows, 'Sub_Categories_Report.csv');
    setShowDownloadDropdown(false);
  };

  const handleCopy = () => {
    if (subCategories.length === 0) return;
    const headers = ['Discipline Group', 'Sub Category Name', 'Description', 'Status'];
    const rows = subCategories.map(sc => [
      sc.category ? sc.category.name : 'N/A',
      sc.name,
      sc.description || 'None',
      sc.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard successfully.', 'success');
    setShowDownloadDropdown(false);
  };

  const handlePrintPDF = () => {
    if (subCategories.length === 0) return;
    const printWindow = window.open('', '_blank');
    const rows = subCategories.map(sc => `
      <tr>
        <td>${sc.category ? sc.category.name : 'N/A'}</td>
        <td>${sc.name}</td>
        <td>${sc.description || 'None'}</td>
        <td>${sc.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Sub Categories Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Sub Categories Report</h2>
          <table>
            <thead>
              <tr><th>Discipline Group</th><th>Sub Category Name</th><th>Description</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
          <FaFolder style={{ color: '#22c55e' }} />
          <span>Sub Category Master</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <>
              <button
                onClick={handleOpenCreate}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaPlus />
                <span>Sub Category</span>
              </button>
              <button
                onClick={() => setIsBulkImportOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaFileExcel />
                <span>Bulk Import</span>
              </button>
            </>
          )}

          {/* Premium Download Button */}
          <button
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            disabled={subCategories.length === 0}
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
              opacity: subCategories.length === 0 ? 0.6 : 1,
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

      {/* Form Container (Below buttons, identical UX to Category/Discipline Group Master) */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Sub Category' : 'Add New Sub Category'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>

              {/* Discipline Group Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Discipline Group *</label>
                  <AddMasterButton label="Add New Group" onClick={() => setInlineModal({ isOpen: true, type: 'category', parentData: {} })} />
                </div>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.categoryId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select Discipline Group</option>
                  {[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.categoryId}</span>
                )}
              </div>

              {/* Sub Category Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sub Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Physical Parameters"
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
                {formErrors.name && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.name}</span>
                )}
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description"
                  rows={2}
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Status Sliding Toggle Switch */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '42px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }))}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: formData.status === 'Active' ? '#22c55e' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      padding: 0
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: formData.status === 'Active' ? '25px' : '3px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: formData.status === 'Active' ? '#22c55e' : '#64748b' }}>
                    {formData.status === 'Active' ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ padding: '0.5rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Main Table view */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Table Filters */}
        <div className="master-table-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Sub Categories: {totalItems}
          </div>
          <div className="master-filter-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
            >
              <option value="">ALL DISCIPLINE GROUPS</option>
              {[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '200px' }}
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="show-on-desktop master-table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                {renderSortableHeader('DISCIPLINE GROUP', 'categoryId')}
                {renderSortableHeader('SUB CATEGORY NAME', 'name')}
                {renderSortableHeader('STATUS', 'status')}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading Sub Categories...
                  </td>
                </tr>
              ) : paginatedSubCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No Sub Categories found.
                  </td>
                </tr>
              ) : (
                paginatedSubCategories.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="company-table-row"
                  >
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#2563eb', fontWeight: 600 }}>{item.category ? item.category.name : 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '12px',
                        backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: item.status === 'Active' ? '#15803d' : '#991b1b'
                      }}>
                        {item.status}
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
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading Sub Categories...</div>
          ) : paginatedSubCategories.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No Sub Categories found.</div>
          ) : (
            <div className="master-card-grid">
              {paginatedSubCategories.map((item, index) => (
                <div key={item.id} className="master-record-card" onClick={() => handleOpenEdit(item)}>
                  <div className="master-record-card-header">
                    <div>
                      <div className="master-record-title">{item.name}</div>
                      <div className="master-record-subtitle">{item.category?.name || 'N/A'} • #{(currentPage - 1) * pageSize + index + 1}</div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: item.status === 'Active' ? '#15803d' : '#991b1b'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <div className="master-record-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                      style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }}
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

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Sub Category"
        message={
          deleteModal.name ? (
            <>Are you sure you want to delete sub category <strong>{deleteModal.name}</strong>? This action cannot be undone.</>
          ) : (
            'Are you sure you want to delete this sub category? This action cannot be undone.'
          )
        }
        confirmText="Delete Sub Category"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Bulk Excel Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        masterType="subCategory"
        existingDbRecords={subCategories}
        onImportSuccess={async (validRows) => {
          const activeCompId = localStorage.getItem('selectedCompanyId') || '';
          const res = await apiService.post(SUB_CATEGORY_ENDPOINTS.BULK_IMPORT, { rows: validRows, companyId: activeCompId });
          if (res && res.success) {
            triggerToast(res.message || 'Sub Categories imported successfully!', 'success');
            fetchSubCategories();
          } else {
            throw new Error(res?.message || 'Failed to import sub categories.');
          }
        }}
      />

      {/* Inline Master Creation Modal */}
      <InlineMasterModal
        isOpen={inlineModal.isOpen}
        onClose={() => setInlineModal({ isOpen: false, type: null, parentData: {} })}
        masterType={inlineModal.type}
        parentData={inlineModal.parentData}
        onSuccess={async (createdItem) => {
          if (inlineModal.type === 'category') {
            try {
              const res = await apiService.get(CATEGORY_ENDPOINTS.GET_ALL);
              if (res?.data) {
                const list = Array.isArray(res.data) ? res.data : [res.data];
                setCategories(list.filter(cat => cat.status === 'Active'));
              }
            } catch (e) {
              console.error("Error refreshing categories", e);
            }
            if (createdItem?.id) {
              setFormData(prev => ({ ...prev, categoryId: createdItem.id }));
            }
          }
        }}
      />
    </div>
  );
};

export default SubCategoryMaster;
