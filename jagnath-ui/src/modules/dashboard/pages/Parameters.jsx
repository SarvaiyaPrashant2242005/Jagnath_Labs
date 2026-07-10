import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaPlus, FaTimes, FaCheck, FaEdit, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

// Catalog of Categories for Parameter mappings
const CATEGORIES_LIST = [
  'Drinking Water', 'Ground Water', 'Surface Water', 'Waste Water', 'Food', 'Soil'
];

// Initial parameters database matching the screenshot exactly
const INITIAL_PARAMETERS_DATA = [
  { id: 'p1', name: 'pH', unit: '—', price: 150, turnaround: '2 hrs', categories: ['Drinking Water', 'Ground Water', 'Surface Water', 'Waste Water', 'Soil'] },
  { id: 'p2', name: 'TDS', unit: 'mg/L', price: 150, turnaround: '2 hrs', categories: ['Drinking Water', 'Ground Water'] },
  { id: 'p3', name: 'Chloride', unit: 'mg/L', price: 200, turnaround: '3 hrs', categories: ['Drinking Water'] },
  { id: 'p4', name: 'Fluoride', unit: 'mg/L', price: 250, turnaround: '4 hrs', categories: ['Drinking Water', 'Ground Water'] },
  { id: 'p5', name: 'Total Hardness', unit: 'mg/L', price: 200, turnaround: '3 hrs', categories: ['Drinking Water', 'Ground Water'] },
  { id: 'p6', name: 'Calcium', unit: 'mg/L', price: 220, turnaround: '3 hrs', categories: ['Drinking Water'] },
  { id: 'p7', name: 'Turbidity', unit: 'NTU', price: 150, turnaround: '1 hr', categories: ['Drinking Water', 'Surface Water'] },
  { id: 'p8', name: 'Iron', unit: 'mg/L', price: 200, turnaround: '4 hrs', categories: ['Drinking Water', 'Ground Water'] },
  { id: 'p9', name: 'Residual Chlorine', unit: 'mg/L', price: 150, turnaround: '1 hr', categories: ['Drinking Water'] },
  { id: 'p10', name: 'E. Coli', unit: 'CFU/100mL', price: 450, turnaround: '24 hrs', categories: ['Drinking Water'] },
  
  { id: 'p11', name: 'Nitrate', unit: 'mg/L', price: 260, turnaround: '4 hrs', categories: ['Ground Water'] },
  { id: 'p12', name: 'Sulphate', unit: 'mg/L', price: 240, turnaround: '4 hrs', categories: ['Ground Water'] },
  { id: 'p13', name: 'Arsenic', unit: 'mg/L', price: 550, turnaround: '6 hrs', categories: ['Ground Water'] },
  { id: 'p14', name: 'Alkalinity', unit: 'mg/L', price: 100, turnaround: '2 hrs', categories: ['Ground Water'] },
  { id: 'p15', name: 'DO', unit: 'mg/L', price: 200, turnaround: '1 hr', categories: ['Surface Water'] },
  { id: 'p16', name: 'BOD', unit: 'mg/L', price: 400, turnaround: '5 days', categories: ['Surface Water', 'Waste Water'] },
  { id: 'p17', name: 'COD', unit: 'mg/L', price: 350, turnaround: '3 hrs', categories: ['Surface Water', 'Waste Water'] },
  { id: 'p18', name: 'TSS', unit: 'mg/L', price: 220, turnaround: '3 hrs', categories: ['Surface Water', 'Waste Water'] },
  { id: 'p19', name: 'Ammonia', unit: 'mg/L', price: 200, turnaround: '3 hrs', categories: ['Surface Water'] },
  { id: 'p20', name: 'Phosphate', unit: 'mg/L', price: 260, turnaround: '3 hrs', categories: ['Surface Water'] },
  
  { id: 'p21', name: 'Oil & Grease', unit: 'mg/L', price: 450, turnaround: '6 hrs', categories: ['Waste Water'] },
  { id: 'p22', name: 'Ammonical Nitrogen', unit: 'mg/L', price: 280, turnaround: '4 hrs', categories: ['Waste Water'] },
  { id: 'p23', name: 'Sulphide', unit: 'mg/L', price: 300, turnaround: '4 hrs', categories: ['Waste Water'] },
  { id: 'p24', name: 'Phenolic Compounds', unit: 'mg/L', price: 600, turnaround: '8 hrs', categories: ['Waste Water'] },
  { id: 'p25', name: 'Moisture', unit: '%', price: 150, turnaround: '2 hrs', categories: ['Food'] },
  { id: 'p26', name: 'Protein', unit: '%', price: 350, turnaround: '6 hrs', categories: ['Food'] },
  { id: 'p27', name: 'Fat Content', unit: '%', price: 300, turnaround: '5 hrs', categories: ['Food'] },
  { id: 'p28', name: 'Ash Content', unit: '%', price: 200, turnaround: '3 hrs', categories: ['Food'] },
  { id: 'p29', name: 'Total Plate Count', unit: 'CFU/g', price: 400, turnaround: '48 hrs', categories: ['Food'] },
  { id: 'p30', name: 'Yeast & Mould', unit: 'CFU/g', price: 400, turnaround: '48 hrs', categories: ['Food'] },
  
  { id: 'p31', name: 'Salmonella', unit: '—', price: 700, turnaround: '72 hrs', categories: ['Food'] },
  { id: 'p32', name: 'Organic Carbon', unit: '%', price: 300, turnaround: '4 hrs', categories: ['Soil'] },
  { id: 'p33', name: 'Available Nitrogen', unit: 'kg/ha', price: 320, turnaround: '5 hrs', categories: ['Soil'] },
  { id: 'p34', name: 'Available Phosphorus', unit: 'kg/ha', price: 320, turnaround: '5 hrs', categories: ['Soil'] },
  { id: 'p35', name: 'Available Potassium', unit: 'kg/ha', price: 320, turnaround: '5 hrs', categories: ['Soil'] },
  { id: 'p36', name: 'Electrical Conductivity', unit: 'dS/m', price: 150, turnaround: '1 hr', categories: ['Soil'] }
];

