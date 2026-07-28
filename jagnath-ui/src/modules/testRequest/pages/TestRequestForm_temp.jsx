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
      if (window.location.hash.includes('print=true')) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
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
      <div className="premium-ui-form hide-on-print" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* General Information Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
            <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', borderRadius: '6px' }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>General Information</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Company <span style={{color: '#ef4444'}}>*</span></label>
              <select name="companyId" value={formData.companyId} onChange={handleChange} className="premium-input">
                <option value="">Select Company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.company_name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Customer / Client <span style={{color: '#ef4444'}}>*</span></label>
              <select name="clientId" value={formData.clientId} onChange={handleChange} className="premium-input">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Address for Communication</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className="premium-input" rows={2} placeholder="Enter full address..."></textarea>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email ID</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="premium-input" placeholder="e.g. contact@client.com" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Location of Sample</label>
              <input type="text" name="locationOfSample" value={formData.locationOfSample} onChange={handleChange} className="premium-input" placeholder="Sample site or location" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="premium-input" placeholder="Name of contact" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Contact Number</label>
              <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="premium-input" placeholder="+91 00000 00000" />
            </div>
          </div>
        </div>

        {/* Sample Details Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
            <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #10b981, #34d399)', borderRadius: '6px' }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sample Details</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Date of Collection</label>
              <input type="date" name="dateOfCollection" value={formData.dateOfCollection} onChange={handleChange} className="premium-input" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Date of Receipt</label>
              <input type="date" name="dateOfReceipt" value={formData.dateOfReceipt} onChange={handleChange} className="premium-input" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Collected By</label>
              <input type="text" name="sampleCollectedBy" value={formData.sampleCollectedBy} onChange={handleChange} className="premium-input" placeholder="Name of collector" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Quantity</label>
              <input type="text" name="sampleQuantity" value={formData.sampleQuantity} onChange={handleChange} className="premium-input" placeholder="e.g. 500ml" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Field Data Sheet</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '100%', boxSizing: 'border-box' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                  <input type="radio" name="fieldDataSheet" value="Available" checked={formData.fieldDataSheet === 'Available'} onChange={handleChange} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                  Available
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                  <input type="radio" name="fieldDataSheet" value="Not Available" checked={formData.fieldDataSheet === 'Not Available'} onChange={handleChange} style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }} />
                  Not Available
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Packing details</label>
              <input type="text" name="packingDetails" value={formData.packingDetails} onChange={handleChange} className="premium-input" placeholder="e.g. Sealed glass bottle" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample ID No.</label>
              <input type="text" name="sampleIdNumber" value={formData.sampleIdNumber} onChange={handleChange} className="premium-input" placeholder="e.g. SPL-1002" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Report No.</label>
              <input type="text" name="reportNumber" value={formData.reportNumber} onChange={handleChange} className="premium-input" placeholder="e.g. RPT-001" />
            </div>
          </div>
        </div>

        {/* Testing Parameters Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
            <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #8b5cf6, #a78bfa)', borderRadius: '6px' }}></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Testing Parameters</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem', maxWidth: '400px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Particular (Category) <span style={{color: '#ef4444'}}>*</span></label>
            <select name="sampleParticular" value={formData.sampleParticular} onChange={handleChange} className="premium-input">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {parameters.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #ffffff)', fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Select Test Parameters to be Analyzed
                <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  {Object.values(checkedParameters).filter(Boolean).length} Selected
                </span>
              </div>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, boxShadow: '0 1px 0 #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'center', width: '80px', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Select</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Parameter Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>Test Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map(param => {
                      const isChecked = !!checkedParameters[param.id];
                      return (
                        <tr 
                          key={param.id} 
                          onClick={() => handleParameterCheck(param.id)} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s ease',
                            backgroundColor: isChecked ? '#f0fdf4' : '#ffffff' 
                          }} 
                          onMouseEnter={(e) => { if(!isChecked) e.currentTarget.style.backgroundColor = '#f8fafc' }} 
                          onMouseLeave={(e) => { if(!isChecked) e.currentTarget.style.backgroundColor = '#ffffff' }}
                        >
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: isChecked ? 'none' : '2px solid #cbd5e1', background: isChecked ? '#22c55e' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                                {isChecked && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>âœ“</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: isChecked ? '#166534' : '#1e293b', fontWeight: isChecked ? 600 : 500 }}>{param.parameterName}</td>
                          <td style={{ padding: '1rem', color: isChecked ? '#15803d' : '#64748b' }}>{param.testMethod || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Authorized Signatory Signature (Placeholder)</label>
                  <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e)=> {e.currentTarget.style.borderColor='#94a3b8'; e.currentTarget.style.background='#f1f5f9'}} onMouseLeave={(e)=> {e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.background='#f8fafc'}}>
                      Click to Upload Signature Image <br/><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Coming soon)</span>
                  </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Company Logo (Placeholder)</label>
                  <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e)=> {e.currentTarget.style.borderColor='#94a3b8'; e.currentTarget.style.background='#f1f5f9'}} onMouseLeave={(e)=> {e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.background='#f8fafc'}}>
                      Click to Upload Company Logo <br/><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Coming soon)</span>
                  </div>
              </div>
          </div>
        </div>

      </div>

