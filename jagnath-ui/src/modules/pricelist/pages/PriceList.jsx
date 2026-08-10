import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaTag, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown, FaSave, FaSearch, FaTimes
} from 'react-icons/fa';
import { priceMasterService } from '../services/priceMasterService';
import { apiService } from '../../../shared/services/apiService';
import { CATEGORY_ENDPOINTS, PARAMETER_ENDPOINTS, PRICE_MASTER_ENDPOINTS, SUB_CATEGORY_ENDPOINTS, DEPARTMENT_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import BulkImportModal from '../../../shared/components/BulkImport/BulkImportModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';
import AddMasterButton from '../../../shared/components/InlineMasterModal/AddMasterButton';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';


const PriceMasterPage = () => {
  // Inline master modal state
  const [inlineModal, setInlineModal] = useState({ isOpen: false, type: null, parentData: {} });
  // Data States
  const [prices, setPrices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [filteredParameters, setFilteredParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Multi-Select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Select all / deselect all current page prices
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = prices.map(p => p.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle single price row selection
  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Selected
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected price item(s)?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => priceMasterService.deletePrice(id)));
      triggerToast(`${selectedIds.length} price item(s) deleted successfully!`, 'success');
      setSelectedIds([]);
      fetchPrices();
    } catch (err) {
      triggerToast(err.message || 'Failed to delete selected price items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); // 'asc', 'desc', or null

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Main Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    parameterId: '',
    price: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Category Modal State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Quick Add Parameter Modal State
  const [isAddParamModalOpen, setIsAddParamModalOpen] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [newParamTestMethod, setNewParamTestMethod] = useState('');
  const [isSavingParam, setIsSavingParam] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchCategoriesAndParameters();
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [currentPage, pageSize, searchQuery, statusFilter, selectedCategory, sortField, sortDirection]);

  const formCategoriesFiltered = useMemo(() => {
    if (!formDepartmentId) return [];
    return categories.filter(c => String(c.departmentId || c.department_id) === String(formDepartmentId));
  }, [categories, formDepartmentId]);

  // Filter and sort parameters dropdown based on selected category & subCategory in form
  const sortedAndFilteredParameters = useMemo(() => {
    if (!formData.categoryId) return [];

    const activeCatId = String(formData.categoryId);
    const activeSubCatId = formData.subCategoryId ? String(formData.subCategoryId) : '';

    return [...parameters].map(p => {
      let score = 0;
      let matchBadges = [];

      const pCatId = p.categoryId ? String(p.categoryId) : (p.category?.id ? String(p.category.id) : '');
      const pSubCatId = p.subCategoryId ? String(p.subCategoryId) : (p.subCategory?.id ? String(p.subCategory.id) : '');

      if (activeSubCatId && pSubCatId === activeSubCatId) {
        score += 10;
        matchBadges.push('Sub Category');
      }
      if (activeCatId && pCatId === activeCatId) {
        score += 5;
        matchBadges.push('Discipline Group');
      }

      return {
        ...p,
        parameterName: p.parameterName || p.name || '',
        testMethod: p.testingStandard || p.testMethod || '',
        matchScore: score,
        isMatching: score > 0,
        matchBadges
      };
    }).sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (a.parameterName || '').localeCompare(b.parameterName || '');
    });
  }, [parameters, formData.categoryId, formData.subCategoryId]);


  // Fetch Sub Categories when form opens or category changes
  useEffect(() => {
    const fetchSubCats = async () => {
      try {
        const url = formData.categoryId
          ? `${SUB_CATEGORY_ENDPOINTS.GET_ALL}?categoryId=${formData.categoryId}&limit=1000&all=true`
          : `${SUB_CATEGORY_ENDPOINTS.GET_ALL}?limit=1000&all=true`;
        const res = await apiService.get(url);
        if (res && res.data) {
          const raw = res.data;
          let list = Array.isArray(raw) ? raw : (raw.rows || raw.subCategories || raw.data || []);
          if (!Array.isArray(list)) list = [];

          if (formData.categoryId) {
            const matched = list.filter(s => {
              const sCatId = s.categoryId || s.category_id || (s.category ? s.category.id : '');
              return String(sCatId) === String(formData.categoryId);
            });
            if (matched.length > 0 || list.length > 0) {
              list = matched.length > 0 ? matched : list;
            }
          }

          setSubCategories(list);
        } else {
          setSubCategories([]);
        }
      } catch {
        setSubCategories([]);
      }
    };
    if (isFormOpen) {
      fetchSubCats();
    }
  }, [formData.categoryId, isFormOpen]);

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

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchCategoriesAndParameters = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const deptUrl = activeCompId ? `${DEPARTMENT_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&status=Active&limit=500` : `${DEPARTMENT_ENDPOINTS.GET_ALL}?status=Active&limit=500`;
      
      const [deptRes, catRes, paramRes] = await Promise.all([
        apiService.get(deptUrl),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL),
        apiService.get(PARAMETER_ENDPOINTS.GET_ALL)
      ]);
      if (deptRes?.data) {
        setDepartments(deptRes.data.rows || deptRes.data || []);
      }
      if (catRes?.data) {
        setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data.rows || []));
      }
      if (paramRes?.data) {
        setParameters(Array.isArray(paramRes.data) ? paramRes.data : (paramRes.data.rows || []));
      }
    } catch (err) {
      console.error('Failed to load categories or parameters:', err);
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter,
        categoryId: selectedCategory
      };
      if (sortField && sortDirection) {
        params.sortBy = sortField;
        params.sortOrder = sortDirection;
      }

      const res = await priceMasterService.getAll(params);
      if (res?.data) {
        if (res.data.rows) {
          setPrices(res.data.rows);
          setTotalItems(res.data.total || 0);
          setTotalPages(res.data.totalPages || 0);
        } else if (Array.isArray(res.data)) {
          setPrices(res.data);
          setTotalItems(res.data.length);
          setTotalPages(Math.ceil(res.data.length / pageSize));
        }
      }
    } catch (err) {
      triggerToast(err.message || 'Failed to fetch price master records.', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateCategoryDirect = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      triggerToast('Category name is required.', 'error');
      return;
    }
    if (!formDepartmentId) {
      triggerToast('Please select a Department first.', 'error');
      return;
    }

    try {
      setIsSavingCat(true);
      const res = await apiService.post(CATEGORY_ENDPOINTS.CREATE, {
        name: newCatName.trim(),
        status: 'Active',
        departmentId: formDepartmentId
      });

      const createdCat = res?.data;
      triggerToast('New Category created successfully!', 'success');
      setIsAddCatModalOpen(false);
      setNewCatName('');

      // Refresh categories list
      const catRes = await apiService.get(CATEGORY_ENDPOINTS.GET_ALL);
      if (catRes?.data) {
        const freshList = Array.isArray(catRes.data) ? catRes.data : (catRes.data.rows || []);
        setCategories(freshList);

        // Auto select newly created category
        if (createdCat?.id) {
          setFormData(prev => ({ ...prev, categoryId: createdCat.id }));
        } else {
          const match = freshList.find(c => c.name.toLowerCase() === newCatName.trim().toLowerCase());
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

  // Quick Add Parameter Handler
  const handleCreateParameterDirect = async (e) => {
    e.preventDefault();
    if (!newParamName.trim()) {
      triggerToast('Parameter name is required.', 'error');
      return;
    }

    try {
      setIsSavingParam(true);
      const res = await apiService.post(PARAMETER_ENDPOINTS.CREATE, {
        parameterName: newParamName.trim(),
        testMethod: newParamTestMethod.trim() || undefined,
        status: 'Active'
      });

      const createdParam = res?.data;
      triggerToast('New Parameter created successfully!', 'success');
      setIsAddParamModalOpen(false);
      setNewParamName('');
      setNewParamTestMethod('');

      // Refresh parameters list
      const paramRes = await apiService.get(PARAMETER_ENDPOINTS.GET_ALL);
      if (paramRes?.data) {
        const freshList = Array.isArray(paramRes.data) ? paramRes.data : (paramRes.data.rows || []);
        setParameters(freshList);

        // Auto select newly created parameter
        if (createdParam?.id) {
          setFormData(prev => ({ ...prev, parameterId: createdParam.id }));
        } else {
          const match = freshList.find(p => (p.parameterName || p.name).toLowerCase() === newParamName.trim().toLowerCase());
          if (match) {
            setFormData(prev => ({ ...prev, parameterId: match.id }));
          }
        }
      }
    } catch (err) {
      triggerToast(err.message || 'Failed to create parameter.', 'error');
    } finally {
      setIsSavingParam(false);
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDepartmentId('');
    setFormData({
      categoryId: '',
      subCategoryId: '',
      parameterId: '',
      price: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsFormOpen(true);
    document.querySelector('.dashboard-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Edit Form
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const catId = item.categoryId || (item.category ? item.category.id : '');
    const matchedCat = categories.find(c => String(c.id) === String(catId));
    const matchedDeptId = matchedCat ? (matchedCat.departmentId || matchedCat.department_id || '') : '';
    setFormDepartmentId(matchedDeptId);

    const subCatId = item.parameter?.subCategoryId || item.subCategoryId || '';
    setFormData({
      categoryId: catId,
      subCategoryId: subCatId,
      parameterId: item.parameterId || (item.parameter ? item.parameter.id : ''),
      price: item.price !== undefined ? item.price : '',
      status: item.status || 'Active'
    });
    setFormErrors({});
    setIsFormOpen(true);
    document.querySelector('.dashboard-content-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formDepartmentId) {
      errors.departmentId = 'Department is required.';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Discipline Group is required.';
    }
    if (!formData.parameterId) {
      errors.parameterId = 'Parameter is required.';
    }
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      errors.price = 'Price must be a valid non-negative number.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await priceMasterService.update(editingId, {
          categoryId: formData.categoryId,
          subCategoryId: formData.subCategoryId,
          parameterId: formData.parameterId,
          price: Number(formData.price),
          status: formData.status
        });
        triggerToast('Price updated successfully!', 'success');
      } else {
        await priceMasterService.create({
          categoryId: formData.categoryId,
          parameterId: formData.parameterId,
          price: Number(formData.price),
          status: formData.status
        });
        triggerToast('Price added successfully!', 'success');
      }
      setIsFormOpen(false);
      fetchPrices();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to save price.', 'error');
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
      await priceMasterService.delete(deleteModal.id);
      triggerToast('Price deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchPrices();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete price.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Download Export Handlers
  // Helper to fetch all records matching active filter (no pagination limit)
  const fetchAllExportData = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({
        page: 1,
        limit: 100000,
        search: searchQuery,
        status: statusFilter,
        categoryId: selectedCategory
      });
      if (activeCompId) {
        params.append('companyId', activeCompId);
      }

      const url = `${PRICE_MASTER_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : (response.data.rows || []);
      }
      return prices;
    } catch (err) {
      return prices;
    }
  };

  const handleDownloadCSV = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Category', 'Parameter', 'Price (INR)', 'Status'];
    const rows = allData.map(p => [
      p.category ? p.category.name : '',
      p.parameter ? (p.parameter.parameterName || p.parameter.name) : '',
      p.price,
      p.status
    ]);
    downloadCSV(headers, rows, 'PriceMaster_Report.csv');
    setShowDownloadDropdown(false);
  };

  const handleDownloadExcel = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Category', 'Parameter', 'Price (INR)', 'Status'];
    const rows = allData.map(p => [
      p.category ? p.category.name : 'Unassigned',
      p.parameter ? (p.parameter.parameterName || p.parameter.name) : 'Unassigned',
      p.price,
      p.status
    ]);
    downloadExcel(headers, rows, 'PriceMaster_Report.xlsx');
    setShowDownloadDropdown(false);
  };

  const handleCopy = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Category', 'Parameter', 'Price', 'Status'];
    const rows = allData.map(p => [
      p.category ? p.category.name : 'Unassigned',
      p.parameter ? (p.parameter.parameterName || p.parameter.name) : 'Unassigned',
      p.price,
      p.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    copyTextToClipboard(text,
      () => triggerToast('Copied to clipboard successfully.', 'success'),
      () => triggerToast('Failed to copy text.', 'error')
    );
    setShowDownloadDropdown(false);
  };

  const handlePrintPDF = () => {
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
          <FaTag style={{ color: '#22c55e' }} />
          <span>Price Master</span>
        </h2>

        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <>
              <button
                onClick={handleOpenCreate}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaPlus />
                <span>Add Price</span>
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

          {/* Premium Download Button Dropdown */}
          <button
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            disabled={prices.length === 0}
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
              opacity: prices.length === 0 ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)'
            }}
          >
            <FaDownload />
            <span>Download</span>
            <FaChevronDown style={{ fontSize: '0.75rem', opacity: 0.8 }} />
          </button>

          {/* Download Dropdown Options Menu */}
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
                { name: 'Print', action: handlePrintPDF, icon: <FaPrint style={{ color: '#7c3aed' }} /> }
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

      {/* Inline Form Container */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Price' : 'Add New Price'}
          </h3>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Department Select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Department *</label>
                <select
                  value={formDepartmentId}
                  onChange={(e) => {
                    setFormDepartmentId(e.target.value);
                    setFormData({ ...formData, categoryId: '', subCategoryId: '', parameterId: '' });
                    setSubCategories([]);
                  }}
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.departmentId ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box', height: '40px' }}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {formErrors.departmentId && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.departmentId}</span>
                )}
              </div>

              {/* Discipline Group Dropdown & Quick Add Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Discipline Group *</label>
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!formDepartmentId) {
                          triggerToast('Please select a Department first.', 'error');
                          return;
                        }
                        setIsAddCatModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <FaPlus size={10} /> Add New Group
                    </button>
                  )}
                </div>
                <SearchableSelect
                  options={[...formCategoriesFiltered].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  value={formData.categoryId}
                  disabled={!formDepartmentId}
                  onChange={async (selectedVal) => {
                    setFormData({ ...formData, categoryId: selectedVal, subCategoryId: '', parameterId: '' });
                    if (selectedVal) {
                      try {
                        const res = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?categoryId=${selectedVal}`);
                        setSubCategories(res?.data || []);
                      } catch { setSubCategories([]); }
                    } else { setSubCategories([]); }
                  }}
                  placeholder="-- Select Discipline Group --"
                  searchPlaceholder="Search discipline group..."
                  hasError={!!formErrors.categoryId}
                />
                {
                  formErrors.categoryId && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.categoryId}</span>
                  )
                }
              </div >

              {/* Sub Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sub Category</label>
                  {!editingId && (
                    <AddMasterButton
                      label="Add New Sub Category"
                      onClick={() => {
                        if (!formData.categoryId) {
                          triggerToast('Please select a Discipline Group first.', 'error');
                          return;
                        }
                        setInlineModal({ isOpen: true, type: 'subCategory', parentData: { categoryId: formData.categoryId, departmentId: formDepartmentId } });
                      }}
                    />
                  )}
                </div>
                <SearchableSelect
                  options={[...subCategories].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  value={formData.subCategoryId}
                  disabled={!formData.categoryId}
                  onChange={(selectedVal) => setFormData({ ...formData, subCategoryId: selectedVal })}
                  placeholder="-- Select Sub Category --"
                  searchPlaceholder="Search sub category..."
                />
              </div >

              {/* Parameter Dropdown & Quick Add Link */}
              < div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Parameter *</label>
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => setIsAddParamModalOpen(true)}
                      style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <FaPlus size={10} /> Add New Parameter
                    </button>
                  )}
                </div>
                <SearchableSelect
                  options={sortedAndFilteredParameters}
                  value={formData.parameterId}
                  onChange={(selectedId) => setFormData({ ...formData, parameterId: selectedId })}
                  placeholder="-- Select Parameter --"
                  searchPlaceholder="Search parameter name or standard..."
                  hasError={!!formErrors.parameterId}
                  disabled={!formData.categoryId}
                  customOptionLabel=""
                />

                {
                  formErrors.parameterId && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.parameterId}</span>
                  )
                }
              </div >

              {/* Price Input */}
              < div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.price ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                />
                {
                  formErrors.price && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.price}</span>
                  )
                }
              </div >

              {/* Status Sliding Toggle Switch */}
              < div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
              </div >

            </div >

            {/* Action Buttons */}
            < div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
                style={{ padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 600, opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FaSave />
                <span>{submitting ? 'Saving...' : 'Save'}</span>
              </button>
            </div >

          </form >
        </div >
      )}

      {/* Main Table View Card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Table Filters */}
        <div className="master-table-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
              Total Prices: {totalItems}
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
          <div className="master-filter-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
            >
              <option value="">ALL CATEGORIES</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
            >
              <option value="ALL">ALL STATUS</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search parameter..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', width: '200px' }}
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
                <th style={{ padding: '0.75rem 0.75rem', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={prices.length > 0 && selectedIds.length === prices.length}
                    onChange={handleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
                {renderSortableHeader('DISCIPLINE GROUP', 'categoryId')}
                {renderSortableHeader('SUB CATEGORY', 'subCategory')}
                {renderSortableHeader('PARAMETER', 'parameter')}
                {renderSortableHeader('PRICE (₹)', 'price')}
                {renderSortableHeader('STATUS', 'status')}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading price master records...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No prices found. Click <strong>Add Price</strong> to create a rate entry.
                  </td>
                </tr>
              ) : (
                prices.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    className="company-table-row"
                  >
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectRow(item.id, e)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.parameter?.parameterName || item.parameter?.name); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td >
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 500 }}>
                      {item.category ? item.category.name : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      {item.parameter?.subCategory ? item.parameter.subCategory.name : (item.subCategoryName || 'Unassigned')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>
                      {item.parameter ? (item.parameter.parameterName || item.parameter.name) : '-'}
                      {(item.parameter?.testMethod || item.parameter?.testingStandard) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                          {item.parameter.testMethod || item.parameter.testingStandard}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>
                      ₹{Number(item.price || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
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
                  </tr >
                ))
              )}
            </tbody >
          </table >
        </div >

        {/* Mobile Cards View */}
        < div className="show-on-mobile" >
          {
            loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }} >
                Loading price master records...
              </div >
            ) : prices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No prices found.
              </div>
            ) : (
              <div className="master-card-grid">
                {prices.map((item) => (
                  <div key={item.id} className="master-record-card" onClick={() => handleOpenEdit(item)}>
                    <div className="master-record-card-header">
                      <div>
                        <div className="master-record-title">{item.parameter?.name || item.parameter?.parameterName || 'Parameter'}</div>
                        <div className="master-record-subtitle">
                          {item.category?.name} {item.parameter?.subCategory ? `• ${item.parameter.subCategory.name}` : ''} • ₹{Number(item.price || 0).toFixed(2)}
                        </div>
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.parameter?.parameterName || item.parameter?.name); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FaTrash size={12} /> Delete
                      </button>
                    </div >
                  </div >
                ))}
              </div >
            )}
        </div >

        {/* Pagination */}
        {
          !loading && totalItems > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              />
            </div>
          )
        }

      </div >

      {/* Quick Add Category Modal */}
      {
        isAddCatModalOpen && (
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
        )
      }

      {/* Quick Add Parameter Modal */}
      {
        isAddParamModalOpen && (
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
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add New Parameter</h3>
                <button onClick={() => setIsAddParamModalOpen(false)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}><FaTimes /></button>
              </div>
              <form onSubmit={handleCreateParameterDirect} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Parameter Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Biochemical Oxygen Demand (BOD)"
                    value={newParamName}
                    onChange={(e) => setNewParamName(e.target.value)}
                    autoFocus
                    required
                    style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Test Method / Standard (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. IS 3025 (Part 44)"
                    value={newParamTestMethod}
                    onChange={(e) => setNewParamTestMethod(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsAddParamModalOpen(false)} style={{ padding: '0.45rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSavingParam} style={{ padding: '0.45rem 1.2rem', border: 'none', borderRadius: '6px', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: 600, cursor: 'pointer', opacity: isSavingParam ? 0.7 : 1 }}>{isSavingParam ? 'Saving...' : 'Create Parameter'}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Bulk Excel Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        masterType="pricelist"
        existingDbRecords={prices}
        onImportSuccess={async (validRows) => {
          const res = await apiService.post(PRICE_MASTER_ENDPOINTS.BULK_IMPORT, { rows: validRows });
          if (res && res.success) {
            triggerToast(res.message || 'Price list imported successfully!', 'success');
            fetchPrices(currentPage, pageSize, searchQuery, statusFilter, selectedCategory);
          } else {
            throw new Error(res?.message || 'Failed to import price list.');
          }
        }}
      />

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Price Record"
        message={
          deleteModal.name ? (
            <>Are you sure you want to delete price entry for <strong>{deleteModal.name}</strong>? This action cannot be undone.</>
          ) : (
            'Are you sure you want to delete this price record? This action cannot be undone.'
          )
        }
        confirmText="Delete Price"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Inline Master Creation Modal */}
      <InlineMasterModal
        isOpen={inlineModal.isOpen}
        onClose={() => setInlineModal({ isOpen: false, type: null, parentData: {} })}
        masterType={inlineModal.type}
        parentData={inlineModal.parentData}
        onSuccess={async (createdItem) => {
          if (inlineModal.type === 'subCategory') {
            if (formData.categoryId) {
              try {
                const res = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?categoryId=${formData.categoryId}`);
                setSubCategories(res?.data || []);
              } catch (e) {
                console.error("Error fetching subcategories", e);
              }
            }
            if (createdItem?.id) {
              setFormData(prev => ({ ...prev, subCategoryId: createdItem.id }));
            }
          }
        }}
      />
    </div >
  );
};

export default PriceMasterPage;
