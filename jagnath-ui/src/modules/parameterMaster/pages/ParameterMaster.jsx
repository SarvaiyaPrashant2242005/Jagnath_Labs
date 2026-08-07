import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaSlidersH, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown, FaTimes
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { PARAMETER_ENDPOINTS, COMPANY_ENDPOINTS, CATEGORY_ENDPOINTS, SUB_CATEGORY_ENDPOINTS, LOCATION_SAMPLE_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import BulkImportModal from '../../../shared/components/BulkImport/BulkImportModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';
import AddMasterButton from '../../../shared/components/InlineMasterModal/AddMasterButton';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';
import DisciplineGroupAssignModal from '../../../shared/components/DisciplineGroupAssignModal/DisciplineGroupAssignModal';
import { FaTags } from 'react-icons/fa';

const ParameterMaster = () => {
  // Inline master modal state
  const [inlineModal, setInlineModal] = useState({ isOpen: false, type: null, parentData: {} });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  // Parameter, Company & Category states
  const [parameters, setParameters] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [locationSamplesList, setLocationSamplesList] = useState([]);
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

  // Saved parameters auto-fill state
  const [allSavedParameters, setAllSavedParameters] = useState([]);
  const [selectedExistingParamId, setSelectedExistingParamId] = useState('');
  const [isManualNameEntry, setIsManualNameEntry] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [subCategoriesFilterList, setSubCategoriesFilterList] = useState([]);

  // Sorting State
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); // 'asc', 'desc', or null

  // Download Dropdown toggle
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    parameterName: '',
    unit: '',
    isPermissibleLimitApplicable: false,
    permissibleLimit: '',
    testMethod: '',
    status: 'Active',
    companyName: '',
    categoryId: '',
    subCategoryId: '',
    locationSampleId: ''
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
      const url = activeCompId ? `${CATEGORY_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&limit=1000&all=true` : `${CATEGORY_ENDPOINTS.GET_ALL}?limit=1000&all=true`;
      const response = await apiService.get(url);
      if (response && response.data) {
        const raw = response.data;
        const categories = Array.isArray(raw) ? raw : (raw.rows || raw.categories || raw.data || []);
        setCategoriesList(Array.isArray(categories) ? categories.filter(cat => cat.status === 'Active' || cat.status === true || !cat.status) : []);
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
      const params = new URLSearchParams({ limit: 5000, all: 'true' });
      if (activeCompId) params.append('companyId', activeCompId);

      const response = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        const raw = response.data;
        let subs = Array.isArray(raw) ? raw : (raw.rows || raw.subCategories || raw.data || []);
        if (!Array.isArray(subs)) subs = [];

        let activeSubs = subs.filter(s => s.status === 'Active' || s.status === true || !s.status);

        if (catId) {
          const selectedCat = categoriesList.find(c => String(c.id) === String(catId));
          const catName = selectedCat ? (selectedCat.name || selectedCat.categoryName || '').toLowerCase().trim() : '';

          const matched = activeSubs.filter(s => {
            const sCatId = s.categoryId || s.category_id || (s.category ? s.category.id : '');
            const sCatName = (s.category?.name || s.category?.categoryName || s.categoryName || '').toLowerCase().trim();
            const idMatch = sCatId && String(sCatId) === String(catId);
            const nameMatch = catName && sCatName && sCatName === catName;
            return idMatch || nameMatch;
          });

          activeSubs = matched.length > 0 ? matched : activeSubs;
        }

        setSubCategoriesList(activeSubs);
      } else {
        setSubCategoriesList([]);
      }
    } catch (err) {
      setSubCategoriesList([]);
    }
  };

  // Fetch active location samples to populate dropdown options
  const fetchLocationSamplesForDropdown = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&status=Active` : `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?status=Active`;
      const response = await apiService.get(url);
      if (response && response.data) {
        const locs = Array.isArray(response.data) ? response.data : (response.data.rows || [response.data]);
        setLocationSamplesList(locs);
      } else {
        setLocationSamplesList([]);
      }
    } catch (err) {
      setLocationSamplesList([]);
    }
  };

  // Fetch saved parameters for auto-fill dropdown
  const fetchSavedParametersForForm = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ limit: 5000 });
      if (activeCompId) params.append('companyId', activeCompId);

      const response = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?${params.toString()}`);
      if (response && response.data) {
        const list = Array.isArray(response.data) ? response.data : (response.data.rows || [response.data]);
        setAllSavedParameters(list);
      } else {
        setAllSavedParameters([]);
      }
    } catch {
      setAllSavedParameters([]);
    }
  };

  useEffect(() => {
    if (isFormOpen) {
      fetchSubCategoriesForDropdown(formData.categoryId);
      fetchSavedParametersForForm();
    }
  }, [formData.categoryId, isFormOpen]);

  // Unique list of saved parameters sorted by match relevance and name
  const uniqueSavedParameters = useMemo(() => {
    const map = new Map();
    allSavedParameters.forEach(p => {
      if (p.parameterName) {
        const key = `${(p.parameterName || '').toLowerCase().trim()}_${(p.testMethod || '').toLowerCase().trim()}`;
        if (!map.has(key)) {
          map.set(key, p);
        }
      }
    });

    const uniqueList = Array.from(map.values());

    const activeCatId = formData.categoryId ? String(formData.categoryId) : '';
    const activeSubCatId = formData.subCategoryId ? String(formData.subCategoryId) : '';
    const activeLocId = formData.locationSampleId ? String(formData.locationSampleId) : '';

    const hasFilter = !!(activeCatId || activeSubCatId || activeLocId);

    const scoredList = uniqueList.map(p => {
      let score = 0;
      let matchBadges = [];

      const pCatId = p.categoryId ? String(p.categoryId) : (p.category?.id ? String(p.category.id) : '');
      const pSubCatId = p.subCategoryId ? String(p.subCategoryId) : (p.subCategory?.id ? String(p.subCategory.id) : '');
      const pLocId = p.locationSampleId ? String(p.locationSampleId) : (p.locationSample?.id ? String(p.locationSample.id) : '');

      if (activeSubCatId && pSubCatId === activeSubCatId) {
        score += 10;
        matchBadges.push('Sub Category');
      }
      if (activeCatId && pCatId === activeCatId) {
        score += 5;
        matchBadges.push('Discipline Group');
      }
      if (activeLocId && pLocId === activeLocId) {
        score += 2;
        matchBadges.push('Location');
      }

      return {
        ...p,
        matchScore: score,
        isMatching: score > 0,
        matchBadges
      };
    });

    scoredList.sort((a, b) => {
      if (hasFilter && b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (a.parameterName || '').localeCompare(b.parameterName || '');
    });

    return scoredList;
  }, [allSavedParameters, formData.categoryId, formData.subCategoryId, formData.locationSampleId]);

  const handleSelectExistingParameter = (valOrEvent) => {
    const selectedId = (valOrEvent && typeof valOrEvent === 'object' && valOrEvent.target)
      ? valOrEvent.target.value
      : valOrEvent;

    if (selectedId === '__CUSTOM_MANUAL__') {
      setIsManualNameEntry(true);
      setSelectedExistingParamId('');
      setFormData(prev => ({ ...prev, parameterName: '' }));
      return;
    }

    setSelectedExistingParamId(selectedId);
    if (!selectedId) {
      setFormData(prev => ({ ...prev, parameterName: '', testMethod: '', unit: '', permissibleLimit: '' }));
      return;
    }

    const matched = allSavedParameters.find(p => String(p.id) === String(selectedId));
    if (matched) {
      const newCatId = formData.categoryId || matched.categoryId || matched.category?.id || '';
      const newSubCatId = formData.subCategoryId || matched.subCategoryId || matched.subCategory?.id || '';
      const newLocId = formData.locationSampleId || matched.locationSampleId || matched.locationSample?.id || '';

      if (newCatId && newCatId !== formData.categoryId) {
        fetchSubCategoriesForDropdown(newCatId);
      }

      setFormData(prev => ({
        ...prev,
        parameterName: matched.parameterName || '',
        testMethod: matched.testMethod || '',
        unit: matched.unit || '',
        isPermissibleLimitApplicable: matched.isPermissibleLimitApplicable === true || matched.is_permissible_limit_applicable === true,
        permissibleLimit: matched.permissibleLimit || matched.permissible_limit || '',
        categoryId: newCatId,
        subCategoryId: newSubCatId,
        locationSampleId: newLocId
      }));
    }
  };


  // Fetch all parameters once (pure UI filtering)
  const fetchParameters = async () => {
    setLoading(true);
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({ limit: 5000, all: 'true' });
      if (activeCompId) {
        params.append('companyId', activeCompId);
      }
      const url = `${PARAMETER_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : (raw.rows || raw.parameters || raw.data || []);
        setParameters(Array.isArray(list) ? list : []);
      } else {
        setParameters([]);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch parameters.', 'error');
      } else {
        setParameters([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pure UI-side Filtering & Sorting (Latest Added First) for Parameters
  const filteredParameters = useMemo(() => {
    const list = parameters.filter(p => {
      // 1. Discipline Group Filter
      if (categoryFilter) {
        const pCatId = p.categoryId || p.category_id || (p.category ? p.category.id : '');
        if (String(pCatId) !== String(categoryFilter)) return false;
      }

      // 2. Sub Category Filter
      if (subCategoryFilter) {
        const pSubCatId = p.subCategoryId || p.sub_category_id || (p.subCategory ? p.subCategory.id : '');
        if (String(pSubCatId) !== String(subCategoryFilter)) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        const statusStr = (p.status || 'Active').toString().toLowerCase();
        if (statusStr !== statusFilter.toLowerCase()) return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (p.parameterName || p.name || '').toLowerCase().includes(q);
        const methodMatch = (p.testMethod || '').toLowerCase().includes(q);
        const unitMatch = (p.unit || '').toLowerCase().includes(q);
        const catMatch = (p.category?.name || '').toLowerCase().includes(q);
        const subMatch = (p.subCategory?.name || '').toLowerCase().includes(q);
        if (!nameMatch && !methodMatch && !unitMatch && !catMatch && !subMatch) return false;
      }

      return true;
    });

    // Sort Latest Added First (descending order by timestamp or ID)
    return list;
  }, [parameters, categoryFilter, subCategoryFilter, statusFilter, searchQuery]);

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

  const sortedParameters = useMemo(() => {
    if (!sortField || !sortDirection) {
      // Sort Latest Added First (descending order by timestamp or ID)
      return [...filteredParameters].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime();
        if (timeA !== timeB && timeA > 0 && timeB > 0) {
          return timeB - timeA;
        }
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    }
    const sorted = [...filteredParameters];
    sorted.sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'categoryId') {
        valA = a.category?.name || a.category?.categoryName || '';
        valB = b.category?.name || b.category?.categoryName || '';
      } else if (sortField === 'subCategoryId') {
        valA = a.subCategory?.name || a.subCategory?.categoryName || '';
        valB = b.subCategory?.name || b.subCategory?.categoryName || '';
      } else if (sortField === 'locationSampleId') {
        valA = a.locationSample?.name || a.locationSample?.categoryName || '';
        valB = b.locationSample?.name || b.locationSample?.categoryName || '';
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
  }, [filteredParameters, sortField, sortDirection]);

  const totalItems = sortedParameters.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedParameters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedParameters.slice(start, start + pageSize);
  }, [sortedParameters, currentPage, pageSize]);

  const fetchSubCategoriesForToolbarFilter = async (catId) => {
    if (!catId) {
      setSubCategoriesFilterList([]);
      return;
    }
    try {
      const response = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?limit=5000&all=true`);
      if (response && response.data) {
        const raw = response.data;
        let list = Array.isArray(raw) ? raw : (raw.rows || raw.subCategories || raw.data || []);
        if (!Array.isArray(list)) list = [];
        const matched = list.filter(s => {
          const sCatId = s.categoryId || s.category_id || (s.category ? s.category.id : '');
          return String(sCatId) === String(catId);
        });
        setSubCategoriesFilterList(matched);
      } else {
        setSubCategoriesFilterList([]);
      }
    } catch {
      setSubCategoriesFilterList([]);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchCategoriesForDropdown();
      await fetchLocationSamplesForDropdown();
      await fetchParameters();
    };
    initializeData();

    const handleCompanyChange = () => {
      fetchCategoriesForDropdown();
      fetchLocationSamplesForDropdown();
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
      unit: '',
      isPermissibleLimitApplicable: false,
      permissibleLimit: '',
      testMethod: '',
      status: 'Active',
      companyName: defaultCompanyName,
      categoryId: initialCatId,
      subCategoryId: '',
      locationSampleId: ''
    });
    setFormErrors({});
    setEditingId(null);
    setSelectedExistingParamId('');
    setIsManualNameEntry(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Form for Edit
  const handleOpenEdit = (param) => {
    if (param.categoryId) {
      fetchSubCategoriesForDropdown(param.categoryId);
    }
    setFormData({
      parameterName: param.parameterName || '',
      unit: param.unit || '',
      isPermissibleLimitApplicable: param.isPermissibleLimitApplicable === true || param.is_permissible_limit_applicable === true,
      permissibleLimit: param.permissibleLimit || param.permissible_limit || '',
      testMethod: param.testMethod || '',
      status: param.status || 'Active',
      companyName: param.companyName || (param.company ? (param.company.companyName || param.company.company_name) : ''),
      categoryId: param.categoryId || '',
      subCategoryId: param.subCategoryId || '',
      locationSampleId: param.locationSampleId || ''
    });
    setFormErrors({});
    setEditingId(param.id);
    setSelectedExistingParamId('');
    setIsManualNameEntry(true);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    const activeCompId = localStorage.getItem('selectedCompanyId');
    const matchedComp = companies.find(c => String(c.id) === String(activeCompId));
    const activeCompanyName = matchedComp ? (matchedComp.companyName || matchedComp.company_name) : (companies.length > 0 ? (companies[0].companyName || companies[0].company_name) : '');

    if (!activeCompanyName && !formData.companyName) {
      triggerToast('Please select a company in the top header first.', 'error');
      setSubmitting(false);
      return;
    }

    const payload = {
      parameterName: formData.parameterName,
      unit: formData.unit,
      isPermissibleLimitApplicable: formData.isPermissibleLimitApplicable,
      permissibleLimit: formData.isPermissibleLimitApplicable ? formData.permissibleLimit : '',
      testMethod: formData.testMethod,
      status: formData.status,
      companyId: activeCompId || null,
      companyName: activeCompanyName || formData.companyName,
      categoryId: formData.categoryId || null,
      subCategoryId: formData.subCategoryId || null,
      locationSampleId: formData.locationSampleId || null
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
      setCurrentPage(1);
      fetchParameters();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || err.error?.userMessage || err.error?.message || 'Operation failed. Please try again.', 'error');
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

  // Fetch all parameters matching current filters for complete data export
  const fetchAllExportData = async () => {
    return filteredParameters;
  };

  // Helper to map parameter record to bulk import template columns format
  const mapParameterToTemplateRow = (p) => {
    const isLimitApp = p.isPermissibleLimitApplicable === true || p.is_permissible_limit_applicable === true;
    return [
      p.categoryName || p.category_name || '',
      p.subCategoryName || p.sub_category_name || '',
      p.locationSampleName || p.location_sample_name || p.locationOfSample || '',
      p.parameterName || p.parameter_name || '',
      p.testMethod || p.test_method || '',
      p.unit || '',
      isLimitApp ? 'Yes' : 'No',
      isLimitApp ? (p.permissibleLimit || p.permissible_limit || '') : (p.permissibleLimit || p.permissible_limit || ''),
      p.status || 'Active'
    ];
  };

  const exportTemplateHeaders = [
    'Discipline Group *',
    'Sub Category',
    'Location of Sample',
    'Parameter Name *',
    'Test Method',
    'Unit',
    'Permissible Limit Applicable?',
    'Permissible Limit',
    'Status'
  ];

  // CSV Export
  const handleDownloadCSV = async () => {
    const exportData = await fetchAllExportData();
    if (!exportData || exportData.length === 0) return;
    const rows = exportData.map(mapParameterToTemplateRow);
    downloadCSV(exportTemplateHeaders, rows, 'Parameters_Report.csv');
    setShowDownloadDropdown(false);
  };

  // Excel Export (matches exact bulk import template format with filled data)
  const handleDownloadExcel = async () => {
    const exportData = await fetchAllExportData();
    if (!exportData || exportData.length === 0) return;
    const rows = exportData.map(mapParameterToTemplateRow);
    downloadExcel(exportTemplateHeaders, rows, 'Parameter_Master_Export.xlsx');
    setShowDownloadDropdown(false);
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    const exportData = await fetchAllExportData();
    if (!exportData || exportData.length === 0) return;
    const rows = exportData.map(mapParameterToTemplateRow);
    const text = [exportTemplateHeaders.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard successfully.', 'success');
    setShowDownloadDropdown(false);
  };

  // PDF Export
  const handlePrintPDF = async () => {
    const exportData = await fetchAllExportData();
    if (!exportData || exportData.length === 0) return;
    const printWindow = window.open('', '_blank');
    const rows = exportData.map(mapParameterToTemplateRow).map(r => `
      <tr>
        ${r.map(cell => `<td>${cell || '-'}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Parameters Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Parameter Master Report</h2>
          <table>
            <thead>
              <tr>${exportTemplateHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
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
              {/* <button
                onClick={() => setIsAssignModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)' }}
              >
                <FaTags />
                <span>Assign Groups</span>
              </button> */}
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
                <SearchableSelect
                  options={[...categoriesList].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  value={formData.categoryId}
                  onChange={(selectedVal) => {
                    handleInputChange({ target: { name: 'categoryId', value: selectedVal } });
                    fetchSubCategoriesForDropdown(selectedVal);
                  }}
                  placeholder="Select Discipline Group"
                  searchPlaceholder="Search discipline group..."
                  hasError={!!formErrors.categoryId}
                />
                {formErrors.categoryId && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{formErrors.categoryId}</span>
                )}
              </div>

              {/* Sub Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sub Category</label>
                  <AddMasterButton
                    label="Add New Sub Category"
                    onClick={() => {
                      if (!formData.categoryId) {
                        triggerToast('Please select a Discipline Group first.', 'error');
                        return;
                      }
                      setInlineModal({ isOpen: true, type: 'subCategory', parentData: { categoryId: formData.categoryId } });
                    }}
                  />
                </div>
                <SearchableSelect
                  options={[...subCategoriesList].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  value={formData.subCategoryId}
                  onChange={(selectedVal) => {
                    handleInputChange({ target: { name: 'subCategoryId', value: selectedVal } });
                  }}
                  placeholder="Select Sub Category"
                  searchPlaceholder="Search sub category..."
                />
              </div>

              {/* Location of Sample Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Location of Sample</label>
                  <AddMasterButton
                    label="Add New Location"
                    onClick={() => setInlineModal({ isOpen: true, type: 'locationSample', parentData: {} })}
                  />
                </div>
                <SearchableSelect
                  options={[...locationSamplesList].sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  value={formData.locationSampleId}
                  onChange={(selectedVal) => {
                    handleInputChange({ target: { name: 'locationSampleId', value: selectedVal } });
                  }}
                  placeholder="Select Location of Sample"
                  searchPlaceholder="Search location..."
                />
              </div>

              {/* Parameter Name Dropdown OR Manual Entry Text Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Parameter Name *</label>
                  {!editingId && uniqueSavedParameters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newManual = !isManualNameEntry;
                        setIsManualNameEntry(newManual);
                        setSelectedExistingParamId('');
                        if (newManual) {
                          setFormData(prev => ({ ...prev, parameterName: '' }));
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      {isManualNameEntry ? '≡ Select Saved Parameter' : '+ Manual Entry'}
                    </button>
                  )}
                </div>

                {!isManualNameEntry && uniqueSavedParameters.length > 0 && !editingId ? (
                  <SearchableSelect
                    options={uniqueSavedParameters}
                    value={selectedExistingParamId}
                    onChange={(selectedId) => handleSelectExistingParameter(selectedId)}
                    placeholder="Select Parameter Name"
                    searchPlaceholder="Search parameter name or test method..."
                    hasError={!!formErrors.parameterName}
                    customOptionLabel="+ Enter Custom Parameter Name (Manual)..."
                    onCustomOptionSelect={() => {
                      setIsManualNameEntry(true);
                      setSelectedExistingParamId('');
                      setFormData(prev => ({ ...prev, parameterName: '' }));
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    name="parameterName"
                    value={formData.parameterName}
                    onChange={handleInputChange}
                    placeholder="e.g. pH Level"
                    style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.parameterName ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                )}

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

              {/* Unit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="e.g. mg/L, %, pH"
                  style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Permissible Limit Applicable Switch / Radio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Permissible Limit Applicable?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', height: '42px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="isPermissibleLimitApplicable"
                      checked={formData.isPermissibleLimitApplicable === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPermissibleLimitApplicable: true }))}
                    /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>
                    <input
                      type="radio"
                      name="isPermissibleLimitApplicable"
                      checked={formData.isPermissibleLimitApplicable === false}
                      onChange={() => setFormData(prev => ({ ...prev, isPermissibleLimitApplicable: false, permissibleLimit: '' }))}
                    /> No
                  </label>
                </div>
              </div>

              {/* Permissible Limit Value (Shown if Applicable) */}
              {formData.isPermissibleLimitApplicable && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Permissible Limit Value *</label>
                  <input
                    type="text"
                    name="permissibleLimit"
                    value={formData.permissibleLimit}
                    onChange={handleInputChange}
                    placeholder="e.g. 6.5 - 8.5 or Max 100 mg/L"
                    style={{ padding: '0.55rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              )}

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
            {/* Discipline Group Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                const catId = e.target.value;
                setCategoryFilter(catId);
                setSubCategoryFilter('');
                fetchSubCategoriesForToolbarFilter(catId);
                setCurrentPage(1);
              }}
              style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' }}
            >
              <option value="">ALL DISCIPLINE GROUPS</option>
              {[...categoriesList].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Sub Category Filter */}
            <select
              value={subCategoryFilter}
              onChange={(e) => {
                setSubCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!categoryFilter}
              style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', backgroundColor: !categoryFilter ? '#f1f5f9' : '#ffffff' }}
            >
              <option value="">ALL SUB CATEGORIES</option>
              {[...subCategoriesFilterList].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
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
                    {renderSortableHeader('PARAMETER NAME', 'parameterName')}
                    {renderSortableHeader('DISCIPLINE GROUP', 'categoryId')}
                    {renderSortableHeader('SUB CATEGORY', 'subCategoryId')}
                    {renderSortableHeader('LOCATION OF SAMPLE', 'locationSampleId')}
                    {renderSortableHeader('TEST METHOD', 'testMethod')}
                    {renderSortableHeader('UNIT', 'unit')}
                    {renderSortableHeader('PERMISSIBLE LIMIT', 'permissibleLimit')}
                    {renderSortableHeader('STATUS', 'status')}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Loading parameters...
                      </td>
                    </tr>
                  ) : paginatedParameters.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No parameters found.
                      </td>
                    </tr>
                  ) : (
                    paginatedParameters.map((param, index) => (
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
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{param.locationSampleName || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{param.testMethod || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 600 }}>{param.unit || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                          {param.isPermissibleLimitApplicable || param.is_permissible_limit_applicable ? (param.permissibleLimit || param.permissible_limit || 'Applicable') : '-'}
                        </td>
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
              ) : paginatedParameters.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No parameters found.
                </div>
              ) : (
                <div className="master-card-grid">
                  {paginatedParameters.map((param, index) => (
                    <div key={param.id} className="master-record-card" onClick={() => handleOpenEdit(param)}>
                      <div className="master-record-card-header">
                        <div>
                          <div className="master-record-title">{param.parameterName}</div>
                          <div className="master-record-subtitle">#{(currentPage - 1) * pageSize + index + 1} • {param.categoryName || (param.category ? param.category.categoryName : 'Unassigned')}</div>
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
            ) : filteredParameters.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No parameters found.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                {Object.entries(
                  filteredParameters.reduce((acc, param) => {
                    const cat = param.categoryName || (param.category ? param.category.categoryName : 'Unassigned');
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
        {viewMode === 'table' && (
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
        )}
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

      {/* Inline Master Creation Modal */}
      <InlineMasterModal
        isOpen={inlineModal.isOpen}
        onClose={() => setInlineModal({ isOpen: false, type: null, parentData: {} })}
        masterType={inlineModal.type}
        parentData={inlineModal.parentData}
        onSuccess={(createdItem) => {
          if (inlineModal.type === 'subCategory') {
            if (formData.categoryId) {
              fetchSubCategoriesForDropdown(formData.categoryId);
            }
            if (createdItem?.id) {
              setFormData(prev => ({ ...prev, subCategoryId: createdItem.id }));
            }
          } else if (inlineModal.type === 'locationSample') {
            fetchLocationSamplesForDropdown();
            if (createdItem?.id) {
              setFormData(prev => ({ ...prev, locationSampleId: createdItem.id }));
            }
          }
        }}
      />
      <DisciplineGroupAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        parameters={parameters}
        categories={categoriesList}
        subCategories={subCategoriesList}
        locationSamples={locationSamplesList}
        onSuccess={fetchParameters}
      />
    </div>
  );
};

export default ParameterMaster;