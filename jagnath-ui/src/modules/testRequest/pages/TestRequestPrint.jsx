import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  CAUTION_ENDPOINTS
} from '../../../shared/services/apiEndpoints';

const TestRequestPrint = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selCompany, setSelCompany] = useState({});
  const [selClient, setSelClient] = useState({});
  const [selCategory, setSelCategory] = useState({});
  const [selCaution, setSelCaution] = useState(null);
  const [formData, setFormData] = useState({});

  const [parameters, setParameters] = useState([]);
  const [checkedParameters, setCheckedParameters] = useState({});

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      setError(true);
      setLoading(false);
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const trRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(id));
      if (!trRes?.data) {
        setError(true);
        setLoading(false);
        return;
      }

      const tr = trRes.data;
      setFormData(tr);

      // Primary objects from populated TR associations
      if (tr.company) setSelCompany(tr.company);
      if (tr.client) setSelClient(tr.client);
      if (tr.caution) setSelCaution(tr.caution);

      // Fetch secondary lists gracefully using Promise.allSettled
      const [compRes, clientRes, catRes] = await Promise.allSettled([
        apiService.get(COMPANY_ENDPOINTS.GET_MY),
        apiService.get(CLIENT_ENDPOINTS.GET_ALL),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL)
      ]);

      const compData = compRes.status === 'fulfilled' ? compRes.value?.data : null;
      const clientData = clientRes.status === 'fulfilled' ? clientRes.value?.data : null;
      const catData = catRes.status === 'fulfilled' ? catRes.value?.data : null;

      const cList = Array.isArray(compData) ? compData : (compData ? [compData] : []);
      const clList = Array.isArray(clientData) ? clientData : (clientData?.rows ? clientData.rows : (clientData ? [clientData] : []));
      const catList = Array.isArray(catData) ? catData : (catData?.rows ? catData.rows : (catData ? [catData] : []));

      const matchingComp = cList.find(c => c.id === tr.companyId || (c.companyName || c.company_name) === tr.companyName) || tr.company || {};
      const matchingClient = clList.find(c => c.id === tr.clientId || c.clientName === tr.clientName) || tr.client || {};
      const matchingCat = catList.find(c => c.id === tr.categoryId || c.id === tr.sampleParticular || c.name === tr.sampleParticularName) || {};

      setSelCompany(matchingComp);
      setSelClient(matchingClient);
      if (matchingCat.id) setSelCategory(matchingCat);

      if (!tr.caution && tr.cautionId) {
        try {
          const cautionRes = await apiService.get(CAUTION_ENDPOINTS.GET_BY_ID(tr.cautionId));
          if (cautionRes?.data) setSelCaution(cautionRes.data);
        } catch (e) {
          console.error("Error fetching caution for TR print:", e);
        }
      }

      let allCategoryParams = [];
      const activeCatId = tr.categoryId || (tr.sampleParticular && tr.sampleParticular.length === 36 ? tr.sampleParticular : null);
      if (activeCatId) {
        try {
          const paramRes = await apiService.get(CATEGORY_PARAMETER_ENDPOINTS.GET_BY_CATEGORY(activeCatId));
          if (paramRes?.data) {
            allCategoryParams = Array.isArray(paramRes.data) ? paramRes.data : [paramRes.data];
          }
        } catch (e) {
          console.error("Error fetching category parameters:", e);
        }
      }

      try {
        const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
        if (trpRes?.data) {
          const trps = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data?.rows || [trpRes.data]);
          const matchingTrps = trps.filter(t => t.testRequestId === id);
          const checks = {};
          matchingTrps.forEach(t => {
            if (t.parameterId) checks[t.parameterId] = true;
          });
          setCheckedParameters(checks);

          const selectedParamsOnly = allCategoryParams.filter(p => checks[p.id]);
          setParameters(selectedParamsOnly.length > 0 ? selectedParamsOnly : allCategoryParams);
        } else {
          setParameters(allCategoryParams);
        }
      } catch (e) {
        setParameters(allCategoryParams);
      }

      setTimeout(() => {
        window.print();
      }, 500);

    } catch (err) {
      console.error("Error in TestRequestPrint fetchData:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Print Preview...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error loading data.</div>;
  }

  return (
    <div className="print-container">
      {/* ======================= PAGE 1 ======================= */}
      <div className="print-page">

        {/* Header Table */}
        <table className="print-header-table">
          <tbody>
            <tr>
              <td className="header-logo-cell" style={{ textAlign: 'center', padding: '4px' }}>
                <img src="/Images/Navbar_Logo.png" alt="Logo" style={{ height: '65px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              </td>
              <td className="header-title-cell">
                <h2>FORMATS</h2>
              </td>
              <td className="header-info-cell">
                <table className="header-inner-table">
                  <tbody>
                    <tr><td>Amendment No.</td><td>00</td></tr>
                    <tr><td>Amendment Date</td><td>--</td></tr>
                    <tr><td>Issue No.</td><td>01</td></tr>
                    <tr><td>Issue Date</td><td>01/09/2018</td></tr>
                    <tr><td style={{ borderBottom: 'none' }}>Format No.</td><td style={{ borderBottom: 'none' }}>7.1 F-01</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="form-title-bar">
          <h3>TEST REQUEST FORM FOR {(formData.formTitle || 'WATER & WASTE WATER').replace(/^TEST REQUEST FORM FOR /i, '')}</h3>
        </div>

        {/* Main Form Table */}
        <table className="print-main-table">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '2%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '2%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '2%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="label-col">Name of Company/<br />Customer</td><td className="colon-col">:</td>
              <td colSpan={7} className="val-col">{selCompany.companyName || selCompany.company_name || ''} {selClient.clientName ? `- ${selClient.clientName}` : ''}</td>
            </tr>
            <tr>
              <td className="label-col">Address for<br />Communication</td><td className="colon-col">:</td>
              <td colSpan={7} className="val-col" style={{ minHeight: '40px' }}>{formData.address}</td>
            </tr>
            <tr>
              <td className="label-col">Email ID</td><td className="colon-col">:</td>
              <td colSpan={4} className="val-col">{formData.email}</td>
              <td className="label-col">Location of Sample</td><td className="colon-col">:</td>
              <td className="val-col">{formData.locationOfSample}</td>
            </tr>
            <tr>
              <td className="label-col">Contact Person</td><td className="colon-col">:</td>
              <td colSpan={4} className="val-col">{formData.contactPerson}</td>
              <td className="label-col">Contact No.</td><td className="colon-col">:</td>
              <td className="val-col">{formData.contactNumber}</td>
            </tr>
            <tr>
              <td className="label-col">Date of Collection of<br />Sample</td><td className="colon-col">:</td>
              <td colSpan={4} className="val-col">{formData.dateOfCollection}</td>
              <td className="label-col">Date of Receipt of<br />Sample</td><td className="colon-col">:</td>
              <td className="val-col">{formData.dateOfReceipt}</td>
            </tr>
            <tr>
              <td className="label-col">Sample Collected By</td><td className="colon-col">:</td>
              <td colSpan={4} className="val-col">{formData.sampleCollectedBy}</td>
              <td className="label-col">Sample Quantity</td><td className="colon-col">:</td>
              <td className="val-col">{formData.sampleQuantity}</td>
            </tr>
            <tr>
              <td className="label-col">Field Data Sheet</td><td className="colon-col">:</td>
              <td className="val-col">{formData.fieldDataSheet}</td>
              <td className="label-col">Form Type</td><td className="colon-col">:</td>
              <td className="val-col">{formData.formType || 'Regular'}</td>
              <td className="label-col">Packing details</td><td className="colon-col">:</td>
              <td className="val-col">{formData.packingDetails}</td>
            </tr>
            <tr>
              <td className="label-col">Sample ID No.</td><td className="colon-col">:</td>
              <td colSpan={4} className="val-col">{formData.sampleIdNumber}</td>
              <td className="label-col">Report No.</td><td className="colon-col">:</td>
              <td className="val-col">{formData.reportNumber}</td>
            </tr>

            <tr>
              <td className="label-col">Sample Particular</td><td className="colon-col">:</td>
              <td colSpan={7} className="val-col" style={{ whiteSpace: 'pre-wrap' }}>{formData.sampleParticular || selCategory.name || ''}</td>
            </tr>

            <tr>
              <td className="label-col">Availability of<br />Equipments</td><td className="colon-col">:</td>
              <td className="val-col">{formData.equipmentAvailability}</td>
              <td className="label-col">Availability of<br />reference standards</td><td className="colon-col">:</td>
              <td className="val-col">{formData.referenceStandardAvailability}</td>
              <td className="label-col">Adequacy of sample<br />quantity</td><td className="colon-col">:</td>
              <td className="val-col">{formData.sampleAdequacy || 'Adequate/Not Adequate'}</td>
            </tr>

            <tr>
              <td className="label-col">Availability of<br />Test method</td><td className="colon-col">:</td>
              <td className="val-col">{formData.testMethodAvailability}</td>
              <td className="label-col">Availability of<br />Trained person</td><td className="colon-col">:</td>
              <td className="val-col">{formData.trainedPersonAvailability}</td>
              <td className="label-col">Tentative Days of<br />Issuing the Report</td><td className="colon-col">:</td>
              <td className="val-col">{formData.reportIssueDays || '15-20 Days'}</td>
            </tr>

            <tr>
              <td className="label-col" style={{ verticalAlign: 'top' }}>Sample testing facility<br />reviewed by</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td colSpan={7} className="val-col" style={{ verticalAlign: 'top' }}>{formData.reviewedBy || 'Quality Manager /Technical Manager'}</td>
            </tr>

            <tr>
              <td className="label-col" style={{ verticalAlign: 'top', height: '40px' }}>Signature of Customer<br />Representative</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td colSpan={4} className="val-col"></td>
              <td className="label-col" style={{ verticalAlign: 'top' }}>Signature of Sample<br />Received By</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td className="val-col"></td>
            </tr>

            <tr>
              <td className="label-col" style={{ verticalAlign: 'top', height: '40px' }}>Name & Designation of<br />Customer</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td colSpan={4} className="val-col">{formData.customerRepresentativeName}</td>
              <td className="label-col" style={{ verticalAlign: 'top' }}>Name & Designation of<br />Sample Received</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td className="val-col">{formData.sampleReceiverName}</td>
            </tr>

            <tr>
              <td className="label-col" style={{ verticalAlign: 'top' }}>Test Protocol / method<br />to be adopted</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td colSpan={7} className="val-col" style={{ whiteSpace: 'pre-wrap' }}>
                {formData.testProtocol || 'Ground Water/Surface Water/Drinking Water: APHA 23rd Edition 2017\nWaste Water: APHA 23rd Edition 2017'}
              </td>
            </tr>

            <tr>
              <td className="label-col" style={{ verticalAlign: 'top' }}>Remarks</td><td className="colon-col" style={{ verticalAlign: 'top' }}>:</td>
              <td colSpan={7} className="val-col" style={{ lineHeight: '1.4', padding: '0.5rem' }}>
                <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Please mention specific tests to be applied</li>
                  <li>All the test procedures are followed as per National & International Standards.</li>
                  <li>In case of sampling conducted by JLT, sampling plan is followed as per National & International Standards.</li>
                  <li>If due to any unavoidable or unforeseen condition, the testing will be sub contracted only to competent agencies that comply with ISO/IEC 17025:2017(NABL) requirements</li>
                </ol>
                {formData.remarks && <div style={{ marginTop: '0.5rem' }}><strong>Additional:</strong> {formData.remarks}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Page 1 */}
        <table className="print-footer-table" style={{ marginTop: 'auto' }}>
          <tbody>
            <tr>
              <td style={{ width: '33.33%', borderRight: '1px solid #000' }}>Doc No: JLT/ 7.1 F-01</td>
              <td style={{ width: '33.33%', borderRight: '1px solid #000', borderTop: '1px solid #fff' }}></td>
              <td style={{ width: '33.33%', textAlign: 'right' }}>Page 1 of 2</td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000' }}>Format No. 7.1 F-01</td>
              <td colSpan={2}>Format: Test Request Form (Water & Waste Water)</td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000' }}>Prepared By: TM</td>
              <td style={{ borderRight: '1px solid #000' }}>Approved By: QM</td>
              <td>Issue By/Reviewed By: TM</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ======================= PAGE 2 ======================= */}
      <div className="print-page">

        {/* Header Table (Repeated) */}
        <table className="print-header-table">
          <tbody>
            <tr>
              <td className="header-logo-cell" style={{ textAlign: 'center', padding: '4px' }}>
                <img src="/Images/Navbar_Logo.png" alt="Logo" style={{ height: '65px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              </td>
              <td className="header-title-cell">
                <h2>FORMATS</h2>
              </td>
              <td className="header-info-cell">
                <table className="header-inner-table">
                  <tbody>
                    <tr><td>Amendment No.</td><td>00</td></tr>
                    <tr><td>Amendment Date</td><td>--</td></tr>
                    <tr><td>Issue No.</td><td>01</td></tr>
                    <tr><td>Issue Date</td><td>01/09/2018</td></tr>
                    <tr><td style={{ borderBottom: 'none' }}>Format No.</td><td style={{ borderBottom: 'none' }}>7.1 F-01</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
          Test Parameter to Be Analyzed: - <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>{selCategory.name || 'Water & Waste Water'}</span>
        </div>

        <table className="print-param-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Sr. No.</th>
              <th style={{ width: '42%' }}>Test Parameters</th>
              <th style={{ width: '10%' }}>Tick √</th>
              <th style={{ width: '40%' }}>Test Method</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(20, parameters.length) }).map((_, i) => {
              const param = parameters[i];
              return (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{i + 1}.</td>
                  <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{param ? (param.parameterName || param.name) : ''}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{param ? '√' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{param ? (param.testMethod || param.defaultTestMethod || '') : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Caution / Notice Section (Printed if Include Caution = YES) */}
        {(formData.includeCaution || formData.include_caution) && selCaution && (
          <div style={{
            marginTop: '0.8rem',
            border: '1px solid #000',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            lineHeight: '1.3',
            background: '#fff'
          }}>
            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '0.25rem' }}>
              CAUTION / NOTICE: {selCaution.title}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', color: '#111' }}>
              {selCaution.description}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: '1rem', fontWeight: 'bold', fontSize: '0.9rem', paddingRight: '2rem' }}>
          Approved By<br />
          Technical Manager
        </div>

        {/* Footer Page 2 */}
        <table className="print-footer-table" style={{ marginTop: 'auto' }}>
          <tbody>
            <tr>
              <td style={{ width: '33.33%', borderRight: '1px solid #000' }}>Doc No: JLT/ 7.1 F-01</td>
              <td style={{ width: '33.33%', borderRight: '1px solid #000', borderTop: '1px solid #fff' }}></td>
              <td style={{ width: '33.33%', textAlign: 'right' }}>Page 2 of 2</td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000' }}>Format No. 7.1 F-01</td>
              <td colSpan={2}>Format: Test Request Form (Water & Waste Water)</td>
            </tr>
            <tr>
              <td style={{ borderRight: '1px solid #000' }}>Prepared By: TM</td>
              <td style={{ borderRight: '1px solid #000' }}>Approved By: QM</td>
              <td>Issue By/Reviewed By: TM</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print styles */}
      <style>{`
        body { margin: 0; padding: 0; background: #fff; }
        .print-container { 
          width: 100%; 
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: 'Times New Roman', Times, serif;
        }
        
        .print-page {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Header Styles */
        .print-header-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-bottom: 0.5rem;
        }
        .print-header-table td {
          border: 1px solid #000;
          vertical-align: middle;
        }
        .header-logo-cell {
          width: 40%;
          padding: 0.5rem;
        }
        .logo-placeholder {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .brand-name {
          font-size: 1.2rem;
          margin: 0;
          font-weight: bold;
          color: #444;
          line-height: 1.1;
        }
        .brand-sub {
          font-size: 0.8rem;
          margin: 0;
          color: #666;
          line-height: 1.1;
        }
        
        .header-title-cell {
          width: 30%;
          text-align: center;
        }
        .header-title-cell h2 {
          font-size: 1.5rem;
          margin: 0;
          letter-spacing: 2px;
        }

        .header-info-cell {
          width: 30%;
          padding: 0;
        }
        .header-inner-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }
        .header-inner-table td {
          padding: 0.15rem 0.3rem;
          border: none;
          border-bottom: 1px solid #000;
        }
        .header-inner-table tr:last-child td {
          border-bottom: none;
        }
        .header-inner-table td:first-child {
          border-right: 1px solid #000;
          width: 55%;
        }

        /* Title Bar */
        .form-title-bar {
          text-align: center;
          margin: 0.5rem 0;
        }
        .form-title-bar h3 {
          font-size: 1rem;
          margin: 0;
          text-decoration: underline;
        }

        /* Main Form Table */
        .print-main-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 0.75rem;
          table-layout: fixed;
        }
        .print-main-table td {
          border: 1px solid #000;
          padding: 0.15rem 0.3rem;
          vertical-align: middle;
        }
        
        .label-col {
          font-weight: bold;
        }
        .colon-col {
          width: 2%;
          text-align: center;
          font-weight: bold;
        }
        .val-col {
          word-break: break-word;
        }

        /* Parameter Table */
        .print-param-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 0.75rem;
        }
        .print-param-table th, .print-param-table td {
          border: 1px solid #000;
          padding: 0.1rem 0.2rem;
        }
        .print-param-table th {
          background-color: transparent !important;
        }
        .print-param-table td {
          height: 13.5px;
        }

        /* Footer Table */
        .print-footer-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          font-size: 0.75rem;
        }
        .print-footer-table td {
          padding: 0.2rem 0.4rem;
          border-bottom: 1px solid #000;
          border-top: 1px solid #000;
        }
        .print-footer-table tr:last-child td {
          border-bottom: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body { 
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important; 
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container { 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important; 
            padding: 0 !important; 
          }
          .print-page { 
            width: 100% !important; 
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important; 
            margin: 0 !important; 
            box-sizing: border-box !important;
            page-break-after: always;
            overflow: visible !important;
            display: block !important;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default TestRequestPrint;
