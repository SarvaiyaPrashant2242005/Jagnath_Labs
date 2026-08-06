import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../../shared/services/apiService';
import {
  CLIENT_ENDPOINTS,
  CATEGORY_ENDPOINTS,
  PARAMETER_ENDPOINTS,
  CATEGORY_PARAMETER_ENDPOINTS,
  TEST_REQUEST_ENDPOINTS,
  TEST_REQUEST_PARAMETER_ENDPOINTS,
  COMPANY_ENDPOINTS,
  CAUTION_ENDPOINTS,
  PRICE_MASTER_ENDPOINTS,
  SUB_CATEGORY_ENDPOINTS,
  LOCATION_SAMPLE_ENDPOINTS
} from '../../../shared/services/apiEndpoints';
import { FaPrint, FaSave, FaArrowLeft, FaCheck, FaExclamationCircle, FaEye, FaEyeSlash, FaFilePdf, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';

const TestRequestForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // State for dropdown options
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [cautions, setCautions] = useState([]);
  const [locationSamples, setLocationSamples] = useState([]);
  const [priceMasterMap, setPriceMasterMap] = useState({});

  // State for dynamic parameter checklist & pagination
  const [parameters, setParameters] = useState([]);
  const [checkedParameters, setCheckedParameters] = useState({});
  const [selectedParamSequence, setSelectedParamSequence] = useState([]);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [paramPage, setParamPage] = useState(1);
  const [paramSearch, setParamSearch] = useState('');
  const [paramPageSize, setParamPageSize] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    companyId: '',
    clientId: '',
    address: '',
    email: '',
    locationOfSample: '',
    contactPerson: '',
    contactNumber: '',
    dateOfCollection: '',
    dateOfReceipt: '',
    sampleCollectedBy: '',
    sampleQuantity: '',
    fieldDataSheet: 'Not Available',
    packingDetails: '',
    sampleIdNumber: '',
    reportNumber: '',
    sampleParticular: '',
    categoryId: '',
    subCategoryId: '',
    equipmentAvailability: 'Available',
    referenceStandardAvailability: 'Available',
    sampleAdequacy: 'Adequate',
    testMethodAvailability: 'Available',
    trainedPersonAvailability: 'Available',
    tentativeDays: '',
    sampleTestingFacilityReviewedBy: '',
    customerRepresentativeName: '',
    sampleReceiverName: '',
    testProtocol: '',
    remarks: '',
    formTitle: '',
    formType: 'Regular',
    includeCaution: false,
    cautionId: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showLivePreview, setShowLivePreview] = useState(true);
  const printRef = useRef();

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    fetchCautions();
    fetchLocationSamples();
    fetchInitialData();

    const handleCompanyChange = () => {
      fetchInitialData();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  // Helper to generate next Report No in format RPT-001, RPT-002, etc. based on previous report numbers
  const generateNextReportNumber = (allRequests) => {
    if (!allRequests || allRequests.length === 0) {
      return 'RPT-001';
    }

    const validReportNos = allRequests
      .map(r => r.reportNumber || r.report_number || '')
      .filter(num => num && num.trim().length > 0);

    if (validReportNos.length === 0) {
      return 'RPT-001';
    }

    let maxNum = 0;
    let maxPrefix = 'RPT-';
    let padLength = 3;

    validReportNos.forEach(repNo => {
      const match = repNo.trim().match(/^([A-Za-z]+[-_/\s]*)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const numVal = parseInt(numStr, 10);
        if (!isNaN(numVal) && numVal > maxNum) {
          maxNum = numVal;
          maxPrefix = prefix;
          padLength = Math.max(numStr.length, 3);
        }
      } else {
        const endNumMatch = repNo.trim().match(/(\d+)$/);
        if (endNumMatch) {
          const numStr = endNumMatch[1];
          const numVal = parseInt(numStr, 10);
          if (!isNaN(numVal) && numVal > maxNum) {
            maxNum = numVal;
            padLength = Math.max(numStr.length, 3);
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    const paddedNextNum = String(nextNum).padStart(padLength, '0');
    return `${maxPrefix}${paddedNextNum}`;
  };

  const fetchCautions = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${CAUTION_ENDPOINTS.GET_ALL}?companyId=${activeCompId}` : CAUTION_ENDPOINTS.GET_ALL;
      const res = await apiService.get(url);
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || []);
        setCautions(list.filter(c => c.status === 'Active'));
      }
    } catch (err) {
      console.error("Error fetching cautions", err);
    }
  };

  const fetchLocationSamples = async () => {
    try {
      const activeCompId = localStorage.getItem('selectedCompanyId') || '';
      const url = activeCompId ? `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?companyId=${activeCompId}&status=Active` : `${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?status=Active`;
      const res = await apiService.get(url);
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || [res.data]);
        setLocationSamples(list);
      }
    } catch (err) {
      console.error("Error fetching location samples", err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // 1. Fetch companies, categories, cautions, and price master first
      const [compRes, catRes, cautionRes, priceRes] = await Promise.all([
        apiService.get(COMPANY_ENDPOINTS.GET_MY),
        apiService.get(CATEGORY_ENDPOINTS.GET_ALL),
        apiService.get(CAUTION_ENDPOINTS.GET_ALL),
        apiService.get(PRICE_MASTER_ENDPOINTS.GET_ALL)
      ]);

      const cList = Array.isArray(compRes?.data) ? compRes.data : [compRes?.data];
      if (compRes?.data) setCompanies(cList);
      if (catRes?.data) {
        const catList = Array.isArray(catRes.data) ? catRes.data : [catRes.data];
        setCategories(catList.filter(cat => cat.status === 'Active'));
      }

      if (cautionRes?.data) {
        const cautionList = Array.isArray(cautionRes.data) ? cautionRes.data : [cautionRes.data];
        setCautions(cautionList.filter(c => c.status === true || c.status === 'Active'));
      }

      if (priceRes?.data) {
        const priceList = Array.isArray(priceRes.data) ? priceRes.data : [priceRes.data];
        const pMap = {};
        priceList.forEach(p => {
          if (p.parameterId && (p.status === 'Active' || p.status === true)) {
            pMap[p.parameterId] = parseFloat(p.price || 0);
          }
        });
        setPriceMasterMap(pMap);
      }

      let tr = null;
      let targetCompanyId = '';

      // 2. If editing, load the test request details to determine target company ID
      if (isEditing) {
        const trRes = await apiService.get(TEST_REQUEST_ENDPOINTS.GET_BY_ID(id));
        if (trRes?.data) {
          tr = trRes.data;
          if (tr.companyId) {
            targetCompanyId = tr.companyId;
          } else if (tr.companyName) {
            const matchingComp = cList.find(c => c.id === tr.companyId || (c.companyName || c.company_name) === tr.companyName);
            if (matchingComp) targetCompanyId = matchingComp.id;
          }
        }
      }

      // If not editing, or if editing but targetCompanyId not found, use default selected company
      if (!targetCompanyId && cList.length > 0) {
        const savedSelectedId = localStorage.getItem('selectedCompanyId');
        targetCompanyId = savedSelectedId || cList[0].id;
      }

      // 3. Fetch clients for that target company (not the system default company)
      const clientRes = await apiService.get(
        targetCompanyId
          ? `${CLIENT_ENDPOINTS.GET_ALL}?companyId=${targetCompanyId}`
          : CLIENT_ENDPOINTS.GET_ALL
      );
      const clList = Array.isArray(clientRes?.data) ? clientRes.data : [clientRes?.data];
      if (clientRes?.data) {
        setClients(clList.filter(client => client.status === 'Active'));
      }

      // 4. If editing, pre-fill form fields
      if (isEditing && tr) {
        const matchingComp = cList.find(c => c.id === tr.companyId || (c.companyName || c.company_name) === tr.companyName) || {};
        const matchingClient = clList.find(c => c.id === tr.clientId || c.clientName === tr.clientName) || {};

        let savedSubCatId = tr.subCategoryId || tr.sub_category_id || '';
        let savedCategoryId = tr.categoryId || tr.category_id || (tr.sampleParticular && tr.sampleParticular.length === 36 ? tr.sampleParticular : '');
        const savedSampleParticular = (tr.sampleParticular && tr.sampleParticular.length === 36) ? '' : (tr.sampleParticular || '');

        // Fetch checked parameters for this test request
        const checks = {};
        const loadedSeq = [];
        try {
          const trpRes = await apiService.get(TEST_REQUEST_PARAMETER_ENDPOINTS.GET_ALL);
          if (trpRes?.data) {
            const trps = Array.isArray(trpRes.data) ? trpRes.data : (trpRes.data.rows || [trpRes.data]);
            const matchingTrps = trps.filter(t => String(t.testRequestId) === String(id));
            matchingTrps.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
            matchingTrps.forEach(t => {
              if (t.parameterId) {
                checks[t.parameterId] = true;
                checks[`_id_${t.parameterId}`] = t.id; // Store transaction ID for updates/deletes
                loadedSeq.push(t.parameterId);
              }
            });
            setCheckedParameters(checks);
            setSelectedParamSequence(loadedSeq);
          }
        } catch (e) {
          console.error("Error fetching request parameters", e);
        }

        // If category or subcategory is missing in TR record, try inferring from checked parameters
        if ((!savedCategoryId || !savedSubCatId) && loadedSeq.length > 0) {
          try {
            const paramRes = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true`);
            const allParams = Array.isArray(paramRes?.data) ? paramRes.data : (paramRes?.data?.rows || []);
            const matchedParam = allParams.find(p => loadedSeq.includes(p.id));
            if (matchedParam) {
              if (!savedCategoryId) savedCategoryId = matchedParam.categoryId || matchedParam.category_id || '';
              if (!savedSubCatId) savedSubCatId = matchedParam.subCategoryId || matchedParam.sub_category_id || '';
            }
          } catch (err) {
            console.error("Error inferring category from parameters", err);
          }
        }

        setFormData({
          companyId: matchingComp.id || tr.companyId || '',
          clientId: matchingClient.id || tr.clientId || '',
          address: tr.address || matchingClient.plantAddress || matchingClient.plant_address || matchingClient.officeAddress || matchingClient.office_address || matchingClient.address || '',
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
          sampleParticular: savedSampleParticular,
          categoryId: savedCategoryId,
          subCategoryId: savedSubCatId,
          equipmentAvailability: tr.equipmentAvailability || 'Available',
          referenceStandardAvailability: tr.referenceStandardAvailability || 'Available',
          sampleAdequacy: tr.sampleAdequacy || 'Adequate',
          testMethodAvailability: tr.testMethodAvailability || 'Available',
          trainedPersonAvailability: tr.trainedPersonAvailability || 'Available',
          tentativeDays: tr.reportIssueDays || '15-20 Days',
          sampleTestingFacilityReviewedBy: tr.reviewedBy || 'Quality Manager /Technical Manager',
          customerRepresentativeName: tr.customerRepresentativeName || '',
          sampleReceiverName: tr.sampleReceiverName || '',
          remarks: tr.remarks || '',
          testProtocol: tr.testProtocol || 'Ground Water/Surface Water/Drinking Water: APHA 23rd Edition 2017\nWaste Water: APHA 23rd Edition 2017',
          formTitle: (tr.formTitle || 'WATER & WASTE WATER').replace(/^TEST REQUEST FORM FOR /i, ''),
          formType: tr.formType || 'Regular',
          includeCaution: tr.includeCaution !== undefined ? !!tr.includeCaution : false,
          cautionId: tr.cautionId || ''
        });

        if (savedSubCatId) {
          setSelectedSubCategory(savedSubCatId);
        }

        if (savedCategoryId) {
          fetchSubCategoriesForCategory(savedCategoryId);
        }
        fetchParameters(savedSubCatId, savedCategoryId, loadedSeq);
      } else {
        // Pre-select company if we resolved one and auto-generate next Report No (e.g. RPT-001, RPT-002)
        let autoReportNo = 'RPT-001';
        try {
          const allTrsRes = await apiService.get(`${TEST_REQUEST_ENDPOINTS.GET_ALL}?limit=1000${targetCompanyId ? `&companyId=${targetCompanyId}` : ''}`);
          const trsList = Array.isArray(allTrsRes?.data) ? allTrsRes.data : (allTrsRes?.data?.rows || []);
          autoReportNo = generateNextReportNumber(trsList);
        } catch (e) {
          console.error("Error auto-generating report number", e);
        }

        setFormData(prev => ({
          ...prev,
          companyId: targetCompanyId || prev.companyId,
          reportNumber: autoReportNo
        }));
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load initial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategoriesForCategory = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    setSubCategoriesLoading(true);
    try {
      const res = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?categoryId=${categoryId}&status=Active&all=true`);
      const list = res?.data?.subCategories || res?.data || [];
      const subCatList = Array.isArray(list) ? list : [list];
      setSubCategories(subCatList.filter(s => s.status === 'Active' || s.status === true || !s.status));
    } catch (e) {
      console.error("Error fetching subcategories", e);
      setSubCategories([]);
    } finally {
      setSubCategoriesLoading(false);
    }
  };

  const fetchParameters = async (subCategoryId, categoryId, extraIncludeIds = []) => {
    if (!subCategoryId && !categoryId && (!extraIncludeIds || extraIncludeIds.length === 0)) {
      setParameters([]);
      setParametersLoading(false);
      return;
    }
    setParametersLoading(true);
    try {
      let url = `${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true`;
      if (subCategoryId) {
        url += `&subCategoryId=${subCategoryId}`;
      } else if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }
      const res = await apiService.get(url);
      let list = [];
      if (res?.data?.rows) {
        list = res.data.rows;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (res?.data) {
        list = [res.data];
      }

      let activeList = list.filter(p => p.status === 'Active' || p.status === true || !p.status);

      // If there are extra parameter IDs (e.g., from existing TR parameters) missing from activeList, fetch and merge them
      if (extraIncludeIds && extraIncludeIds.length > 0) {
        const missingIds = extraIncludeIds.filter(id => !activeList.some(p => p.id === id));
        if (missingIds.length > 0) {
          const allRes = await apiService.get(`${PARAMETER_ENDPOINTS.GET_ALL}?status=Active&all=true`);
          const allList = Array.isArray(allRes?.data) ? allRes.data : (allRes?.data?.rows || []);
          const extraParams = allList.filter(p => missingIds.includes(p.id));
          activeList = [...activeList, ...extraParams];
        }
      }

      setParameters(activeList);
      setParamPage(1);
    } catch (e) {
      console.error("Error fetching parameters", e);
      setParameters([]);
    } finally {
      setParametersLoading(false);
    }
  };

  const handleSubCategoryChange = (e) => {
    const subId = e.target.value;
    setSelectedSubCategory(subId);
    setFormData(prev => ({ ...prev, subCategoryId: subId }));
    setParamPage(1);
    setCheckedParameters({});
    if (subId) {
      fetchParameters(subId, formData.categoryId);
    } else if (formData.categoryId) {
      fetchParameters('', formData.categoryId);
    } else {
      setParameters([]);
    }
  };

  const handleToggleSelectAllParameters = () => {
    const displayedParams = parameters.filter(param => !selectedSubCategory || param.subCategoryId === selectedSubCategory || param.subCategory?.id === selectedSubCategory);
    if (displayedParams.length === 0) return;

    const allChecked = displayedParams.every(p => !!checkedParameters[p.id]);
    const displayedIds = displayedParams.map(p => p.id);

    setCheckedParameters(prev => {
      const next = { ...prev };
      displayedParams.forEach(p => {
        if (allChecked) {
          delete next[p.id];
        } else {
          next[p.id] = true;
        }
      });
      return next;
    });

    setSelectedParamSequence(prevSeq => {
      if (allChecked) {
        return prevSeq.filter(id => !displayedIds.includes(id));
      } else {
        const newIdsToAdd = displayedIds.filter(id => !prevSeq.includes(id));
        return [...prevSeq, ...newIdsToAdd];
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'categoryId') {
      setSelectedSubCategory('');
      setFormData(prev => ({ ...prev, categoryId: value, subCategoryId: '' }));
      setParameters([]);
      setCheckedParameters({});
      setParamPage(1);
      setParamSearch('');
      if (value) {
        fetchSubCategoriesForCategory(value);
        fetchParameters('', value);
      } else {
        setSubCategories([]);
      }
    }

    if (name === 'clientId' && value) {
      // Auto-fill client details including Plant/Industry Address
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        const clientPlantAddress = selectedClient.plantAddress || selectedClient.plant_address || selectedClient.officeAddress || selectedClient.office_address || selectedClient.address || '';
        setFormData(prev => ({
          ...prev,
          address: clientPlantAddress,
          email: selectedClient.email || '',
          contactNumber: selectedClient.contactNumber || prev.contactNumber
        }));
      }
    }
  };

  const handleParameterCheck = (paramId) => {
    const isCurrentlyChecked = !!checkedParameters[paramId];

    setCheckedParameters(prev => ({
      ...prev,
      [paramId]: !isCurrentlyChecked
    }));

    setSelectedParamSequence(prevSeq => {
      if (!isCurrentlyChecked) {
        return prevSeq.includes(paramId) ? prevSeq : [...prevSeq, paramId];
      } else {
        return prevSeq.filter(id => id !== paramId);
      }
    });
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
    const activeCatId = formData.categoryId || (formData.sampleParticular && formData.sampleParticular.length === 36 ? formData.sampleParticular : '');
    if (!activeCatId) {
      triggerToast('Please select a Discipline Group.', 'error');
      return false;
    }
    if (!selectedSubCategory && !formData.subCategoryId) {
      triggerToast('Please select a Sub Category.', 'error');
      return false;
    }
    return true;
  };

  const [savedRequestId, setSavedRequestId] = useState(id || null);

  const handleSave = async () => {
    if (!validateForm()) return false;
    setSubmitting(true);

    try {
      // 1. Save Test Request
      const activeCatId = formData.categoryId || (formData.sampleParticular && formData.sampleParticular.length === 36 ? formData.sampleParticular : null);
      const textSampleParticular = (formData.sampleParticular && formData.sampleParticular.length === 36) ? '' : formData.sampleParticular;

      const payload = {
        ...formData,
        categoryId: activeCatId,
        sampleParticular: textSampleParticular,
        subCategoryId: selectedSubCategory || formData.subCategoryId || null,
        includeCaution: Boolean(formData.includeCaution),
        cautionId: formData.includeCaution && formData.cautionId ? formData.cautionId : null,
        reportIssueDays: formData.tentativeDays,
        reviewedBy: formData.sampleTestingFacilityReviewedBy
      };
      delete payload.tentativeDays;
      delete payload.sampleTestingFacilityReviewedBy;

      const targetId = savedRequestId || id;
      let savedTrId = targetId;
      if (targetId) {
        await apiService.put(TEST_REQUEST_ENDPOINTS.UPDATE(targetId), payload);
      } else {
        const res = await apiService.post(TEST_REQUEST_ENDPOINTS.CREATE, payload);
        savedTrId = res?.data?.id || res?.data?.data?.id; // depending on response format
      }

      if (!savedTrId) {
        triggerToast('Failed to retrieve saved request ID.', 'error');
        setSubmitting(false);
        return false;
      }

      // Update saved requestId state
      setSavedRequestId(savedTrId);

      // 2. Save Parameters Checklist with sequence
      const checkedParamIds = Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && checkedParameters[k]);

      const orderedParamIds = [
        ...selectedParamSequence.filter(id => checkedParamIds.includes(id)),
        ...checkedParamIds.filter(id => !selectedParamSequence.includes(id))
      ];

      for (let i = 0; i < orderedParamIds.length; i++) {
        const pId = orderedParamIds[i];
        const seqNum = i + 1;
        const trpId = checkedParameters[`_id_${pId}`];

        if (!trpId) {
          const targetParam = parameters.find(p => p.id === pId);
          const res = await apiService.post(TEST_REQUEST_PARAMETER_ENDPOINTS.CREATE, {
            testRequestId: savedTrId,
            parameterId: pId,
            sequence: seqNum,
            testMethod: targetParam ? (targetParam.testMethod || targetParam.defaultTestMethod) : null,
            price: priceMasterMap[pId] || 0
          });
          if (res?.data?.id) {
            setCheckedParameters(prev => ({ ...prev, [`_id_${pId}`]: res.data.id }));
          }
        } else {
          await apiService.put(TEST_REQUEST_PARAMETER_ENDPOINTS.UPDATE(trpId), {
            sequence: seqNum
          });
        }
      }

      triggerToast('Test Request saved successfully!', 'success');
      return savedTrId;
    } catch (err) {
      const errorMsg = err?.messageToShow || err?.message || err?.errorMessage || err?.error || (typeof err === 'string' ? err : 'Failed to save test request.');
      triggerToast(errorMsg, 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndNavigate = async () => {
    const savedId = await handleSave();
    if (savedId) {
      setTimeout(() => {
        navigate('/test-requests');
      }, 500);
    }
  };

  const handleSaveAndPrint = async () => {
    const savedId = await handleSave();
    if (savedId) {
      window.open(`#/test-requests/print/${savedId}`, '_blank');
      setTimeout(() => {
        navigate('/test-requests');
      }, 500);
    }
  };

  const handleSaveAndQuotation = async () => {
    const savedId = await handleSave();
    if (savedId) {
      window.open(`#/test-requests/quotation/${savedId}`, '_blank');
      setTimeout(() => {
        navigate('/test-requests');
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
      <div className="master-top-bar hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/test-requests')} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaArrowLeft />
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEditing ? 'Edit Test Request' : 'New Test Request'}
          </h2>
        </div>
        <div className="master-top-bar-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showLivePreview ? <FaEyeSlash /> : <FaEye />}
            <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
          </button>
          <button
            onClick={handleSaveAndNavigate}
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

      {/* Main Split Screen Area (Screen Only) */}
      <div className="premium-ui-form test-request-split-container hide-on-print" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* Left Column: Form Inputs */}
        <div style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* General Information Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>General Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>

              {/* Document Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Document Title Postfix <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="test-request-title-prefix" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>TEST REQUEST FORM FOR </span>
                  <input
                    type="text"
                    name="formTitle"
                    value={formData.formTitle}
                    onChange={handleChange}
                    className="premium-input"
                    placeholder="e.g. WATER & WASTE WATER"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Customer / Client <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="clientId" value={formData.clientId} onChange={handleChange} className="premium-input">
                  <option value="">Select Client</option>
                  {[...clients].sort((a, b) => (a.clientName || '').localeCompare(b.clientName || '')).map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Form Type <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="formType"
                      value="Regular"
                      checked={formData.formType === 'Regular'}
                      onChange={handleChange}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    Regular
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="formType"
                      value="NABL"
                      checked={formData.formType === 'NABL'}
                      onChange={handleChange}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    NABL
                  </label>
                </div>
              </div>

              {/* Include Caution Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Include Caution</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', height: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="includeCaution"
                      value="false"
                      checked={!formData.includeCaution}
                      onChange={() => setFormData(prev => ({ ...prev, includeCaution: false, cautionId: '' }))}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    No
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="includeCaution"
                      value="true"
                      checked={formData.includeCaution}
                      onChange={() => setFormData(prev => ({ ...prev, includeCaution: true }))}
                      style={{ width: '1.1rem', height: '1.1rem', accentColor: '#3b82f6' }}
                    />
                    Yes
                  </label>
                </div>
              </div>

              {/* Select Caution Dropdown */}
              {formData.includeCaution && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Select Caution <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="cautionId"
                    value={formData.cautionId}
                    onChange={handleChange}
                    className="premium-input"
                  >
                    <option value="">Select Caution</option>
                    {cautions.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Address for Communication</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className="premium-input" rows={2} placeholder="Enter full address..."></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Email ID</label>
                <input type="text" name="email" value={formData.email} onChange={handleChange} className="premium-input" placeholder="e.g. contact@client.com, contact2@client.com" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Location of Sample</label>
                <select
                  name="locationOfSample"
                  value={formData.locationOfSample}
                  onChange={handleChange}
                  className="premium-input"
                >
                  <option value="">Select Location of Sample</option>
                  {[...locationSamples].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                  {formData.locationOfSample && !locationSamples.some(l => l.name === formData.locationOfSample) && (
                    <option value={formData.locationOfSample}>{formData.locationOfSample}</option>
                  )}
                </select>
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
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #10b981, #34d399)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sample Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
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
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Report No. (Auto-Generated)</label>
                <input
                  type="text"
                  name="reportNumber"
                  value={formData.reportNumber}
                  onChange={handleChange}
                  className="premium-input"
                  placeholder="Auto-generated (e.g. RPT-001)"
                  readOnly={true}
                  disabled={true}
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569', fontWeight: 600 }}
                />
              </div>

              {/* Sample Particular Field (Long Text Input) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Particular</label>
                <textarea
                  name="sampleParticular"
                  value={formData.sampleParticular}
                  onChange={handleChange}
                  className="premium-input"
                  rows={3}
                  placeholder="Enter sample particulars / description..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Testing Parameters Card */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #8b5cf6, #a78bfa)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Testing Parameters</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Discipline Group <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="categoryId" value={formData.categoryId || (formData.sampleParticular && formData.sampleParticular.length === 36 ? formData.sampleParticular : '')} onChange={handleChange} className="premium-input">
                  <option value="">Select Discipline Group</option>
                  {[...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  Sub Category <span style={{ color: '#ef4444' }}>*</span> {subCategoriesLoading && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Loading...)</span>}
                </label>
                <select
                  value={selectedSubCategory || formData.subCategoryId || ''}
                  onChange={handleSubCategoryChange}
                  className="premium-input"
                  disabled={(!formData.categoryId && (!formData.sampleParticular || formData.sampleParticular.length !== 36)) || subCategoriesLoading}
                >
                  <option value="">Select Sub Category</option>
                  {[...subCategories].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {(formData.categoryId || (formData.sampleParticular && formData.sampleParticular.length === 36)) && !subCategoriesLoading && subCategories.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No subcategories available for this discipline group
                  </span>
                )}
              </div>
            </div>

            {!formData.categoryId && (!formData.sampleParticular || formData.sampleParticular.length !== 36) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontWeight: 500 }}>
                Please select a Discipline Group to begin.
              </div>
            ) : (!selectedSubCategory && !formData.subCategoryId && subCategories.length > 0 && parameters.length === 0) ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontWeight: 500 }}>
                Please select a Sub Category to view test parameters.
              </div>
            ) : parametersLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                Loading parameters...
              </div>
            ) : parameters.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                No parameters mapped to this selection
              </div>
            ) : (() => {
              const categoryFilteredParams = parameters.filter(param =>
                !selectedSubCategory ||
                param.subCategoryId === selectedSubCategory ||
                param.subCategory?.id === selectedSubCategory ||
                checkedParameters[param.id]
              );
              const searchFilteredParams = categoryFilteredParams
                .filter(param => {
                  if (!paramSearch.trim()) return true;
                  const q = paramSearch.toLowerCase();
                  return (param.parameterName || '').toLowerCase().includes(q) ||
                    (param.testMethod || '').toLowerCase().includes(q);
                })
                .sort((a, b) => (a.parameterName || '').localeCompare(b.parameterName || ''));

              const totalParamItems = searchFilteredParams.length;
              const totalParamPages = Math.ceil(totalParamItems / paramPageSize) || 1;
              const safeParamPage = Math.min(Math.max(1, paramPage), totalParamPages);
              const startParamItem = totalParamItems === 0 ? 0 : (safeParamPage - 1) * paramPageSize + 1;
              const endParamItem = Math.min(safeParamPage * paramPageSize, totalParamItems);

              const paginatedParams = searchFilteredParams.slice(
                (safeParamPage - 1) * paramPageSize,
                safeParamPage * paramPageSize
              );

              return categoryFilteredParams.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  {/* Top Bar / Header */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #ffffff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                      Select Test Parameters to be Analyzed
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Search box */}
                      <div style={{ position: 'relative', width: '220px' }}>
                        <input
                          type="text"
                          placeholder="Search parameters..."
                          value={paramSearch}
                          onChange={(e) => {
                            setParamSearch(e.target.value);
                            setParamPage(1);
                          }}
                          style={{
                            padding: '0.35rem 0.65rem 0.35rem 2rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                            width: '100%',
                            outline: 'none',
                            backgroundColor: '#ffffff'
                          }}
                        />
                        <FaSearch size={12} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        {paramSearch && (
                          <button
                            type="button"
                            onClick={() => setParamSearch('')}
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleSelectAllParameters}
                        style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!checkedParameters[p.id])
                          ? 'Deselect All' : 'Select All'}
                      </button>

                      <span style={{ fontSize: '0.85rem', background: '#dcfce7', color: '#166534', padding: '0.3rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>
                        Total: ₹{parameters.reduce((sum, param) => sum + (checkedParameters[param.id] ? (priceMasterMap[param.id] || 0) : 0), 0).toFixed(2)}
                      </span>

                      <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.65rem', borderRadius: '999px', fontWeight: 600 }}>
                        {Object.keys(checkedParameters).filter(k => !k.startsWith('_id_') && checkedParameters[k]).length} Selected
                      </span>
                    </div>
                  </div>

                  {/* Clean Parameters Table */}
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.925rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '70px', color: '#64748b', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!checkedParameters[p.id])}
                              onChange={handleToggleSelectAllParameters}
                              title={categoryFilteredParams.length > 0 && categoryFilteredParams.every(p => !!checkedParameters[p.id]) ? "Deselect All" : "Select All"}
                              style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: '#22c55e' }}
                            />
                          </th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Parameter Name</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Test Method</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 600, width: '130px' }}>Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedParams.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                              No parameters match your search criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedParams.map(param => {
                            const isChecked = !!checkedParameters[param.id];
                            const paramPrice = priceMasterMap[param.id] || 0;
                            return (
                              <tr
                                key={param.id}
                                onClick={() => handleParameterCheck(param.id)}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  backgroundColor: isChecked ? '#f0fdf4' : '#ffffff'
                                }}
                                onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                                onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = '#ffffff' }}
                              >
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: isChecked ? 'none' : '2px solid #cbd5e1', background: isChecked ? '#22c55e' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.15s ease' }}>
                                      {isChecked && <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>✓</span>}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: isChecked ? '#166534' : '#1e293b', fontWeight: isChecked ? 600 : 500 }}>
                                  {param.parameterName}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: isChecked ? '#15803d' : '#64748b' }}>
                                  {param.testMethod || 'N/A'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: isChecked ? '#15803d' : '#334155', fontWeight: 600 }}>
                                  ₹{paramPrice.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Clean Pagination Footer */}
                  <div style={{
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Showing <strong style={{ color: '#0f172a' }}>{startParamItem}</strong> to <strong style={{ color: '#0f172a' }}>{endParamItem}</strong> of <strong style={{ color: '#0f172a' }}>{totalParamItems}</strong> parameters
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>Rows per page:</span>
                        <select
                          value={paramPageSize}
                          onChange={(e) => {
                            setParamPageSize(Number(e.target.value));
                            setParamPage(1);
                          }}
                          style={{ padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', outline: 'none' }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={() => setParamPage(p => Math.max(1, p - 1))}
                          disabled={safeParamPage <= 1}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: safeParamPage <= 1 ? '#f1f5f9' : '#ffffff',
                            color: safeParamPage <= 1 ? '#94a3b8' : '#334155',
                            cursor: safeParamPage <= 1 ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <FaChevronLeft size={10} /> Prev
                        </button>

                        {/* Smart Page Pill Buttons */}
                        {Array.from({ length: totalParamPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === totalParamPages || Math.abs(page - safeParamPage) <= 1)
                          .map((page, idx, arr) => {
                            const prevPage = arr[idx - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && <span style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0 0.15rem' }}>...</span>}
                                <button
                                  type="button"
                                  onClick={() => setParamPage(page)}
                                  style={{
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '6px',
                                    border: page === safeParamPage ? '1px solid #8b5cf6' : '1px solid #cbd5e1',
                                    backgroundColor: page === safeParamPage ? '#8b5cf6' : '#ffffff',
                                    color: page === safeParamPage ? '#ffffff' : '#334155',
                                    fontWeight: page === safeParamPage ? 700 : 500,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    minWidth: '28px'
                                  }}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}

                        <button
                          type="button"
                          onClick={() => setParamPage(p => Math.min(totalParamPages, p + 1))}
                          disabled={safeParamPage >= totalParamPages}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: safeParamPage >= totalParamPages ? '#f1f5f9' : '#ffffff',
                            color: safeParamPage >= totalParamPages ? '#94a3b8' : '#334155',
                            cursor: safeParamPage >= totalParamPages ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          Next <FaChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Facility & Technical Feasibility Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #f59e0b, #fbbf24)', borderRadius: '6px' }}></div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Facility & Feasibility</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    equipmentAvailability: 'Available',
                    referenceStandardAvailability: 'Available',
                    sampleAdequacy: 'Adequate',
                    testMethodAvailability: 'Available',
                    trainedPersonAvailability: 'Available'
                  }));
                }}
                style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                ✓ Quick Set All Available
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>

              {/* Availability of Equipments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Equipments</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.equipmentAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="equipmentAvailability" value="Available" checked={(formData.equipmentAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.equipmentAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="equipmentAvailability" value="Not Available" checked={formData.equipmentAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Availability of Reference Standards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Reference Standards</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.referenceStandardAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="referenceStandardAvailability" value="Available" checked={(formData.referenceStandardAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.referenceStandardAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="referenceStandardAvailability" value="Not Available" checked={formData.referenceStandardAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Adequacy of Sample Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Adequacy of Sample Quantity</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.sampleAdequacy || 'Adequate') === 'Adequate' ? '#166534' : '#475569' }}>
                    <input type="radio" name="sampleAdequacy" value="Adequate" checked={(formData.sampleAdequacy || 'Adequate') === 'Adequate'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Adequate
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.sampleAdequacy === 'Not Adequate' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="sampleAdequacy" value="Not Adequate" checked={formData.sampleAdequacy === 'Not Adequate'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Adequate
                  </label>
                </div>
              </div>

              {/* Availability of Test Method */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Test Method</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.testMethodAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="testMethodAvailability" value="Available" checked={(formData.testMethodAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.testMethodAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="testMethodAvailability" value="Not Available" checked={formData.testMethodAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              {/* Availability of Trained Person */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Availability of Trained Person</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '0.65rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '42px', boxSizing: 'border-box' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: (formData.trainedPersonAvailability || 'Available') === 'Available' ? '#166534' : '#475569' }}>
                    <input type="radio" name="trainedPersonAvailability" value="Available" checked={(formData.trainedPersonAvailability || 'Available') === 'Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#22c55e' }} />
                    Available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: formData.trainedPersonAvailability === 'Not Available' ? '#991b1b' : '#475569' }}>
                    <input type="radio" name="trainedPersonAvailability" value="Not Available" checked={formData.trainedPersonAvailability === 'Not Available'} onChange={handleChange} style={{ width: '1.05rem', height: '1.05rem', accentColor: '#ef4444' }} />
                    Not Available
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Tentative Days of Issuing Report</label>
                <input type="text" name="tentativeDays" value={formData.tentativeDays} onChange={handleChange} className="premium-input" placeholder="e.g. 15-20 Days" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Sample Testing Facility Reviewed By</label>
                <input type="text" name="sampleTestingFacilityReviewedBy" value={formData.sampleTestingFacilityReviewedBy} onChange={handleChange} className="premium-input" placeholder="Quality Manager /Technical Manager" />
              </div>
            </div>
          </div>

          {/* Signatures & Adoption Card */}
          <div className="test-request-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f8fafc' }}>
              <div style={{ width: '12px', height: '24px', background: 'linear-gradient(to bottom, #ec4899, #f472b6)', borderRadius: '6px' }}></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Signatures & Adoption</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Name & Designation of Customer Representative</label>
                <input type="text" name="customerRepresentativeName" value={formData.customerRepresentativeName} onChange={handleChange} className="premium-input" placeholder="Enter representative name..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Name & Designation of Sample Receiver</label>
                <input type="text" name="sampleReceiverName" value={formData.sampleReceiverName} onChange={handleChange} className="premium-input" placeholder="Enter receiver name..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Test Protocol / Method to be Adopted</label>
                <textarea name="testProtocol" value={formData.testProtocol} onChange={handleChange} className="premium-input" rows={3} placeholder="Ground Water/Surface Water/Drinking Water: APHA..."></textarea>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Remarks / Additional Notes</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="premium-input" rows={3} placeholder="Enter any extra remarks..."></textarea>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="test-request-bottom-actions hide-on-print" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem 2rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {showLivePreview ? <FaEyeSlash /> : <FaEye />}
              <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndNavigate}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaSave />
              <span>{submitting ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndPrint}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaPrint />
              <span>Save & TRF PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndQuotation}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              <FaFilePdf />
              <span>Generate Quotation</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live Preview Simulator */}
        {showLivePreview && (
          <div className="live-preview-container hide-on-mobile" style={{
            width: '460px',
            flexShrink: 0,
            position: 'sticky',
            top: '24px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Document Preview</span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', background: '#e8fdf0', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #b8ffd0', fontWeight: 'bold' }}>A4 Format</span>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #000000',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
              fontSize: '10px',
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              color: '#000000',
              lineHeight: '1.3'
            }}>
              {/* Header block */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginBottom: '8px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%', border: '1px solid #000000', padding: '4px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <img src="/Images/Navbar_Logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    </td>
                    <td style={{ width: '25%', border: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                      FORMATS
                    </td>
                    <td style={{ width: '30%', border: '1px solid #000000', padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment No.</td><td style={{ padding: '2px 3px' }}>00</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment Date</td><td style={{ padding: '2px 3px' }}>--</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue No.</td><td style={{ padding: '2px 3px' }}>01</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue Date</td><td style={{ padding: '2px 3px' }}>01/09/2018</td></tr>
                          <tr><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No.</td><td style={{ padding: '2px 3px' }}>7.1 F-01</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Document Title */}
              <div style={{ border: '1px solid #000000', borderTop: 'none', background: '#f8fafc', padding: '3px', textAlign: 'center', fontWeight: 'bold', fontSize: '8px', marginBottom: '8px' }}>
                TEST REQUEST FORM FOR {formData.formTitle || 'WATER & WASTE WATER'}
              </div>

              {/* Form Fields Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '8px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ width: '32%', padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Name of Company / Customer</td>
                    <td style={{ padding: '3px 4px' }}>{selCompany.companyName || selCompany.company_name || '(Select Company)'} {selClient.clientName ? `- ${selClient.clientName}` : ''}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Address for Communication</td>
                    <td style={{ padding: '3px 4px' }}>{formData.address || 'N/A'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Email ID</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formData.email || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Location of Sample</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.locationOfSample || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Contact Person</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formData.contactPerson || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Contact No.</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.contactNumber || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Date of Collection</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formData.dateOfCollection || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Date of Receipt</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.dateOfReceipt || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample Collected By</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formData.sampleCollectedBy || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Sample Quantity</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.sampleQuantity || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Field Data Sheet</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{formData.fieldDataSheet}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px' }}>Packing details</span>
                        <span>{formData.packingDetails || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Form Type</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.formType || 'Regular'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample ID No.</td>
                    <td style={{ padding: '3px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{formData.sampleIdNumber || 'N/A'}</span>
                        <span style={{ fontWeight: '600', borderLeft: '1px solid #000000', paddingLeft: '6px', borderRight: '1px solid #000000', paddingRight: '6px', marginLeft: 'auto' }}>Report No.</span>
                        <span style={{ paddingLeft: '6px' }}>{formData.reportNumber || 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Sample Particular</td>
                    <td style={{ padding: '3px 4px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{formData.sampleParticular || selCategory.name || 'N/A'}</td>
                  </tr>

                  {/* Feasibility table inner block */}
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0', fontWeight: '600' }} colSpan={2}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7.5px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000000' }}>
                            <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Equip.</td>
                            <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.equipmentAvailability}</td>
                            <td style={{ width: '25%', padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Ref Std.</td>
                            <td style={{ width: '25%', padding: '2px 3px' }}>{formData.referenceStandardAvailability}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Test Method</td>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.testMethodAvailability}</td>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Availability of Trained Person</td>
                            <td style={{ padding: '2px 3px' }}>{formData.trainedPersonAvailability}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Adequacy of sample qty</td>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>{formData.sampleAdequacy}</td>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Tentative Report Days</td>
                            <td style={{ padding: '2px 3px' }}>{formData.tentativeDays}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000' }}>Facility reviewed by</td>
                    <td style={{ padding: '3px 4px' }}>{formData.sampleTestingFacilityReviewedBy}</td>
                  </tr>

                  {/* Signatures space */}
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '0', fontWeight: '600' }} colSpan={2}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7.5px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000000', height: '20px' }}>
                            <td style={{ width: '50%', padding: '2px 3px', borderRight: '1px solid #000000', verticalAlign: 'top', fontWeight: 'bold' }}>Signature of Customer Representative:</td>
                            <td style={{ width: '50%', padding: '2px 3px', verticalAlign: 'top', fontWeight: 'bold' }}>Signature of Sample Received By:</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 3px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>
                              Name & Designation: <span style={{ fontWeight: 'normal' }}>{formData.customerRepresentativeName || 'N/A'}</span>
                            </td>
                            <td style={{ padding: '2px 3px', fontWeight: 'bold' }}>
                              Name & Designation: <span style={{ fontWeight: 'normal' }}>{formData.sampleReceiverName || 'N/A'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000', verticalAlign: 'top' }}>Test Protocol adopted</td>
                    <td style={{ padding: '3px 4px', whiteSpace: 'pre-wrap' }}>{formData.testProtocol}</td>
                  </tr>

                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: '600', borderRight: '1px solid #000000', verticalAlign: 'top' }}>Remarks / Notes</td>
                    <td style={{ padding: '3px 4px', whiteSpace: 'pre-wrap' }}>
                      <ol style={{ margin: 0, paddingLeft: '1rem', fontSize: '7px' }}>
                        <li>Please mention specific tests to be applied</li>
                        <li>All the test procedures are followed as per National & International Standards.</li>
                        <li>In case of sampling conducted by JLT, sampling plan is followed as per National & International Standards.</li>
                        <li>If due to any unavoidable condition, testing will be sub-contracted only to NABL-complying competent agencies.</li>
                      </ol>
                      {formData.remarks && <div style={{ marginTop: '3px', borderTop: '1px dashed #cbd5e1', paddingTop: '3px' }}><strong>Additional:</strong> {formData.remarks}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Page 1 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '7px', marginTop: 'auto' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}>Doc No: JLT/ 7.1 F-01</td>
                    <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}></td>
                    <td style={{ width: '33.33%', padding: '2px 3px', textAlign: 'right' }}>Page 1 of 2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No. 7.1 F-01</td>
                    <td colSpan={2} style={{ padding: '2px 3px' }}>Format: Test Request Form (Water & Waste Water)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Prepared By: TM</td>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Approved By: QM</td>
                    <td style={{ padding: '2px 3px' }}>Issue By/Reviewed By: TM</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PAGE BREAK / SPACER */}
            <div style={{ margin: '2rem 0', borderTop: '2px dashed #cbd5e1', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#f8fafc', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Page 2 Preview</span>
            </div>

            {/* PAGE 2 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #000000',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
              fontSize: '10px',
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              color: '#000000',
              lineHeight: '1.3',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}>
              {/* Header block (repeated from Page 1) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginBottom: '8px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%', border: '1px solid #000000', padding: '4px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <img src="/Images/Navbar_Logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    </td>
                    <td style={{ width: '25%', border: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                      FORMATS
                    </td>
                    <td style={{ width: '30%', border: '1px solid #000000', padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '7px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment No.</td><td style={{ padding: '2px 3px' }}>00</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Amendment Date</td><td style={{ padding: '2px 3px' }}>--</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue No.</td><td style={{ padding: '2px 3px' }}>01</td></tr>
                          <tr style={{ borderBottom: '1px solid #000000' }}><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Issue Date</td><td style={{ padding: '2px 3px' }}>01/09/2018</td></tr>
                          <tr><td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No.</td><td style={{ padding: '2px 3px' }}>7.1 F-01</td></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '8px', border: '1px solid #000000', borderTop: 'none', background: '#f8fafc', padding: '3px', textAlign: 'center' }}>
                Test Parameter to Be Analyzed: - {selCategory.name || 'WATER & WASTE WATER'}
              </div>

              {/* Parameters Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '8px', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000000' }}>
                    <th style={{ width: '8%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'center' }}>Sr. No.</th>
                    <th style={{ width: '42%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'left' }}>Test Parameters</th>
                    <th style={{ width: '10%', padding: '3px', borderRight: '1px solid #000000', textAlign: 'center' }}>Tick √</th>
                    <th style={{ width: '40%', padding: '3px', textAlign: 'center' }}>Test Method</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(20, parameters.length) }).map((_, i) => {
                    const param = parameters[i];
                    const isChecked = param ? !!checkedParameters[param.id] : false;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #000000' }}>
                        <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center' }}>{i + 1}.</td>
                        <td style={{ padding: '2px 4px', borderRight: '1px solid #000000', textAlign: 'left' }}>{param ? (param.parameterName || param.name) : ''}</td>
                        <td style={{ padding: '2px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', color: '#15803d' }}>{isChecked ? '√' : ''}</td>
                        <td style={{ padding: '2px 4px', textAlign: 'left' }}>{param ? (param.testMethod || '') : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Approved By Technical Manager */}
              <div style={{ textAlign: 'right', marginTop: '1.5rem', fontWeight: 'bold', fontSize: '8px', paddingRight: '1.5rem' }}>
                Approved By<br />
                Technical Manager
              </div>

              {/* Footer Page 2 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '7px', marginTop: 'auto' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}>Doc No: JLT/ 7.1 F-01</td>
                    <td style={{ width: '33.33%', padding: '2px 3px', borderRight: '1px solid #000000' }}></td>
                    <td style={{ width: '33.33%', padding: '2px 3px', textAlign: 'right' }}>Page 2 of 2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Format No. 7.1 F-01</td>
                    <td colSpan={2} style={{ padding: '2px 3px' }}>Format: Test Request Form (Water & Waste Water)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Prepared By: TM</td>
                    <td style={{ padding: '2px 3px', borderRight: '1px solid #000000' }}>Approved By: QM</td>
                    <td style={{ padding: '2px 3px' }}>Issue By/Reviewed By: TM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRequestForm;
