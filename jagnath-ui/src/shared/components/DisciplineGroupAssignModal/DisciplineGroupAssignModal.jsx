/**
 * @file DisciplineGroupAssignModal.jsx
 * @description Dedicated modal to download Category-wise parameters Excel, fill in unassigned Discipline Groups / Sub Categories, and bulk assign them via UI.
 */
import React, { useState, useRef } from 'react';
import {
  FaTags, FaDownload, FaCloudUploadAlt, FaTimes,
  FaCheckCircle, FaExclamationCircle, FaSpinner
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { apiService } from '../../services/apiService';
import { PARAMETER_ENDPOINTS, CATEGORY_ENDPOINTS, SUB_CATEGORY_ENDPOINTS, LOCATION_SAMPLE_ENDPOINTS } from '../../services/apiEndpoints';

const DisciplineGroupAssignModal = ({
  isOpen,
  onClose,
  parameters = [],
  categories = [],
  subCategories = [],
  locationSamples = [],
  onSuccess
}) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultSummary, setResultSummary] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // 1. Download Category-wise Parameters Excel
  const handleDownloadTemplate = () => {
    const unassignedParams = [];
    const assignedParams = [];

    parameters.forEach(p => {
      const catName = p.categoryName || (p.category ? p.category.name : '') || '';
      if (!catName || catName.toLowerCase() === 'unassigned') {
        unassignedParams.push(p);
      } else {
        assignedParams.push(p);
      }
    });

    // Helper for multi-level sorting: Category -> SubCategory -> LocationSample -> ParameterName
    const sortParams = (list) => {
      return [...list].sort((a, b) => {
        const catA = (a.categoryName || a.category?.name || '').toLowerCase();
        const catB = (b.categoryName || b.category?.name || '').toLowerCase();
        if (catA !== catB) return catA.localeCompare(catB);

        const subA = (a.subCategoryName || a.subCategory?.name || '').toLowerCase();
        const subB = (b.subCategoryName || b.subCategory?.name || '').toLowerCase();
        if (subA !== subB) return subA.localeCompare(subB);

        const locA = (a.locationSampleName || a.locationSample?.name || '').toLowerCase();
        const locB = (b.locationSampleName || b.locationSample?.name || '').toLowerCase();
        if (locA !== locB) return locA.localeCompare(locB);

        const nameA = (a.parameterName || a.name || '').toLowerCase();
        const nameB = (b.parameterName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    };

    const sortedUnassigned = sortParams(unassignedParams);
    const sortedAssigned = sortParams(assignedParams);

    const exportRows = [];

    // Helper to format row
    const mapToRow = (p, catDefault) => ({
      'Discipline Group *': p.categoryName || (p.category ? p.category.name : '') || catDefault,
      'Sub Category': p.subCategoryName || (p.subCategory ? p.subCategory.name : '') || '',
      'Location of Sample': p.locationSampleName || (p.locationSample ? p.locationSample.name : '') || '',
      'Parameter Name *': p.parameterName || p.name || '',
      'Test Method': p.testMethod || '',
      'Unit': p.unit || '',
      'Status': p.status || 'Active',
      'Parameter ID (System)': p.id
    });

    // Add Unassigned parameters at top
    sortedUnassigned.forEach(p => {
      exportRows.push(mapToRow(p, 'Unassigned'));
    });

    // Add Assigned parameters
    sortedAssigned.forEach(p => {
      exportRows.push(mapToRow(p, ''));
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths matching standard master format
    worksheet['!cols'] = [
      { wch: 25 }, // Discipline Group
      { wch: 28 }, // Sub Category
      { wch: 25 }, // Location of Sample
      { wch: 35 }, // Parameter Name
      { wch: 30 }, // Test Method
      { wch: 12 }, // Unit
      { wch: 12 }, // Status
      { wch: 38 }  // Parameter ID
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Category Assignment');
    XLSX.writeFile(workbook, 'Category_Wise_Parameters_Assignment.xlsx');
    triggerToast('Assignment sheet downloaded successfully!', 'success');
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        triggerToast('Please upload a valid Excel file (.xlsx or .xls).', 'error');
        return;
      }
      setFile(selected);
      setResultSummary(null);
    }
  };

  // 2. Upload & Process Automatic Group Assignment
  const handleProcessUpload = async () => {
    if (!file) {
      triggerToast('Please select an Excel file to upload.', 'error');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Reading Excel file...');
    const companyId = localStorage.getItem('selectedCompanyId') || '';

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        triggerToast('Uploaded file is empty.', 'error');
        setIsProcessing(false);
        return;
      }

      // Fetch fresh Categories, SubCategories & LocationSamples
      setProgressMsg('Syncing master records...');
      let currentCategories = [...categories];
      let currentSubCategories = [...subCategories];
      let currentLocationSamples = [...locationSamples];

      try {
        const catRes = await apiService.get(`${CATEGORY_ENDPOINTS.GET_ALL}?limit=1000&all=true`);
        if (catRes?.data) {
          const raw = catRes.data;
          currentCategories = Array.isArray(raw) ? raw : (raw.rows || raw.categories || []);
        }
      } catch (err) {
        console.warn('Could not refresh categories:', err);
      }

      try {
        const subRes = await apiService.get(`${SUB_CATEGORY_ENDPOINTS.GET_ALL}?limit=5000&all=true`);
        if (subRes?.data) {
          const raw = subRes.data;
          currentSubCategories = Array.isArray(raw) ? raw : (raw.rows || raw.subCategories || []);
        }
      } catch (err) {
        console.warn('Could not refresh subcategories:', err);
      }

      try {
        const locRes = await apiService.get(`${LOCATION_SAMPLE_ENDPOINTS.GET_ALL}?limit=1000&all=true`);
        if (locRes?.data) {
          const raw = locRes.data;
          currentLocationSamples = Array.isArray(raw) ? raw : (raw.rows || raw.locationSamples || []);
        }
      } catch (err) {
        console.warn('Could not refresh location samples:', err);
      }

      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        setProgressMsg(`Updating parameters (${i + 1}/${rawRows.length})...`);

        const groupInput = (row['Discipline Group *'] || row['Discipline Group'] || '').toString().trim();
        const subGroupInput = (row['Sub Category'] || '').toString().trim();
        const locInput = (row['Location of Sample'] || row['LocationSample'] || row['Location Name'] || '').toString().trim();
        const paramId = (row['Parameter ID (System)'] || row['Parameter ID'] || '').toString().trim();
        const paramName = (row['Parameter Name *'] || row['Parameter Name'] || '').toString().trim();

        if (!paramId && !paramName) {
          skippedCount++;
          continue;
        }

        // If user left Discipline Group blank or as 'Unassigned', skip
        if (!groupInput || groupInput.toLowerCase() === 'unassigned') {
          skippedCount++;
          continue;
        }

        // Find Parameter
        let targetParam = parameters.find(p => String(p.id) === String(paramId));
        if (!targetParam && paramName) {
          targetParam = parameters.find(p => (p.parameterName || p.name || '').trim().toLowerCase() === paramName.toLowerCase());
        }

        if (!targetParam) {
          errorCount++;
          continue;
        }

        // 1. Resolve Category ID
        let matchedCat = currentCategories.find(c => (c.name || c.categoryName || '').trim().toLowerCase() === groupInput.toLowerCase());

        if (!matchedCat) {
          try {
            const createCatRes = await apiService.post(CATEGORY_ENDPOINTS.CREATE, {
              name: groupInput,
              status: 'Active',
              companyId
            });
            const newCat = createCatRes?.data || createCatRes?.data?.data || { id: createCatRes?.id, name: groupInput };
            if (newCat && newCat.id) {
              matchedCat = newCat;
              currentCategories.push(newCat);
            }
          } catch (e) {
            console.warn(`Failed to auto-create group '${groupInput}':`, e);
          }
        }

        const catId = matchedCat ? matchedCat.id : null;
        if (!catId) {
          errorCount++;
          continue;
        }

        // 2. Resolve Sub Category ID
        let subCatId = null;
        if (subGroupInput) {
          let matchedSub = currentSubCategories.find(s => {
            const sCatId = s.categoryId || s.category_id || (s.category ? s.category.id : '');
            const sNameMatch = (s.name || '').trim().toLowerCase() === subGroupInput.toLowerCase();
            const sCatMatch = !catId || String(sCatId) === String(catId);
            return sNameMatch && sCatMatch;
          });

          if (!matchedSub) {
            try {
              const createSubRes = await apiService.post(SUB_CATEGORY_ENDPOINTS.CREATE, {
                name: subGroupInput,
                categoryId: catId,
                status: 'Active',
                companyId
              });
              const newSub = createSubRes?.data || createSubRes?.data?.data || { id: createSubRes?.id, name: subGroupInput };
              if (newSub && newSub.id) {
                matchedSub = newSub;
                currentSubCategories.push(newSub);
              }
            } catch (e) {
              console.warn(`Failed to auto-create subcategory '${subGroupInput}':`, e);
            }
          }
          if (matchedSub) {
            subCatId = matchedSub.id;
          }
        }

        // 3. Resolve Location of Sample ID
        let locationSampleId = null;
        if (locInput) {
          let matchedLoc = currentLocationSamples.find(l => (l.name || '').trim().toLowerCase() === locInput.toLowerCase());
          if (!matchedLoc) {
            try {
              const createLocRes = await apiService.post(LOCATION_SAMPLE_ENDPOINTS.CREATE, {
                name: locInput,
                status: 'Active',
                companyId
              });
              const newLoc = createLocRes?.data || createLocRes?.data?.data || { id: createLocRes?.id, name: locInput };
              if (newLoc && newLoc.id) {
                matchedLoc = newLoc;
                currentLocationSamples.push(newLoc);
              }
            } catch (e) {
              console.warn(`Failed to auto-create location '${locInput}':`, e);
            }
          }
          if (matchedLoc) {
            locationSampleId = matchedLoc.id;
          }
        }

        // 4. Update Parameter via API
        try {
          const payload = {
            parameterName: targetParam.parameterName || targetParam.name,
            unit: targetParam.unit || '',
            isPermissibleLimitApplicable: targetParam.isPermissibleLimitApplicable === true || targetParam.is_permissible_limit_applicable === true,
            permissibleLimit: targetParam.permissibleLimit || targetParam.permissible_limit || '',
            testMethod: targetParam.testMethod || '',
            status: targetParam.status || 'Active',
            companyId: companyId || targetParam.companyId,
            categoryId: catId,
            subCategoryId: subCatId || targetParam.subCategoryId || null,
            locationSampleId: locationSampleId || targetParam.locationSampleId || null
          };

          await apiService.put(PARAMETER_ENDPOINTS.UPDATE(targetParam.id), payload);
          updatedCount++;
        } catch (err) {
          console.error(`Failed to update parameter ${targetParam.parameterName}:`, err);
          errorCount++;
        }
      }

      setResultSummary({
        updatedCount,
        skippedCount,
        errorCount,
        totalRows: rawRows.length
      });

      triggerToast(`Group assignment completed! Assigned: ${updatedCount}`, 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Group assignment process failed:', err);
      triggerToast('Failed to process upload file.', 'error');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      {/* Toast Notification Container */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#7c3aed',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FaTags style={{ fontSize: '1.25rem' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Discipline Group Assignment Tool</h3>
              <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Download category-wise parameters sheet, fill unassigned groups & re-upload</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Step 1: Download Category-wise Excel */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                Step 1: Download Category-Wise Sheet
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Exports all parameters grouped category-wise (Unassigned items grouped at top).
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <FaDownload /> Download Sheet
            </button>
          </div>

          {/* Step 2: Upload Updated Excel Sheet */}
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            cursor: 'pointer'
          }} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <FaCloudUploadAlt style={{ fontSize: '2.5rem', color: '#7c3aed', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
              {file ? file.name : 'Click to select filled Excel file'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              {file ? 'File ready for processing.' : 'Supported formats: .xlsx, .xls'}
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '0.75rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '0.85rem',
              color: '#0369a1',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <FaSpinner className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>{progressMsg}</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Result Summary */}
          {resultSummary && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaCheckCircle style={{ color: '#10b981' }} />
                <span>Group Assignment Results</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#047857', display: 'flex', gap: '1.5rem' }}>
                <div>Successfully Assigned: <strong>{resultSummary.updatedCount}</strong></div>
                <div>Skipped / Blank: <strong>{resultSummary.skippedCount}</strong></div>
                <div>Errors: <strong>{resultSummary.errorCount}</strong></div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '0.55rem 1.25rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleProcessUpload}
            disabled={!file || isProcessing}
            style={{
              padding: '0.55rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: (!file || isProcessing) ? 'not-allowed' : 'pointer',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              fontWeight: 700,
              opacity: (!file || isProcessing) ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(124, 58, 237, 0.25)'
            }}
          >
            {isProcessing ? 'Processing...' : 'Apply & Assign Groups'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DisciplineGroupAssignModal;
