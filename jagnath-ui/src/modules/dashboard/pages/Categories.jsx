import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaFlask, FaPlus, FaTimes, FaCheck, FaFolderOpen, FaTint, FaSeedling, FaAppleAlt, FaTrash 
} from 'react-icons/fa';
import categoryService from '../../../shared/services/categoryService';
import parameterService from '../../../shared/services/parameterService';
import categoryParameterService from '../../../shared/services/categoryParameterService';

const Categories = ({ triggerNotification }) => {
  const [categories, setCategories] = useState([]);
  const [dbParameters, setDbParameters] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create Category Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParams, setNewCatParams] = useState(new Set()); // parameter IDs
  const [newCatError, setNewCatError] = useState('');

  // Edit Mapping Drawer State
  const [editingCategory, setEditingCategory] = useState(null);
  const [tempParams, setTempParams] = useState(new Set()); // parameter IDs

  // Load all categories, parameters, and mappings
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const catRes = await categoryService.getCategories();
      const paramRes = await parameterService.getParameters();
      const mapRes = await categoryParameterService.getMappings();

      const dbParams = paramRes.success && paramRes.data ? paramRes.data : [];
      setDbParameters(dbParams);

      const dbMaps = mapRes.success && mapRes.data ? mapRes.data : [];
      setMappings(dbMaps);

      if (catRes.success && catRes.data) {
        const catList = catRes.data.map(cat => {
          // Find mapped parameters for this category
          const categoryMaps = dbMaps.filter(m => m.categoryId === cat.id);
          const mappedParamNames = categoryMaps.map(m => {
            const param = dbParams.find(p => p.id === m.parameterId);
            return param ? param.name : m.parameterName;
          }).filter(Boolean);

          let icon = <FaFolderOpen />;
          let iconClass = 'generic';
          if (cat.name.toLowerCase().includes('water')) {
            icon = <FaTint />;
            iconClass = cat.name.toLowerCase().replace(/\s+/g, '-');
          } else if (cat.name.toLowerCase().includes('food')) {
            icon = <FaAppleAlt />;
            iconClass = 'food';
          } else if (cat.name.toLowerCase().includes('soil')) {
            icon = <FaSeedling />;
            iconClass = 'soil';
          }

          return {
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            iconClass: iconClass,
            icon: icon,
            parameters: mappedParamNames,
            rawParameters: categoryMaps.map(m => m.parameterId) // store IDs for drawer checklist
          };
        });
        setCategories(catList);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve categories and parameter mappings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleToggleNewParam = (paramId) => {
    const next = new Set(newCatParams);
    if (next.has(paramId)) {
      next.delete(paramId);
    } else {
      next.add(paramId);
    }
    setNewCatParams(next);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setNewCatError('Category name is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await categoryService.createCategory({
        name: newCatName.trim(),
        description: 'Standard Category'
      });

      if (res.success && res.data) {
        const categoryId = res.data.id;
        // Create parameter mappings for checked parameters
        const mapPromises = Array.from(newCatParams).map(paramId =>
          categoryParameterService.createMapping(categoryId, paramId)
        );
        await Promise.all(mapPromises);
      }

      setIsCreateOpen(false);
      if (triggerNotification) {
        triggerNotification();
      }
      await loadData();
    } catch (err) {
      console.error(err);
      setNewCatError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit mapping handlers
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setTempParams(new Set(category.rawParameters));
  };

  const handleToggleTempParam = (paramId) => {
    const next = new Set(tempParams);
    if (next.has(paramId)) {
      next.delete(paramId);
    } else {
      next.add(paramId);
    }
    setTempParams(next);
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsLoading(true);
    try {
      const categoryId = editingCategory.id;

      // 1. Identify which mappings to delete
      const toDelete = mappings.filter(m => 
        m.categoryId === categoryId && !tempParams.has(m.parameterId)
      );

      // 2. Identify which mappings to create
      const existingParamIds = new Set(
        mappings.filter(m => m.categoryId === categoryId).map(m => m.parameterId)
      );
      const toCreate = Array.from(tempParams).filter(paramId => !existingParamIds.has(paramId));

      // Execute deletions
      const deletePromises = toDelete.map(m => categoryParameterService.deleteMapping(m.id));
      // Execute creations
      const createPromises = toCreate.map(paramId => categoryParameterService.createMapping(categoryId, paramId));

      await Promise.all([...deletePromises, ...createPromises]);

      setEditingCategory(null);
      if (triggerNotification) {
        triggerNotification();
      }
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to update parameter mappings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"? This will delete all parameter mappings for this category.`)) {
      setIsLoading(true);
      try {
        // Delete all associated mappings first
        const categoryMaps = mappings.filter(m => m.categoryId === cat.id);
        const mapDeletePromises = categoryMaps.map(m => categoryParameterService.deleteMapping(m.id));
        await Promise.all(mapDeletePromises);

        // Delete category itself
        await categoryService.deleteCategory(cat.id);

        if (triggerNotification) {
          triggerNotification();
        }
        await loadData();
      } catch (err) {
        console.error(err);
        setError('Failed to delete category.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="categories-container">
      {/* Categories header summary */}
      <div className="cat-master-header">
        <span className="cat-header-left-text">
          {isLoading ? 'Loading...' : `${categories.length} categories • ${totalParametersMapped} parameters mapped`}
        </span>
        <div className="cat-header-right-actions">
          <button className="cat-create-btn" onClick={handleOpenCreate} disabled={isLoading}>
            <FaPlus />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="form-alert form-alert-error" style={{ margin: '1rem 0.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Grid of category cards */}
      <div className="cat-grid">
        {isLoading ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: 'var(--text-light)' }}>
            <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
            Loading categories and mappings...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem', color: 'var(--text-light)' }}>
            No categories registered. Click "Create Category" to get started.
          </div>
        ) : (
          categories.map(cat => {
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
                  <div className="cat-header-badges-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.25rem' }}
                      title="Delete Category"
                    >
                      <FaTrash />
                    </button>
                    <div className={`cat-icon-badge ${cat.iconClass}`}>
                      {cat.icon}
                    </div>
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
          })
        )}
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
                  {dbParameters.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', padding: '1rem 0' }}>
                      No parameters available in catalog. Please create parameters first.
                    </div>
                  ) : (
                    <div className="cat-drawer-checklist">
                      {dbParameters.map(p => {
                        const isChecked = newCatParams.has(p.id);
                        return (
                          <div 
                            key={p.id} 
                            className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                            onClick={() => handleToggleNewParam(p.id)}
                          >
                            <div className="cat-checklist-box">
                              <FaCheck />
                            </div>
                            <span>{p.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  {dbParameters.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', padding: '1rem 0' }}>
                      No parameters available in catalog.
                    </div>
                  ) : (
                    <div className="cat-drawer-checklist">
                      {dbParameters.map(p => {
                        const isChecked = tempParams.has(p.id);
                        return (
                          <div 
                            key={p.id} 
                            className={`cat-checklist-item ${isChecked ? 'checked' : ''}`}
                            onClick={() => handleToggleTempParam(p.id)}
                          >
                            <div className="cat-checklist-box">
                              <FaCheck />
                            </div>
                            <span>{p.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
