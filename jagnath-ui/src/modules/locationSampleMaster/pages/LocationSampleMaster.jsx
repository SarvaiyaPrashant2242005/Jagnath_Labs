import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaFolder, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown, FaMapMarkerAlt, FaSlidersH
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import {
  LOCATION_SAMPLE_ENDPOINTS, COMPANY_ENDPOINTS,
  DEPARTMENT_ENDPOINTS, CATEGORY_ENDPOINTS, SUB_CATEGORY_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';
import AddMasterButton from '../../../shared/components/InlineMasterModal/AddMasterButton';

const LocationSampleMaster = () => {
  // Inline Modal State
  const [inlineModal, setInlineModal] = useState({ isOpen: false, type: null, parentData: {} });

  // States
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
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
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form cascading selectors state
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); // 'asc', 'desc', or null

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    subCategoryId: '',
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

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ page: '1', limit: '500', status: 'Active' });
      if (activeCompId) params.append('companyId', activeCompId);
      const response = await apiService.get(`${DEPARTMENT_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        setDepartments(response.data.rows || response.data || []);
      }
    } catch (err) {
      setDepartments([]);
    }
  };

  // Fetch all categories (Discipline Groups)
  const fetchCategories = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ page: '1', limit: '1000', status: 'Active', all: 'true' });
      if (activeCompId) params.append('companyId', activeCompId);
      const response = await apiService.get(`${CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        setCategories(response.data.rows || response.data || []);
      }
    } catch (err) {
      setCategories([]);
    }
  };

  // Fetch all sub-categories
  const fetchSubCategories = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ page: '1', limit: '5000', status: 'Active', all: 'true' });
      if (activeCompId) params.append('companyId', activeCompId);
      const response = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        const list = response.data.subCategories || response.data.rows || response.data || [];
        setSubCategories(list);
      }
    } catch (err) {
      setSubCategories([]);
    }
  };

  // Fetch all locations of sample
  const fetchLocations = async () => {
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
      if (subCategoryFilter && subCategoryFilter !== 'ALL') {
        params.append('subCategoryId', subCategoryFilter);
      } else if (categoryFilter && categoryFilter !== 'ALL') {
        // Handle cascading filter parameters on client-side or nested if needed
      }

      if (sortField && sortDirection) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortDirection);
      }
      const response = await apiService.get(`${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        if (response.data.rows !== undefined) {
          setLocations(response.data.rows);
          setTotalItems(response.data.total);
          setTotalPages(response.data.totalPages);
        } else {
          const locList = Array.isArray(response.data) ? response.data : [response.data];
          setLocations(locList);
          setTotalItems(locList.length);
          setTotalPages(1);
        }
      } else {
        setLocations([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      triggerToast('Failed to load locations of sample', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pure UI side filtering for cascading selects in filters header
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      // 1. Department Filter
      if (departmentFilter !== 'ALL') {
        const lDeptId = loc.departmentId || loc.category?.departmentId || '';
        if (String(lDeptId) !== String(departmentFilter)) return false;
      }
      // 2. Category Filter
      if (categoryFilter !== 'ALL') {
        const lCatId = loc.categoryId || loc.subCategory?.categoryId || '';
        if (String(lCatId) !== String(categoryFilter)) return false;
      }
      // 3. SubCategory Filter
      if (subCategoryFilter !== 'ALL') {
        const lSubId = loc.subCategoryId || '';
        if (String(lSubId) !== String(subCategoryFilter)) return false;
      }
      return true;
    });
  }, [locations, departmentFilter, categoryFilter, subCategoryFilter]);

  // Cascading Categories and SubCategories lists for form dropdowns
  const formCategoriesList = useMemo(() => {
    if (!formDepartmentId) return [];
    return categories.filter(c => String(c.departmentId || c.department_id) === String(formDepartmentId));
  }, [categories, formDepartmentId]);

  const formSubCategoriesList = useMemo(() => {
    if (!formCategoryId) return [];
    return subCategories.filter(s => String(s.categoryId || s.category_id) === String(formCategoryId));
  }, [subCategories, formCategoryId]);

  // Cascading lists for filter headers
  const filterCategoriesList = useMemo(() => {
    if (departmentFilter === 'ALL') return categories;
    return categories.filter(c => String(c.departmentId || c.department_id) === String(departmentFilter));
  }, [categories, departmentFilter]);

  const filterSubCategoriesList = useMemo(() => {
    if (categoryFilter === 'ALL') {
      if (departmentFilter === 'ALL') return subCategories;
      return subCategories.filter(s => String(s.category?.departmentId || s.category?.department_id) === String(departmentFilter));
    }
    return subCategories.filter(s => String(s.categoryId || s.category_id) === String(categoryFilter));
  }, [subCategories, departmentFilter, categoryFilter]);

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

  const loadAllMasterDependencies = async () => {
    await fetchCompanies();
    await fetchDepartments();
    await fetchCategories();
    await fetchSubCategories();
    await fetchLocations();
  };

  // Listen for global company switch
  useEffect(() => {
    const handleCompanyChange = () => {
      setCurrentPage(1);
      loadAllMasterDependencies();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Fetch on state changes
  useEffect(() => {
    loadAllMasterDependencies();
  }, [currentPage, pageSize, statusFilter, searchQuery, sortField, sortDirection]);

  // Reset form inputs
  const resetForm = () => {
    setFormData({
      subCategoryId: '',
      name: '',
      description: '',
      status: 'Active',
      companyName: ''
    });
    setFormDepartmentId('');
    setFormCategoryId('');
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDepartmentId('');
    setFormCategoryId('');
    setFormData({
      subCategoryId: '',
      name: '',
      description: '',
      status: 'Active',
      companyName: ''
    });
    setFormErrors({});
    setIsFormOpen(true);
    document.querySelector('.dashboard-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle manual input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!formDepartmentId) errors.departmentId = 'Department is required';
    if (!formCategoryId) errors.categoryId = 'Discipline Group is required';
    if (!formData.subCategoryId) errors.subCategoryId = 'Sub Category is required';
    if (!formData.name.trim()) {
      errors.name = 'Location of Sample name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save/Add or Update location sample
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const payload = {
        subCategoryId: formData.subCategoryId,
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        status: formData.status,
        companyId: activeCompId
      };

      if (editingId) {
        await apiService.put(LOCATION_SAMPLE_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Location of Sample updated successfully!');
      } else {
        await apiService.post(LOCATION_SAMPLE_ENDPOINTS.CREATE, payload);
        triggerToast('Location of Sample added successfully!');
      }
      resetForm();
      fetchLocations();
    } catch (err) {
      triggerToast(err.messageToShow || 'Failed to save Location of Sample', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Set up edit form pre-fills
  const handleOpenEdit = (loc) => {
    setEditingId(loc.id);
    setFormDepartmentId(loc.departmentId || loc.category?.departmentId || '');
    setFormCategoryId(loc.categoryId || loc.subCategory?.categoryId || '');
    setFormData({
      subCategoryId: loc.subCategoryId || '',
      name: loc.name,
      description: loc.description || '',
      status: loc.status || 'Active',
      companyName: loc.companyName || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
    document.querySelector('.dashboard-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Action Handler
  const handleDelete = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await apiService.delete(LOCATION_SAMPLE_ENDPOINTS.DELETE(deleteModal.id));
      triggerToast('Location of Sample deleted successfully!');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchLocations();
    } catch (err) {
      triggerToast(err.messageToShow || 'Failed to delete Location of Sample', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Export handlers
  const handleDownloadExcel = () => {
    const listToExport = filteredLocations.map((l, index) => ({
      'Sr. No.': index + 1,
      'Department': l.departmentName || 'N/A',
      'Discipline Group': l.categoryName || 'N/A',
      'Sub Category': l.subCategoryName || 'N/A',
      'Location of Sample': l.name,
      'Description': l.description || '-',
      'Status': l.status,
      'Company': l.companyName || 'Unassigned'
    }));
    downloadExcel(listToExport, 'LIMS_Location_of_Samples');
    setShowDownloadDropdown(false);
  };

  const handleDownloadCSV = () => {
    const listToExport = filteredLocations.map((l, index) => ({
      'Sr. No.': index + 1,
      'Department': l.departmentName || 'N/A',
      'Discipline Group': l.categoryName || 'N/A',
      'Sub Category': l.subCategoryName || 'N/A',
      'Location of Sample': l.name,
      'Description': l.description || '-',
      'Status': l.status,
      'Company': l.companyName || 'Unassigned'
    }));
    downloadCSV(listToExport, 'LIMS_Location_of_Samples');
    setShowDownloadDropdown(false);
  };

  const handleCopy = () => {
    const text = filteredLocations.map((l, index) => `${index + 1}\t${l.departmentName || ''}\t${l.categoryName || ''}\t${l.subCategoryName || ''}\t${l.name}\t${l.description || ''}\t${l.status}`).join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard!');
    setShowDownloadDropdown(false);
  };

  const handlePrintPDF = () => {
    window.print();
    setShowDownloadDropdown(false);
  };

  const handlePrint = () => {
    window.print();
    setShowDownloadDropdown(false);
  };

  return (
    <div className="location-master-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '0.85rem 1.5rem',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <FaCheck size={16} /> : <FaExclamationCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FaMapMarkerAlt style={{ color: '#22c55e' }} />
            <span>Location of Sample Master</span>
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Configure Sample collection locations mapped under specific Sub Categories.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <button
            onClick={handleOpenCreate}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
            }}
          >
            <FaPlus size={14} />
            <span>Add Location</span>
          </button>

          <button
            onClick={() => setShowDownloadDropdown(prev => !prev)}
            ref={dropdownRef}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#475569'
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

      {/* Dropdown Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {editingId ? 'Edit Location of Sample' : 'Add New Location of Sample'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            
            {/* Department select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Department *</label>
              <select
                value={formDepartmentId}
                onChange={(e) => {
                  setFormDepartmentId(e.target.value);
                  setFormCategoryId('');
                  setFormData(prev => ({ ...prev, subCategoryId: '' }));
                }}
                style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.departmentId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {formErrors.departmentId && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.departmentId}</span>}
            </div>

            {/* Category / Discipline Group Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Discipline Group *</label>
                <AddMasterButton label="Add New Group" onClick={() => setInlineModal({ isOpen: true, type: 'category', parentData: { departmentId: formDepartmentId } })} />
              </div>
              <select
                value={formCategoryId}
                onChange={(e) => {
                  setFormCategoryId(e.target.value);
                  setFormData(prev => ({ ...prev, subCategoryId: '' }));
                }}
                disabled={!formDepartmentId}
                style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.categoryId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: !formDepartmentId ? '#f1f5f9' : '#ffffff', cursor: !formDepartmentId ? 'not-allowed' : 'default' }}
              >
                <option value="">Select Discipline Group</option>
                {formCategoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {formErrors.categoryId && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.categoryId}</span>}
            </div>

            {/* Sub Category Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sub Category *</label>
                <AddMasterButton label="Add New Sub" onClick={() => setInlineModal({ isOpen: true, type: 'sub-category', parentData: { categoryId: formCategoryId, departmentId: formDepartmentId } })} />
              </div>
              <select
                name="subCategoryId"
                value={formData.subCategoryId}
                onChange={handleInputChange}
                disabled={!formCategoryId}
                style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.subCategoryId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: !formCategoryId ? '#f1f5f9' : '#ffffff', cursor: !formCategoryId ? 'not-allowed' : 'default' }}
              >
                <option value="">Select Sub Category</option>
                {formSubCategoriesList.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
              {formErrors.subCategoryId && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.subCategoryId}</span>}
            </div>

            {/* Location Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Location Title *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Borewell Outlet 1"
                style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
              />
              {formErrors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formErrors.name}</span>}
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Description / Specific Location Details</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Details of sample collection points, physical tags etc."
                rows="2"
                style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '0.55rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.55rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Panel */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, alignItems: 'center' }}>
          
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCategoryFilter('ALL');
              setSubCategoryFilter('ALL');
              setCurrentPage(1);
            }}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="ALL">ALL DEPARTMENTS</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubCategoryFilter('ALL');
              setCurrentPage(1);
            }}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="ALL">ALL DISCIPLINE GROUPS</option>
            {filterCategoriesList.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={subCategoryFilter}
            onChange={(e) => {
              setSubCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="ALL">ALL SUB CATEGORIES</option>
            {filterSubCategoriesList.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '180px' }}
          />
        </div>
      </div>

      {/* Main Listing Table */}
      <div className="card" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, width: '100px' }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, width: '60px' }}>SR. NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DEPARTMENT</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DISCIPLINE GROUP</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SUB CATEGORY</th>
                {renderSortableHeader('LOCATION TITLE', 'name')}
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>DESCRIPTION</th>
                {renderSortableHeader('STATUS', 'status')}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    <span style={{ marginLeft: '0.5rem' }}>Loading Locations...</span>
                  </td>
                </tr>
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No locations found.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc, index) => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        title="Edit"
                        style={{ padding: '0.35rem', background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        title="Delete"
                        style={{ padding: '0.35rem', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{loc.departmentName || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{loc.categoryName || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{loc.subCategoryName || 'N/A'}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1e293b' }}>{loc.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.description || '-'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: loc.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: loc.status === 'Active' ? '#15803d' : '#b91c1c'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: loc.status === 'Active' ? '#22c55e' : '#ef4444' }} />
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredLocations.length > 0 && (
          <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing {filteredLocations.length} of {totalItems} items
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Location of Sample"
        message={`Are you sure you want to delete Location "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Inline Creation Modal */}
      <InlineMasterModal
        isOpen={inlineModal.isOpen}
        onClose={() => setInlineModal({ isOpen: false, type: null, parentData: {} })}
        type={inlineModal.type}
        parentData={inlineModal.parentData}
        onSuccess={async (newId, newName) => {
          if (inlineModal.type === 'category') {
            await fetchCategories();
            setFormCategoryId(newId);
          } else if (inlineModal.type === 'sub-category') {
            await fetchSubCategories();
            setFormData(prev => ({ ...prev, subCategoryId: newId }));
          }
          triggerToast('New item created successfully!', 'success');
        }}
      />

    </div>
  );
};

export default LocationSampleMaster;
