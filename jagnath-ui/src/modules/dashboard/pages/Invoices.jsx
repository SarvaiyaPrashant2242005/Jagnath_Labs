import React, { useState, useEffect, useMemo } from 'react';
import { FaFileInvoiceDollar, FaTimes, FaPrint, FaDownload, FaEye } from 'react-icons/fa';
import testRequestService from '../../../shared/services/testRequestService';
import companyService from '../../../shared/services/companyService';

const Invoices = () => {
  const [requests, setRequests] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected invoice for preview drawer
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trRes = await testRequestService.getTestRequests();
      const compRes = await companyService.getCompany();

      if (trRes.success && trRes.data) {
        setRequests(trRes.data);
      }
      if (compRes.success && compRes.data) {
        setCompanyInfo(compRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load invoice list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map requests to a formatted invoice objects list
  const invoices = useMemo(() => {
    return requests.map(r => {
      const shortId = r.id.substring(0, 8).toUpperCase();
      const invoiceNo = `INV-${shortId}`;
      const amount = 450; // Average base testing cost
      
      return {
        id: r.id,
        invoiceNo,
        trNo: `TR-${shortId}`,
        company: r.company,
        client: r.client,
        date: r.date || '2026-07-10',
        amount,
        status: r.status === 'Completed' || r.status === 'Inactive' ? 'Paid' : 'Unpaid',
        category: r.category
      };
    });
  }, [requests]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (inv) => {
    const text = `
========================================
           JAGANATH LABS LIMS
               INVOICE
========================================
Invoice No  : ${inv.invoiceNo}
TR Number   : ${inv.trNo}
Date        : ${inv.date}
Status      : ${inv.status}
----------------------------------------
Billed To   :
Company     : ${inv.company}
Client      : ${inv.client}
----------------------------------------
Description              Qty     Amount
Testing Services (Base)   1      ₹${inv.amount}.00
----------------------------------------
TOTAL DUE                        ₹${inv.amount}.00
========================================
    Thank you for choosing Jagnath Labs!
========================================
`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${inv.invoiceNo}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="invoices-container" style={{ padding: '0.25rem' }}>
      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Invoice list table block */}
      <div className="comp-card">
        <div className="comp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
            {isLoading ? 'Loading...' : `${invoices.length} invoices generated`}
          </span>
        </div>

        <div className="comp-table-wrapper">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>TR Number</th>
                <th>Company</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading invoice registry...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No invoices registered. Create test requests to generate invoices.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="comp-text-medium" style={{ fontWeight: 700 }}>{inv.invoiceNo}</td>
                    <td className="comp-text-light">{inv.trNo}</td>
                    <td className="comp-text-medium">{inv.company}</td>
                    <td className="comp-text-medium">{inv.client}</td>
                    <td className="comp-text-medium" style={{ fontWeight: 700 }}>₹{inv.amount}</td>
                    <td>
                      <span 
                        className={`comp-type-badge`} 
                        style={{ 
                          backgroundColor: inv.status === 'Paid' ? 'rgba(80, 200, 120, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: inv.status === 'Paid' ? 'var(--secondary-dark)' : '#EF4444'
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '1rem' }}
                          title="View Invoice Detail"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleDownload(inv)}
                          style={{ background: 'none', border: 'none', color: 'var(--secondary-dark)', cursor: 'pointer', fontSize: '1rem' }}
                          title="Download Invoice"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice details preview drawer */}
      {selectedInvoice && (
        <div className="tr-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="tr-modal-drawer" onClick={(e) => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="tr-drawer-header">
              <h2 className="tr-drawer-title">Invoice Receipt</h2>
              <button className="tr-drawer-close" onClick={() => setSelectedInvoice(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="tr-drawer-body" id="printable-invoice-content" style={{ padding: '1.5rem', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>JAGANATH LABS LIMS</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Premium Pathology & Medical Diagnostics</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '1rem', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.5rem' }}>
                <div>
                  <strong>Invoice No:</strong> {selectedInvoice.invoiceNo}<br />
                  <strong>TR Ref:</strong> {selectedInvoice.trNo}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Date:</strong> {selectedInvoice.date}<br />
                  <strong>Status:</strong> <span style={{ color: selectedInvoice.status === 'Paid' ? 'green' : 'red', fontWeight: 'bold' }}>{selectedInvoice.status}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '4px' }}>
                <strong>Billed To:</strong><br />
                {selectedInvoice.client}<br />
                {selectedInvoice.company}<br />
                {companyInfo?.address && <span>{companyInfo.address}</span>}
              </div>

              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Description</th>
                    <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Qty</th>
                    <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ paddingTop: '0.5rem' }}>Diagnostics & Analysis (Category: {selectedInvoice.category})</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}>1</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}>₹{selectedInvoice.amount}.00</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #E2E8F0', fontWeight: 'bold' }}>
                    <td style={{ paddingTop: '0.5rem' }}>Total Due</td>
                    <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}></td>
                    <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}>₹{selectedInvoice.amount}.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-light)', borderTop: '1px dashed #E2E8F0', paddingTop: '1rem', marginTop: '1rem' }}>
                This is a computer-generated invoice receipt.<br />
                Thank you for choosing Jagnath Labs!
              </div>
            </div>

            <div className="tr-drawer-footer" style={{ gap: '1rem' }}>
              <button className="tr-cancel-btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <FaPrint />
                <span>Print Invoice</span>
              </button>
              <button className="tr-submit-btn" onClick={() => handleDownload(selectedInvoice)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <FaDownload />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
