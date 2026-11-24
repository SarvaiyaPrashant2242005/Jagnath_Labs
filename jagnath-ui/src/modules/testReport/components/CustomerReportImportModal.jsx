import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaTimes, 
  FaSearch, 
  FaUserTie, 
  FaFileAlt, 
  FaArrowLeft, 
  FaPlus, 
  FaCheck, 
  FaSpinner, 
  FaCalendarAlt, 
  FaVial, 
  FaBuilding, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaClipboardCheck
} from 'react-icons/fa';
import apiService from '../../../shared/services/apiService';
import { CLIENT_ENDPOINTS, TEST_REPORT_ENDPOINTS } from '../../../shared/services/apiEndpoints';
import InlineMasterModal from '../../../shared/components/InlineMasterModal/InlineMasterModal';

/**
 * CustomerReportImportModal
 * Allows searching and selecting a customer, viewing all previous test reports of that customer,
 * and importing the report's details and parameters into the active Test Report form.
 */
const CustomerReportImportModal = ({
  isOpen,
  onClose,
  onSelectReport, // callback receiving (fullReportData, client)
  onSelectCustomerOnly, // callback receiving (client) to start fresh report with customer
  currentCompanyId
}) => {
  // Navigation step: 1 = Client Selection, 2 = Customer Report History
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [reports, setReports] = useState([]);

  // Search & Filter state
  const [clientSearch, setClientSearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');

  // Loading & Error states
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Add Client Modal state
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // Fetch Clients when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedClient(null);
      setReports([]);
      setClientSearch('');
      setReportSearch('');
      setErrorMsg('');
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setLoadingClients(true);
    setErrorMsg('');
    try {
      const activeCompId = currentCompanyId || localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId 
        ? `${CLIENT_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&limit=1000` 
        : `${CLIENT_ENDPOINTS.GET_ALL}?limit=1000`;
      const res = await apiService.get(url);
      if (res?.data) {
        const clientList = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setClients(clientList);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      setErrorMsg('Failed to load customer list. Please try again.');
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch reports when a customer is chosen
  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setStep(2);
    setLoadingReports(true);
    setErrorMsg('');
    try {
      const activeCompId = currentCompanyId || localStorage.getItem('selectedCompanyId') || '';
      // Query reports for this company & client
      let url = `${TEST_REPORT_ENDPOINTS.GET_ALL}?clientId=${client.id}&limit=100`;
      if (activeCompId) {
        url += `&companyId=${activeCompId}`;
      }
      const res = await apiService.get(url);
      let reportList = [];
      if (res?.data) {
        reportList = Array.isArray(res.data) ? res.data : (res.data.rows || []);
      }

      // If no reports found with strict clientId query, or as fallback, check by customer name matching
      if (reportList.length === 0 && client.clientName) {
        const fallbackUrl = `${TEST_REPORT_ENDPOINTS.GET_ALL}?search=${encodeURIComponent(client.clientName)}&limit=100${activeCompId ? `&companyId=${activeCompId}` : ''}`;
        try {
          const fallbackRes = await apiService.get(fallbackUrl);
          if (fallbackRes?.data) {
            reportList = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data.rows || []);
          }
        } catch (e) {
          console.warn('Fallback search failed', e);
        }
      }

      setReports(reportList);
    } catch (err) {
      console.error('Failed to load customer reports:', err);
      setErrorMsg('Failed to fetch previous reports for this customer.');
    } finally {
      setLoadingReports(false);
    }
  };

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => {
      const name = (c.clientName || '').toLowerCase();
      const compName = (c.companyName || c.name || '').toLowerCase();
      const mobile = (c.contactNumber || c.mobile || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const code = (c.clientCode || c.id || '').toLowerCase();
      return name.includes(q) || compName.includes(q) || mobile.includes(q) || email.includes(q) || city.includes(q) || code.includes(q);
    });
  }, [clients, clientSearch]);

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    if (!reportSearch.trim()) return reports;
    const q = reportSearch.toLowerCase();
    return reports.filter(r => {
      const repNo = (r.reportNumber || r.referenceNo || '').toLowerCase();
      const sample = (r.detailsOfSample || r.sampleParticular || '').toLowerCase();
      const title = (r.nameOfWork || r.sectionHeader || '').toLowerCase();
      const loc = (r.samplingLocation || '').toLowerCase();
      const repDate = (r.reportDate || '').toLowerCase();
      return repNo.includes(q) || sample.includes(q) || title.includes(q) || loc.includes(q) || repDate.includes(q);
    });
  }, [reports, reportSearch]);

  // Handle successful creation of new client
  const handleClientCreated = (newClient) => {
    setIsAddClientOpen(false);
    if (newClient) {
      setClients(prev => [newClient, ...prev]);
      // If parent supplied onSelectCustomerOnly, invoke it directly so the user can immediately start report creation
      if (onSelectCustomerOnly) {
        onSelectCustomerOnly(newClient);
      } else {
        handleSelectClient(newClient);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Back to Customers"
              >
                <FaArrowLeft size={14} />
              </button>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {step === 1 ? 'Select Customer for Report Import' : `Previous Reports for ${selectedClient?.clientName || 'Customer'}`}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {step === 1 
                  ? 'Choose a customer to browse and import previously generated test reports.'
                  : 'Select an existing report to auto-fill sample, customer, and parameter details.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', flex: 1, overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: CUSTOMER SELECTION */}
          {step === 1 && (
            <div>
              {/* Search Bar & Add Button */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FaSearch
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      fontSize: '0.9rem'
                    }}
                  />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search customer by name, company, mobile, city, or email..."
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem 0.7rem 2.4rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1.15rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'
                  }}
                >
                  <FaPlus size={12} />
                  <span>Add New Customer</span>
                </button>
              </div>

              {/* Customers List */}
              {loadingClients ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <FaSpinner className="fa-spin" style={{ fontSize: '1.75rem', color: '#047857', marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading customers...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                  }}
                >
                  <FaUserTie style={{ fontSize: '2.25rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontSize: '1rem' }}>No Customers Found</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    {clientSearch ? 'Try a different search term or add a new customer.' : 'No customers exist yet. Click "Add New Customer" above to create one.'}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '0.85rem',
                    maxHeight: '52vh',
                    overflowY: 'auto',
                    paddingRight: '0.25rem'
                  }}
                >
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#10b981';
                        e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(16, 185, 129, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              background: '#ecfdf5',
                              color: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 700
                            }}
                          >
                            {(c.clientName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.2 }}>
                            {c.clientName}
                          </div>
                        </div>

                        {c.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                            <FaMapMarkerAlt style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                            <span>{c.city}</span>
                          </div>
                        )}

                        {c.contactNumber && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            <FaPhoneAlt style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                            <span>{c.contactNumber}</span>
                          </div>
                        )}

                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            <FaEnvelope style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: '0.85rem',
                          paddingTop: '0.6rem',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          fontSize: '0.775rem'
                        }}
                      >
                        <span style={{ color: '#047857', fontWeight: 600 }}>View Past Reports →</span>
                        {onSelectCustomerOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCustomerOnly(c);
                            }}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid #047857',
                              background: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 600,
                              fontSize: '0.725rem',
                              cursor: 'pointer'
                            }}
                            title="Directly use this customer"
                          >
                            Select Directly
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CUSTOMER'S PREVIOUS REPORTS */}
          {step === 2 && (
            <div>
              {/* Selected Customer Summary Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaUserTie style={{ color: '#047857', fontSize: '1rem' }} />
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#065f46' }}>
                      {selectedClient?.clientName}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#047857', marginTop: '0.25rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    {selectedClient?.city && <span><strong>City:</strong> {selectedClient.city}</span>}
                    {selectedClient?.contactNumber && <span><strong>Phone:</strong> {selectedClient.contactNumber}</span>}
                    {selectedClient?.email && <span><strong>Email:</strong> {selectedClient.email}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #a7f3d0',
                    background: '#ffffff',
                    color: '#047857',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Change Customer
                </button>
                {onSelectCustomerOnly && (
                  <button
                    type="button"
                    onClick={() => onSelectCustomerOnly(selectedClient)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#047857',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(4, 120, 87, 0.2)'
                    }}
                  >
                    Use This Customer for New Report
                  </button>
                )}
              </div>

              {/* Report Search Bar */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <FaSearch
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.9rem'
                  }}
                />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Filter reports by Report No, sample name, title, or location..."
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Reports List */}
              {loadingReports ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <FaSpinner className="fa-spin" style={{ fontSize: '1.75rem', color: '#047857', marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading customer test reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                  }}
                >
                  <FaFileAlt style={{ fontSize: '2.25rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontSize: '1rem' }}>No Previous Reports Found</h4>
                  <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                    {reportSearch ? 'No reports match your search query.' : 'This customer has no previous test reports registered in the system.'}
                  </p>
                  {onSelectCustomerOnly && (
                    <button
                      type="button"
                      onClick={() => onSelectCustomerOnly(selectedClient)}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#047857',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)'
                      }}
                    >
                      Start New Report with {selectedClient?.clientName}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    maxHeight: '48vh',
                    overflowY: 'auto',
                    paddingRight: '0.25rem'
                  }}
                >
                  {filteredReports.map((r) => {
                    const paramCount = Array.isArray(r.parametersList) ? r.parametersList.length : 0;
                    return (
                      <div
                        key={r.id}
                        onClick={() => onSelectReport(r, selectedClient)}
                        style={{
                          padding: '1.15rem 1.25rem',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#047857';
                          e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(4, 120, 87, 0.12)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: '#047857',
                                background: '#ecfdf5',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0'
                              }}
                            >
                              {r.reportNumber || 'Report No. N/A'}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>
                              {r.nameOfWork || 'Test Report'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.825rem', color: '#64748b', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <FaVial style={{ color: '#059669', fontSize: '0.75rem' }} />
                              <strong>Sample:</strong> {r.detailsOfSample || 'Standard Sample'}
                            </span>

                            {r.samplingLocation && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FaMapMarkerAlt style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                                <strong>Location:</strong> {r.samplingLocation}
                              </span>
                            )}

                            {r.reportDate && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                                <strong>Report Date:</strong> {r.reportDate}
                              </span>
                            )}

                            {r.dateOfReceipt && (
                              <span>
                                <strong>Receipt:</strong> {r.dateOfReceipt}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#0369a1',
                              background: '#e0f2fe',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px'
                            }}
                          >
                            {paramCount} {paramCount === 1 ? 'Parameter' : 'Parameters'}
                          </span>

                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem 0.95rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#047857',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)'
                            }}
                          >
                            <FaClipboardCheck size={12} />
                            <span>Import This Report</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {step === 1 
              ? `${filteredClients.length} customer(s) available` 
              : `${filteredReports.length} report(s) found for ${selectedClient?.clientName}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Inline Master Modal for creating a new Client directly */}
      {isAddClientOpen && (
        <InlineMasterModal
          isOpen={isAddClientOpen}
          onClose={() => setIsAddClientOpen(false)}
          masterType="client"
          parentData={{ companyId: currentCompanyId || localStorage.getItem('selectedCompanyId') || '' }}
          onSuccess={handleClientCreated}
        />
      )}
    </div>
  );
};

export default CustomerReportImportModal;

