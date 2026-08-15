import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  CAUTION_ENDPOINTS,
  PRICE_MASTER_ENDPOINTS,
  BACKEND_ROOT_URL
} from '../../../shared/services/apiEndpoints';

const QuotationPrint = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selCompany, setSelCompany] = useState({});
  const [selClient, setSelClient] = useState({});
  const [selCategory, setSelCategory] = useState({});
  const [selCaution, setSelCaution] = useState(null);
  const [formData, setFormData] = useState({});

  const [parameters, setParameters] = useState([]);
  const [priceMap, setPriceMap] = useState({});

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

      if (tr.company) setSelCompany(tr.company);
      if (tr.client) setSelClient(tr.client);
      if (tr.caution) setSelCaution(tr.caution);

      const [compRes, clientRes, catRes, priceRes] = await Promise.allSettled([
        apiService.get(COMPANY_ENDPOINTS.GET_MY),
        apiService.get(CLIENT_ENDPOINTS.GET_ALL),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL),
        apiService.get(PRICE_MASTER_ENDPOINTS.GET_ALL)
      ]);

      const compData = compRes.status === 'fulfilled' ? compRes.value?.data : null;
      const clientData = clientRes.status === 'fulfilled' ? clientRes.value?.data : null;
      const catData = catRes.status === 'fulfilled' ? catRes.value?.data : null;
      const priceData = priceRes.status === 'fulfilled' ? priceRes.value?.data : null;

      const cList = Array.isArray(compData) ? compData : (compData ? [compData] : []);
      const clList = Array.isArray(clientData) ? clientData : (clientData?.rows ? clientData.rows : (clientData ? [clientData] : []));
      const catList = Array.isArray(catData) ? catData : (catData?.rows ? catData.rows : (catData ? [catData] : []));
      const pList = Array.isArray(priceData) ? priceData : (priceData?.rows ? priceData.rows : (priceData ? [priceData] : []));

      const matchingComp = cList.find(c => c.id === tr.companyId || (c.companyName || c.company_name) === tr.companyName) || tr.company || {};
      const matchingClient = clList.find(c => c.id === tr.clientId || c.clientName === tr.clientName) || tr.client || {};
      const matchingCat = catList.find(c => c.id === tr.sampleParticular || c.name === tr.sampleParticularName) || {};

      setSelCompany(matchingComp);
      setSelClient(matchingClient);
      if (matchingCat.id) setSelCategory(matchingCat);

      const pMap = {};
      pList.forEach(pm => {
        if (pm.parameterId) {
          const parsed = parseFloat(pm.price || 0);
          pMap[pm.parameterId] = isNaN(parsed) ? 0 : parsed;
        }
      });
      setPriceMap(pMap);

      if (!tr.caution && tr.cautionId) {
        try {
          const cautionRes = await apiService.get(CAUTION_ENDPOINTS.GET_BY_ID(tr.cautionId));
          if (cautionRes?.data) setSelCaution(cautionRes.data);
        } catch (e) {
          console.error("Error fetching caution for quotation:", e);
        }
      }

      let allCategoryParams = [];
      if (tr.sampleParticular) {
        try {
          const paramRes = await apiService.get(CATEGORY_PARAMETER_ENDPOINTS.GET_BY_CATEGORY(tr.sampleParticular));
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
          const matchingTrps = trps.filter(t => t.testRequestId === id || t.test_request_id === id);

          const selectedList = [];
          matchingTrps.forEach(trp => {
            const pId = trp.parameterId || trp.parameter_id || trp.id;
            const catParam = allCategoryParams.find(p => p.id === pId || p.parameterId === pId || p.parameter_id === pId);
            const parsedPrice = trp.price !== undefined && trp.price !== null ? parseFloat(trp.price) : parseFloat(catParam?.price || 0);
            const pPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
            selectedList.push({
              ...(catParam || {}),
              id: pId,
              parameterName: trp.parameterName || trp.parameter?.parameterName || catParam?.parameterName || catParam?.name || 'Parameter',
              testMethod: trp.testMethod || trp.test_method || catParam?.testMethod || catParam?.defaultTestMethod || '',
              price: pPrice
            });
          });

          setParameters(selectedList.length > 0 ? selectedList : allCategoryParams);
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
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = () => {
    if (!selCompany) return '/Images/Navbar_Logo.png';
    const logoPath = selCompany.quotation_logo || selCompany.quotationLogo || selCompany.logo;
    if (!logoPath) return '/Images/Navbar_Logo.png';
    const cleanPath = logoPath.replace(/\\/g, '/');
    const idx = cleanPath.lastIndexOf('uploads/');
    if (idx !== -1) {
      return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
    }
    return logoPath;
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading Quotation Preview...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>Failed to load quotation data.</div>;
  }

  // Calculations
  const rawSubtotal = parameters.reduce((sum, item) => {
    const val = parseFloat(item.price);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const subtotal = isNaN(rawSubtotal) ? 0 : rawSubtotal;
  const gstAmount = subtotal * 0.18;
  const grandTotal = Math.round(subtotal + gstAmount);

  const formatDateLong = (dateStr) => {
    if (!dateStr) return 'June 20, 2025';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const quoRefNo = `JLT/EM/${formData.reportNumber || formData.sampleIdNumber || '06-25/449'}`;
  const clientDisplayName = selClient.clientName || selCompany.companyName || selCompany.company_name || 'JINDAL SAW LTD.';
  const clientLocation = formData.address || selClient.address || 'MUNDRA Kutchh.';
  const sampleParticularName = selCategory.name || 'DISTILLED WATER';
  const paramNamesList = parameters.map(p => p.parameterName || p.name).join(', ') || 'pH, Electric Conductivity, Total Dissolved Solids, Chloride, Sodium';

  return (
    <div className="paper-quotation-container" style={{
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '10mm 15mm 15mm 15mm',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      fontFamily: '"Times New Roman", Times, serif, Arial',
      fontSize: '10.5pt',
      color: '#000000',
      lineHeight: '1.35',
      position: 'relative'
    }}>
      <style>{`
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .paper-quotation-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <img src={getLogoUrl()} alt="Company Logo" style={{ height: '110px', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '15px' }}></div>

      {/* Date & Ref No (Right Aligned) */}
      <div style={{ textAlign: 'right', fontSize: '9.5pt', marginBottom: '12px' }}>
        <div>{formatDateLong(formData.created_at || formData.createdAt)}</div>
        <div style={{ textDecoration: 'underline', fontWeight: 'bold', marginTop: '3px' }}>{quoRefNo}</div>
      </div>

      {/* To Address */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold' }}>To</div>
        <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>M/s. {clientDisplayName.toUpperCase()},</div>
        <div>{clientLocation}</div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>
        SUBJECT: - <span style={{ textDecoration: 'underline' }}>QUOTATION FOR {sampleParticularName.toUpperCase()} SAMPLE ANALYSIS.</span>
      </div>

      {/* Salutation & Intro Paragraphs */}
      <div style={{ marginBottom: '12px', textAlign: 'justify' }}>
        Dear Sir/Mam,
      </div>

      <div style={{ marginBottom: '10px', textIndent: '20px', textAlign: 'justify' }}>
        JLTs - A state of art laboratory facility and an independent company offering high quality technical services in the environment, chemical and biological sciences. Services are provided in the disciplines of environmental/agriculture/food consulting, Water and Waste water treatment, field sampling and monitoring with various analysis and R&D work.
      </div>

      <div style={{ marginBottom: '15px', textIndent: '20px', textAlign: 'justify' }}>
        Also It is our proud privilege to inform you that— <strong>We are NABL accredited as per ISO/IEC 17025:2017 laboratory and also recognized by Gujarat Pollution Control Board, Government of Gujarat - Gandhinagar, along with the recognition as Schedule - II Environmental Auditors wide letter no. GPCB/EA-330/493289 under the Honorable High Court; Gujarat orders.</strong>
      </div>

      {/* SCOPE OF WORK */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>SCOPE OF WORK:</div>
        <div style={{ fontWeight: 'bold', paddingLeft: '15px', marginBottom: '3px' }}>
          (1) Method of analysis must be approved / recognized by ISO 17025:2017, GPCB / CPCB / MoEF&CC.
        </div>
        <div style={{ paddingLeft: '30px', fontSize: '10pt', lineHeight: '1.4' }}>
          <div>✓ Analysis of sample and preservation of sample be made as per <strong>ISO 17025:2017</strong>, GPCB/CPCB or IS/APHA guidelines.</div>
          <div>✓ Analysis of collected water samples as per the guidelines of <strong>ISO 17025:2017</strong>, GPCB / CPCB or / IS/APHA</div>
          <div>✓ Timely submission of water Analysis Report(s) to the authorized person of the industry.</div>
        </div>
      </div>

      {/* Detail of Charges Table Title */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '8px', fontSize: '11pt' }}>
        Detail of Charges for carrying out {sampleParticularName} Analysis
      </div>

      {/* Charges Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', border: '1.5px solid #000000', fontSize: '9.5pt' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000000' }}>
            <th style={{ borderRight: '1px solid #000000', padding: '5px', width: '8%', textAlign: 'center' }}>SR. NO.</th>
            <th style={{ borderRight: '1px solid #000000', padding: '5px', width: '52%', textAlign: 'center' }}>DESCRIPTION OF WORK</th>
            <th style={{ borderRight: '1px solid #000000', padding: '5px', width: '8%', textAlign: 'center' }}>QTY.</th>
            <th style={{ borderRight: '1px solid #000000', padding: '5px', width: '8%', textAlign: 'center' }}>UNIT</th>
            <th style={{ borderRight: '1px solid #000000', padding: '5px', width: '12%', textAlign: 'center' }}>RATE/QTY</th>
            <th style={{ padding: '5px', width: '12%', textAlign: 'center' }}>AMOUNT RS.</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #000000', verticalAlign: 'top' }}>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>1</td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px' }}>
              <div>Charges for {sampleParticularName} analysis of {clientDisplayName}.</div>
              <div style={{ fontSize: '9pt', color: '#222', marginTop: '3px' }}>
                ({paramNamesList})
              </div>
            </td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center' }}>1</td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center' }}>No.</td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{subtotal}/-</td>
            <td style={{ padding: '6px', textAlign: 'center' }}>{subtotal}/-</td>
          </tr>

          <tr style={{ borderBottom: '1px solid #000000' }}>
            <td style={{ borderRight: '1px solid #000000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>2</td>
            <td style={{ borderRight: '1px solid #000000', padding: '6px' }}>Rates Total With Tax Details</td>
            <td colSpan="4" style={{ padding: '6px', textAlign: 'center' }}>
              <div>As actual as per GPCB rates</div>
              <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>({subtotal}/- + GST 18 %)</div>
            </td>
          </tr>

          <tr style={{ fontWeight: 'bold', borderTop: '1.5px solid #000000' }}>
            <td colSpan="5" style={{ padding: '6px', textAlign: 'right', borderRight: '1px solid #000000' }}>Total</td>
            <td style={{ padding: '6px', textAlign: 'center' }}>{grandTotal}/-</td>
          </tr>
        </tbody>
      </table>

      {/* Terms and Conditions */}
      <div style={{ marginBottom: '12px', fontSize: '8.5pt', lineHeight: '1.35' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Terms and conditions:</div>
        <ol style={{ margin: 0, paddingLeft: '18px' }}>
          <li>Purchase/Work Order is must before starting the work.</li>
          <li>For future requirement of any urgent report for said work the payment condition is advance with the work order.</li>
          <li>Charges for sampling & analysis of various samples including water, wastewater, air, stack, hazardous waste, solid waste & noise level etc. will be paid extra as actual as per GPCB guidelines if there is any requirement/addition in parameters by you.</li>
          <li>The payments should be made by RTGS/NEFT drawn in favor of "JAGNATH LAB TECHNOLOGIES" payable at GONDAL.</li>
        </ol>
      </div>

      {/* Quotation Section (Printed if Include Quotation = YES) */}
      {(formData.includeCaution || formData.include_caution) && selCaution && (
        <div style={{
          border: '1px solid #000000',
          padding: '6px 10px',
          marginBottom: '12px',
          fontSize: '8.5pt',
          background: '#fff'
        }}>
          <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '3px' }}>
            QUOTATION: {selCaution.title}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>
            {selCaution.description}
          </div>
        </div>
      )}

      {/* Signatory & Closing */}
      <div style={{ marginBottom: '20px', fontSize: '9.5pt' }}>
        <div>Thanking you in anticipation!</div>
        <div style={{ fontWeight: 'bold', marginTop: '2px' }}>For, Jagnath Lab Technologies</div>
        
        {/* Stamp / Signature placeholder space */}
        <div style={{ height: '40px', margin: '4px 0' }}></div>

        <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
        <div style={{ fontWeight: 'bold' }}>Contact Person: - Mr Purvin Raiyani (+91 8140555515)</div>
      </div>

      {/* Footer Banner */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', textAlign: 'center' }}>
        <div style={{ color: '#15803d', fontWeight: 'bold', fontSize: '10pt', letterSpacing: '0.5px', marginBottom: '4px' }}>
          “NURTURING THE NATURE FOR HUMAN RACE”
        </div>
        <div style={{ borderBottom: '2px solid #15803d', marginBottom: '6px' }}></div>
        <div style={{ fontSize: '7.5pt', color: '#1e3a8a', lineHeight: '1.3' }}>
          5-6/B, Nayanjyot chamber, First Floor, Opp. Vachhera Vada, Gondal – 360 311, Dist. – Rajkot (Guj.) +91 8140-555515 Email:<br />
          <span style={{ color: '#2563eb' }}>jagnathtechnologies@yahoo.com</span> // <span style={{ color: '#2563eb', textDecoration: 'underline' }}>www.jagnath.com</span> // <span style={{ color: '#2563eb' }}>purvin@jagnath.com</span>
        </div>
      </div>

    </div>
  );
};

export default QuotationPrint;
