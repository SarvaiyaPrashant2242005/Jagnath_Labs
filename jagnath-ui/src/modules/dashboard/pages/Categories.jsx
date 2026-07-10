import React, { useState, useMemo } from 'react';
import { 
  FaFlask, FaPlus, FaTimes, FaCheck, FaFolderOpen, FaTint, FaSeedling, FaAppleAlt 
} from 'react-icons/fa';

// Master list of all available parameters in the laboratory catalog
const ALL_PARAMETERS = [
  'pH', 'TDS', 'Chloride', 'Fluoride', 'Total Hardness', 'Calcium', 'Sulphate', 
  'Nitrate', 'Turbidity', 'Alkalinity', 'DO', 'BOD', 'COD', 'TSS', 'Oil & Grease', 
  'Ammonical Nitrogen', 'Electrical Conductivity', 'Moisture', 'Protein', 
  'Fat Content', 'Ash Content', 'Total Plate Count', 'Yeast & Mold', 'E.Coli', 
  'Carbohydrates', 'Organic Carbon', 'Available Nitrogen', 'Available Phosphorus', 
  'Available Potassium', 'Clay Content'
];

// Initial categories matching the mockup exactly
const INITIAL_CATEGORIES_DATA = [
  { 
    id: 'cat1', 
    name: 'Drinking Water', 
    iconClass: 'drinking-water', 
    icon: <FaTint />, 
    parameters: ['pH', 'TDS', 'Chloride', 'Fluoride', 'Total Hardness', 'Calcium', 'Sulphate', 'Nitrate', 'Turbidity', 'Alkalinity'] 
  },
  { 
    id: 'cat2', 
    name: 'Ground Water', 
    iconClass: 'ground-water', 
    icon: <FaTint />, 
    parameters: ['pH', 'TDS', 'Total Hardness', 'Nitrate', 'Sulphate', 'Fluoride', 'Chloride', 'Alkalinity', 'Calcium'] 
  },
  { 
    id: 'cat3', 
    name: 'Surface Water', 
    iconClass: 'surface-water', 
    icon: <FaTint />, 
    parameters: ['pH', 'DO', 'BOD', 'COD', 'TSS', 'Turbidity', 'Chloride', 'Nitrate'] 
  },
  { 
    id: 'cat4', 
    name: 'Waste Water', 
    iconClass: 'waste-water', 
    icon: <FaTint />, 
    parameters: ['pH', 'COD', 'BOD', 'TSS', 'Oil & Grease', 'Ammonical Nitrogen', 'Chloride', 'Sulphate', 'Nitrate'] 
  },
  { 
    id: 'cat5', 
    name: 'Food', 
    iconClass: 'food', 
    icon: <FaAppleAlt />, 
    parameters: ['Moisture', 'Protein', 'Fat Content', 'Ash Content', 'Total Plate Count', 'Yeast & Mold', 'E.Coli'] 
  },
  { 
    id: 'cat6', 
    name: 'Soil', 
    iconClass: 'soil', 
    icon: <FaSeedling />, 
    parameters: ['pH', 'Organic Carbon', 'Available Nitrogen', 'Available Phosphorus', 'Available Potassium', 'Electrical Conductivity'] 
  }
];

