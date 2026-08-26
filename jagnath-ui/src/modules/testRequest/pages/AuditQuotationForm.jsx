/**
 * @file AuditQuotationForm.jsx
 * @description Editable form on the left, with multi-page live A4 print preview on the right.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaPrint, FaArrowLeft, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import apiService from '../../../shared/services/apiService';
import { API_BASE_URL } from '../../../shared/services/apiEndpoints';

const BACKEND_ROOT_URL = 'http://localhost:5000';

const AuditQuotationForm = () => {
  const { testRequestId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: '',
    testRequestId: '',
    companyId: '',
    clientId: '',
    quotationNumber: '',
    quotationDate: '',
    revisedDate: '',
    financialYear: '',
    reference: '',
    subject: '',
    introText: '',
    accreditationText: '',
    scopeText: '',
    termsText: '',
    charges: [],
    annexure: [],
    contactPerson: '',
    signatoryName: '',
    signatoryDesignation: '',
    signatorySignature: '',
    stampImage: '',
  });

  const [client, setClient] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const signatureInputRef = useRef();
  const stampInputRef = useRef();

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        const res = await apiService.get(`${API_BASE_URL}/audit-quotation/test-request/${testRequestId}`);
        if (res?.data) {
          const q = res.data;
          setFormData({
            id: q.id || '',
            testRequestId: q.testRequestId || testRequestId,
            companyId: q.companyId || '',
            clientId: q.clientId || '',
            quotationNumber: q.quotationNumber || '',
            quotationDate: q.quotationDate || '',
            revisedDate: q.revisedDate || '',
            financialYear: q.financialYear || '',
            reference: q.reference || '',
            subject: q.subject || '',
            introText: q.introText || '',
            accreditationText: q.accreditationText || '',
            scopeText: q.scopeText || '',
            termsText: q.termsText || '',
            charges: q.charges || [],
            annexure: q.annexure || [],
            contactPerson: q.contactPerson || '',
            signatoryName: q.signatoryName || '',
            signatoryDesignation: q.signatoryDesignation || '',
            signatorySignature: q.signatorySignature || '',
            stampImage: q.stampImage || '',
          });
          if (q.client) setClient(q.client);
          if (q.company) setCompany(q.company);
        } else {
          setError("Failed to load/initialize quotation.");
        }
      } catch (err) {
        console.error(err);
        setError(err?.messageToShow || err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationData();
  }, [testRequestId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChargeRowChange = (index, field, val) => {
    setFormData(prev => {
      const updated = [...prev.charges];
      updated[index] = { ...updated[index], [field]: val };
      
      // Auto calculate row amount if qty or rate changes
      if (field === 'qty' || field === 'rate') {
        const qty = parseFloat(field === 'qty' ? val : updated[index].qty) || 0;
        const rate = parseFloat(field === 'rate' ? val : updated[index].rate) || 0;
        updated[index].amount = Math.round(qty * rate);
      }
      
      return { ...prev, charges: updated };
    });
  };

  const addChargeRow = () => {
    setFormData(prev => ({
      ...prev,
      charges: [
        ...prev.charges,
        { srNo: prev.charges.length + 1, description: '', qty: 1, unit: 'No.', rate: 0, amount: 0 }
      ]
    }));
  };

  const removeChargeRow = (index) => {
    setFormData(prev => {
      const filtered = prev.charges.filter((_, i) => i !== index);
      // Re-index serial numbers
      const updated = filtered.map((item, idx) => ({ ...item, srNo: idx + 1 }));
      return { ...prev, charges: updated };
    });
  };

  const handleAnnexureRowChange = (index, field, val) => {
    setFormData(prev => {
      const updated = [...prev.annexure];
      updated[index] = { ...updated[index], [field]: val };

      // Auto calculate totals if rates change
      if (field === 'ratePerSample' || field === 'samplePerVisit' || field === 'chargesPerVisit') {
        const rate = parseFloat(field === 'ratePerSample' ? val : updated[index].ratePerSample) || 0;
        const samples = parseInt(field === 'samplePerVisit' ? val : updated[index].samplePerVisit) || 0;
        updated[index].chargesPerVisit = rate * samples;
        updated[index].total = rate * samples * 3; // 3 visits
      }

      return { ...prev, annexure: updated };
    });
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, [field]: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async (silent = false) => {
    try {
      setSubmitting(true);
      const res = await apiService.post(`${API_BASE_URL}/audit-quotation`, formData);
      if (res?.success) {
        if (!silent) {
          alert("Audit Quotation saved successfully!");
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      alert("Error saving quotation: " + (err?.response?.data?.message || err?.message));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const success = await handleSave(true);
    if (success) {
      window.open(`#/test-requests/audit-quotation/print/${testRequestId}`, '_blank');
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading Audit Quotation Editor...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>
        ⚠️ {error}
      </div>
    );
  }

  // Preview helper values
  const getLogoUrl = () => {
    const logoPath = company.quotationLogo || company.quotation_logo || company.logo;
    if (!logoPath) return '/Images/Navbar_Logo.png';
    const cleanPath = logoPath.replace(/\\/g, '/');
    const idx = cleanPath.lastIndexOf('uploads/');
    if (idx !== -1) {
      return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
    }
    return logoPath;
  };

  const subtotal = formData.charges.reduce((sum, item) => {
    const amt = parseFloat(item.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = Math.round(subtotal + gstAmount);

  const groupedAnnexure = formData.annexure.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#f8fafc' }}>
      
      {/* Upper Navigation Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/test-requests')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            <FaArrowLeft /> Back to List
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Audit Quotation Editor: {client.clientName}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => handleSave(false)} disabled={submitting} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            <FaSave /> {submitting ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleSaveAndPrint} className="btn-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
            <FaPrint /> Save & Print PDF
          </button>
        </div>
      </div>

      {/* Main Split Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Form Editor Pane (Scrollable) */}
        <div style={{ width: '45%', padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          
          {/* Card 1: Basic details */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Basic Quotation Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Quotation Reference Number</label>
                <input type="text" name="quotationNumber" value={formData.quotationNumber} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Quotation Date</label>
                  <input type="text" name="quotationDate" placeholder="dd/mm/yyyy" value={formData.quotationDate} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Revised Date (Optional)</label>
                  <input type="text" name="revisedDate" placeholder="dd/mm/yyyy" value={formData.revisedDate} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Financial Year / Year</label>
                  <input type="text" name="financialYear" value={formData.financialYear} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Audit Reference</label>
                  <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Subject Heading</label>
                <textarea name="subject" value={formData.subject} onChange={handleChange} className="premium-input" rows={2} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem', fontFamily: 'sans-serif' }}></textarea>
              </div>
            </div>
          </div>

          {/* Card 2: Letter Content */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Page 1 - Letter Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Introductory & Accreditation Paragraphs</label>
                <textarea name="introText" value={formData.introText} onChange={handleChange} className="premium-input" rows={6} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem', fontFamily: 'sans-serif', fontSize: '0.85rem' }}></textarea>
              </div>
            </div>
          </div>

          {/* Card 3: Scope of Work */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Page 2 - Scope of Work</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Scope Points Text</label>
                <textarea name="scopeText" value={formData.scopeText} onChange={handleChange} className="premium-input" rows={5} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem', fontFamily: 'sans-serif', fontSize: '0.85rem' }}></textarea>
              </div>
            </div>
          </div>

          {/* Card 4: Charges Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: 0 }}>Page 2 - Detail of Charges</h3>
              <button type="button" onClick={addChargeRow} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                <FaPlus /> Add Charge Row
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.charges.map((item, index) => (
                <div key={index} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.75rem', background: '#f8fafc', relative: 'true' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Row #{item.srNo}</span>
                    <button type="button" onClick={() => removeChargeRow(index)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <FaTrash size={12} /> Remove
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Description of Work</label>
                      <input type="text" value={item.description} onChange={(e) => handleChargeRowChange(index, 'description', e.target.value)} className="premium-input" style={{ width: '100%', height: '34px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.15rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Qty</label>
                        <input type="number" value={item.qty} onChange={(e) => handleChargeRowChange(index, 'qty', e.target.value)} className="premium-input" style={{ width: '100%', height: '34px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.15rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Unit</label>
                        <input type="text" value={item.unit} onChange={(e) => handleChargeRowChange(index, 'unit', e.target.value)} className="premium-input" style={{ width: '100%', height: '34px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.15rem' }} />
                      </div>
                      <div style={{ flex: 1.2 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Rate (Rs.)</label>
                        <input type="number" value={item.rate} onChange={(e) => handleChargeRowChange(index, 'rate', e.target.value)} className="premium-input" style={{ width: '100%', height: '34px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.15rem' }} />
                      </div>
                      <div style={{ flex: 1.2 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Amount (Rs.)</label>
                        <input type="number" value={item.amount} onChange={(e) => handleChargeRowChange(index, 'amount', e.target.value)} className="premium-input" style={{ width: '100%', height: '34px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.15rem' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Terms and Conditions */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Page 3 - Terms & Conditions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Terms text list</label>
                <textarea name="termsText" value={formData.termsText} onChange={handleChange} className="premium-input" rows={6} style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem', fontFamily: 'sans-serif', fontSize: '0.85rem' }}></textarea>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Contact Person Details</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
              </div>
            </div>
          </div>

          {/* Card 6: Signatory details */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Signatory & Stamp Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Signatory Name</label>
                  <input type="text" name="signatoryName" value={formData.signatoryName} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Signatory Designation</label>
                  <input type="text" name="signatoryDesignation" value={formData.signatoryDesignation} onChange={handleChange} className="premium-input" style={{ width: '100%', height: '38px', padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.25rem' }} />
                </div>
              </div>

              {/* Signature Uploader */}
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Authorized Digital Signature</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="file" ref={signatureInputRef} onChange={(e) => handleFileUpload(e, 'signatorySignature')} accept="image/*" style={{ display: 'none' }} />
                  <button type="button" onClick={() => signatureInputRef.current.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <FaUpload /> Upload Signature
                  </button>
                  {formData.signatorySignature && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={formData.signatorySignature} alt="Signature Preview" style={{ maxHeight: '40px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                      <button type="button" onClick={() => removeImage('signatorySignature')} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stamp Uploader */}
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Company Round Stamp</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="file" ref={stampInputRef} onChange={(e) => handleFileUpload(e, 'stampImage')} accept="image/*" style={{ display: 'none' }} />
                  <button type="button" onClick={() => stampInputRef.current.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <FaUpload /> Upload Stamp
                  </button>
                  {formData.stampImage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={formData.stampImage} alt="Stamp Preview" style={{ maxHeight: '40px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                      <button type="button" onClick={() => removeImage('stampImage')} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: Annexure Rates */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginTop: 0, marginBottom: '1rem' }}>Annexure-B Rates Editor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.annexure.map((item, index) => (
                <div key={index} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.3rem' }}>
                    <span>{item.category}</span>
                    <span style={{ color: '#0f172a' }}>{item.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '0.72rem', color: '#475569' }}>Description</label>
                      <input type="text" value={item.description} onChange={(e) => handleAnnexureRowChange(index, 'description', e.target.value)} className="premium-input" style={{ width: '100%', height: '32px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.72rem', color: '#475569' }}>Rate/Sample (Rs.)</label>
                      <input type="number" value={item.ratePerSample} onChange={(e) => handleAnnexureRowChange(index, 'ratePerSample', e.target.value)} className="premium-input" style={{ width: '100%', height: '32px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }} />
                    </div>
                    <div style={{ flex: 0.8 }}>
                      <label style={{ fontSize: '0.72rem', color: '#475569' }}>Sample/Visit</label>
                      <input type="number" value={item.samplePerVisit} onChange={(e) => handleAnnexureRowChange(index, 'samplePerVisit', e.target.value)} className="premium-input" style={{ width: '100%', height: '32px', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Preview Pane (Scrollable) */}
        <div style={{ width: '55%', background: '#cbd5e1', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', boxSizing: 'border-box' }}>
          
          {/* Preview Page 1 */}
          <div className="preview-page" style={{ width: '210mm', height: '297mm', background: '#ffffff', padding: '20mm', boxSizing: 'border-box', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', color: '#000000', lineHeight: '1.4', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <img src={getLogoUrl()} alt="Company Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '5px 0 15px 0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', fontWeight: 'bold' }}>
                Date: {formatDateLong(formData.quotationDate)}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold' }}>To,</div>
                <div style={{ fontWeight: 'bold' }}>M/s. {client.companyName || client.clientName || 'CLIENT NAME'}</div>
                <div style={{ whiteSpace: 'pre-line', marginTop: '2px' }}>
                  {client.plantAddress || client.address || 'Plant Address'}
                </div>
              </div>
              <div style={{ marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                SUBJECT: - <span style={{ textDecoration: 'underline' }}>{formData.subject}</span>
              </div>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Dear Sir,</div>
              <div style={{ textAlign: 'justify', whiteSpace: 'pre-line', fontSize: '10.5pt', marginBottom: '20px' }}>
                {formData.introText}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div>Thanking you</div>
                <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
              </div>
              <div style={{ position: 'relative', marginTop: '15px' }}>
                <div>For, {company.companyName?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '8px 0' }}>
                  {formData.signatorySignature && (
                    <img src={formData.signatorySignature} alt="Signature" style={{ maxHeight: '55px', objectFit: 'contain' }} />
                  )}
                  {formData.stampImage && (
                    <img src={formData.stampImage} alt="Stamp" style={{ maxHeight: '70px', objectFit: 'contain' }} />
                  )}
                </div>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '3px' }}>{formData.signatoryName || 'Purvin Raiyani'}</div>
                <div>({formData.signatoryDesignation || 'Proprietor'})</div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
              <div style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#1e293b', marginBottom: '2px' }}>"NURTURING THE NATURE FOR HUMAN RACE"</div>
              <div>5-6/B, Nayan Jyot Chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist.- Rajkot (GUJ.) +91 81405 55515</div>
              <div>Email: jagnathtechnologies@yahoo.com / www.jagnathlabtechnologies.com</div>
            </div>
          </div>

          {/* Preview Page 2 */}
          <div className="preview-page" style={{ width: '210mm', height: '297mm', background: '#ffffff', padding: '20mm', boxSizing: 'border-box', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', color: '#000000', lineHeight: '1.4', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <img src={getLogoUrl()} alt="Company Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '5px 0 15px 0' }} />
              </div>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '12pt', margin: 0 }}>PROVISIONAL ESTIMATED QUOTE</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '9pt', border: '1px solid #000000' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold', width: '50%' }}>
                      CLIENT NAME:- <span style={{ fontWeight: 'normal' }}>M/s. {client.companyName || client.clientName || 'CLIENT NAME'}</span>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold', width: '50%' }}>
                      REFERENCE:- <span style={{ fontWeight: 'normal' }}>{formData.reference}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold' }}>
                      ADDRESS:- <span style={{ fontWeight: 'normal', whiteSpace: 'pre-line' }}>{client.plantAddress || client.address || 'Address'}</span>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold' }}>
                      APPROVED BY:- <span style={{ fontWeight: 'normal' }}>{formData.signatoryName || 'Mr. Purvin Patel'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold' }}>
                      Q-P.I :- <span style={{ fontWeight: 'normal' }}>{formData.quotationNumber}</span>
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '5px', fontWeight: 'bold' }}>
                      DATE:- <span style={{ fontWeight: 'normal' }}>{formData.quotationDate}</span>
                      {formData.revisedDate && <div>REVISED DATE:- <span style={{ fontWeight: 'normal' }}>{formData.revisedDate}</span></div>}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '10.5pt' }}>SCOPE OF WORK</h4>
                <div style={{ whiteSpace: 'pre-line', fontSize: '9pt', lineHeight: '1.35', textAlign: 'justify' }}>
                  {formData.scopeText}
                </div>
              </div>

              <div>
                <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '10.5pt' }}>
                  Detail of Charges for carrying out environmental audit as per GPCB norms.
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.8pt', border: '1px solid #000000' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '8%' }}>Sr. No.</th>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '47%', textAlign: 'left' }}>Description of work</th>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '10%' }}>Qty.</th>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '10%' }}>Unit</th>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '12%' }}>Rate</th>
                      <th style={{ border: '1px solid #000000', padding: '4px', width: '13%' }}>Amount Rs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.charges.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'center' }}>{item.srNo}</td>
                        <td style={{ border: '1px solid #000000', padding: '4px' }}>{item.description}</td>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{parseFloat(item.rate || 0).toLocaleString('en-IN')}/-</td>
                        <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{parseFloat(item.amount || 0).toLocaleString('en-IN')}/-</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan={5} style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>Total Subtotal:</td>
                      <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{subtotal.toLocaleString('en-IN')}/-</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold' }}>
                      <td colSpan={5} style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>GST (18%):</td>
                      <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{gstAmount.toLocaleString('en-IN')}/-</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>
                      <td colSpan={5} style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>Grand Total (Rs.):</td>
                      <td style={{ border: '1px solid #000000', padding: '4px', textAlign: 'right' }}>{grandTotal.toLocaleString('en-IN')}/-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '8.5pt', fontStyle: 'italic', marginTop: '8px' }}>
                Note: - Tax will be paid extra (GST 18%) apart from above rate/amount.
              </div>
            </div>
            {/* Footer */}
            <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Page 2</span>
                <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#1e293b' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                <span style={{ width: '30px' }}></span>
              </div>
            </div>
          </div>

          {/* Preview Page 3 */}
          <div className="preview-page" style={{ width: '210mm', height: '297mm', background: '#ffffff', padding: '20mm', boxSizing: 'border-box', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', color: '#000000', lineHeight: '1.4', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <img src={getLogoUrl()} alt="Company Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '5px 0 15px 0' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ textDecoration: 'underline', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '11pt' }}>Terms and conditions:</h4>
                <div style={{ whiteSpace: 'pre-line', fontSize: '9pt', lineHeight: '1.4', textAlign: 'justify' }}>
                  {formData.termsText}
                </div>
              </div>

              <div style={{ fontSize: '8.5pt', fontStyle: 'italic', marginBottom: '20px', background: '#f8fafc', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                (Note: - We have briefly studied all your scope of work and accordingly we are tied and committed to uphold highest standards of honesty & integrity for accuracy to the work order.)
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div>Thanking you in anticipation!</div>
                <div style={{ fontWeight: 'bold' }}>For, {company.companyName?.toUpperCase() || 'JAGNATH LAB TECHNOLOGIES'}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '10px 0' }}>
                {formData.signatorySignature && (
                  <img src={formData.signatorySignature} alt="Signature" style={{ maxHeight: '55px', objectFit: 'contain' }} />
                )}
                {formData.stampImage && (
                  <img src={formData.stampImage} alt="Stamp" style={{ maxHeight: '70px', objectFit: 'contain' }} />
                )}
              </div>

              <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
              <div style={{ marginTop: '15px', fontSize: '9.5pt', fontWeight: 'bold' }}>
                Contact Person: - {formData.contactPerson}
              </div>
            </div>
            {/* Footer */}
            <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Page 3</span>
                <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#1e293b' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                <span style={{ width: '30px' }}></span>
              </div>
            </div>
          </div>

          {/* Preview Page 4 */}
          <div className="preview-page" style={{ width: '210mm', height: '297mm', background: '#ffffff', padding: '15mm', boxSizing: 'border-box', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: '"Times New Roman", Times, serif', fontSize: '10pt', color: '#000000', lineHeight: '1.3', marginBottom: '2rem' }}>
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                <img src={getLogoUrl()} alt="Company Logo" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                <hr style={{ border: 'none', borderTop: '1.5px solid #000000', margin: '3px 0 8px 0' }} />
              </div>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h3 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '11pt', margin: 0 }}>Annexure - B</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.8pt', border: '1px solid #000000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '6%' }}>Sr. No.</th>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '36%', textAlign: 'left' }}>DESCRIPTIONS</th>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '13%' }}>Rate per sample</th>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '13%' }}>Sample per visit</th>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '16%' }}>Charges per visit</th>
                    <th style={{ border: '1px solid #000000', padding: '3px', width: '16%' }}>Total (3 visit)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedAnnexure).map((catName, catIdx) => {
                    const items = groupedAnnexure[catName];
                    return (
                      <React.Fragment key={catIdx}>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>
                          <td style={{ border: '1px solid #000000', padding: '3px', textAlign: 'center' }}>{catIdx + 1}</td>
                          <td colSpan={5} style={{ border: '1px solid #000000', padding: '3px', textTransform: 'uppercase' }}>{catName}</td>
                        </tr>
                        {items.map((item, itemIdx) => (
                          <tr key={itemIdx}>
                            <td style={{ border: '1px solid #000000', padding: '3px' }}></td>
                            <td style={{ border: '1px solid #000000', padding: '3px' }}>{item.description}</td>
                            <td style={{ border: '1px solid #000000', padding: '3px', textAlign: 'center' }}>{parseFloat(item.ratePerSample || 0).toLocaleString('en-IN')}/-</td>
                            <td style={{ border: '1px solid #000000', padding: '3px', textAlign: 'center' }}>{item.samplePerVisit}</td>
                            <td style={{ border: '1px solid #000000', padding: '3px', textAlign: 'right' }}>{parseFloat(item.chargesPerVisit || 0).toLocaleString('en-IN')}/-</td>
                            <td style={{ border: '1px solid #000000', padding: '3px', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(item.total || 0).toLocaleString('en-IN')}/-</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ fontSize: '7.8pt', fontStyle: 'italic', background: '#f8fafc', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '6px' }}>
                Note: At the time of visit if any extra stack found then extra charges will be included in invoice and if any parameters found to be added for testing then their charges are to be included at the time of reporting and invoice.
              </div>
            </div>
            {/* Footer */}
            <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Page 4</span>
                <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#1e293b', fontSize: '7.5pt' }}>"NURTURING THE NATURE FOR HUMAN RACE"</span>
                <span style={{ width: '30px' }}></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDateLong = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
};

export default AuditQuotationForm;
