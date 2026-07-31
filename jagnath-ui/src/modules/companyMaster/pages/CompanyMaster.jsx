import React, { useState, useEffect, useRef } from 'react';
import { 
  FaBuilding, FaPlus, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaFileExcel, FaCopy, FaFileCsv, 
  FaFilePdf, FaPrint, FaChevronDown, FaUserShield
} from 'react-icons/fa';
import { apiService } from '../../../shared/services/apiService';
import { COMPANY_ENDPOINTS, USER_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import { getStoredUser } from '../../auth/services/authService';
import { getIndianStates, getCitiesByStateIso2 } from '../../../shared/services/locationService';
import Pagination from '../../../shared/components/Pagination';
import { copyTextToClipboard, downloadCSV, downloadExcel } from '../../../shared/utils/exportUtils';

const CompanyMaster = ({ onCompanyUpdate }) => {
  // Company state
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Location dropdown states (India)
  const [indianStates, setIndianStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Toast notifications state (success or error)
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
    companyName: '',
    companyEmail: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    status: 'Active'
  });
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Super Admin Detection & User Assignment State
  const currentUser = getStoredUser();
  const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.email === 'admin@jagnath.com';
  const [usersList, setUsersList] = useState([]);
  const [assignMode, setAssignMode] = useState('existing');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'Admin' });

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

  useEffect(() => {
    if (isSuperAdmin) {
      apiService.get(USER_ENDPOINTS.GET_ALL)
        .then(res => {
          if (res?.data) {
            setUsersList(Array.isArray(res.data) ? res.data : []);
          }
        })
        .catch(err => console.error('Failed to fetch platform users for assignment', err));
    }
  }, [isSuperAdmin]);

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

  // Fetch company associated with user id
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter
      });
      const response = await apiService.get(`${COMPANY_ENDPOINTS.GET_MY}?${params.toString()}`);
      
      if (response && response.data) {
        if (response.data.rows !== undefined) {
           setCompanies(response.data.rows);
           setTotalItems(response.data.total);
           setTotalPages(response.data.totalPages);
           if (response.data.rows.length > 0 && onCompanyUpdate) {
              onCompanyUpdate(response.data.rows[0].companyName || response.data.rows[0].company_name);
           }
        } else {
           const companyList = Array.isArray(response.data) ? response.data : [response.data];
           setCompanies(companyList);
           setTotalItems(companyList.length);
           setTotalPages(1);
           
           if (companyList.length > 0 && onCompanyUpdate) {
             onCompanyUpdate(companyList[0].companyName || companyList[0].company_name);
           }
        }
      } else {
        setCompanies([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      if (err.status !== 404 && err.errorCode !== 'NOT_FOUND') {
        triggerToast(err.messageToShow || err.message || 'Failed to fetch companies.', 'error');
      } else {
        setCompanies([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company Name is required.';
    }
    if (!formData.companyEmail.trim()) {
      errors.companyEmail = 'Company Email is required.';
    } else if (!emailRegex.test(formData.companyEmail)) {
      errors.companyEmail = 'Please enter a valid email address.';
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

  // Handle local file validations (max 16MB, JPG/PNG)
  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      triggerToast("File size exceeds 16MB limit.", "error");
      e.target.value = null;
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      triggerToast("Only PNG, JPG, and JPEG files are allowed.", "error");
      e.target.value = null;
      return;
    }

    setFile(file);
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setFormData({
      companyName: '',
      companyEmail: '',
      phone: '',
      address: '',
      state: '',
      city: '',
      status: 'Active'
    });
    setLogoFile(null);
    setSignatureFile(null);
    setFormErrors({});
    setSelectedUserId('');
    setNewUserData({ name: '', email: '', password: '', role: 'Admin' });
    setAssignMode('existing');
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (company) => {
    setFormData({
      companyName: company.companyName || company.company_name || '',
      companyEmail: company.companyEmail || company.company_email || '',
      phone: company.phone || company.contact_number || '',
      address: company.address || '',
      state: company.state || '',
      city: company.city || '',
      status: company.status || 'Active'
    });
    setLogoFile(null);
    setSignatureFile(null);
    setFormErrors({});
    setSelectedUserId('');
    setNewUserData({ name: '', email: '', password: '', role: 'Admin' });
    setAssignMode('existing');
    setEditingId(company.id);
    setIsFormOpen(true);
  };

  // Submit Handler using multipart FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('companyName', formData.companyName);
    formDataToSend.append('companyEmail', formData.companyEmail);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('state', formData.state || '');
    formDataToSend.append('city', formData.city || '');
    formDataToSend.append('status', formData.status);
    if (logoFile) {
      formDataToSend.append('logo', logoFile);
    }
    if (signatureFile) {
      formDataToSend.append('signature', signatureFile);
    }

    if (isSuperAdmin) {
      if (assignMode === 'existing' && selectedUserId) {
        formDataToSend.append('assignedUserId', selectedUserId);
      } else if (assignMode === 'new') {
        if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
          triggerToast('Please fill in Name, Email, and Password for the new user.', 'error');
          setSubmitting(false);
          return;
        }
        formDataToSend.append('createNewUser', 'true');
        formDataToSend.append('newUser', JSON.stringify(newUserData));
      }
    }

    try {
      if (editingId) {
        const response = await apiService.putForm(COMPANY_ENDPOINTS.UPDATE(editingId), formDataToSend);
        triggerToast(response.messageToShow || 'Company updated successfully.', 'success');
      } else {
        const response = await apiService.postForm(COMPANY_ENDPOINTS.CREATE, formDataToSend);
        triggerToast(response.messageToShow || 'Company created successfully.', 'success');
      }
      setIsFormOpen(false);
      fetchCompanies();
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await apiService.delete(COMPANY_ENDPOINTS.DELETE(id));
      triggerToast('Company deleted successfully.', 'success');
      fetchCompanies();
      if (onCompanyUpdate) {
        onCompanyUpdate(null);
      }
    } catch (err) {
      triggerToast(err.messageToShow || err.message || 'Failed to delete company.', 'error');
    }
  };

  // CSV Export logic
  const handleDownloadCSV = () => {
    if (companies.length === 0) return;
    const headers = ['Company Name', 'Email', 'Phone', 'Address', 'City', 'Status'];
    const rows = companies.map(c => [
      c.companyName || c.company_name || 'N/A',
      c.companyEmail || c.company_email || 'N/A',
      c.phone || c.contact_number || 'N/A',
      c.address || 'N/A',
      c.city || 'N/A',
      c.status
    ]);
    downloadCSV(headers, rows, 'Companies_Report.csv');
    setShowDownloadDropdown(false);
  };

  // Excel Export logic
  const handleDownloadExcel = () => {
    if (companies.length === 0) return;
    const headers = ['Company Name', 'Email', 'Phone', 'Address', 'City', 'Status'];
    const rows = companies.map(c => [
      c.companyName || c.company_name || 'N/A',
      c.companyEmail || c.company_email || 'N/A',
      c.phone || c.contact_number || 'N/A',
      c.address || 'N/A',
      c.city || 'N/A',
      c.status
    ]);
    downloadExcel(headers, rows, 'Companies_Report.xlsx');
    setShowDownloadDropdown(false);
  };

  // Clipboard copy
  const handleCopy = () => {
    if (companies.length === 0) return;
    const headers = ['Company Name', 'Email', 'Phone', 'Address', 'City', 'Status'];
    const rows = companies.map(c => [
      c.companyName || c.company_name || 'N/A',
      c.companyEmail || c.company_email || 'N/A',
      c.phone || c.contact_number || 'N/A',
      c.address || 'N/A',
      c.city || 'N/A',
      c.status
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    copyTextToClipboard(text, 
      () => triggerToast('Copied to clipboard successfully.', 'success'),
      () => triggerToast('Failed to copy text.', 'error')
    );
    setShowDownloadDropdown(false);
  };

  // PDF Export
  const handlePrintPDF = () => {
    if (companies.length === 0) return;
    const printWindow = window.open('', '_blank');
    const headers = ['Company Name', 'Email', 'Phone', 'Address', 'City', 'Status'];
    const rows = companies.map(c => `
      <tr>
        <td>${c.companyName || c.company_name || 'N/A'}</td>
        <td>${c.companyEmail || c.company_email || 'N/A'}</td>
        <td>${c.phone || c.contact_number || 'N/A'}</td>
        <td>${c.address || 'N/A'}</td>
        <td>${c.city || 'N/A'}</td>
        <td>${c.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Companies Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Companies Report</h2>
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
          transition: 'all 0.3s ease-in-out',
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar matching Screenshot 2 */}
      <div className="master-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaBuilding style={{ color: '#22c55e' }} />
          <span>Company</span>
        </h2>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={dropdownRef}>
          {!isFormOpen && (
            <button 
              onClick={handleOpenCreate} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <FaPlus />
              <span>Company</span>
            </button>
          )}

          {/* Redesigned Premium Download Button matching Screenshot */}
          <button 
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)} 
            disabled={companies.length === 0}
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
              opacity: companies.length === 0 ? 0.6 : 1,
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
            {editingId ? 'Edit Company Master' : 'Add Company Master'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Company Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Company Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter Company Name"
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.companyName ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none' }}
                />
                {formErrors.companyName && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.companyName}</span>}
              </div>

              {/* Company Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  Company Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  placeholder="Enter Company Email"
                  style={{ padding: '0.625rem', border: `1px solid ${formErrors.companyEmail ? '#ef4444' : '#cbd5e1'}`, borderRadius: '6px', outline: 'none' }}
                />
                {formErrors.companyEmail && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{formErrors.companyEmail}</span>}
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter Phone Number"
                  style={{ padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                />
              </div>

            </div>

            {/* Address, State, City & Status Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1.25rem', marginTop: '0.5rem', alignItems: 'end' }}>
              {/* Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter Company Address"
                  rows={1}
                  style={{ padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', resize: 'none', height: '42px', fontFamily: 'inherit' }}
                />
              </div>

              {/* State Dropdown (India) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>State</label>
                <select
                  name="state"
                  value={formData.state || ''}
                  onChange={handleStateChange}
                  style={{ padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', backgroundColor: '#ffffff', height: '42px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Select State --</option>
                  {indianStates.map((s) => (
                    <option key={s.id || s.iso2} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown (India) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>City</label>
                <select
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  disabled={!formData.state}
                  style={{ 
                    padding: '0.625rem', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px', 
                    outline: 'none', 
                    backgroundColor: !formData.state ? '#f8fafc' : '#ffffff', 
                    height: '42px',
                    fontSize: '0.85rem',
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
              </div>

              {/* Status Toggle Switch */}
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

            {/* Logo and Signature File Uploads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
              {/* Logo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Company Logo (Max 16MB)</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange(e, setLogoFile)}
                  style={{ 
                    padding: '0.5rem', 
                    border: '1px dashed #cbd5e1', 
                    borderRadius: '6px', 
                    fontSize: '0.85rem', 
                    color: '#475569', 
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer' 
                  }}
                />
              </div>

              {/* Signature Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Authorized Signature (Max 16MB)</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange(e, setSignatureFile)}
                  style={{ 
                    padding: '0.5rem', 
                    border: '1px dashed #cbd5e1', 
                    borderRadius: '6px', 
                    fontSize: '0.85rem', 
                    color: '#475569', 
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer' 
                  }}
                />
              </div>
            </div>

            {/* Assign User / Company Admin Section (Super Admin Only) */}
            {isSuperAdmin && (
              <div style={{
                marginTop: '1rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaUserShield style={{ color: '#a855f7' }} />
                    <span>Assign Company Admin User</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', background: '#f3e8ff', color: '#7e22ce', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 700 }}>
                    Super Admin Only
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="assignUserMode" 
                      value="existing" 
                      checked={assignMode === 'existing'} 
                      onChange={() => setAssignMode('existing')} 
                    />
                    <span>Assign Existing Platform User</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="assignUserMode" 
                      value="new" 
                      checked={assignMode === 'new'} 
                      onChange={() => setAssignMode('new')} 
                    />
                    <span>Create & Assign New Admin User</span>
                  </label>
                </div>

                {assignMode === 'existing' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Select Existing User</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#ffffff' }}
                    >
                      <option value="">-- Select Existing User to Assign --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email}) - Role: {u.role || 'User'}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>User Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. John Manager"
                        value={newUserData.name}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#ffffff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>User Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="email"
                        placeholder="manager@company.com"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#ffffff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>User Password <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#ffffff' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
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

      {/* Filter and Table view matching Screenshot 2 */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Table Filters */}
        <div className="master-table-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
            Total Companies: {totalItems}
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
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COMPANY CODE</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>COMPANY NAME</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>EMAIL</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>PHONE</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>ADDRESS</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        Loading companies...
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No companies found.
                      </td>
                    </tr>
                  ) : (
                    companies.map((company, index) => (
                      <tr 
                        key={company.id} 
                        onClick={() => handleOpenEdit(company)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                        className="company-table-row"
                      >
                        <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(company); }}
                            style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}
                            style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#0f172a' }}>{(currentPage - 1) * pageSize + index + 1}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#2563eb', fontWeight: 700 }}>{company.companyCode || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#0f172a', fontWeight: 600 }}>{company.companyName || company.company_name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{company.companyEmail || company.email || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{company.contactNumber || company.phone || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.address || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            backgroundColor: company.status === 'Active' ? '#dcfce7' : '#fee2e2',
                            color: company.status === 'Active' ? '#15803d' : '#991b1b'
                          }}>
                            {company.status}
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
                  Loading companies...
                </div>
              ) : companies.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No companies found.
                </div>
              ) : (
                <div className="master-card-grid">
                  {companies.map((company, index) => (
                    <div key={company.id} className="master-record-card" onClick={() => handleOpenEdit(company)}>
                      <div className="master-record-card-header">
                        <div>
                          <div className="master-record-title">{company.companyName || company.company_name}</div>
                          <div className="master-record-subtitle">Code: <span style={{ color: '#2563eb', fontWeight: 700 }}>{company.companyCode || 'N/A'}</span></div>
                        </div>
                        <span style={{ 
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: '12px',
                          backgroundColor: company.status === 'Active' ? '#dcfce7' : '#fee2e2',
                          color: company.status === 'Active' ? '#15803d' : '#991b1b'
                        }}>
                          {company.status}
                        </span>
                      </div>

                      <div className="master-record-details">
                        <div className="master-record-detail-item">
                          <span className="master-record-label">Email</span>
                          <span className="master-record-value">{company.companyEmail || company.email || 'N/A'}</span>
                        </div>
                        <div className="master-record-detail-item">
                          <span className="master-record-label">Phone</span>
                          <span className="master-record-value">{company.contactNumber || company.phone || 'N/A'}</span>
                        </div>
                        <div className="master-record-detail-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="master-record-label">Address</span>
                          <span className="master-record-value">{company.address || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="master-record-actions">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(company); }}
                          style={{ background: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.8rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}
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
            setCurrentPage(1); // Reset to page 1 on page size change
          }}
        />

      </div>

    </div>
  );
};

export default CompanyMaster;
