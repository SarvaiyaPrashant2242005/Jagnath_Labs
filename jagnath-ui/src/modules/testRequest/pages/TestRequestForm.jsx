import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import { FaPrint, FaSave, FaArrowLeft, FaCheck, FaExclamationCircle } from 'react-icons/fa';

const TestRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // State for dropdown options
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // State for dynamic parameter checklist
  const [parameters, setParameters] = useState([]);
  const [checkedParameters, setCheckedParameters] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    companyId: '',
    clientId: '',
    address: '',
    email: '',
    locationOfSample: '',
    contactPerson: '',
    contactNumber: '',
    dateOfCollection: new Date().toISOString().split('T')[0],
    dateOfReceipt: '',
    sampleCollectedBy: '',
    sampleQuantity: '',
    fieldDataSheet: 'Not Available',
    packingDetails: '',
    sampleIdNumber: '',
    reportNumber: '',
    sampleParticular: '', // This will hold categoryId
    equipmentAvailability: '',
    referenceStandardAvailability: '',
    sampleAdequacy: '',
    testMethodAvailability: '',
    tentativeDays: '',
    sampleTestingFacilityReviewedBy: '',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const printRef = useRef();

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [compRes, clientRes, catRes] = await Promise.all([
        apiService.get(COMPANY_ENDPOINTS.GET_MY),
        apiService.get(CLIENT_ENDPOINTS.GET_ALL),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL)
      ]);

      if (compRes?.data) setCompanies(Array.isArray(compRes.data) ? compRes.data : [compRes.data]);
      if (clientRes?.data) setClients(Array.isArray(clientRes.data) ? clientRes.data : [clientRes.data]);
      if (catRes?.data) setCategories(Array.isArray(catRes.data) ? catRes.data : [catRes.data]);

      // If editing, fetch the existing request and populate form
      if (isEditing) {
        const trRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(id));
        if (trRes?.data) {
          const tr = trRes.data;
          
          const cList = Array.isArray(compRes?.data) ? compRes.data : [compRes?.data];
          const clList = Array.isArray(clientRes?.data) ? clientRes.data : [clientRes?.data];
          
          const matchingComp = cList.find(c => (c.companyName || c.company_name) === tr.companyName) || {};
          const matchingClient = clList.find(c => c.clientName === tr.clientName) || {};

          setFormData({
            companyId: matchingComp.id || '',
            clientId: matchingClient.id || '',
            address: tr.address || '',
            email: tr.email || '',
            locationOfSample: tr.locationOfSample || '',
            contactPerson: tr.contactPerson || '',
            contactNumber: tr.contactNumber || '',
            dateOfCollection: tr.dateOfCollection || '',
            dateOfReceipt: tr.dateOfReceipt || '',
            sampleCollectedBy: tr.sampleCollectedBy || '',
            sampleQuantity: tr.sampleQuantity || '',
            fieldDataSheet: tr.fieldDataSheet || 'Not Available',
            packingDetails: tr.packingDetails || '',
            sampleIdNumber: tr.sampleIdNumber || '',
            reportNumber: tr.reportNumber || '',
            sampleParticular: tr.sampleParticular || '',
            equipmentAvailability: tr.equipmentAvailability || '',
            referenceStandardAvailability: tr.referenceStandardAvailability || '',
            sampleAdequacy: tr.sampleAdequacy || '',
            testMethodAvailability: tr.testMethodAvailability || '',
            tentativeDays: tr.reportIssueDays || '',
            sampleTestingFacilityReviewedBy: tr.reviewedBy || '',
            remarks: tr.remarks || ''
          });

          if (tr.sampleParticular) {
            fetchParametersForCategory(tr.sampleParticular);
          }

          // Fetch checked parameters
          try {
            const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
            if (trpRes?.data) {
              const trps = Array.isArray(trpRes.data) ? trpRes.data : [trpRes.data];
              const matchingTrps = trps.filter(t => t.testRequestId === id);
              const checks = {};
              matchingTrps.forEach(t => {
                if (t.parameterId) checks[t.parameterId] = true;
                checks[`_id_${t.parameterId}`] = t.id; // Store transaction ID for updates/deletes
              });
              setCheckedParameters(checks);
            }
          } catch (e) {
            console.error("Error fetching request parameters", e);
          }
        }
      } else {
        // Pre-select company if only one exists
        if (compRes?.data) {
          const compArray = Array.isArray(compRes.data) ? compRes.data : [compRes.data];
          if (compArray.length === 1) {
            setFormData(prev => ({ ...prev, companyId: compArray[0].id }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchParametersForCategory = async (categoryId) => {
    try {
      const res = await apiService.get(CATEGORY_PARAMETER_ENDPOINTS.GET_BY_CATEGORY(categoryId));
      if (res?.data) {
        setParameters(Array.isArray(res.data) ? res.data : [res.data]);
      } else {
        setParameters([]);
      }
    } catch (e) {
      setParameters([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'sampleParticular' && value) {
      fetchParametersForCategory(value);
      // Reset checks when category changes
      setCheckedParameters({});
    }

    if (name === 'clientId' && value) {
      // Auto-fill client details
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        setFormData(prev => ({ 
          ...prev, 
          email: selectedClient.email || '', 
          contactNumber: selectedClient.contactNumber || prev.contactNumber 
        }));
      }
    }
  };

  const handleParameterCheck = (paramId) => {
    setCheckedParameters(prev => ({
      ...prev,
      [paramId]: !prev[paramId]
    }));
  };

  const validateForm = () => {
    if (!formData.companyId) {
      triggerToast('Please select a Company.', 'error');
      return false;
    }
    if (!formData.clientId) {
      triggerToast('Please select a Client.', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return false;
    setSubmitting(true);
    
    try {
      // 1. Save Test Request
      const payload = { ...formData, reportIssueDays: formData.tentativeDays, reviewedBy: formData.sampleTestingFacilityReviewedBy };
      delete payload.tentativeDays;
      delete payload.sampleTestingFacilityReviewedBy;
      
      let savedTrId = id;
      if (isEditing) {
        await apiService.put(TEST_REQUEST_ENDPOINTS.UPDATE(id), payload);
      } else {
        const res = await apiService.post(TEST_REQUEST_ENDPOINTS.CREATE, payload);
        savedTrId = res?.data?.id || res?.data?.data?.id; // depending on response format
      }

      if (!savedTrId) {
        triggerToast('Failed to retrieve saved request ID.', 'error');
        setSubmitting(false);
        return false;
      }

      // 2. Save Parameters Checklist
      const currentParamIds = Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && checkedParameters[k]);
      
      for (const pId of currentParamIds) {
        if (!checkedParameters[`_id_${pId}`]) {
          await apiService.post(TEST_REQUEST_PARAMETER_ENDPOINTS.CREATE, {
            testRequestId: savedTrId,
            parameterId: pId
          });
        }
      }

      triggerToast('Test Request saved successfully!', 'success');
      return true;
    } catch (err) {
      triggerToast(err.messageToShow || 'Failed to save test request.', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const success = await handleSave();
    if (success) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading Form Data...</div>;

  // Selected entities for display in print format
  const selCompany = companies.find(c => c.id === formData.companyId) || {};
  const selClient = clients.find(c => c.id === formData.clientId) || {};
  const selCategory = categories.find(c => c.id === formData.sampleParticular) || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.3s ease-in-out',
        }}>
          {toast.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title & Top Action bar */}
      <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/requests')} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaArrowLeft />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEditing ? 'Edit Test Request' : 'New Test Request'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleSave} 
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaSave />
            <span>{submitting ? 'Saving...' : 'Save'}</span>
          </button>
          <button 
            onClick={handleSaveAndPrint} 
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <FaPrint />
            <span>Save & Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Premium UI (Screen Only) */}
      <div className="premium-ui-form hide-on-print" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>General Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Company *</label>
            <select name="companyId" value={formData.companyId} onChange={handleChange} className="premium-input">
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.company_name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Customer / Client *</label>
            <select name="clientId" value={formData.clientId} onChange={handleChange} className="premium-input">
              <option value="">Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Address for Communication</label>
            <textarea name="address" value={formData.address} onChange={handleChange} className="premium-input" rows={2}></textarea>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email ID</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Location of Sample</label>
            <input type="text" name="locationOfSample" value={formData.locationOfSample} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Contact Person</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Contact Number</label>
            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="premium-input" />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Sample Details</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date of Collection</label>
            <input type="date" name="dateOfCollection" value={formData.dateOfCollection} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date of Receipt</label>
            <input type="date" name="dateOfReceipt" value={formData.dateOfReceipt} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sample Collected By</label>
            <input type="text" name="sampleCollectedBy" value={formData.sampleCollectedBy} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sample Quantity</label>
            <input type="text" name="sampleQuantity" value={formData.sampleQuantity} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Field Data Sheet</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                <input type="radio" name="fieldDataSheet" value="Available" checked={formData.fieldDataSheet === 'Available'} onChange={handleChange} />
                Available
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }}>
                <input type="radio" name="fieldDataSheet" value="Not Available" checked={formData.fieldDataSheet === 'Not Available'} onChange={handleChange} />
                Not Available
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Packing details</label>
            <input type="text" name="packingDetails" value={formData.packingDetails} onChange={handleChange} className="premium-input" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sample ID No.</label>
            <input type="text" name="sampleIdNumber" value={formData.sampleIdNumber} onChange={handleChange} className="premium-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Report No.</label>
            <input type="text" name="reportNumber" value={formData.reportNumber} onChange={handleChange} className="premium-input" />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Testing Parameters</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Sample Particular (Category Master)</label>
          <select name="sampleParticular" value={formData.sampleParticular} onChange={handleChange} className="premium-input">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {parameters.length > 0 && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600, color: '#0f172a' }}>
              Select Test Parameters to be Analyzed
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#ffffff', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '60px', color: '#64748b' }}>Select</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b' }}>Parameter</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b' }}>Test Method</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map(param => (
                    <tr key={param.id} onClick={() => handleParameterCheck(param.id)} style={{ borderTop: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <input type="checkbox" checked={!!checkedParameters[param.id]} onChange={() => {}} onClick={(e) => e.stopPropagation()} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#22c55e' }} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 500 }}>{param.parameterName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{param.testMethod || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Authorized Signatory Signature (Placeholder)</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Click to Upload Signature Image (Coming soon)
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Company Logo (Placeholder)</label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Click to Upload Company Logo (Coming soon)
                </div>
            </div>
        </div>

      </div>

      {/* Printable Area (Paper Format) - Hidden on Screen */}
      <div ref={printRef} className="print-container hide-on-screen form-wrapper">
        
        {/* Header matching the paper form */}
        <div className="form-header-row">
          <div className="header-col header-col-logo">
             <div className="logo-placeholder">
                <div className="logo-circle">LOGO</div>
                <h1 className="brand-name">{selCompany.companyName || selCompany.company_name || 'JAGNATH'}</h1>
                <p className="brand-sub">Lab Technologies</p>
             </div>
          </div>
          <div className="header-col header-col-title">
            <h2>FORMATS</h2>
          </div>
          <div className="header-col header-col-info">
            <div className="info-row"><div className="info-label">Amendment No.</div><div className="info-val">00</div></div>
            <div className="info-row"><div className="info-label">Amendment Date</div><div className="info-val">--</div></div>
            <div className="info-row"><div className="info-label">Issue No.</div><div className="info-val">01</div></div>
            <div className="info-row"><div className="info-label">Issue Date</div><div className="info-val">01/09/2018</div></div>
            <div className="info-row no-border-b"><div className="info-label">Format No.</div><div className="info-val">7.1 F-01</div></div>
          </div>
        </div>

        <div className="form-title-bar">
          <h3>Test Request Form For Water & Waste Water</h3>
        </div>

        {/* Form Grid */}
        <div className="form-grid">
           {/* Row 1 */}
           <div className="grid-row full-width">
              <div className="grid-label w-quarter">Name of Company/<br/>Customer :</div>
              <div className="grid-val w-three-quarter" style={{ display: 'flex', gap: '1rem' }}>
                 <div className="print-val flex-1">{selCompany.companyName || selCompany.company_name || ''}</div>
                 <div className="print-val flex-1">{selClient.clientName || ''}</div>
              </div>
           </div>

           {/* Row 2 */}
           <div className="grid-row full-width">
              <div className="grid-label w-quarter">Address for<br/>Communication :</div>
              <div className="grid-val w-three-quarter">
                 <div className="print-val w-full min-h-50">{formData.address}</div>
              </div>
           </div>

           {/* Row 3 - Split */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Email ID :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.email}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Location of Sample :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.locationOfSample}</div></div>
              </div>
           </div>

           {/* Row 4 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Contact Person :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.contactPerson}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Contact No. :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.contactNumber}</div></div>
              </div>
           </div>

           {/* Row 5 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Date of Collection :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.dateOfCollection}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Date of Receipt :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.dateOfReceipt}</div></div>
              </div>
           </div>

           {/* Row 6 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Sample Collected By :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.sampleCollectedBy}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Sample Quantity :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.sampleQuantity}</div></div>
              </div>
           </div>

           {/* Row 7 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Field Data Sheet :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.fieldDataSheet}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Packing details :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.packingDetails}</div></div>
              </div>
           </div>

           {/* Row 8 */}
           <div className="grid-row split-row border-b-none">
              <div className="split-col border-r">
                <div className="grid-label w-half">Sample ID No. :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.sampleIdNumber}</div></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Report No. :</div>
                <div className="grid-val w-half"><div className="print-val w-full">{formData.reportNumber}</div></div>
              </div>
           </div>
        </div>

        <div className="form-grid mt-4">
           {/* Row 9 */}
           <div className="grid-row full-width border-b-none">
              <div className="grid-label w-quarter">Sample Particular :</div>
              <div className="grid-val w-three-quarter">
                 <div className="print-val w-full">{selCategory.name || ''}</div>
              </div>
           </div>
        </div>

        {/* Dynamic Parameter Checklist based on selected category */}
        {parameters.length > 0 && (
           <div className="parameter-checklist">
              <h4>Test Parameter to be Analyzed:</h4>
              <table className="param-table">
                 <thead>
                    <tr>
                       <th style={{ width: '60px', textAlign: 'center' }}>Sr. No.</th>
                       <th>Test Parameters</th>
                       <th style={{ width: '60px', textAlign: 'center' }}>Tick √</th>
                       <th>Test Method</th>
                    </tr>
                 </thead>
                 <tbody>
                    {parameters.map((param, index) => {
                       const pName = param.parameterName || 'Unknown Parameter';
                       const pMethod = param.testMethod || 'N/A';
                       return (
                          <tr key={param.id}>
                             <td style={{ textAlign: 'center' }}>{index + 1}</td>
                             <td>{pName}</td>
                             <td style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {checkedParameters[param.id] ? '√' : ''}
                             </td>
                             <td>{pMethod}</td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        )}

      </div>
      
      {/* Print styles block to ensure it looks exactly like the form on print and display */}
      <style>{`
        .premium-input {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-family: inherit;
          font-size: 0.9rem;
          color: #1e293b;
          background-color: #f8fafc;
          transition: all 0.2s;
        }
        .premium-input:focus {
          outline: none;
          border-color: #3b82f6;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-wrapper {
          border: 2px solid #1e293b;
          background: #fff;
          font-family: Arial, sans-serif;
          color: #000;
        }
        .form-header-row {
          display: flex;
          border-bottom: 2px solid #1e293b;
        }
        .header-col {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .header-col-logo {
          width: 30%;
          border-right: 2px solid #1e293b;
          align-items: center;
        }
        .logo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-circle {
          width: 50px;
          height: 50px;
          border: 2px solid #94a3b8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
          color: #94a3b8;
          margin-bottom: 0.25rem;
        }
        .brand-name {
          font-size: 1.25rem;
          font-weight: bold;
          letter-spacing: 2px;
          margin: 0;
        }
        .brand-sub {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
          color: #64748b;
        }
        .header-col-title {
          width: 40%;
          border-right: 2px solid #1e293b;
          align-items: center;
        }
        .header-col-title h2 {
          font-size: 1.5rem;
          font-weight: bold;
          letter-spacing: 3px;
          margin: 0;
        }
        .header-col-info {
          width: 30%;
          padding: 0;
        }
        .info-row {
          display: flex;
          border-bottom: 1px solid #1e293b;
          font-size: 0.75rem;
        }
        .no-border-b { border-bottom: none; }
        .info-label {
          width: 60%;
          padding: 0.25rem 0.5rem;
          border-right: 1px solid #1e293b;
        }
        .info-val {
          width: 40%;
          padding: 0.25rem 0.5rem;
        }
        .form-title-bar {
          padding: 0.75rem;
          text-align: center;
          border-bottom: 2px solid #1e293b;
        }
        .form-title-bar h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: bold;
          text-decoration: underline;
          text-transform: uppercase;
        }
        .form-grid {
          display: flex;
          flex-direction: column;
          border: 1px solid #1e293b;
          border-left: none;
          border-right: none;
        }
        .grid-row {
          display: flex;
          border-bottom: 1px solid #1e293b;
        }
        .border-b-none { border-bottom: none; }
        .split-row {
          width: 100%;
        }
        .split-col {
          display: flex;
          width: 50%;
        }
        .split-col.border-r {
          border-right: 1px solid #1e293b;
        }
        .grid-label {
          padding: 0.5rem;
          background-color: #f8fafc;
          border-right: 1px solid #1e293b;
          font-size: 0.8rem;
          font-weight: bold;
          display: flex;
          align-items: center;
        }
        .grid-val {
          padding: 0.5rem;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
        }
        .print-val {
          font-weight: 500;
          color: #000;
        }
        .w-half { width: 50%; }
        .w-quarter { width: 25%; }
        .w-three-quarter { width: 75%; }
        .full-width { width: 100%; }
        .flex-1 { flex: 1; }
        .w-full { width: 100%; box-sizing: border-box; }
        .min-h-50 { min-height: 50px; }
        
        .mt-4 { margin-top: 1rem; }
        
        .parameter-checklist {
          margin-top: 2rem;
          border-top: 4px solid #1e293b;
          padding-top: 1rem;
          page-break-before: always;
        }
        .parameter-checklist h4 {
          font-size: 1rem;
          font-weight: bold;
          margin: 0 0 0.5rem 0;
        }
        .param-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #1e293b;
          font-size: 0.8rem;
        }
        .param-table th, .param-table td {
          border: 1px solid #1e293b;
          padding: 0.4rem;
          text-align: left;
        }
        .param-table th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        
        @media screen {
          .hide-on-screen { display: none !important; }
        }

        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .grid-label, .param-table th { background-color: transparent !important; }
          .parameter-checklist { page-break-before: always; }
        }
      `}</style>
    </div>
  );
};

export default TestRequestForm;
