import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaSearch, FaCheck, FaChevronRight, FaTimes, FaFlask 
} from 'react-icons/fa';

// Rich parameters dataset categorized by group
const PARAMETERS_DATA = [
  // Frequently Used
  { id: 'p_ph', name: 'pH', category: 'Frequently Used', price: 150, turnaround: '1 day' },
  { id: 'p_tds', name: 'TDS', category: 'Frequently Used', price: 150, turnaround: '1 day' },
  { id: 'p_bod', name: 'BOD', category: 'Frequently Used', price: 300, turnaround: '3 days' },
  { id: 'p_cod', name: 'COD', category: 'Frequently Used', price: 300, turnaround: '2 days' },

  // Drinking Water
  { id: 'dw_ph', name: 'pH', category: 'Drinking Water', price: 150, turnaround: '1 day' },
  { id: 'dw_tds', name: 'TDS', category: 'Drinking Water', price: 150, turnaround: '1 day' },
  { id: 'dw_chloride', name: 'Chloride', category: 'Drinking Water', price: 200, turnaround: '1 day' },
  { id: 'dw_fluoride', name: 'Fluoride', category: 'Drinking Water', price: 250, turnaround: '2 days' },
  { id: 'dw_hardness', name: 'Total Hardness', category: 'Drinking Water', price: 200, turnaround: '1 day' },
  { id: 'dw_calcium', name: 'Calcium', category: 'Drinking Water', price: 180, turnaround: '1 day' },
  { id: 'dw_turbidity', name: 'Turbidity', category: 'Drinking Water', price: 120, turnaround: '1 day' },
  { id: 'dw_iron', name: 'Iron', category: 'Drinking Water', price: 220, turnaround: '2 days' },
  { id: 'dw_chlorine', name: 'Residual Chlorine', category: 'Drinking Water', price: 150, turnaround: '1 day' },
  { id: 'dw_ecoli', name: 'E.Coli', category: 'Drinking Water', price: 350, turnaround: '2 days' },

  // Ground Water
  { id: 'gw_ph', name: 'pH', category: 'Ground Water', price: 150, turnaround: '1 day' },
  { id: 'gw_tds', name: 'TDS', category: 'Ground Water', price: 150, turnaround: '1 day' },
  { id: 'gw_hardness', name: 'Total Hardness', category: 'Ground Water', price: 200, turnaround: '1 day' },
  { id: 'gw_fluoride', name: 'Fluoride', category: 'Ground Water', price: 250, turnaround: '2 days' },
  { id: 'gw_iron', name: 'Iron', category: 'Ground Water', price: 220, turnaround: '2 days' },
  { id: 'gw_arsenic', name: 'Arsenic', category: 'Ground Water', price: 400, turnaround: '3 days' },
  { id: 'gw_alkalinity', name: 'Alkalinity', category: 'Ground Water', price: 180, turnaround: '1 day' },

  // Surface Water
  { id: 'sw_ph', name: 'pH', category: 'Surface Water', price: 150, turnaround: '1 day' },
  { id: 'sw_do', name: 'DO', category: 'Surface Water', price: 200, turnaround: '1 day' },
  { id: 'sw_tss', name: 'TSS', category: 'Surface Water', price: 180, turnaround: '1 day' },
  { id: 'sw_cod', name: 'COD', category: 'Surface Water', price: 300, turnaround: '2 days' },
  { id: 'sw_tds', name: 'TDS', category: 'Surface Water', price: 150, turnaround: '1 day' },
  { id: 'sw_turbidity', name: 'Turbidity', category: 'Surface Water', price: 120, turnaround: '1 day' },
  { id: 'sw_ammonia', name: 'Ammonia', category: 'Surface Water', price: 220, turnaround: '2 days' },
  { id: 'sw_phosphate', name: 'Phosphate', category: 'Surface Water', price: 250, turnaround: '2 days' },

  // Waste Water
  { id: 'ww_ph', name: 'pH', category: 'Waste Water', price: 150, turnaround: '1 day' },
  { id: 'ww_tss', name: 'TSS', category: 'Waste Water', price: 180, turnaround: '1 day' },
  { id: 'ww_cod', name: 'COD', category: 'Waste Water', price: 300, turnaround: '2 days' },
  { id: 'ww_bod', name: 'BOD', category: 'Waste Water', price: 300, turnaround: '3 days' },
  { id: 'ww_turbidity', name: 'Turbidity', category: 'Waste Water', price: 120, turnaround: '1 day' },
  { id: 'ww_sulphide', name: 'Sulphide', category: 'Waste Water', price: 250, turnaround: '2 days' },
  { id: 'ww_phenolic', name: 'Phenolic Compounds', category: 'Waste Water', price: 450, turnaround: '3 days' },

  // Food
  { id: 'fd_moisture', name: 'Moisture', category: 'Food', price: 200, turnaround: '1 day' },
  { id: 'fd_protein', name: 'Protein', category: 'Food', price: 350, turnaround: '3 days' },
  { id: 'fd_fat', name: 'Fat Content', category: 'Food', price: 300, turnaround: '2 days' },
  { id: 'fd_ash', name: 'Ash Content', category: 'Food', price: 250, turnaround: '1 day' },
  { id: 'fd_tpc', name: 'Total Plate Count', category: 'Food', price: 400, turnaround: '3 days' },
  { id: 'fd_yeast', name: 'Yeast & Mold', category: 'Food', price: 400, turnaround: '3 days' },
  { id: 'fd_salmonella', name: 'Salmonella', category: 'Food', price: 600, turnaround: '4 days' },

  // Soil
  { id: 'sl_ph', name: 'pH', category: 'Soil', price: 150, turnaround: '1 day' },
  { id: 'sl_carbon', name: 'Organic Carbon', category: 'Soil', price: 250, turnaround: '2 days' },
  { id: 'sl_nitrogen', name: 'Available Nitrogen', category: 'Soil', price: 300, turnaround: '2 days' },
  { id: 'sl_phosphorus', name: 'Available Phosphorus', category: 'Soil', price: 300, turnaround: '2 days' },
  { id: 'sl_potassium', name: 'Available Potassium', category: 'Soil', price: 300, turnaround: '2 days' },
  { id: 'sl_ec', name: 'Electrical Conductivity', category: 'Soil', price: 150, turnaround: '1 day' }
];

