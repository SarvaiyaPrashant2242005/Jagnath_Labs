import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaPlus, FaTimes, FaUserAlt, FaEdit, FaTrash 
} from 'react-icons/fa';
import clientService from '../../../shared/services/clientService';
import companyService from '../../../shared/services/companyService';

const Clients = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  // State variables for clients database
  const [clients, setClients] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter settings states
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');

  // Slide Drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  // Form registration state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    designation: '',
    phone: '',
    email: '',
    gender: 'Male',
    city: 'Rajkot',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Sync drawer trigger prop
  useEffect(() => {
    if (openAddDrawerDirectly) {
      setIsDrawerOpen(true);
    }
  }, [openAddDrawerDirectly]);

  // Load clients and company info
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get user's company
      const compRes = await companyService.getCompany();
      let currentCompany = '';
      if (compRes.success && compRes.data) {
        currentCompany = compRes.data.companyName || compRes.data.company_name || '';
        setCompanyName(currentCompany);
        setFormData(prev => ({ ...prev, company: currentCompany }));
      }

      // 2. Get clients list
      const clientRes = await clientService.getClients();
      if (clientRes.success && clientRes.data) {
        const clientList = clientRes.data.map(c => {
          const words = (c.clientName || '').trim().split(/\s+/);
          let initials = 'CL';
          if (words.length >= 2) {
            initials = (words[0][0] + words[1][0]).toUpperCase();
          } else if (words.length === 1 && words[0].length >= 2) {
            initials = words[0].substring(0, 2).toUpperCase();
          }
          return {
            id: c.id,
            name: c.clientName,
            initials: initials,
            company: currentCompany, // All clients belong to user's company
            designation: 'Contact Person', // Backend doesn't store this, mock display
            phone: c.contactNumber || '',
            email: c.address && c.address.includes('@') ? c.address : '',
            gender: c.gender || 'Male',
            city: c.city || 'Rajkot',
            address: c.address || ''
          };
        });
        setClients(clientList);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve client contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract companies list dynamically (for filtering)
  const companiesList = useMemo(() => {
    return ['All', companyName].filter(Boolean);
  }, [companyName]);

  // Live filter clients by search query and company dropdown
  const filteredClients = clients.filter(c => {
    // 1. Search Query filter (name, designation, email, phone)
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === '' || 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q);
      
    // 2. Company filter
    const matchCompany = companyFilter === 'All' || c.company === companyFilter;
    
    return matchQuery && matchCompany;
  });

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingClientId(null);
    setFormData({
      name: '',
      company: companyName,
      designation: '',
      phone: '',
      email: '',
      gender: 'Male',
      city: 'Rajkot',
      address: ''
    });
    setFormErrors({});
    if (onCloseAddDrawer) {
      onCloseAddDrawer();
    }
  };

  // Submit and save new or edited client details
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Client name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!companyName) errs.company = 'Please register a company first before adding clients';
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      // Map email to address field if address is empty
      const submissionData = {
        ...formData,
        company: companyName,
        address: formData.address || formData.email
      };

      if (editingClientId) {
        await clientService.updateClient(editingClientId, submissionData);
      } else {
        await clientService.createClient(submissionData);
      }
      
      if (triggerNotification) {
        triggerNotification();
      }

      closeDrawer();
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save client details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (c) => {
    setFormData({
      name: c.name,
      company: c.company,
      designation: c.designation,
      phone: c.phone,
      email: c.email || c.address || '',
      gender: c.gender || 'Male',
      city: c.city || 'Rajkot',
      address: c.address || ''
    });
    setEditingClientId(c.id);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = async (c) => {
    if (window.confirm(`Are you sure you want to delete client "${c.name}"?`)) {
      setIsLoading(true);
      try {
        await clientService.deleteClient(c.id);
        if (triggerNotification) {
          triggerNotification();
        }
        await loadData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete client contact.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="clients-container">
      {/* Dynamic registered count stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
          {isLoading ? 'Loading...' : `${clients.length} client contacts`}
        </span>
        {companyName && (
          <button 
            className="client-add-btn"
            onClick={() => setIsDrawerOpen(true)}
          >
            <FaPlus />
            <span>Add Client</span>
          </button>
        )}
      </div>

      {error && (
        <div className="form-alert form-alert-error" style={{ margin: '1rem 0.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Main Clients Card block */}
      <div className="client-card">
        {/* Card Filters header */}
        <div className="client-card-header">
          <div className="client-filters-left">
            <div className="client-search-wrapper">
              <FaSearch className="client-search-icon" />
              <input 
                type="text" 
                className="client-search-input" 
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="tr-filter-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="All">All Companies</option>
              {companiesList.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            <button className="client-filter-btn">
              <FaFilter />
              <span>Company</span>
            </button>
          </div>
        </div>

        {/* Master Table Grid */}
        <div className="client-table-wrapper">
          <table className="client-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading client contacts...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No client contacts found. Please add a client to start.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">
                          {c.initials}
                        </div>
                        <span className="client-name-title">{c.name}</span>
                      </div>
                    </td>
                    <td className="client-text-medium">{c.company}</td>
                    <td className="client-text-medium">{c.designation}</td>
                    <td className="client-text-light">{c.phone}</td>
                    <td className="client-text-light">{c.email || c.address}</td>
                    <td>
                      <span className="client-req-badge">
                        {c.requests} requests
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                          className="action-btn-edit" 
                          onClick={() => handleEditClick(c)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '1rem' }}
                          title="Edit Client"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn-delete" 
                          onClick={() => handleDeleteClick(c)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="Delete Client"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide drawer client registration form */}
      {isDrawerOpen && (
        <div className="tr-modal-overlay" onClick={closeDrawer}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">{editingClientId ? 'Edit Client' : 'Add Client'}</h2>
              <button className="tr-drawer-close" onClick={closeDrawer}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                {/* Client Name */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Client Name</label>
                  <input 
                    type="text"
                    name="name"
                    className="tr-form-input"
                    placeholder="e.g. Rajesh Patel"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <span className="wiz-field-error">{formErrors.name}</span>}
                </div>

                {/* Company select */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Company</label>
                  <select
                    name="company"
                    className="wiz-field-select tr-form-select"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={true} // Loaded automatically from backend company API
                  >
                    <option value={companyName}>{companyName || 'No Company Registered'}</option>
                  </select>
                  {formErrors.company && <span className="wiz-field-error">{formErrors.company}</span>}
                </div>

                {/* Phone & Gender Row */}
                <div className="tr-form-row">
                  <div className="tr-form-group">
                    <label className="tr-form-label">Phone Number</label>
                    <input 
                      type="text"
                      name="phone"
                      className="tr-form-input"
                      placeholder="e.g. 9825011223"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    {formErrors.phone && <span className="wiz-field-error">{formErrors.phone}</span>}
                  </div>
                  <div className="tr-form-group">
                    <label className="tr-form-label">Gender</label>
                    <select
                      name="gender"
                      className="wiz-field-select tr-form-select"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Email Address</label>
                  <input 
                    type="email"
                    name="email"
                    className="tr-form-input"
                    placeholder="e.g. rajesh.patel@abcind.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && <span className="wiz-field-error">{formErrors.email}</span>}
                </div>

                {/* Designation & City Row */}
                <div className="tr-form-row">
                  <div className="tr-form-group">
                    <label className="tr-form-label">Designation</label>
                    <input 
                      type="text"
                      name="designation"
                      className="tr-form-input"
                      placeholder="e.g. QA Manager"
                      value={formData.designation}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="tr-form-group">
                    <label className="tr-form-label">City</label>
                    <input 
                      type="text"
                      name="city"
                      className="tr-form-input"
                      placeholder="e.g. Rajkot"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Address</label>
                  <textarea 
                    name="address"
                    className="tr-form-input"
                    style={{ height: '70px', padding: '0.5rem', fontFamily: 'inherit' }}
                    placeholder="e.g. 102, ABC Plaza, GIDC"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={closeDrawer} disabled={isLoading}>Cancel</button>
                <button type="submit" className="tr-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingClientId ? 'Save Changes' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
