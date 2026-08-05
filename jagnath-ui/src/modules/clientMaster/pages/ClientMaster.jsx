import React, { useState, useEffect, useRef } from 'react';
import {
  FaUserFriends, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck,
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv,
  FaFilePdf, FaPrint, FaChevronDown
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { CLIENT_ENDPOINTS, COMPANY_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import { getIndianStates, getCitiesByStateIso2 } from '../../../shared/services/locationService';
import Pagination from '../../../shared/components/Pagination';
import BulkImportModal from '../../../shared/components/BulkImport/BulkImportModal';
import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

const ClientMaster = () => {
  // Client state
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Multi-Select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Select all / deselect all current page clients
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = clients.map(c => c.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle single client selection
  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete Selected
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected client(s)?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => apiService.delete(`${CLIENT_ENDPOINTS.DELETE}/${id}`)));
      triggerToast(`${selectedIds.length} clients deleted successfully!`, 'success');
      setSelectedIds([]);
      fetchClients();
    } catch (err) {
      triggerToast(err.message || 'Failed to delete selected clients.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Location dropdown states (India)
  const [indianStates, setIndianStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

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
    clientName: '',
    contactNumber: '',
    companyName: '',
    gender: 'Male',
    officeAddress: '',
    plantAddress: '',
    city: '',
    state: '',
    email: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Indian states on mount
  useEffect(() => {
    getIndianStates().then(states => {
      setIndianStates(states);
    });
  }, []);

  // Fetch cities whenever selected state changes
  useEffect(() => {
    if (formData.state && indianStates.length > 0) {
      const matchedState = indianStates.find(
        s => s.name.toLowerCase() === formData.state.toLowerCase() || s.iso2.toLowerCase() === formData.state.toLowerCase()
      );
      if (matchedState) {
        getCitiesByStateIso2(matchedState.iso2).then(cities => {
          setAvailableCities(cities);
        });
      } else {
        setAvailableCities([]);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.state, indianStates]);

  const handleStateChange = (e) => {
    const selectedStateName = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: selectedStateName,
      city: ''
    }));
    if (formErrors.state) {
      setFormErrors(prev => ({ ...prev, state: '' }));
    }
  };

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

  // Fetch all companies associated with user to populate select input
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

  // Fetch all clients
  const fetchClients = async () => {
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

      const url = `${CLIENT_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        if (response.data.rows !== undefined) {
          setClients(response.data.rows);
          setTotalItems(response.data.total);
          setTotalPages(response.data.totalPages);
        } else {
          const clientList = Array.isArray(response.data) ? response.data : [response.data];
          setClients(clientList);
          setTotalItems(clientList.length);
          setTotalPages(1);
        }
      } else {
        setClients([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch clients.', 'error');
      } else {
        setClients([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCompanies();
      await fetchClients();
    };
    initializeData();

    const handleCompanyChange = () => {
      fetchClients();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    const phoneRegex = /^[0-9]+$/;

    if (!formData.clientName.trim()) {
      errors.clientName = 'Client Name is required.';
    }

    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact Number is required.';
    } else if (!phoneRegex.test(formData.contactNumber)) {
      errors.contactNumber = 'Contact Number must contain only digits.';
    }
    if (!formData.officeAddress || !formData.officeAddress.trim()) {
      errors.officeAddress = 'Office Address is required.';
    }
    if (!formData.plantAddress || !formData.plantAddress.trim()) {
      errors.plantAddress = 'Plant / Industry Address is required.';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required.';
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
    // Default to currently selected company from localStorage if available
    const activeCompId = localStorage.getItem('selectedCompanyId');
    const matchedComp = companies.find(c => String(c.id) === String(activeCompId));
    const defaultCompanyName = matchedComp ? (matchedComp.companyName || matchedComp.company_name) : (companies.length > 0 ? (companies[0].companyName || companies[0].company_name) : '');

    setFormData({
      clientName: '',
      contactNumber: '',
      companyName: defaultCompanyName,
      gender: 'Male',
      officeAddress: '',
      plantAddress: '',
      city: '',
      state: '',
      email: '',
      status: 'Active'
    });
    setFormErrors({});
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (client) => {
    setFormData({
      clientName: client.clientName || '',
      contactNumber: client.contactNumber || '',
      companyName: client.companyName || client.company_name || (client.company ? (client.company.companyName || client.company.company_name) : ''),
      gender: client.gender || 'Male',
      officeAddress: client.officeAddress || client.address || '',
      plantAddress: client.plantAddress || client.address || '',
      city: client.city || '',
      state: client.state || '',
      email: client.email || '',
      status: client.status || 'Active'
    });
    setFormErrors({});
    setEditingId(client.id);
    setIsFormOpen(true);
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
      ...formData,
      companyName: activeCompanyName || formData.companyName
    };

    try {
      if (editingId) {
        await apiService.put(CLIENT_ENDPOINTS.UPDATE(editingId), payload);
        triggerToast('Client updated successfully.', 'success');
      } else {
        await apiService.post(CLIENT_ENDPOINTS.CREATE, payload);
        triggerToast('Client created successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchClients();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
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
      await apiService.delete(CLIENT_ENDPOINTS.DELETE(deleteModal.id));
      triggerToast('Client deleted successfully.', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchClients();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete client.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to fetch all records matching active filter (no pagination limit)
  const fetchAllExportData = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const params = new URLSearchParams({
        page: 1,
        limit: 100000,
        search: searchQuery,
        status: statusFilter
      });
      if (activeCompId) {
        params.append('companyId', activeCompId);
      }

      const url = `${CLIENT_ENDPOINTS.GET_ALL}?${params.toString()}`;
      const response = await apiService.get(url);
      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : (response.data.rows || []);
      }
      return clients;
    } catch (err) {
      return clients;
    }
  };

  // CSV Export logic
  const handleDownloadCSV = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Client Name', 'Email', 'Contact Number', 'Office Address', 'Plant / Industry Address', 'City', 'State', 'Status'];
    const rows = allData.map(c => [
      c.clientName,
      c.email || 'N/A',
      c.contactNumber,
      c.officeAddress || c.address || 'N/A',
      c.plantAddress || c.address || 'N/A',
      c.city,
      c.state || 'N/A',
      c.status
    ]);
    downloadCSV(headers, rows, 'Clients_Report.csv');
    setShowDownloadDropdown(false);
  };

  // Excel Export logic
  const handleDownloadExcel = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Client Name', 'Email', 'Contact Number', 'Office Address', 'Plant / Industry Address', 'City', 'State', 'Status'];
    const rows = allData.map(c => [
      c.clientName,
      c.email || 'N/A',
      c.contactNumber,
      c.officeAddress || c.address || 'N/A',
      c.plantAddress || c.address || 'N/A',
      c.city,
      c.state || 'N/A',
      c.status
    ]);
    downloadExcel(headers, rows, 'Clients_Report.xlsx');
    setShowDownloadDropdown(false);
  };

  // Copy to Clipboard logic
  const handleCopy = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const headers = ['Client Name', 'Company Name', 'Email', 'Contact Number', 'Address', 'City', 'State', 'Status'];
    const rows = allData.map(c => [
      c.clientName,
      c.companyName || (c.company ? (c.company.companyName || c.company.company_name) : 'N/A'),
      c.email || 'N/A',
      c.contactNumber,
      c.address,
      c.city,
      c.state || 'N/A',
      c.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    copyTextToClipboard(text,
      () => triggerToast('Copied to clipboard successfully.', 'success'),
      () => triggerToast('Failed to copy text.', 'error')
    );
    setShowDownloadDropdown(false);
  };

  // PDF Print logic
  const handlePrintPDF = async () => {
    const allData = await fetchAllExportData();
    if (!allData || allData.length === 0) return;
    const printWindow = window.open('', '_blank');
    const rowsHtml = allData.map(c => `
      <tr>
        <td>${c.clientName}</td>
        <td>${c.companyName || (c.company ? (c.company.companyName || c.company.company_name) : 'N/A')}</td>
        <td>${c.email || 'N/A'}</td>
        <td>${c.contactNumber}</td>
        <td>${c.address}</td>
        <td>${c.city}</td>
        <td>${c.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Clients Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Clients Report</h2>
          <table>
            <thead>
              <tr><th>Client Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>City</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${rowsHtml}
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
          transition: 'all 0.3s ease-in-out'
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar */}
      <div className="master-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaUserFriends style={{ color: '#22c55e' }} />
          <span>Clients Master</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <>
              <button
                onClick={handleOpenCreate}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <FaPlus />
                <span>Client</span>
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
            disabled={clients.length === 0}
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
              opacity: clients.length === 0 ? 0.6 : 1,
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

      {/* Toggleable Form Block positioned right below action bar */}
      {isFormOpen && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
            {editingId ? 'Edit Client Details' : 'Add New Client'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Client Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Enter Client Name"
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.clientName ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none' }}
                />
                {formErrors.clientName && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.clientName}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Contact Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Contact Number"
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.contactNumber ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none' }}
                />
                {formErrors.contactNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.contactNumber}</span>}
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Office Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleInputChange}
                  placeholder="Enter Office Address"
                  rows={2}
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.officeAddress ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                />
                {formErrors.officeAddress && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.officeAddress}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Plant / Industry Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="plantAddress"
                  value={formData.plantAddress}
                  onChange={handleInputChange}
                  placeholder="Enter Plant / Industry Address"
                  rows={2}
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.plantAddress ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                />
                {formErrors.plantAddress && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.plantAddress}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Email ID
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter Email (comma separated for multiple)"
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.email ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none', height: '42px' }}
                />
              </div>

              {/* State Dropdown (India) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.state ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none', backgroundColor: '#ffffff', height: '42px', fontSize: '0.875rem' }}
                >
                  <option value="">-- Select State --</option>
                  {indianStates.map((s) => (
                    <option key={s.id || s.iso2} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {formErrors.state && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.state}</span>}
              </div>

              {/* City Dropdown (India) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  City <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!formData.state}
                  style={{
                    padding: '0.625rem',
                    border: `1px solid ${formErrors.city ? '#ef4444' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: !formData.state ? '#f8fafc' : '#ffffff',
                    height: '42px',
                    fontSize: '0.875rem',
                    cursor: !formData.state ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">{formData.state ? '-- Select City --' : '-- Select State First --'}</option>
                  {availableCities.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {formData.city && !availableCities.some(c => c.name.toLowerCase() === formData.city.toLowerCase()) && (
                    <option value={formData.city}>{formData.city}</option>
                  )}
                </select>
                {formErrors.city && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.city}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{ padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', backgroundColor: '#ffffff', height: '42px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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

{/* Filter and Table view */ }
<div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

  {/* Table Filters */}
  <div className="master-table-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
        Total Clients: {totalItems}
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
          <th style={{ padding: '0.75rem 0.75rem', width: '40px', textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={clients.length > 0 && selectedIds.length === clients.length}
              onChange={handleSelectAll}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ACTIONS</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>SR. NO.</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CLIENT NAME</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>EMAIL</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CONTACT</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>OFFICE ADDRESS</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>PLANT ADDRESS</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>CITY</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATE</th>
          <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading clients...
            </td>
          </tr>
        ) : clients.length === 0 ? (
          <tr>
            <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No clients found.
            </td>
          </tr>
        ) : (
          clients.map((client, index) => (
            <tr
              key={client.id}
              onClick={() => handleOpenEdit(client)}
              style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
              className="company-table-row"
            >
              <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(client.id)}
                  onChange={(e) => handleSelectRow(client.id, e)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </td>
              <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }}
                  style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  title="Edit"
                >
                  <FaEdit size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(client.id, client.clientName); }}
                  style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  title="Delete"
                >
                  <FaTrash size={12} />
                </button>
              </td>
              <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{client.clientName}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.email || 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.contactNumber}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.officeAddress || client.address || 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.plantAddress || client.address || 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.city}</td>
              <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{client.state || 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  backgroundColor: client.status === 'Active' ? '#dcfce7' : '#fee2e2',
                  color: client.status === 'Active' ? '#15803d' : '#991b1b'
                }}>
                  {client.status}
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
        Loading clients...
      </div>
    ) : clients.length === 0 ? (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No clients found.
      </div>
    ) : (
      <div className="master-card-grid">
        {clients.map((client, index) => (
          <div key={client.id} className="master-record-card" onClick={() => handleOpenEdit(client)}>
            <div className="master-record-card-header">
              <div>
                <div className="master-record-title">{client.clientName}</div>
                <div className="master-record-subtitle">#{(currentPage - 1) * pageSize + index + 1} • {client.companyName || 'N/A'}</div>
              </div>
              <span style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '12px',
                backgroundColor: client.status === 'Active' ? '#dcfce7' : '#fee2e2',
                color: client.status === 'Active' ? '#15803d' : '#991b1b'
              }}>
                {client.status}
              </span>
            </div>

            <div className="master-record-details">
              <div className="master-record-detail-item">
                <span className="master-record-label">Contact</span>
                <span className="master-record-value">{client.contactNumber || 'N/A'}</span>
              </div>
              <div className="master-record-detail-item">
                <span className="master-record-label">Email</span>
                <span className="master-record-value">{client.email || 'N/A'}</span>
              </div>
              <div className="master-record-detail-item">
                <span className="master-record-label">City</span>
                <span className="master-record-value">{client.city || 'N/A'}</span>
              </div>
              <div className="master-record-detail-item">
                <span className="master-record-label">State</span>
                <span className="master-record-value">{client.state || 'N/A'}</span>
              </div>
            </div>

            <div className="master-record-actions">
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }}
                style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FaEdit size={12} /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(client.id, client.clientName); }}
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

{/* Bulk Excel Import Modal */ }
<BulkImportModal
  isOpen={isBulkImportOpen}
  onClose={() => setIsBulkImportOpen(false)}
  masterType="client"
  existingDbRecords={clients}
  onImportSuccess={async (validRows) => {
    const res = await apiService.post(CLIENT_ENDPOINTS.BULK_IMPORT, { rows: validRows });
    if (res && res.success) {
      triggerToast(res.message || 'Clients imported successfully!', 'success');
      fetchClients(currentPage, pageSize, searchQuery, statusFilter);
    } else {
      throw new Error(res?.message || 'Failed to import clients.');
    }
  }}
/>

{/* Reusable Delete Confirmation Modal */ }
<ConfirmDialog
  isOpen={deleteModal.isOpen}
  onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
  onConfirm={confirmDelete}
  title="Delete Client"
  message={
    deleteModal.name ? (
      <>Are you sure you want to delete client <strong>{deleteModal.name}</strong>? This action cannot be undone.</>
    ) : (
      'Are you sure you want to delete this client? This action cannot be undone.'
    )
  }
  confirmText="Delete Client"
  cancelText="Cancel"
  variant="danger"
  loading={deleting}
/>
    </div>
  );
};

export default ClientMaster;