const Parameters = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  const [parameters, setParameters] = useState(INITIAL_PARAMETERS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Create Parameter State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'mg/L',
    price: '',
    turnaround: '',
    categories: new Set()
  });
  const [formErrors, setFormErrors] = useState({});

  // Edit Parameter State
  const [editingParameter, setEditingParameter] = useState(null);

  // Sync drawer trigger prop
  useEffect(() => {
    if (openAddDrawerDirectly) {
      setIsCreateOpen(true);
    }
  }, [openAddDrawerDirectly]);

  // Live filter parameters by search queries
  const filteredParameters = useMemo(() => {
    return parameters.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      return q === '' || 
        p.name.toLowerCase().includes(q) || 
        p.unit.toLowerCase().includes(q) || 
        p.categories.some(cat => cat.toLowerCase().includes(q));
    });
  }, [parameters, searchQuery]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated lists
  const paginatedParameters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParameters.slice(start, start + itemsPerPage);
  }, [filteredParameters, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredParameters.length / itemsPerPage));

  // Drawer checklist helpers
  const handleToggleFormCategory = (cat) => {
    const next = new Set(formData.categories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setFormData(prev => ({ ...prev, categories: next }));
  };

  const handleToggleEditCategory = (cat) => {
    if (!editingParameter) return;
    const next = new Set(editingParameter.categories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setEditingParameter(prev => ({ ...prev, categories: next }));
  };

  // Close drawers
  const closeCreateDrawer = () => {
    setIsCreateOpen(false);
    setFormData({
      name: '',
      unit: 'mg/L',
      price: '',
      turnaround: '',
      categories: new Set()
    });
    setFormErrors({});
    if (onCloseAddDrawer) {
      onCloseAddDrawer();
    }
  };

  const closeEditDrawer = () => {
    setEditingParameter(null);
  };

  // Submit handers
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Parameter name is required';
    if (!formData.price || isNaN(formData.price)) errs.price = 'Valid price is required';
    if (!formData.turnaround.trim()) errs.turnaround = 'Turnaround time is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const newParam = {
      id: `p${parameters.length + 1}`,
      name: formData.name.trim(),
      unit: formData.unit,
      price: parseInt(formData.price, 10),
      turnaround: formData.turnaround.trim(),
      categories: Array.from(formData.categories)
    };

    setParameters([newParam, ...parameters]);
    
    if (triggerNotification) {
      triggerNotification();
    }
    closeCreateDrawer();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingParameter) return;

    if (!editingParameter.name.trim()) return;
    if (!editingParameter.price || isNaN(editingParameter.price)) return;
    if (!editingParameter.turnaround.trim()) return;

    const updated = parameters.map(p => {
      if (p.id === editingParameter.id) {
        return {
          ...editingParameter,
          categories: Array.from(editingParameter.categories)
        };
      }
      return p;
    });

    setParameters(updated);
    if (triggerNotification) {
      triggerNotification();
    }
    closeEditDrawer();
  };

  return (
    <div className="parameters-container">
      {/* Top Header metrics summary */}
      <div className="cat-master-header">
        <span className="cat-header-left-text">
          {parameters.length} parameters in catalog
        </span>
        <button className="param-create-btn" onClick={() => setIsCreateOpen(true)}>
          <FaPlus />
          <span>Create Parameter</span>
        </button>
      </div>

      {/* Table block */}
      <div className="param-card">
        {/* Card search header */}
        <div className="param-card-header">
          <div className="param-filters-left">
            <div className="param-search-wrapper">
              <FaSearch className="param-search-icon" />
              <input 
                type="text" 
                className="param-search-input" 
                placeholder="Search parameters, units, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Paginated Table grid */}
        <div className="param-table-wrapper">
          <table className="param-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Standard Price</th>
                <th>Turnaround</th>
                <th>Mapped Categories</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParameters.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No parameters found matching search.
                  </td>
                </tr>
              ) : (
                paginatedParameters.map(p => (
                  <tr key={p.id}>
                    <td className="param-name-text">{p.name}</td>
                    <td className="param-unit-text">{p.unit}</td>
                    <td className="param-price-text">₹{p.price}</td>
                    <td className="param-time-text">{p.turnaround}</td>
                    <td>
                      <div className="param-cat-pills-container">
                        {p.categories.map(cat => (
                          <span key={cat} className="param-cat-badge">
                            {cat}
                          </span>
                        ))}
                      </div>
                      {/* Hover edit action pencil */}
                      <div 
                        className="param-edit-icon-wrapper"
                        onClick={() => setEditingParameter({
                          ...p,
                          categories: new Set(p.categories)
                        })}
                      >
                        <FaEdit />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls & Pagination */}
        <div className="param-footer">
          <div className="param-showing-text">
            Showing {filteredParameters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredParameters.length)} of {filteredParameters.length}
          </div>

          <div className="param-pagination">
            <button 
              className="param-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  className={`param-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              className="param-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer: Create Parameter */}
      {isCreateOpen && (
        <div className="tr-modal-overlay" onClick={closeCreateDrawer}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">Create Parameter</h2>
              <button className="tr-drawer-close" onClick={closeCreateDrawer}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                {/* Parameter Name */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Parameter Name</label>
                  <input 
                    type="text"
                    className="tr-form-input"
                    placeholder="e.g. Lead"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {formErrors.name && <span className="wiz-field-error">{formErrors.name}</span>}
                </div>

                {/* Unit */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Unit of Measure</label>
                  <select
                    className="wiz-field-select tr-form-select"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="mg/L">mg/L</option>
                    <option value="%">%</option>
                    <option value="CFU/100mL">CFU/100mL</option>
                    <option value="CFU/g">CFU/g</option>
                    <option value="NTU">NTU</option>
                    <option value="kg/ha">kg/ha</option>
                    <option value="dS/m">dS/m</option>
                    <option value="—">—</option>
                  </select>
                </div>

                {/* Price & Turnaround Row */}
                <div className="tr-form-row">
                  <div className="tr-form-group">
                    <label className="tr-form-label">Standard Price (₹)</label>
                    <input 
                      type="number"
                      className="tr-form-input"
                      placeholder="e.g. 250"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                    {formErrors.price && <span className="wiz-field-error">{formErrors.price}</span>}
                  </div>

                  <div className="tr-form-group">
                    <label className="tr-form-label">Turnaround Time</label>
                    <input 
                      type="text"
                      className="tr-form-input"
                      placeholder="e.g. 4 hrs or 3 days"
                      value={formData.turnaround}
                      onChange={(e) => setFormData(prev => ({ ...prev, turnaround: e.target.value }))}
                    />
                    {formErrors.turnaround && <span className="wiz-field-error">{formErrors.turnaround}</span>}
                  </div>
                </div>

                {/* Categories Checkboxes checklist */}
                <div className="tr-form-group" style={{ marginTop: '1rem' }}>
                  <label className="tr-form-label">Map to Categories</label>
                  <div className="cat-drawer-checklist">
                    {CATEGORIES_LIST.map(cat => {
                      const isChecked = formData.categories.has(cat);
                      return (
                        <div 
                          key={cat}
                          className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleFormCategory(cat)}
                        >
                          <div className="cat-checklist-box">
                            <FaCheck />
                          </div>
                          <span>{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={closeCreateDrawer}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Create Parameter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Edit Parameter */}
      {editingParameter && (
        <div className="tr-modal-overlay" onClick={closeEditDrawer}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">Edit Parameter</h2>
              <button className="tr-drawer-close" onClick={closeEditDrawer}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                {/* Parameter Name (ReadOnly for Master Keys) */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Parameter Name</label>
                  <input 
                    type="text"
                    className="tr-form-input"
                    style={{ backgroundColor: '#F1F5F9', color: 'var(--text-light)', cursor: 'not-allowed' }}
                    value={editingParameter.name}
                    readOnly
                  />
                </div>

                {/* Unit */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Unit of Measure</label>
                  <select
                    className="wiz-field-select tr-form-select"
                    value={editingParameter.unit}
                    onChange={(e) => setEditingParameter(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="mg/L">mg/L</option>
                    <option value="%">%</option>
                    <option value="CFU/100mL">CFU/100mL</option>
                    <option value="CFU/g">CFU/g</option>
                    <option value="NTU">NTU</option>
                    <option value="kg/ha">kg/ha</option>
                    <option value="dS/m">dS/m</option>
                    <option value="—">—</option>
                  </select>
                </div>

                {/* Price & Turnaround Row */}
                <div className="tr-form-row">
                  <div className="tr-form-group">
                    <label className="tr-form-label">Standard Price (₹)</label>
                    <input 
                      type="number"
                      className="tr-form-input"
                      value={editingParameter.price}
                      onChange={(e) => setEditingParameter(prev => ({ ...prev, price: parseInt(e.target.value, 10) }))}
                    />
                  </div>

                  <div className="tr-form-group">
                    <label className="tr-form-label">Turnaround Time</label>
                    <input 
                      type="text"
                      className="tr-form-input"
                      value={editingParameter.turnaround}
                      onChange={(e) => setEditingParameter(prev => ({ ...prev, turnaround: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Categories Checkboxes checklist */}
                <div className="tr-form-group" style={{ marginTop: '1rem' }}>
                  <label className="tr-form-label">Map to Categories</label>
                  <div className="cat-drawer-checklist">
                    {CATEGORIES_LIST.map(cat => {
                      const isChecked = editingParameter.categories.has(cat);
                      return (
                        <div 
                          key={cat}
                          className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleEditCategory(cat)}
                        >
                          <div className="cat-checklist-box">
                            <FaCheck />
                          </div>
                          <span>{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={closeEditDrawer}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parameters;
