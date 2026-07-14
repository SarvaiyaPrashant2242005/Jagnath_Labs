import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import { FaPrint, FaSave } from 'react-icons/fa';

const TestRequestForm = () => {
  const { id } = useParams();
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const printRef = useRef();

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
          
          // Try to map companyName to companyId and clientName to clientId
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
    } catch (err) {
      console.error(err);
      setParameters([]);
    }
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill logic for Client Selection
    if (name === 'clientId') {
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientId: value,
          address: selectedClient.address || '',
          contactNumber: selectedClient.contactNumber || ''
        }));
        return;
      }
    }

    // Fetch parameters when Category changes
    if (name === 'sampleParticular') {
      fetchParametersForCategory(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParameterCheck = (parameterId) => {
    setCheckedParameters(prev => ({
      ...prev,
      [parameterId]: !prev[parameterId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId || !formData.clientId) {
      triggerToast('Company and Client are required', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      const selectedClient = clients.find(c => c.id === formData.clientId);

      // Main Request Creation
      const reqPayload = { 
        companyName: selectedCompany ? (selectedCompany.companyName || selectedCompany.company_name) : '',
        clientName: selectedClient ? selectedClient.clientName : '',
        address: formData.address,
        email: formData.email,
        locationOfSample: formData.locationOfSample,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        dateOfCollection: formData.dateOfCollection,
        dateOfReceipt: formData.dateOfReceipt,
        sampleCollectedBy: formData.sampleCollectedBy,
        sampleQuantity: formData.sampleQuantity,
        fieldDataSheet: formData.fieldDataSheet,
        packingDetails: formData.packingDetails,
        sampleIdNumber: formData.sampleIdNumber,
        reportNumber: formData.reportNumber,
        sampleParticular: formData.sampleParticular,
        equipmentAvailability: formData.equipmentAvailability,
        referenceStandardAvailability: formData.referenceStandardAvailability,
        sampleAdequacy: formData.sampleAdequacy,
        testMethodAvailability: formData.testMethodAvailability,
        reportIssueDays: formData.tentativeDays, 
        reviewedBy: formData.sampleTestingFacilityReviewedBy, 
        remarks: formData.remarks
      };

      let res;
      if (isEditing) {
        res = await apiService.put(TEST_REQUEST_ENDPOINTS.UPDATE(id), reqPayload);
        triggerToast('Test Request Updated Successfully', 'success');
      } else {
        res = await apiService.post(TEST_REQUEST_ENDPOINTS.CREATE, reqPayload);
        triggerToast('Test Request Created Successfully', 'success');
      }
      
      // Save parameters
      const trId = isEditing ? id : (res?.data?.id || res?.data?.data?.id || res?.data?.data?.TestRequest?.id);
      
      if (trId) {
        const selectedParamIds = Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && checkedParameters[k]);
        
        for (const pId of selectedParamIds) {
          const trpId = checkedParameters[`_id_${pId}`];
          if (!trpId) {
            // Create new parameter mapping
            await apiService.post(TEST_REQUEST_PARAMETER_ENDPOINTS.CREATE, { 
              testRequestId: trId, 
              parameterId: pId, 
              status: 'Pending' 
            }).catch(console.error);
          }
        }
        
        if (isEditing) {
          const unselectedIds = Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && !checkedParameters[k]);
          for (const pId of unselectedIds) {
            const trpId = checkedParameters[`_id_${pId}`];
            if (trpId) {
              // Delete parameter mapping
              await apiService.delete(TEST_REQUEST_PARAMETER_ENDPOINTS.DELETE(trpId)).catch(console.error);
            }
          }
        }
      }
      
      // Open PDF print view (using standard window.print for the specific container)
      setTimeout(() => {
        handlePrint();
      }, 500);
    } catch (err) {
      triggerToast(err?.messageToShow || 'Failed to create Test Request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>New Test Request Form</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
             <FaPrint /> Print Form
           </button>
           <button onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
             <FaSave /> {loading ? 'Saving...' : 'Save Request'}
           </button>
        </div>
      </div>

      {toast.show && (
        <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', color: toast.type === 'error' ? '#dc2626' : '#16a34a', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
          {toast.message}
        </div>
      )}

      {/* Printable Area starts here */}
      <div ref={printRef} className="print-container form-wrapper">
        
        {/* Header matching the paper form */}
        <div className="form-header-row">
          <div className="header-col header-col-logo">
             <div className="logo-placeholder">
                <div className="logo-circle">LOGO</div>
                <h1 className="brand-name">JAGNATH</h1>
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
                 <select name="companyId" value={formData.companyId} onChange={handleChange} className="form-input flex-1">
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.companyName || c.company_name}</option>)}
                 </select>
                 <select name="clientId" value={formData.clientId} onChange={handleChange} className="form-input flex-1">
                    <option value="">Select Customer (Client)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                 </select>
              </div>
           </div>

           {/* Row 2 */}
           <div className="grid-row full-width">
              <div className="grid-label w-quarter">Address for<br/>Communication :</div>
              <div className="grid-val w-three-quarter">
                 <textarea name="address" value={formData.address} onChange={handleChange} className="form-input w-full min-h-50"></textarea>
              </div>
           </div>

           {/* Row 3 - Split */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Email ID :</div>
                <div className="grid-val w-half"><input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input w-full"/></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Location of Sample :</div>
                <div className="grid-val w-half"><input type="text" name="locationOfSample" value={formData.locationOfSample} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>

           {/* Row 4 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Contact Person :</div>
                <div className="grid-val w-half"><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="form-input w-full"/></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Contact No. :</div>
                <div className="grid-val w-half"><input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>

           {/* Row 5 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Date of Collection :</div>
                <div className="grid-val w-half"><input type="date" name="dateOfCollection" value={formData.dateOfCollection} onChange={handleChange} className="form-input w-full"/></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Date of Receipt :</div>
                <div className="grid-val w-half"><input type="date" name="dateOfReceipt" value={formData.dateOfReceipt} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>

           {/* Row 6 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Sample Collected By :</div>
                <div className="grid-val w-half"><input type="text" name="sampleCollectedBy" value={formData.sampleCollectedBy} onChange={handleChange} className="form-input w-full"/></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Sample Quantity :</div>
                <div className="grid-val w-half"><input type="text" name="sampleQuantity" value={formData.sampleQuantity} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>

           {/* Row 7 */}
           <div className="grid-row split-row">
              <div className="split-col border-r">
                <div className="grid-label w-half">Field Data Sheet :</div>
                <div className="grid-val w-half" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><input type="radio" name="fieldDataSheet" value="Available" checked={formData.fieldDataSheet === 'Available'} onChange={handleChange} /> Available</label>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><input type="radio" name="fieldDataSheet" value="Not Available" checked={formData.fieldDataSheet === 'Not Available'} onChange={handleChange} /> N/A</label>
                </div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Packing details :</div>
                <div className="grid-val w-half"><input type="text" name="packingDetails" value={formData.packingDetails} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>

           {/* Row 8 */}
           <div className="grid-row split-row border-b-none">
              <div className="split-col border-r">
                <div className="grid-label w-half">Sample ID No. :</div>
                <div className="grid-val w-half"><input type="text" name="sampleIdNumber" value={formData.sampleIdNumber} onChange={handleChange} className="form-input w-full"/></div>
              </div>
              <div className="split-col">
                <div className="grid-label w-half">Report No. :</div>
                <div className="grid-val w-half"><input type="text" name="reportNumber" value={formData.reportNumber} onChange={handleChange} className="form-input w-full"/></div>
              </div>
           </div>
        </div>

        <div className="form-grid mt-4">
           {/* Row 9 */}
           <div className="grid-row full-width border-b-none">
              <div className="grid-label w-quarter">Sample Particular :</div>
              <div className="grid-val w-three-quarter">
                 <select name="sampleParticular" value={formData.sampleParticular} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '400px' }}>
                    <option value="">Select Category Master</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
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
                          <tr key={param.id} onClick={() => handleParameterCheck(param.id)} style={{ cursor: 'pointer' }}>
                             <td style={{ textAlign: 'center' }}>{index + 1}</td>
                             <td>{pName}</td>
                             <td style={{ textAlign: 'center' }}>
                                <input type="checkbox" checked={!!checkedParameters[param.id]} onChange={() => {}} style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
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
        .w-half { width: 50%; }
        .w-quarter { width: 25%; }
        .w-three-quarter { width: 75%; }
        .full-width { width: 100%; }
        .flex-1 { flex: 1; }
        .w-full { width: 100%; box-sizing: border-box; }
        .min-h-50 { min-height: 50px; resize: vertical; }
        
        .form-input {
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-family: inherit;
          font-size: 0.8rem;
        }
        .form-input:focus {
          outline: 1px solid #3b82f6;
          border-color: #3b82f6;
        }
        
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
        .param-table tr:hover td {
          background-color: #f8fafc;
        }

        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .form-input { border: none !important; appearance: none !important; font-weight: 500; color: #000; padding: 0 !important; background: transparent !important; }
          .grid-label, .param-table th { background-color: transparent !important; }
          .parameter-checklist { page-break-before: always; }
        }
      `}</style>
    </div>
  );
};

export default TestRequestForm;