const Categories = ({ triggerNotification }) => {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES_DATA);
  
  // Create Category Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParams, setNewCatParams] = useState(new Set());
  const [newCatError, setNewCatError] = useState('');

  // Edit Mapping Drawer State
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempParams, setTempParams] = useState(new Set());

  // Count metrics
  const totalParametersMapped = useMemo(() => {
    const allMapped = new Set();
    categories.forEach(cat => {
      cat.parameters.forEach(p => allMapped.add(p));
    });
    return allMapped.size;
  }, [categories]);

  // Create category handler
  const handleOpenCreate = () => {
    setNewCatName('');
    setNewCatParams(new Set());
    setNewCatError('');
    setIsCreateOpen(true);
  };

  const handleToggleNewParam = (p) => {
    const next = new Set(newCatParams);
    if (next.has(p)) {
      next.delete(p);
    } else {
      next.add(p);
    }
    setNewCatParams(next);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setNewCatError('Category name is required');
      return;
    }

    const newCat = {
      id: `cat${categories.length + 1}`,
      name: newCatName.trim(),
      iconClass: 'generic',
      icon: <FaFolderOpen />,
      parameters: Array.from(newCatParams)
    };

    setCategories([...categories, newCat]);
    setIsCreateOpen(false);
    if (triggerNotification) {
      triggerNotification();
    }
  };

  // Edit mapping handlers
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setTempParams(new Set(category.parameters));
  };

  const handleToggleTempParam = (p) => {
    const next = new Set(tempParams);
    if (next.has(p)) {
      next.delete(p);
    } else {
      next.add(p);
    }
    setTempParams(next);
  };

  const handleSaveMapping = (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    const updated = categories.map(cat => {
      if (cat.id === editingCategory.id) {
        return {
          ...cat,
          parameters: Array.from(tempParams)
        };
      }
      return cat;
    });

    setCategories(updated);
    setEditingCategory(null);
    if (triggerNotification) {
      triggerNotification();
    }
  };

  return (
    <div className="categories-container">
      {/* Categories header summary */}
      <div className="cat-master-header">
        <span className="cat-header-left-text">
          {categories.length} categories • {totalParametersMapped} parameters mapped
        </span>
        <div className="cat-header-right-actions">
          <button className="cat-manage-btn" onClick={() => triggerNotification && triggerNotification()}>
            <FaFlask />
            <span>Manage Parameters</span>
          </button>
          <button className="cat-create-btn" onClick={handleOpenCreate}>
            <FaPlus />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* Grid of category cards */}
      <div className="cat-grid">
        {categories.map(cat => {
          const visibleLimit = 6;
          const visibleParams = cat.parameters.slice(0, visibleLimit);
          const hiddenCount = cat.parameters.length - visibleLimit;

          return (
            <div key={cat.id} className="cat-card">
              <div className="cat-card-header">
                <div className="cat-card-info">
                  <span className="cat-card-title">{cat.name}</span>
                  <span className="cat-count-sub">{cat.parameters.length} parameters mapped</span>
                </div>
                <div className={`cat-icon-badge ${cat.iconClass}`}>
                  {cat.icon}
                </div>
              </div>

              {/* Mapped tags list preview */}
              <div className="cat-tags-container">
                {visibleParams.map(p => (
                  <span key={p} className="cat-tag">{p}</span>
                ))}
                {hiddenCount > 0 && (
                  <span className="cat-tag-more">+{hiddenCount} more</span>
                )}
                {cat.parameters.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No parameters mapped yet.
                  </span>
                )}
              </div>

              {/* Dashed mapping editor panel block */}
              <div className="cat-edit-panel" onClick={() => handleOpenEdit(cat)}>
                <div className="cat-edit-graphic">
                  <svg className="cat-edit-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21h9" />
                  </svg>
                </div>
                <span className="cat-edit-text">Edit Mapping</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer: Create Category */}
      {isCreateOpen && (
        <div className="tr-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">Create Category</h2>
              <button className="tr-drawer-close" onClick={() => setIsCreateOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                <div className="tr-form-group">
                  <label className="tr-form-label">Category Name</label>
                  <input 
                    type="text"
                    className="tr-form-input"
                    placeholder="e.g. Effluent Water"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (newCatError) setNewCatError('');
                    }}
                  />
                  {newCatError && <span className="wiz-field-error">{newCatError}</span>}
                </div>

                <div className="tr-form-group" style={{ marginTop: '1rem' }}>
                  <label className="tr-form-label">Map Initial Parameters</label>
                  <div className="cat-drawer-checklist">
                    {ALL_PARAMETERS.map(p => {
                      const isChecked = newCatParams.has(p);
                      return (
                        <div 
                          key={p} 
                          className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleNewParam(p)}
                        >
                          <div className="cat-checklist-box">
                            <FaCheck />
                          </div>
                          <span>{p}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Edit Parameter Mapping */}
      {editingCategory && (
        <div className="tr-modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">Edit Parameter Mapping</h2>
              <button className="tr-drawer-close" onClick={() => setEditingCategory(null)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
              <div className="tr-drawer-body">
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>Category Name</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.2rem' }}>
                    {editingCategory.name}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                    Choose parameters from the catalog below to map them to this test category.
                  </p>
                </div>

                <div className="tr-form-group">
                  <label className="tr-form-label">{tempParams.size} Parameters Selected</label>
                  <div className="cat-drawer-checklist">
                    {ALL_PARAMETERS.map(p => {
                      const isChecked = tempParams.has(p);
                      return (
                        <div 
                          key={p} 
                          className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleTempParam(p)}
                        >
                          <div className="cat-checklist-box">
                            <FaCheck />
                          </div>
                          <span>{p}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="tr-drawer-footer">
                <button type="button" className="tr-cancel-btn" onClick={() => setEditingCategory(null)}>Cancel</button>
                <button type="submit" className="tr-submit-btn">Save Mappings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
