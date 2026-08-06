import React, { useState, useEffect, useRef } from 'react';
import {
  FaFolder, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaPrint, FaChevronDown, FaMapMarkerAlt
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { LOCATION_SAMPLE_ENDPOINTS, COMPANY_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import Pagination from '../../../shared/components/Pagination';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

const LocationSampleMaster = () => {
  // States
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
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
    name: '',
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
      }
    } catch (err) {
      triggerToast('Failed to load locations of sample', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Listen for global company switch
  useEffect(() => {
    const handleCompanyChange = () => {
      setCurrentPage(1);
      fetchLocations();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Fetch on state changes
  useEffect(() => {
    fetchCompanies();
    fetchLocations();
  }, [currentPage, pageSize, statusFilter]);

  // Handle Search Input Debounce/Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLocations();
  };

  // Reset form inputs
  const resetForm = () => {
    setFormData({
      name: '',
      status: 'Active',
      companyName: ''
    });
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(false);
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
        name: formData.name.trim(),
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
    setFormData({
      name: loc.name,
      status: loc.status || 'Active',
      companyName: loc.companyName || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete modal triggers
  const handleDelete = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
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

  // Export to Excel / CSV
  const handleExport = (type) => {
    const exportData = locations.map((loc, idx) => ({
      'Sr No': idx + 1,
      'Location of Sample': loc.name,
      'Company': loc.companyName || 'N/A',
      'Status': loc.status
    }));

    const namePrefix = 'LocationOfSample_Master';
    if (type === 'excel') {
      downloadExcel(exportData, namePrefix);
      triggerToast('Excel report generated successfully');
    } else {
      downloadCSV(exportData, namePrefix);
      triggerToast('CSV report generated successfully');
    }
    setShowDownloadDropdown(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaMapMarkerAlt size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Location of Sample Master</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>Configure LIMS sample location names and metadata mappings</p>
          </div>
        </div>

        {/* Action Button Headers */}
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <FaDownload /> Export Report <FaChevronDown size={10} />
          </button>
          
          {showDownloadDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px', display: 'flex', flexDirection: 'column', padding: '0.25rem' }}>
              <button onClick={() => handleExport('excel')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', borderRadius: '6px' }} className="dropdown-item-hover">
                <FaFileExcel style={{ color: '#107c41' }} /> Excel Worksheet
              </button>
              <button onClick={() => handleExport('csv')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', borderRadius: '6px' }} className="dropdown-item-hover">
                <FaFileCsv style={{ color: '#0078d4' }} /> CSV Plain Text
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
          >
            <FaPlus /> {isFormOpen ? 'Close Panel' : 'Add Location'}
          </button>
        </div>
      </div>

      {/* Slideout/Dropdown Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {editingId ? 'Edit Location of Sample' : 'Add New Location of Sample'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Title / Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Location Title *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Borewell Water Outlet, Near Boiler Unit"
                style={{ padding: '0.55rem 0.75rem', border: `1px solid ${formErrors.name ? '#ef4444' : '#cbd5e1'}`, borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
              />
              {formErrors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FaExclamationCircle size={10} /> {formErrors.name}</span>}
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

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.5rem 1.25rem', background: '#22c55e', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {submitting ? 'Saving...' : (editingId ? 'Update Location' : 'Save Location')}
            </button>
          </div>
        </form>
      )}

      {/* Main Grid View Container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        
        {/* Toolbar Filter / Search */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: '#fafafa' }}>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Search by location title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', width: '100%' }}
            />
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: '#ffffff', cursor: 'pointer' }}
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, width: '100px' }}>ACTIONS</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, width: '80px' }}>SR. NO.</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>LOCATION TITLE</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COMPANY</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, width: '120px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading locations of sample...</td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No locations of sample found.</td>
                </tr>
              ) : (
                locations.map((loc, index) => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }} className="company-table-row">
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(loc); }}
                        style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(loc.id, loc.name); }}
                        style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{loc.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{loc.companyName || 'Unassigned'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '12px',
                        backgroundColor: loc.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: loc.status === 'Active' ? '#15803d' : '#991b1b'
                      }}>
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Total Locations: {totalItems}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete Location of Sample "${deleteModal.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Location'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        type="danger"
      />

      {/* Floating Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 9999,
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <FaCheck /> {toast.message}
        </div>
      )}
    </div>
  );
};

export default LocationSampleMaster;
