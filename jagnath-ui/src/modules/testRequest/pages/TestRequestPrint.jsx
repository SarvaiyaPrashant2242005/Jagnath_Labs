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
  CAUTION_ENDPOINTS,
  BACKEND_ROOT_URL
} from '../../../shared/services/apiEndpoints';
import TestRequestDocument from '../components/TestRequestDocument';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';

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
          const matchingTrps = trps.filter(t => t.testRequestId === id || t.test_request_id === id);

          const checks = {};
          const selectedList = [];

          matchingTrps.forEach(t => {
            const pId = t.parameterId || t.parameter_id || t.id;
            if (pId) checks[pId] = true;

            const catParam = allCategoryParams.find(p => p.id === pId || p.parameterId === pId || p.parameter_id === pId);
            selectedList.push({
              id: pId,
              parameterName: t.parameterName || t.parameter?.parameterName || (catParam ? (catParam.parameterName || catParam.name) : 'Parameter'),
              testMethod: t.testMethod || t.test_method || (catParam ? (catParam.testMethod || catParam.defaultTestMethod) : ''),
              locationOfSample: t.locationOfSample || t.location_of_sample || ''
            });
          });

          setCheckedParameters(checks);
          setParameters(selectedList);
        } else {
          setParameters([]);
        }
      } catch (e) {
        console.error("Error fetching test request parameters for print:", e);
        setParameters([]);
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

  const getLogoUrl = () => {
    if (!selCompany) return '/Images/Navbar_Logo.png';
    const logoPath = selCompany.test_request_logo || selCompany.testRequestLogo || selCompany.logo;
    if (!logoPath) return '/Images/Navbar_Logo.png';
    const cleanPath = logoPath.replace(/\\/g, '/');
    const idx = cleanPath.lastIndexOf('uploads/');
    if (idx !== -1) {
      return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
    }
    return logoPath;
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Print Preview...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error loading data.</div>;
  }

  const distinctLocations = Array.from(new Set(parameters.map(p => p.locationOfSample).filter(Boolean)));
  const displayLocations = distinctLocations.length > 0 ? distinctLocations.join(', ') : (formData.locationOfSample || '');

  return (
    <div className="print-container">
      <TestRequestDocument
        formData={formData}
        company={selCompany}
        client={selClient}
        category={selCategory}
        parameters={parameters}
        checkedParameters={checkedParameters}
        caution={selCaution}
        isPrintMode={true}
      />
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
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
          margin: 0 auto !important; 
          padding: 0 !important; 
        }
        .trf-document-wrapper {
          width: 100% !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .trf-page-container {
          width: 100% !important;
          max-width: 210mm !important;
          min-height: auto !important;
          height: auto !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
          padding: 4mm 12mm 3mm 12mm !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>
    </div>
  );
};

export default TestRequestPrint;
