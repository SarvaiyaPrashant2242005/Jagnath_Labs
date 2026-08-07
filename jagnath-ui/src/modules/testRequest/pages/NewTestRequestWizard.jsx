import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaCheck, FaChevronRight, FaTimes, FaFlask 
} from 'react-icons/fa';
import companyService from '../../../shared/services/companyService';
import clientService from '../../../shared/services/clientService';
import categoryService from '../../../shared/services/categoryService';
import parameterService from '../../../shared/services/parameterService';
import categoryParameterService from '../../../shared/services/categoryParameterService';
import testRequestService from '../../../shared/services/testRequestService';
import SearchableSelect from '../../../shared/components/Select/SearchableSelect';

const NewTestRequestWizard = ({ onCancel, onSubmitSuccess, requests }) => {
  // Wizard active step tracker
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Database catalogs loaded from API
  const [companiesCatalog, setCompaniesCatalog] = useState([]);
  const [clientsCatalog, setClientsCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dbParameters, setDbParameters] = useState([]);
  const [mappings, setMappings] = useState([]);

  // STEP 1 - Basic Details States
  const [company, setCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [poNumber, setPoNumber] = useState('PO-2026-3391');
  const [priority, setPriority] = useState('Normal');
  const [notes, setNotes] = useState('Any special instructions...');

  // STEP 2 - Sample Details States
  const [sampleType, setSampleType] = useState('');
  const [sampleCategory, setSampleCategory] = useState('');
  const [collectionDate, setCollectionDate] = useState('2026-07-10');
  const [quantity, setQuantity] = useState('2 x 500ml');
  const [collectedBy, setCollectedBy] = useState('Dr. Sanjay Vora');
  const [containerType, setContainerType] = useState('Glass Bottle');
  const [remarks, setRemarks] = useState('Sample condition, seal number, etc.');

  // STEP 3 - Parameter Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedParams, setSelectedParams] = useState([]);

  // STEP Validation Errors
  const [errors, setErrors] = useState({});

  // Auto-map category from sample type in Step 2
  useEffect(() => {
    if (sampleType) {
      setSampleCategory(sampleType);
    }
  }, [sampleType]);

  // Set default mapped filters when entering Step 3
  useEffect(() => {
    if (step === 3 && sampleCategory) {
      setCategoryFilter(sampleCategory);
    }
  }, [step, sampleCategory]);

  // Load backend database catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      setIsLoading(true);
      try {
        const compRes = await companyService.getCompany();
        const clientRes = await clientService.getClients();
        const catRes = await categoryService.getCategories();
        const paramRes = await parameterService.getParameters();
        const mapRes = await categoryParameterService.getMappings();

        if (compRes.success && compRes.data) {
          const cName = compRes.data.companyName || compRes.data.company_name;
          setCompaniesCatalog([cName]);
          setCompany(cName);
        } else {
          setCompaniesCatalog([]);
        }

        if (clientRes.success && clientRes.data) {
          setClientsCatalog(clientRes.data.map(c => c.clientName));
        } else {
          setClientsCatalog([]);
        }

        const dbCats = catRes.success && catRes.data ? catRes.data : [];
        setCategories(dbCats);

        const dbParams = paramRes.success && paramRes.data ? paramRes.data : [];
        const dbMaps = mapRes.success && mapRes.data ? mapRes.data : [];
        setMappings(dbMaps);

        // Associate categories checklist mapping to parameters
        const mappedParameters = dbParams.map(p => {
          const paramMaps = dbMaps.filter(m => m.parameterId === p.id);
          return {
            ...p,
            rawCategories: paramMaps.map(m => m.categoryId),
            categoryNames: paramMaps.map(m => {
              const cat = dbCats.find(c => c.id === m.categoryId);
              return cat ? cat.name : m.categoryName;
            }).filter(Boolean)
          };
        });
        setDbParameters(mappedParameters);
      } catch (err) {
        console.error(err);
        setError('Failed to load database master configurations for the wizard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const sampleTypesCatalog = useMemo(() => {
    return categories.map(cat => cat.name);
  }, [categories]);

  // Handle parameter selection toggling
  const handleToggleParam = (param) => {
    const isSelected = selectedParams.some(p => p.id === param.id);
    if (isSelected) {
      setSelectedParams(selectedParams.filter(p => p.id !== param.id));
    } else {
      setSelectedParams([...selectedParams, param]);
    }
  };

  const handleRemoveParam = (paramId) => {
    setSelectedParams(selectedParams.filter(p => p.id !== paramId));
  };

  // Cost and Turnaround computations
  const estimatedCost = useMemo(() => {
    return selectedParams.reduce((sum, p) => sum + Number(p.price || 150), 0);
  }, [selectedParams]);

  const estimatedTurnaround = useMemo(() => {
    if (selectedParams.length === 0) return '-';
    // Get max turnaround days
    const days = selectedParams.map(p => {
      const parts = p.turnaround.split(' ');
      const val = parseInt(parts[0], 10);
      if (isNaN(val)) return 1;
      return parts[1]?.toLowerCase().includes('day') ? val : 1; // convert hours to 1 day for simplicity in calculating max days
    });
    const maxDays = Math.max(...days);
    return `${maxDays} day${maxDays > 1 ? 's' : ''}`;
  }, [selectedParams]);

  // Live filter parameters by category pill and search bar
  const filteredParamsByCategory = useMemo(() => {
    return categories.map(cat => {
      const items = dbParameters.filter(p => {
        // Check if parameter is mapped to this category ID
        const isMapped = p.rawCategories.includes(cat.id);
        if (!isMapped) return false;

        // Match category filter pill
        const matchFilter = categoryFilter === 'All' || cat.name === categoryFilter;
        if (!matchFilter) return false;
        
        // Match search query
        const q = searchQuery.toLowerCase().trim();
        return q === '' || p.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
      }).map(p => ({
        ...p,
        category: cat.name // inject current category name for tag layout
      }));
      
      return { category: cat.name, items };
    }).filter(group => group.items.length > 0);
  }, [categories, dbParameters, categoryFilter, searchQuery]);

  // Validation routines
  const validateStep1 = () => {
    const errs = {};
    if (!company) errs.company = 'Company is required';
    if (!clientContact) errs.clientContact = 'Client Contact is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!sampleType) errs.sampleType = 'Sample Type is required';
    if (!collectionDate) errs.collectionDate = 'Collection Date is required';
    if (!quantity.trim()) errs.quantity = 'Sample Quantity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (selectedParams.length === 0) {
      errs.params = 'At least one parameter must be selected';
      alert('Please select at least one parameter to test.');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Navigations
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 4) return;

    setIsLoading(true);
    try {
      // 1. Submit basic details and sample details to create Test Request
      const trRes = await testRequestService.createTestRequest({
        company,
        client: clientContact,
        remarks: remarks || notes || '',
        sampleType,
        collectionDate,
        quantity,
        collectedBy,
        containerType
      });

      if (trRes.success && trRes.data) {
        const trId = trRes.data.id;
        
        // 2. Submit linking test parameters
        const parameterPromises = selectedParams.map(param => 
          testRequestService.createTransaction(trId, param.id, {
            unit: param.unit,
            status: 'Pending'
          })
        );
        await Promise.all(parameterPromises);

        // 3. Return callback response representing the newly created Test Request to Dashboard
        onSubmitSuccess({
          id: trRes.data.id,
          client: clientContact,
          company: company,
          category: sampleType,
          date: collectionDate,
          priority: priority,
          progress: 0,
          status: 'Active'
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit test request. Please check values.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-requests-container">
      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Steps indicator bar */}
      <div className="wiz-steps-container">
        {/* Step 1 */}
        <div className={`wiz-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="wiz-step-circle">
            {step > 1 ? <FaCheck className="wiz-step-circle-check" /> : 1}
          </div>
          <div className="wiz-step-label">
            <span className="wiz-step-title">Basic Details</span>
          </div>
        </div>

        <div className={`wiz-step-line ${step > 1 ? 'completed' : ''}`}></div>

        {/* Step 2 */}
        <div className={`wiz-step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="wiz-step-circle">
            {step > 2 ? <FaCheck className="wiz-step-circle-check" /> : 2}
          </div>
          <div className="wiz-step-label">
            <span className="wiz-step-title">Sample Details</span>
          </div>
        </div>

        <div className={`wiz-step-line ${step > 2 ? 'completed' : ''}`}></div>

        {/* Step 3 */}
        <div className={`wiz-step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="wiz-step-circle">
            {step > 3 ? <FaCheck className="wiz-step-circle-check" /> : 3}
          </div>
          <div className="wiz-step-label">
            <span className="wiz-step-title">Parameter Selection</span>
          </div>
        </div>

        <div className={`wiz-step-line ${step > 3 ? 'completed' : ''}`}></div>

        {/* Step 4 */}
        <div className={`wiz-step-item ${step === 4 ? 'active' : ''}`}>
          <div className="wiz-step-circle">4</div>
          <div className="wiz-step-label">
            <span className="wiz-step-title">Review & Submit</span>
          </div>
        </div>
      </div>

      {isLoading && step !== 4 && (
        <div className="wiz-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
          Loading wizard catalog settings...
        </div>
      )}

      {/* Main wizard cards render dynamically based on step state */}
      {!isLoading && step === 1 && (
        <div className="wiz-card">
          <div className="wiz-form-grid">
            {/* Company Dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Company <span>*</span></label>
              {companiesCatalog.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#EF4444', fontWeight: 'bold' }}>
                  Please register a Company first in the Companies Master tab!
                </div>
              ) : (
                <SearchableSelect
                  options={companiesCatalog}
                  value={company}
                  onChange={(selectedVal) => {
                    setCompany(selectedVal);
                    setErrors(prev => ({ ...prev, company: '' }));
                  }}
                  placeholder="Select company..."
                  searchPlaceholder="Search company..."
                />
              )}
              {errors.company && <span className="wiz-field-error">{errors.company}</span>}
            </div>

            {/* Client Contact Dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Client Contact <span>*</span></label>
              <SearchableSelect
                options={clientsCatalog}
                value={clientContact}
                onChange={(selectedVal) => {
                  setClientContact(selectedVal);
                  setErrors(prev => ({ ...prev, clientContact: '' }));
                }}
                placeholder="Select client..."
                searchPlaceholder="Search client..."
              />
              {errors.clientContact && <span className="wiz-field-error">{errors.clientContact}</span>}
            </div>

            {/* Reference/PO Number */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Reference / PO Number</label>
              <input 
                type="text" 
                className="wiz-field-input" 
                placeholder="e.g. PO-2026-3391"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
            </div>

            {/* Priority Dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Priority</label>
              <select 
                className="wiz-field-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Notes for Reception */}
            <div className="wiz-form-group wiz-form-full">
              <label className="wiz-field-label">Notes for Reception</label>
              <textarea 
                className="wiz-field-textarea"
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Action Footer */}
          <div className="wiz-action-bar">
            <button type="button" className="wiz-back-btn" onClick={onCancel}>Cancel</button>
            <button type="button" className="wiz-continue-btn" onClick={handleNext} disabled={companiesCatalog.length === 0}>
              <span>Continue</span>
              <FaChevronRight style={{ fontSize: '0.75rem' }} />
            </button>
          </div>
        </div>
      )}

      {!isLoading && step === 2 && (
        <div className="wiz-card">
          <div className="wiz-form-grid">
            {/* Sample Type dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Sample Type <span>*</span></label>
              <SearchableSelect
                options={sampleTypesCatalog}
                value={sampleType}
                onChange={(selectedVal) => {
                  setSampleType(selectedVal);
                  setErrors(prev => ({ ...prev, sampleType: '' }));
                }}
                placeholder="Select sample type..."
                searchPlaceholder="Search sample type..."
              />
              {errors.sampleType && <span className="wiz-field-error">{errors.sampleType}</span>}
            </div>

            {/* Sample Category */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Sample Category <span>*</span></label>
              <SearchableSelect
                options={sampleTypesCatalog}
                value={sampleCategory}
                onChange={(selectedVal) => {
                  setSampleCategory(selectedVal);
                }}
                placeholder="Select sample category..."
                searchPlaceholder="Search sample category..."
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                Parameters will auto-load in the next step based on this category.
              </span>
            </div>

            {/* Collection Date picker */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Collection Date <span>*</span></label>
              <input 
                type="date" 
                className="wiz-field-input" 
                value={collectionDate}
                onChange={(e) => { setCollectionDate(e.target.value); setErrors(prev => ({ ...prev, collectionDate: '' })); }}
              />
              {errors.collectionDate && <span className="wiz-field-error">{errors.collectionDate}</span>}
            </div>

            {/* Sample Quantity */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Sample Quantity <span>*</span></label>
              <input 
                type="text" 
                className="wiz-field-input" 
                placeholder="e.g. 2 x 500ml"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: '' })); }}
              />
              {errors.quantity && <span className="wiz-field-error">{errors.quantity}</span>}
            </div>

            {/* Collected By */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Collected By</label>
              <select 
                className="wiz-field-select"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
              >
                <option value="Dr. Sanjay Vora">Dr. Sanjay Vora</option>
                <option value="Dr. Rajesh Patel">Dr. Rajesh Patel</option>
                <option value="Technician Team">Technician Team</option>
              </select>
            </div>

            {/* Container Type */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Container Type</label>
              <select 
                className="wiz-field-select"
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
              >
                <option value="Glass Bottle">Glass Bottle</option>
                <option value="Plastic Bottle">Plastic Bottle</option>
                <option value="Sterile Bag">Sterile Bag</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="wiz-form-group wiz-form-full">
              <label className="wiz-field-label">Remarks</label>
              <textarea 
                className="wiz-field-textarea"
                placeholder="Sample condition, seal number, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Action Footer */}
          <div className="wiz-action-bar">
            <button type="button" className="wiz-back-btn" onClick={handleBack}>Back</button>
            <button type="button" className="wiz-continue-btn" onClick={handleNext}>
              <span>Continue</span>
              <FaChevronRight style={{ fontSize: '0.75rem' }} />
            </button>
          </div>
        </div>
      )}

      {!isLoading && step === 3 && (
        <div className="wiz-params-layout">
          {/* Main search and parameters cards grid */}
          <div className="wiz-params-left">
            <div className="wiz-params-card">
              {/* Parameter search bar */}
              <div className="wiz-search-container">
                <FaSearch className="wiz-search-icon" />
                <input 
                  type="text" 
                  className="wiz-search-input" 
                  placeholder="Search parameters (e.g. pH)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Dynamic Filter Pills */}
              <div className="wiz-filter-pills">
                {['All Categories', ...sampleTypesCatalog].map(pill => (
                  <button 
                    key={pill} 
                    type="button"
                    className={`wiz-filter-pill ${categoryFilter === pill || (pill === 'All Categories' && categoryFilter === 'All') ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(pill === 'All Categories' ? 'All' : pill)}
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Render Parameter listings grouped by category */}
              {filteredParamsByCategory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  No parameters mapped to this category. Register parameters and map them in "Category Master" tab.
                </div>
              ) : (
                filteredParamsByCategory.map(group => (
                  <div key={group.category} className="wiz-cat-group">
                    <h3 className="wiz-cat-title">{group.category}</h3>
                    <div className="wiz-param-grid">
                      {group.items.map(param => {
                        const isSelected = selectedParams.some(p => p.id === param.id);
                        return (
                          <div 
                            key={param.id} 
                            className={`wiz-param-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggleParam(param)}
                          >
                            <div className="wiz-param-info">
                              <span className="wiz-param-name">{param.name}</span>
                              <span className="wiz-param-price">₹{param.price} • <span style={{ color: 'var(--text-muted)' }}>{param.turnaround}</span></span>
                            </div>
                            
                            <div className="wiz-param-checkbox">
                              <FaCheck />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Back & Next Navigation buttons */}
            <div className="wiz-action-bar" style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(135, 206, 235, 0.12)' }}>
              <button type="button" className="wiz-back-btn" onClick={handleBack}>Back</button>
              <button type="button" className="wiz-continue-btn" onClick={handleNext}>
                <span>Continue</span>
                <FaChevronRight style={{ fontSize: '0.75rem' }} />
              </button>
            </div>
          </div>

          {/* Sticky selected parameters summary floating card */}
          <aside className="wiz-sidebar-card">
            <h3 className="wiz-sidebar-title">Selected Parameters ({selectedParams.length})</h3>
            
            <div className="wiz-selected-list">
              {selectedParams.length === 0 ? (
                <span className="wiz-sidebar-empty">No parameters selected yet. Click cards on the left to add.</span>
              ) : (
                selectedParams.map(param => (
                  <div key={param.id} className="wiz-selected-item">
                    <span className="wiz-selected-name">{param.name} ({param.category.split(' ')[0]})</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="wiz-selected-price">₹{param.price}</span>
                      <button 
                        type="button" 
                        className="wiz-selected-remove"
                        onClick={() => handleRemoveParam(param.id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculated estimations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
              <div className="wiz-sidebar-meta">
                <span>Parameters Selected</span>
                <span>{selectedParams.length}</span>
              </div>
              <div className="wiz-sidebar-meta">
                <span>Est. Turnaround</span>
                <span>{estimatedTurnaround}</span>
              </div>
            </div>

            <div className="wiz-sidebar-total">
              <span>Estimated Cost</span>
              <span className="wiz-sidebar-cost">₹{estimatedCost}</span>
            </div>
          </aside>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit} className="wiz-card">
          <div className="wiz-review-grid">
            {/* Basic Details Summary */}
            <div className="wiz-review-card">
              <h3 className="wiz-review-card-title">Basic Details</h3>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Company</span>
                <span className="wiz-review-val">{company}</span>
              </div>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Client Contact</span>
                <span className="wiz-review-val">{clientContact}</span>
              </div>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Priority</span>
                <span className="wiz-review-val" style={{ color: priority === 'URGENT' ? '#EF4444' : 'inherit', fontWeight: 'bold' }}>
                  {priority}
                </span>
              </div>
              {poNumber && (
                <div className="wiz-review-item">
                  <span className="wiz-review-label">PO / Ref Number</span>
                  <span className="wiz-review-val">{poNumber}</span>
                </div>
              )}
            </div>

            {/* Sample Details Summary */}
            <div className="wiz-review-card">
              <h3 className="wiz-review-card-title">Sample Details</h3>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Sample Type</span>
                <span className="wiz-review-val">{sampleType}</span>
              </div>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Collection Date</span>
                <span className="wiz-review-val">{collectionDate}</span>
              </div>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Quantity</span>
                <span className="wiz-review-val">{quantity}</span>
              </div>
              <div className="wiz-review-item">
                <span className="wiz-review-label">Container Type</span>
                <span className="wiz-review-val">{containerType}</span>
              </div>
            </div>

            {/* Selected Parameters summary tag pills */}
            <div className="wiz-review-card wiz-review-card-full">
              <h3 className="wiz-review-card-title">Parameters ({selectedParams.length})</h3>
              
              <div className="wiz-tags-container">
                {selectedParams.map(param => (
                  <span key={param.id} className="wiz-tag-pill">
                    {param.name}
                    <span className="wiz-tag-price">₹{param.price}</span>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-dark)' }}>Estimated Total Cost</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E3A8A' }}>₹{estimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Automatic TR generation Banner Alert */}
          <div className="wiz-alert-banner">
            On submission, the test request will be registered, linked parameter transactions will be created, and status will be updated to <strong>Active</strong>.
          </div>

          {/* Footer Action buttons */}
          <div className="wiz-action-bar">
            <button type="button" className="wiz-back-btn" onClick={handleBack} disabled={isLoading}>Back</button>
            <button type="submit" className="wiz-continue-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                  Submitting...
                </>
              ) : (
                <>
                  <FaCheck />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewTestRequestWizard;
