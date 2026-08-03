import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSlidersH, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv, 
  FaFilePdf, FaPrint, FaChevronDown, FaTimes 
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { PARAMETER_ENDPOINTS, COMPANY_ENDPOINTS, CATEGORY_ENDPOINTS, SUB_CATEGORY_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import BulkImportModal from '../../../shared/components/BulkImport/BulkImportModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

const ParameterMaster = () => {
  // Parameter, Company & Category states
  const [parameters, setParameters] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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
    parameterName: '',
    description: '',
    testMethod: '',
    status: 'Active',
    companyName: '',
    categoryId: '',
    subCategoryId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Quick Add Category Modal State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Trigger Toast helper
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // Quick Add Category Handler
  const handleCreateCategoryDirect = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      triggerToast('Category name is required.', 'error');
      return;
    }

    try {
      setIsSavingCat(true);
      const res = await apiService.post(CATEGORY_ENDPOINTS.CREATE, {
        name: newCatName.trim(),
        status: 'Active'
      });

      const createdCat = res?.data;
      triggerToast('New Category created successfully!', 'success');
      setIsAddCatModalOpen(false);
      setNewCatName('');

      // Refresh categories list for dropdown
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CATEGORY_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CATEGORY_ENDPOINTS.GET_ALL;
      const response = await apiService.get(url);
      if (response && response.data) {
        const freshCategories = Array.isArray(response.data) ? response.data : [response.data];
        const activeCats = freshCategories.filter(cat => cat.status === 'Active');
        setCategoriesList(activeCats);

        // Auto select newly created category
        if (createdCat?.id) {
          setFormData(prev => ({ ...prev, categoryId: createdCat.id }));
        } else {
          const match = activeCats.find(c => (c.categoryName || c.name).toLowerCase() === newCatName.trim().toLowerCase());
          if (match) {
            setFormData(prev => ({ ...prev, categoryId: match.id }));
          }
        }
      }
    } catch (err) {
      triggerToast(err.message || 'Failed to create category.', 'error');
    } finally {
      setIsSavingCat(false);
    }
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

  // Fetch categories to populate dropdown options
  const fetchCategoriesForDropdown = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CATEGORY_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CATEGORY_ENDPOINTS.GET_ALL;
      const response = await apiService.get(url);
      if (response && response.data) {
        const categories = Array.isArray(response.data) ? response.data : [response.data];
        setCategoriesList(categories.filter(cat => cat.status === 'Active'));
      } else {
        setCategoriesList([]);
      }
    } catch (err) {
      setCategoriesList([]);
    }
  };

  // Fetch sub categories to populate dropdown options
  const fetchSubCategoriesForDropdown = async (catId = '') => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ status: 'Active', limit: 100 });
      if (activeCompId) params.append('companyId', activeCompId);
      if (catId) params.append('categoryId', catId);
      
      const response = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        const subs = Array.isArray(response.data) ? response.data : [response.data];
        setSubCategoriesList(subs.filter(s => s.status === 'Active'));
      } else {
        setSubCategoriesList([]);
      }
    } catch (err) {
      setSubCategoriesList([]);
    }
  };

  useEffect(() => {
    fetchSubCategoriesForDropdown(formData.categoryId);
  }, [formData.categoryId, isFormOpen]);

  // Fetch all parameters
  const fetchParameters = async () => {
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
      
      const url = `${PARAMETER_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        if (response.data.rows !== undefined) {
           setParameters(response.data.rows);
           setTotalItems(response.data.total);
           setTotalPages(response.data.totalPages);
        } else {
           const paramList = Array.isArray(response.data) ? response.data : [response.data];
           setParameters(paramList);
           setTotalItems(paramList.length);
           setTotalPages(1);
        }
      } else {
        setParameters([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch parameters.', 'error');
      } else {
        setParameters([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchCategoriesForDropdown();
      await fetchParameters();
    };
    initializeData();

    const handleCompanyChange = () => {
      fetchCategoriesForDropdown();
      fetchParameters();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required.';
    }
    if (!formData.parameterName.trim()) {
      errors.parameterName = 'Parameter Name is required.';
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
    const defaultCompanyName = companies.length > 0 ? (companies[0].companyName || companies[0].company_name) : '';
    const initialCatId = categoriesList.length > 0 ? categoriesList[0].id : '';
    if (initialCatId) {
      fetchSubCategoriesForDropdown(initialCatId);
    }
    setFormData({
      parameterName: '',
      description: '',
      testMethod: '',
      status: 'Active',
      companyName: defaultCompanyName,
      categoryId: initialCatId,
      subCategoryId: ''
    });
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (param) => {
    if (param.categoryId) {
      fetchSubCategoriesForDropdown(param.categoryId);
    }
    setFormData({
      parameterName: param.parameterName || '',
      description: param.description || '',
      testMethod: param.testMethod || '',
      status: param.status || 'Active',
      companyName: param.companyName || (param.company ? (param.company.companyName || param.company.company_name) : ''),
      categoryId: param.categoryId || '',
      subCategoryId: param.subCategoryId || ''
    });
    setFormErrors({});
    setEditingId(param.id);
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
      parameterName: formData.parameterName,
      description: formData.description,
      testMethod: formData.testMethod,
      status: formData.status,
      companyName: activeCompanyName || formData.companyName,
      categoryId: formData.categoryId || null,
      subCategoryId: formData.subCategoryId || null
    };

    try {
      if (editingId) {
        await apiService.put(PARAMETER_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Parameter updated successfully.', 'success');
      } else {
        await apiService.post(PARAMETER_ENDPOINTS.CREATE, payload);
        triggerToast('Parameter created successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchParameters();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status inline
  const handleToggleStatus = async (param, e) => {
    e.stopPropagation();
    const newStatus = param.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const payload = {
        parameterName: param.parameterName,
        description: param.description,
        testMethod: param.testMethod,
        status: newStatus,
        companyName: param.companyName,
        categoryId: param.categoryId
      };
      await apiService.put(PARAMETER_ENDPOINTS.UPDATE(param.id), payload);
      triggerToast(`Status changed to ${newStatus}.`, 'success');
      fetchParameters();
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
      await apiService.delete(PARAMETER_ENDPOINTS.DELETE(deleteModal.id));
      triggerToast('Parameter deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchParameters();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete parameter.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export
  const handleDownloadCSV = () => {
    if (parameters.length === 0) return;
    const headers = ['Parameter Name', 'Category', 'Test Method', 'Description', 'Status'];
    const rows = parameters.map(p => [
      p.parameterName,
      p.categoryName || 'Unassigned',
      p.testMethod || 'N/A',
      p.description || 'None',
      p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Parameters_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadDropdown(false);
  };

  // Excel Export
  const handleDownloadExcel = () => {
    if (parameters.length === 0) return;
    const headers = ['Parameter Name', 'Category', 'Test Method', 'Description', 'Status'];
    const rows = parameters.map(p => [
      p.parameterName,
      p.categoryName || 'Unassigned',
      p.testMethod || 'N/A',
      p.description || 'None',
      p.status
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
    link.setAttribute("download", "Parameters_Report.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadDropdown(false);
  };

  // Copy to Clipboard
  const handleCopy = () => {
    if (parameters.length === 0) return;
    const headers = ['Parameter Name', 'Category', 'Test Method', 'Description', 'Status'];
    const rows = parameters.map(p => [
      p.parameterName,
      p.categoryName || 'Unassigned',
      p.testMethod || 'N/A',
      p.description || 'None',
      p.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard successfully.', 'success');
    setShowDownloadDropdown(false);
  };

  // PDF Export
  const handlePrintPDF = () => {
    if (parameters.length === 0) return;
    const printWindow = window.open('', '_blank');
    const headers = ['Parameter Name', 'Category', 'Test Method', 'Description', 'Status'];
    const rows = parameters.map(p => `
      <tr>
        <td>${p.parameterName}</td>
        <td>${p.categoryName || 'Unassigned'}</td>
        <td>${p.testMethod || 'N/A'}</td>
        <td>${p.description || 'None'}</td>
        <td>${p.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Parameters Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Parameters Report</h2>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
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
          <FaSlidersH style={{ color: '#22c55e' }} />
          <span>Parameters Master</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <>
              <button 
                onClick={handleOpenCreate} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaPlus />
                <span>Parameter</span>
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
            disabled={parameters.length === 0}
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
              opacity: parameters.length === 0 ? 0.6 : 1,
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

      {/* Form Container (Below buttons, same as client master) */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Parameter' : 'Add New Parameter'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Discipline Group Dropdown & Quick Add Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Discipline Group *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddCatModalOpen(true)}
                    style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <FaPlus size={10} /> Add New Group
                  </button>
                </div>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => {
                    handleInputChange(e);
                    fetchSubCategoriesForDropdown(e.target.value);
                  }}
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.categoryId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select Discipline Group</option>
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.categoryId}</span>
                )}
              </div>

              {/* Sub Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sub Category</label>
                <select
                  name="subCategoryId"
                  value={formData.subCategoryId}
                  onChange={handleInputChange}
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="">Select Sub Category</option>
                  {subCategoriesList.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Parameter Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Parameter Name *</label>
                <input 
                  type="text" 
                  name="parameterName"
                  value={formData.parameterName}
                  onChange={handleInputChange}
                  placeholder="e.g. pH Level"
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.parameterName ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
                {formErrors.parameterName && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.parameterName}</span>
                )}
              </div>

              {/* Test Method */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Test Method</label>
                <input 
                  type="text"
                  name="testMethod"
                  value={formData.testMethod}
                  onChange={handleInputChange}
                  placeholder="e.g. APHA, 23rd Edition 2017/4500-H-B"
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description of the test parameter"
                  rows={2}
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Status sliding toggle switch */}
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

      {/* Main view container */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Parameters: {totalItems}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '0.25rem' }}>
              <button 
                onClick={() => setViewMode('table')}
                style={{ padding: '0.35rem 0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'table' ? '#ffffff' : 'transparent', color: viewMode === 'table' ? '#0f172a' : '#64748b', fontWeight: 600, boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Table
              </button>
              <button 
                onClick={() => setViewMode('cards')}
                style={{ padding: '0.35rem 0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', background: viewMode === 'cards' ? '#ffffff' : 'transparent', color: viewMode === 'cards' ? '#0f172a' : '#64748b', fontWeight: 600, boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Cards
              </button>
            </div>
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
              placeholder="Search parameter name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '220px' }}
            />
          </div>
        </div>

        {/* Data Grid Table or Cards */}
        {viewMode === 'table' ? (
        <>
          {/* Desktop Table View */}
          <div className="show-on-desktop master-table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>PARAMETER NAME</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DISCIPLINE GROUP</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SUB CATEGORY</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>TEST METHOD</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      Loading parameters...
                    </td>
                  </tr>
                ) : parameters.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No parameters found.
                    </td>
                  </tr>
                ) : (
                  parameters.map((param, index) => (
                    <tr 
                      key={param.id} 
                      onClick={() => handleOpenEdit(param)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                      className="company-table-row"
                    >
                      <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(param); }}
                          style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(param.id, param.parameterName); }}
                          style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{param.parameterName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{param.categoryName || (param.category ? param.category.categoryName : 'Unassigned')}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{param.subCategoryName || 'Unassigned'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{param.testMethod || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.125rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '12px',
                          backgroundColor: param.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: param.status === 'Active' ? '#15803d' : '#991b1b'
                        }}>
                          {param.status}
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
                Loading parameters...
              </div>
            ) : parameters.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No parameters found.
              </div>
            ) : (
              <div className="master-card-grid">
                {parameters.map((param, index) => (
                  <div key={param.id} className="master-record-card" onClick={() => handleOpenEdit(param)}>
                    <div className="master-record-card-header">
                      <div>
                        <div className="master-record-title">{param.parameterName}</div>
                        <div className="master-record-subtitle">#{ (currentPage - 1) * pageSize + index + 1 } • {param.categoryName || (param.category ? param.category.categoryName : 'Unassigned')}</div>
                      </div>
                      <span style={{ 
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '12px',
                        backgroundColor: param.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: param.status === 'Active' ? '#15803d' : '#991b1b'
                      }}>
                        {param.status}
                      </span>
                    </div>

                    <div className="master-record-details">
                      <div className="master-record-detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="master-record-label">Test Method</span>
                        <span className="master-record-value">{param.testMethod || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="master-record-actions">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(param); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FaEdit size={12} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(param.id, param.parameterName); }}
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
        </>
        ) : (
          <div style={{ minHeight: '300px' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading parameters...</div>
            ) : parameters.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No parameters found.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                {Object.entries(
                  parameters.reduce((acc, param) => {
                    const cat = param.categoryName || 'Unassigned';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(param);
                    return acc;
                  }, {})
                ).map(([catName, params]) => (
                  <div key={catName} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.75rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                      {catName} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginLeft: '0.25rem' }}>({params.length})</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {params.map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '0.35rem 0', borderBottom: idx !== params.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: '#334155', fontSize: '0.85rem' }}>{p.parameterName}</div>
                            {p.testMethod && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Method: {p.testMethod}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
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

      {/* Quick Add Category Modal */}
      {isAddCatModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '420px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add New Category</h3>
              <button onClick={() => setIsAddCatModalOpen(false)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateCategoryDirect} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Environmental Water Test"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  autoFocus
                  required
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddCatModalOpen(false)} style={{ padding: '0.45rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSavingCat} style={{ padding: '0.45rem 1.2rem', border: 'none', borderRadius: '6px', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 600, cursor: 'pointer', opacity: isSavingCat ? 0.7 : 1 }}>{isSavingCat ? 'Saving...' : 'Create Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Excel Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        masterType="parameter"
        existingDbRecords={parameters}
        onImportSuccess={async (validRows) => {
          const res = await apiService.post(PARAMETER_ENDPOINTS.BULK_IMPORT, { rows: validRows });
          if (res && res.success) {
            triggerToast(res.message || 'Parameters imported successfully!', 'success');
            fetchParameters(currentPage, pageSize, searchQuery, statusFilter);
          } else {
            throw new Error(res?.message || 'Failed to import parameters.');
          }
        }}
      />

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Parameter"
        message={
          deleteModal.name ? (
            <>Are you sure you want to delete parameter <strong>{deleteModal.name}</strong>? This action cannot be undone.</>
          ) : (
            'Are you sure you want to delete this parameter? This action cannot be undone.'
          )
        }
        confirmText="Delete Parameter"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

    </div>
  );
};

export default ParameterMaster;
