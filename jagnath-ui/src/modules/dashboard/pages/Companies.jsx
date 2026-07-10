import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaPlus, FaTimes, FaBuilding 
} from 'react-icons/fa';

// Initial company dataset matching the screenshot exactly
const INITIAL_COMPANIES_DATA = [
  { id: 'c1', name: 'ABC Industries Pvt. Ltd.', initials: 'AI', type: 'Manufacturing', location: 'Rajkot, GJ', gst: '24AAACB1234F1Z5', clients: 4, requests: 32, since: 'Jan 2023' },
  { id: 'c2', name: 'Reliance Industries Ltd.', initials: 'RI', type: 'Petrochemical', location: 'Jamnagar, GJ', gst: '24AAACR5055K1Z4', clients: 6, requests: 58, since: 'Mar 2021' },
  { id: 'c3', name: 'Tata Chemicals Ltd.', initials: 'TC', type: 'Chemical', location: 'Mithapur, GJ', gst: '24AAACT2727Q1ZW', clients: 3, requests: 21, since: 'Jul 2022' },
  { id: 'c4', name: 'Adani Power Ltd.', initials: 'AP', type: 'Power Generation', location: 'Mundra, GJ', gst: '24AAACA1234M1Z2', clients: 5, requests: 44, since: 'Nov 2022' },
  { id: 'c5', name: 'UltraTech Cement Ltd.', initials: 'UC', type: 'Cement', location: 'Kovaya, GJ', gst: '24AAACL6631J1ZM', clients: 2, requests: 15, since: 'Feb 2024' },
  { id: 'c6', name: 'Jagnath Municipal Corp.', initials: 'JM', type: 'Government', location: 'Rajkot, GJ', gst: '—', clients: 3, requests: 27, since: 'Sep 2023' }
];

const Companies = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  // State variables for companies database
  const [companies, setCompanies] = useState(INITIAL_COMPANIES_DATA);
  
  // Filter settings states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Slide Drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form registration state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Manufacturing',
    location: '',
    gst: '',
    sinceMonth: 'Jan',
    sinceYear: '2026'
  });
  const [formErrors, setFormErrors] = useState({});

  // Sync drawer trigger prop
  useEffect(() => {
    if (openAddDrawerDirectly) {
      setIsDrawerOpen(true);
    }
  }, [openAddDrawerDirectly]);

  // Extract company types dynamically
  const typesList = useMemo(() => {
    const list = new Set(companies.map(c => c.type));
    return ['All', ...Array.from(list)];
  }, [companies]);

  // Live filter companies by search query and type dropdown
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
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
  }, [companies, searchQuery, typeFilter]);

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
      type: 'Manufacturing',
      location: '',
      gst: '',
      sinceMonth: 'Jan',
      sinceYear: '2026'
    });
    setFormErrors({});
    if (onCloseAddDrawer) {
      onCloseAddDrawer();
    }
  };

  // Submit and save new company details
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Company name is required';
    if (!formData.location.trim()) errs.location = 'Location is required';
    
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    // Compute initials from company name (e.g. "ABC Industries" -> "AI", "Adani Power" -> "AP")
    const words = formData.name.trim().split(/\s+/);
    let initials = 'CO';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else if (words.length === 1 && words[0].length === 1) {
      initials = (words[0][0] + 'M').toUpperCase();
    }

    const newCompany = {
      id: `c${companies.length + 1}`,
      name: formData.name.trim(),
      initials: initials,
      type: formData.type,
      location: formData.location.trim(),
      gst: formData.gst.trim() || '—',
      clients: 0,
      requests: 0,
      since: `${formData.sinceMonth} ${formData.sinceYear}`
    };

    setCompanies([...companies, newCompany]);
    
    if (triggerNotification) {
      triggerNotification();
    }

    closeDrawer();
  };

  return (
    <div className="companies-container">
      {/* Dynamic registered count stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
          {companies.length} companies registered
        </span>
        <button 
          className="comp-add-btn"
          onClick={() => setIsDrawerOpen(true)}
        >
          <FaPlus />
          <span>Add Company</span>
        </button>
      </div>

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

            {/* Custom select filter for company type */}
            <select
              className="tr-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {typesList.filter(t => t !== 'All').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
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
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No companies registered matching your criteria.
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
              <h2 className="tr-drawer-title">Add Company</h2>
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
                  <label className="tr-form-label">Location</label>
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
                <button type="button" className="tr-cancel-btn" onClick={closeDrawer}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
