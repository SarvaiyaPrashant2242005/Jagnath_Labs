import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaPlus, FaTimes, FaCheck, FaEdit, FaTrash, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';
import parameterService from '../../../shared/services/parameterService';
import categoryService from '../../../shared/services/categoryService';
import categoryParameterService from '../../../shared/services/categoryParameterService';

const Parameters = ({ triggerNotification, openAddDrawerDirectly = false, onCloseAddDrawer }) => {
  const [parameters, setParameters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    categories: new Set() // Category IDs
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

  // Load all parameters, categories, and mappings
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const paramRes = await parameterService.getParameters();
      const catRes = await categoryService.getCategories();
      const mapRes = await categoryParameterService.getMappings();

      const dbCats = catRes.success && catRes.data ? catRes.data : [];
      setCategories(dbCats);

      const dbMaps = mapRes.success && mapRes.data ? mapRes.data : [];
      setMappings(dbMaps);

      if (paramRes.success && paramRes.data) {
        const paramList = paramRes.data.map(p => {
          // Resolve categories mapped to this parameter
          const paramMaps = dbMaps.filter(m => m.parameterId === p.id);
          const mappedCatNames = paramMaps.map(m => {
            const cat = dbCats.find(c => c.id === m.categoryId);
            return cat ? cat.name : m.categoryName;
          }).filter(Boolean);

          return {
            ...p,
            categories: mappedCatNames,
            rawCategories: paramMaps.map(m => m.categoryId) // store category IDs
          };
        });
        setParameters(paramList);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve parameter catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live filter parameters by search queries
  const filteredParameters = parameters.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return q === '' || 
      p.name.toLowerCase().includes(q) || 
      p.unit.toLowerCase().includes(q) || 
      p.categories.some(cat => cat.toLowerCase().includes(q));
  });

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
  const handleToggleFormCategory = (catId) => {
    const next = new Set(formData.categories);
    if (next.has(catId)) {
      next.delete(catId);
    } else {
      next.add(catId);
    }
    setFormData(prev => ({ ...prev, categories: next }));
  };

  const handleToggleEditCategory = (catId) => {
    if (!editingParameter) return;
    const next = new Set(editingParameter.categories);
    if (next.has(catId)) {
      next.delete(catId);
    } else {
      next.add(catId);
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

  // Submit handlers
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Parameter name is required';
    if (!formData.price || isNaN(formData.price)) errs.price = 'Valid price is required';
    if (!formData.turnaround.trim()) errs.turnaround = 'Turnaround time is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const res = await parameterService.createParameter(formData);
      if (res.success && res.data) {
        const parameterId = res.data.id;
        // Create category parameter mappings
        const mapPromises = Array.from(formData.categories).map(categoryId =>
          categoryParameterService.createMapping(categoryId, parameterId)
        );
        await Promise.all(mapPromises);
      }

      if (triggerNotification) {
        triggerNotification();
      }
      closeCreateDrawer();
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create parameter.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingParameter) return;

    if (!editingParameter.name.trim()) return;
    if (!editingParameter.price || isNaN(editingParameter.price)) return;
    if (!editingParameter.turnaround.trim()) return;

    setIsLoading(true);
    try {
      const paramId = editingParameter.id;
      // 1. Update parameter metadata
      await parameterService.updateParameter(paramId, editingParameter);

      // 2. Resolve mapping deletions
      const toDelete = mappings.filter(m =>
        m.parameterId === paramId && !editingParameter.categories.has(m.categoryId)
      );

      // 3. Resolve mapping creations
      const existingCatIds = new Set(
        mappings.filter(m => m.parameterId === paramId).map(m => m.categoryId)
      );
      const toCreate = Array.from(editingParameter.categories).filter(catId => !existingCatIds.has(catId));

      // Execute database mapping changes
      const deletePromises = toDelete.map(m => categoryParameterService.deleteMapping(m.id));
      const createPromises = toCreate.map(catId => categoryParameterService.createMapping(catId, paramId));

      await Promise.all([...deletePromises, ...createPromises]);

      if (triggerNotification) {
        triggerNotification();
      }
      closeEditDrawer();
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to update parameter details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParameter = async (p) => {
    if (window.confirm(`Are you sure you want to delete parameter "${p.name}"? This will also remove all its category mappings.`)) {
      setIsLoading(true);
      try {
        // Delete all associated mappings first
        const paramMaps = mappings.filter(m => m.parameterId === p.id);
        const mapDeletePromises = paramMaps.map(m => categoryParameterService.deleteMapping(m.id));
        await Promise.all(mapDeletePromises);

        // Delete parameter itself
        await parameterService.deleteParameter(p.id);

        if (triggerNotification) {
          triggerNotification();
        }
        await loadData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete parameter.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="parameters-container">
      {/* Top Header metrics summary */}
      <div className="cat-master-header">
        <span className="cat-header-left-text">
          {isLoading ? 'Loading...' : `${parameters.length} parameters in catalog`}
        </span>
        <button className="param-create-btn" onClick={() => setIsCreateOpen(true)} disabled={isLoading}>
          <FaPlus />
          <span>Create Parameter</span>
        </button>
      </div>

      {error && (
        <div className="form-alert form-alert-error" style={{ margin: '1rem 0.25rem' }}>
          <span>{error}</span>
        </div>
      )}

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading parameter details...
                  </td>
                </tr>
              ) : paginatedParameters.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
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
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                          className="action-btn-edit" 
                          onClick={() => setEditingParameter({
                            ...p,
                            categories: new Set(p.rawCategories)
                          })}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '1rem' }}
                          title="Edit Parameter"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn-delete" 
                          onClick={() => handleDeleteParameter(p)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="Delete Parameter"
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
                  {categories.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      No categories registered yet.
                    </div>
                  ) : (
                    <div className="cat-drawer-checklist">
                      {categories.map(cat => {
                        const isChecked = formData.categories.has(cat.id);
                        return (
                          <div 
                            key={cat.id} 
                            className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                            onClick={() => handleToggleFormCategory(cat.id)}
                          >
                            <div className="cat-checklist-box">
                              <FaCheck />
                            </div>
                            <span>{cat.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                {/* Parameter Name */}
                <div className="tr-form-group">
                  <label className="tr-form-label">Parameter Name</label>
                  <input 
                    type="text"
                    className="tr-form-input"
                    value={editingParameter.name}
                    onChange={(e) => setEditingParameter(prev => ({ ...prev, name: e.target.value }))}
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
                      onChange={(e) => setEditingParameter(prev => ({ ...prev, price: e.target.value }))}
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
                  {categories.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      No categories registered yet.
                    </div>
                  ) : (
                    <div className="cat-drawer-checklist">
                      {categories.map(cat => {
                        const isChecked = editingParameter.categories.has(cat.id);
                        return (
                          <div 
                            key={cat.id} 
                            className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                            onClick={() => handleToggleEditCategory(cat.id)}
                          >
                            <div className="cat-checklist-box">
                              <FaCheck />
                            </div>
                            <span>{cat.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