const NewTestRequestWizard = ({ onCancel, onSubmitSuccess, requests }) => {
  // Wizard active step tracker
  const [step, setStep] = useState(1);

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

  // Companies & Client mock catalog
  const companiesCatalog = ['ABC Industries Pvt. Ltd.', 'UltraTech Cement Ltd.', 'Tata Chemicals Ltd.', 'Jagnath Municipal Corp.', 'Reliance Industries Ltd.'];
  const clientsCatalog = ['Rajesh Patel', 'Vikram Solanki', 'Harsh Mehta', 'Ketan Desai', 'Ami Rana', 'Nilesh Shah'];
  const sampleTypesCatalog = ['Drinking Water', 'Soil', 'Waste Water', 'Surface Water', 'Ground Water', 'Food'];

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
    return selectedParams.reduce((sum, p) => sum + p.price, 0);
  }, [selectedParams]);

  const estimatedTurnaround = useMemo(() => {
    if (selectedParams.length === 0) return '-';
    // Get max turnaround days
    const days = selectedParams.map(p => parseInt(p.turnaround.split(' ')[0], 10));
    const maxDays = Math.max(...days);
    return `${maxDays} day${maxDays > 1 ? 's' : ''}`;
  }, [selectedParams]);

  // Live filter parameters by category pill and search bar
  const filteredParamsByCategory = useMemo(() => {
    // 1. Group parameters by original category
    const categories = ['Frequently Used', 'Drinking Water', 'Ground Water', 'Surface Water', 'Waste Water', 'Food', 'Soil'];
    
    return categories.map(cat => {
      const items = PARAMETERS_DATA.filter(p => {
        // Match category filter
        const matchCategory = categoryFilter === 'All' || categoryFilter === 'All Categories' || cat === categoryFilter;
        if (!matchCategory) return false;
        
        // Match category of item
        if (p.category !== cat) return false;
        
        // Match search query
        const q = searchQuery.toLowerCase().trim();
        return q === '' || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      });
      
      return { category: cat, items };
    }).filter(group => group.items.length > 0);
  }, [categoryFilter, searchQuery]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 4) return;

    // Generate TR Number
    const ids = requests.map(r => parseInt(r.id.split('-')[2], 10));
    const nextNumericId = Math.max(...ids) + 1;
    const paddedId = String(nextNumericId).padStart(6, '0');
    const newTrId = `TR-2026-${paddedId}`;

    const newRequest = {
      id: newTrId,
      client: clientContact,
      company: company,
      category: sampleCategory || sampleType,
      date: collectionDate,
      priority: priority,
      progress: 0, // Freshly created, moves to Pending Testing
      status: 'Pending Testing'
    };

    // Save and submit
    onSubmitSuccess(newRequest);
  };

  return (
    <div className="test-requests-container">
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

      {/* Main wizard cards render dynamically based on step state */}
      {step === 1 && (
        <div className="wiz-card">
          <div className="wiz-form-grid">
            {/* Company Dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Company <span>*</span></label>
              <select 
                className="wiz-field-select" 
                value={company}
                onChange={(e) => { setCompany(e.target.value); setErrors(prev => ({ ...prev, company: '' })); }}
              >
                <option value="">Select company...</option>
                {companiesCatalog.map(comp => <option key={comp} value={comp}>{comp}</option>)}
              </select>
              {errors.company && <span className="wiz-field-error">{errors.company}</span>}
            </div>

            {/* Client Contact Dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Client Contact <span>*</span></label>
              <select 
                className="wiz-field-select" 
                value={clientContact}
                onChange={(e) => { setClientContact(e.target.value); setErrors(prev => ({ ...prev, clientContact: '' })); }}
              >
                <option value="">Select client...</option>
                {clientsCatalog.map(client => <option key={client} value={client}>{client}</option>)}
              </select>
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
            <button type="button" className="wiz-continue-btn" onClick={handleNext}>
              <span>Continue</span>
              <FaChevronRight style={{ fontSize: '0.75rem' }} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wiz-card">
          <div className="wiz-form-grid">
            {/* Sample Type dropdown */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Sample Type <span>*</span></label>
              <select 
                className="wiz-field-select"
                value={sampleType}
                onChange={(e) => { setSampleType(e.target.value); setErrors(prev => ({ ...prev, sampleType: '' })); }}
              >
                <option value="">Select sample type...</option>
                {sampleTypesCatalog.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.sampleType && <span className="wiz-field-error">{errors.sampleType}</span>}
            </div>

            {/* Sample Category */}
            <div className="wiz-form-group">
              <label className="wiz-field-label">Sample Category <span>*</span></label>
              <select 
                className="wiz-field-select"
                value={sampleCategory}
                onChange={(e) => setSampleCategory(e.target.value)}
              >
                <option value="">Auto-mapped from sample type</option>
                {sampleTypesCatalog.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
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

      {step === 3 && (
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
                {['All Categories', 'Drinking Water', 'Ground Water', 'Surface Water', 'Waste Water', 'Food', 'Soil'].map(pill => (
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
              {filteredParamsByCategory.map(group => (
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
              ))}
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
            On submission, a request number in the format <strong>TR-2026-000246</strong> (or next available ID) will be generated automatically and the request will move to <strong>Pending Testing</strong> status. The assigned technician will be notified instantly.
          </div>

          {/* Footer Action buttons */}
          <div className="wiz-action-bar">
            <button type="button" className="wiz-back-btn" onClick={handleBack}>Back</button>
            <button type="submit" className="wiz-continue-btn">
              <FaCheck />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewTestRequestWizard;
