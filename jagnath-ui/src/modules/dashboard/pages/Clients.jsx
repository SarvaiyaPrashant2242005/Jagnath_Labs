import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaPlus, FaTimes, FaUserAlt 
} from 'react-icons/fa';

// Initial client dataset matching the screenshot exactly
const INITIAL_CLIENTS_DATA = [
  { id: 'u1', name: 'Rajesh Patel', initials: 'RP', company: 'ABC Industries Pvt. Ltd.', designation: 'QA Manager', phone: '+91 98250 11223', email: 'rajesh.patel@abcind.com', requests: 14 },
  { id: 'u2', name: 'Nilesh Shah', initials: 'NS', company: 'Reliance Industries Ltd.', designation: 'Plant Head — Env.', phone: '+91 98200 44556', email: 'nilesh.shah@ril.com', requests: 23 },
  { id: 'u3', name: 'Harsh Mehta', initials: 'HM', company: 'Tata Chemicals Ltd.', designation: 'Compliance Officer', phone: '+91 97120 88991', email: 'harsh.mehta@tatachem.com', requests: 11 },
  { id: 'u4', name: 'Priya Joshi', initials: 'PJ', company: 'Adani Power Ltd.', designation: 'Site Engineer', phone: '+91 99040 33221', email: 'priya.joshi@adani.com', requests: 18 },
  { id: 'u5', name: 'Vikram Solanki', initials: 'VS', company: 'UltraTech Cement Ltd.', designation: 'EHS Coordinator', phone: '+91 98988 77665', email: 'vikram.s@ultratech.com', requests: 7 },
  { id: 'u6', name: 'Ketan Desai', initials: 'KD', company: 'Jagnath Municipal Corp.', designation: 'Health Inspector', phone: '+91 97370 22114', email: 'ketan.desai@jmc.gov.in', requests: 16 },
  { id: 'u7', name: 'Ami Rana', initials: 'AR', company: 'ABC Industries Pvt. Ltd.', designation: 'Lab Coordinator', phone: '+91 98795 65321', email: 'ami.rana@abcind.com', requests: 9 }
];

const Clients = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  // State variables for clients database
  const [clients, setClients] = useState(INITIAL_CLIENTS_DATA);
  
  // Filter settings states
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');

  // Slide Drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form registration state
  const [formData, setFormData] = useState({
    name: '',
    company: 'ABC Industries Pvt. Ltd.',
    designation: '',
    phone: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Sync drawer trigger prop
  useEffect(() => {
    if (openAddDrawerDirectly) {
      setIsDrawerOpen(true);
    }
  }, [openAddDrawerDirectly]);

  // Extract companies list dynamically
  const companiesList = useMemo(() => {
    const list = new Set(clients.map(c => c.company));
    return ['All', ...Array.from(list)];
  }, [clients]);

  // Live filter clients by search query and company dropdown
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // 1. Search Query filter (name, designation, email, phone)
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = q === '' || 
        c.name.toLowerCase().includes(q) || 
        c.designation.toLowerCase().includes(q) || 
        c.phone.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q);
        
      // 2. Company filter
      const matchCompany = companyFilter === 'All' || c.company === companyFilter;
      
      return matchQuery && matchCompany;
    });
  }, [clients, searchQuery, companyFilter]);

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
    setFormData({
      name: '',
      company: 'ABC Industries Pvt. Ltd.',
      designation: '',
      phone: '',
      email: ''
    });
    setFormErrors({});
    if (onCloseAddDrawer) {
      onCloseAddDrawer();
    }
  };

  // Submit and save new client details
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Client name is required';
    if (!formData.designation.trim()) errs.designation = 'Designation is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    // Compute initials from client name (e.g. "Rajesh Patel" -> "RP")
    const words = formData.name.trim().split(/\s+/);
    let initials = 'CL';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else if (words.length === 1 && words[0].length === 1) {
      initials = (words[0][0] + 'T').toUpperCase();
    }

    const newClient = {
      id: `u${clients.length + 1}`,
      name: formData.name.trim(),
      initials: initials,
      company: formData.company,
      designation: formData.designation.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      requests: 0
    };

    setClients([...clients, newClient]);
    
    if (triggerNotification) {
      triggerNotification();
    }

    closeDrawer();
  };

  return (
    <div className="clients-container">
      {/* Dynamic registered count stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
          {clients.length} client contacts
        </span>
        <button 
          className="client-add-btn"
          onClick={() => setIsDrawerOpen(true)}
        >
          <FaPlus />
          <span>Add Client</span>
        </button>
      </div>

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

            {/* Custom select filter for company name */}
            <select
              className="tr-filter-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="All">All Companies</option>
              {companiesList.filter(c => c !== 'All').map(company => (
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
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No client contacts found matching your criteria.
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
                    <td className="client-text-light">{c.email}</td>
                    <td>
                      <span className="client-req-badge">
                        {c.requests} requests
                      </span>
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
              <h2 className="tr-drawer-title">Add Client</h2>
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
                  >
                    {companiesList.filter(c => c !== 'All').map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
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
                  {formErrors.designation && <span className="wiz-field-error">{formErrors.designation}</span>}
                </div>

                {/* Phone */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Phone Number</label>
                  <input 
                    type="text"
                    name="phone"
                    className="tr-form-input"
                    placeholder="e.g. +91 98250 11223"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {formErrors.phone && <span className="wiz-field-error">{formErrors.phone}</span>}
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
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={closeDrawer}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
