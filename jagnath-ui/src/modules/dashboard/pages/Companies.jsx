import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaPlus, FaTimes, FaBuilding, FaEdit, FaTrash 
} from 'react-icons/fa';
import companyService from '../../../shared/services/companyService';

const Companies = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  // State variables for companies database
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter settings states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Slide Drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  // Form registration state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Manufacturing',
    location: '',
    gst: '',
    sinceMonth: 'Jan',
    sinceYear: '2026',
    email: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Sync drawer trigger prop
  useEffect(() => {
    if (openAddDrawerDirectly) {
      setIsDrawerOpen(true);
    }
  }, [openAddDrawerDirectly]);

  // Load user's company
  const loadCompanyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await companyService.getCompany();
      if (res.success && res.data) {
        // Map backend model to frontend list item
        const comp = res.data;
        const words = (comp.companyName || comp.company_name || '').trim().split(/\s+/);
        let initials = 'CO';
        if (words.length >= 2) {
          initials = (words[0][0] + words[1][0]).toUpperCase();
        } else if (words.length === 1 && words[0].length >= 2) {
          initials = words[0].substring(0, 2).toUpperCase();
        }

        let sinceMonth = 'Jan';
        let sinceYear = '2026';
        if (comp.description && comp.description.startsWith('Established:')) {
          const parts = comp.description.replace('Established: ', '').split(' ');
          if (parts.length >= 2) {
            sinceMonth = parts[0];
            sinceYear = parts[1];
          }
        }

        setCompanies([{
          id: comp.id,
          name: comp.companyName || comp.company_name,
          initials: initials,
          type: comp.description && !comp.description.startsWith('Established:') ? comp.description : 'Manufacturing',
          location: comp.address || '',
          gst: comp.gst_number || '—',
          clients: comp.clients ? comp.clients.length : 0,
          requests: comp.testRequests ? comp.testRequests.length : 0,
          since: `${sinceMonth} ${sinceYear}`,
          email: comp.companyEmail || comp.company_email || '',
          phone: comp.phone || comp.contact_number || ''
        }]);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load company details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  // Live filter companies by search query and type dropdown
  const filteredCompanies = companies.filter(c => {
    // 1. Search Query filter (name, location, gst)
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = q === '' || 
      c.name.toLowerCase().includes(q) || 
      c.location.toLowerCase().includes(q) || 
      c.gst.toLowerCase().includes(q);
      
    // 2. Type filter
    const matchType = typeFilter === 'All' || c.type === typeFilter;
    
    return matchQuery && matchType;
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
    setEditingCompanyId(null);
    setFormData({
      name: '',
      type: 'Manufacturing',
      location: '',
      gst: '',
      sinceMonth: 'Jan',
      sinceYear: '2026',
      email: '',
      phone: ''
    });
    setFormErrors({});
    if (onCloseAddDrawer) {
      onCloseAddDrawer();
    }
  };

  // Submit and save new or edited company details
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Company name is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      if (editingCompanyId) {
        await companyService.updateCompany(editingCompanyId, formData);
      } else {
        await companyService.createCompany(formData);
      }
      
      if (triggerNotification) {
        triggerNotification();
      }

      closeDrawer();
      await loadCompanyData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save company information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (c) => {
    const parts = c.since.split(' ');
    setFormData({
      name: c.name,
      type: c.type,
      location: c.location,
      gst: c.gst !== '—' ? c.gst : '',
      sinceMonth: parts[0] || 'Jan',
      sinceYear: parts[1] || '2026',
      email: c.email || '',
      phone: c.phone || ''
    });
    setEditingCompanyId(c.id);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = async (c) => {
    if (window.confirm(`Are you sure you want to delete company "${c.name}"?`)) {
      setIsLoading(true);
      try {
        await companyService.deleteCompany(c.id);
        if (triggerNotification) {
          triggerNotification();
        }
        await loadCompanyData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete company.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="companies-container">
      {/* Dynamic registered count stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
          {isLoading ? 'Loading...' : `${companies.length} company registered`}
        </span>
        {/* Hide Add button if company already exists (1 company restriction per user) */}
        {!isLoading && companies.length === 0 && (
          <button 
            className="comp-add-btn"
            onClick={() => setIsDrawerOpen(true)}
          >
            <FaPlus />
            <span>Add Company</span>
          </button>
        )}
      </div>

      {error && (
        <div className="form-alert form-alert-error" style={{ margin: '1rem 0.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Main Companies Card block */}
      <div className="comp-card">
        {/* Card Filters header */}
        <div className="comp-card-header">
          <div className="comp-filters-left">
            <div className="comp-search-wrapper">
              <FaSearch className="comp-search-icon" />
              <input 
                type="text" 
                className="comp-search-input" 
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="tr-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Petrochemical">Petrochemical</option>
              <option value="Chemical">Chemical</option>
              <option value="Power Generation">Power Generation</option>
              <option value="Cement">Cement</option>
              <option value="Government">Government</option>
            </select>

            <button className="comp-filter-btn">
              <FaFilter />
              <span>Type</span>
            </button>
          </div>
        </div>

        {/* Master Table Grid */}
        <div className="comp-table-wrapper">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Type</th>
                <th>Location</th>
                <th>GST No.</th>
                <th>Clients</th>
                <th>Requests</th>
                <th>Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading company details...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No company registered. Please register your company using the "Add Company" button.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="comp-name-cell">
                        <div className={`comp-avatar ${c.initials.toLowerCase()} generic`}>
                          {c.initials}
                        </div>
                        <span className="comp-name-title">{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`comp-type-badge ${c.type.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="comp-text-medium">{c.location}</td>
                    <td className="comp-text-light">{c.gst}</td>
                    <td className="comp-text-medium" style={{ paddingLeft: '1.25rem' }}>{c.clients}</td>
                    <td className="comp-text-medium" style={{ paddingLeft: '1.5rem' }}>{c.requests}</td>
                    <td className="comp-text-muted">{c.since}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                          className="action-btn-edit" 
                          onClick={() => handleEditClick(c)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '1rem' }}
                          title="Edit Company"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn-delete" 
                          onClick={() => handleDeleteClick(c)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="Delete Company"
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

      {/* Slide drawer registration form */}
      {isDrawerOpen && (
        <div className="tr-modal-overlay" onClick={closeDrawer}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">{editingCompanyId ? 'Edit Company' : 'Add Company'}</h2>
              <button className="tr-drawer-close" onClick={closeDrawer}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                {/* Company Name */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Company Name</label>
                  <input 
                    type="text"
                    name="name"
                    className="tr-form-input"
                    placeholder="e.g. UltraTech Cement Ltd."
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <span className="wiz-field-error">{formErrors.name}</span>}
                </div>

                {/* Company Type selection */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Company Type</label>
                  <select
                    name="type"
                    className="wiz-field-select tr-form-select"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Petrochemical">Petrochemical</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Power Generation">Power Generation</option>
                    <option value="Cement">Cement</option>
                    <option value="Government">Government</option>
                  </select>
                </div>

                {/* Location */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Location (Address)</label>
                  <input 
                    type="text"
                    name="location"
                    className="tr-form-input"
                    placeholder="e.g. Rajkot, GJ"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                  {formErrors.location && <span className="wiz-field-error">{formErrors.location}</span>}
                </div>

                {/* Phone & Email Row */}
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
                  </div>
                  <div className="tr-form-group">
                    <label className="tr-form-label">Email Address</label>
                    <input 
                      type="email"
                      name="email"
                      className="tr-form-input"
                      placeholder="e.g. company@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* GST No. */}
                <div className="tr-form-group">
                  <label className="tr-form-label">GST Number</label>
                  <input 
                    type="text"
                    name="gst"
                    className="tr-form-input"
                    placeholder="e.g. 24AAACB1234F1Z5"
                    value={formData.gst}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Since Date */}
                <div className="tr-form-row">
                  <div className="tr-form-group">
                    <label className="tr-form-label">Since Month</label>
                    <select
                      name="sinceMonth"
                      className="wiz-field-select tr-form-select"
                      value={formData.sinceMonth}
                      onChange={handleInputChange}
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="tr-form-group">
                    <label className="tr-form-label">Since Year</label>
                    <select
                      name="sinceYear"
                      className="wiz-field-select tr-form-select"
                      value={formData.sinceYear}
                      onChange={handleInputChange}
                    >
                      {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={closeDrawer} disabled={isLoading}>Cancel</button>
                <button type="submit" className="tr-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingCompanyId ? 'Save Changes' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
