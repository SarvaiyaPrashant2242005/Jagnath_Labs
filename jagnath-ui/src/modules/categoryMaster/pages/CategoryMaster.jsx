import React, { useState, useEffect, useRef } from 'react';
import { 
  FaFolder, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv, 
  FaFilePdf, FaPrint, FaChevronDown 
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { CATEGORY_ENDPOINTS, COMPANY_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import { copyTextToClipboard, downloadCSV } from '../../../shared/utils/exportUtils';

const CategoryMaster = () => {
  // Category & Company states
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

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
    name: '',
    description: '',
    status: 'Active',
    companyName: ''
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

  // Fetch all companies associated with user
  const fetchCompanies = async () => {
    try {
      const response = await apiService.get(COMPANY_ENDPOINTS.GET_MY);
      if (response && response.data) {
        const companyList = Array.isArray(response.data) ? response.data : [response.data];
        setCompanies(companyList);
        return companyList;
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
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
      
      const url = `${CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        if (response.data.rows !== undefined) {
           setCategories(response.data.rows);
           setTotalItems(response.data.total);
           setTotalPages(response.data.totalPages);
        } else {
           const categoryList = Array.isArray(response.data) ? response.data : [response.data];
           setCategories(categoryList);
           setTotalItems(categoryList.length);
           setTotalPages(1);
        }
      } else {
        setCategories([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch categories.', 'error');
      } else {
        setCategories([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchCategories();
    };
    initializeData();

    const handleCompanyChange = () => {
      fetchCategories();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Category Name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    const activeCompId = localStorage.getItem('selectedCompanyId');
    const matchedComp = companies.find(c => c.id === activeCompId);
    const defaultCompanyName = matchedComp ? (matchedComp.companyName || matchedComp.company_name) : (companies.length > 0 ? (companies[0].companyName || companies[0].company_name) : '');

    setFormData({
      name: '',
      description: '',
      status: 'Active',
      companyName: defaultCompanyName
    });
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (category) => {
    setFormData({
      name: category.name || '',
      description: category.description || '',
      status: category.status || 'Active',
      companyName: category.companyName || (category.company ? (category.company.companyName || category.company.company_name) : '')
    });
    setFormErrors({});
    setEditingId(category.id);
    setIsFormOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    const activeCompId = localStorage.getItem('selectedCompanyId');
    const matchedComp = companies.find(c => c.id === activeCompId);
    const activeCompanyName = matchedComp ? (matchedComp.companyName || matchedComp.company_name) : '';

    if (!activeCompanyName && !formData.companyName) {
      triggerToast('Please select a company in the top header first.', 'error');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      companyName: activeCompanyName || formData.companyName
    };

    try {
      if (editingId) {
        await apiService.put(CATEGORY_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Category updated successfully.', 'success');
      } else {
        await apiService.post(CATEGORY_ENDPOINTS.CREATE, payload);
        triggerToast('Category created successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status inline
  const handleToggleStatus = async (cat, e) => {
    e.stopPropagation();
    const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const payload = {
        name: cat.name,
        description: cat.description,
        status: newStatus,
        companyName: cat.companyName
      };
      await apiService.put(CATEGORY_ENDPOINTS.UPDATE(cat.id), payload);
      triggerToast(`Status changed to ${newStatus}.`, 'success');
      fetchCategories();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to toggle status.', 'error');
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiService.delete(CATEGORY_ENDPOINTS.DELETE(id));
      triggerToast('Category deleted successfully.', 'success');
      fetchCategories();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete category.', 'error');
    }
  };

  const handleDownloadCSV = () => {
    if (categories.length === 0) return;
    const headers = ['Category Name', 'Description', 'Status'];
    const rows = categories.map(c => [
      c.name,
      c.description || 'None',
      c.status
    ]);
    downloadCSV(headers, rows, 'Categories_Report.csv');
    setShowDownloadDropdown(false);
  };

  const handleDownloadExcel = () => {
    if (categories.length === 0) return;
    const headers = ['Category Name', 'Description', 'Status'];
    const rows = categories.map(c => [
      c.name,
      c.description || 'None',
      c.status
    ]);
    downloadCSV(headers, rows, 'Categories_Report.csv'); // Download as CSV to prevent insecure download blocks
    setShowDownloadDropdown(false);
  };

  const handleCopy = () => {
    if (categories.length === 0) return;
    const headers = ['Category Name', 'Description', 'Status'];
    const rows = categories.map(c => [
      c.name,
      c.description || 'None',
      c.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    copyTextToClipboard(text, 
      () => triggerToast('Copied to clipboard successfully.', 'success'),
      () => triggerToast('Failed to copy text.', 'error')
    );
    setShowDownloadDropdown(false);
  };

  const handlePrintPDF = () => {
    if (categories.length === 0) return;
    const printWindow = window.open('', '_blank');
    const rows = categories.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.description || 'None'}</td>
        <td>${c.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Categories Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Categories Report</h2>
          <table>
            <thead>
              <tr><th>Category Name</th><th>Description</th><th>Status</th></tr>
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

  // Print trigger
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
          <span>Categories Master</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <button 
              onClick={handleOpenCreate} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <FaPlus />
              <span>Category</span>
            </button>
          )}

          {/* Premium Download Button */}
          <button 
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} 
            disabled={categories.length === 0}
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
              opacity: categories.length === 0 ? 0.6 : 1,
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

      {/* Form Container */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Category Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Category Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Chemical Parameters"
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
                  placeholder="Optional description of tests under this category"
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
            Total Categories: {totalItems}
          </div>
          <div className="master-filter-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
        <div className="show-on-desktop master-table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CATEGORY NAME</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr 
                    key={category.id} 
                    onClick={() => handleOpenEdit(category)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="company-table-row"
                  >
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(category); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{category.categoryName || category.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '12px',
                        backgroundColor: category.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: category.status === 'Active' ? '#15803d' : '#991b1b'
                      }}>
                        {category.status}
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
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No categories found.
            </div>
          ) : (
            <div className="master-card-grid">
              {categories.map((category, index) => (
                <div key={category.id} className="master-record-card" onClick={() => handleOpenEdit(category)}>
                  <div className="master-record-card-header">
                    <div>
                      <div className="master-record-title">{category.categoryName || category.name}</div>
                      <div className="master-record-subtitle">#{ (currentPage - 1) * pageSize + index + 1 }</div>
                    </div>
                    <span style={{ 
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '12px',
                      backgroundColor: category.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: category.status === 'Active' ? '#15803d' : '#991b1b'
                    }}>
                      {category.status}
                    </span>
                  </div>

                  <div className="master-record-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(category); }}
                      style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FaEdit size={12} /> Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
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

    </div>
  );
};

export default CategoryMaster;
