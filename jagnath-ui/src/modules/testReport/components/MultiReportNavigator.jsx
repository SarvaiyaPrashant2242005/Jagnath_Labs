import React, { useState, useRef, useEffect } from 'react';
import { 
  FaPlus, 
  FaCopy, 
  FaTrash, 
  FaCheck, 
  FaExclamationTriangle, 
  FaLayerGroup, 
  FaChevronLeft, 
  FaChevronRight,
  FaFileAlt,
  FaFileArchive,
  FaSave,
  FaHistory,
  FaPrint,
  FaFilePdf
} from 'react-icons/fa';

/**
 * MultiReportNavigator
 * Report navigator panel inside TestReportForm.
 * Now features:
 * - Single Report actions: Print / Download PDF on each card
 * - All Reports actions:
 *   1) Print / PDF of All Reports in ONE combined document
 *   2) Download All Reports individually (ZIP)
 *   3) Save All Reports to DB
 */
export const MultiReportNavigator = ({
  reports,
  activeReportIndex,
  onSelectReport,
  onAddNewReport,
  onDuplicateReport,
  onRemoveReport,
  onOpenCustomerImport,
  onSaveAll,
  onPrintAllCombined,
  onDownloadAllZip,
  onPrintSingleReport,
  onDownloadSingleReport,
  isBatchSaving,
  validationErrors = {}
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showAddMenu]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative'
      }}
    >
      {/* 1. Header with report count and pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem'
            }}
          >
            <FaLayerGroup />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
            My Reports ({reports.length})
          </span>
        </div>

        {/* Prev / Next buttons */}
        {reports.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              type="button"
              onClick={() => onSelectReport(Math.max(0, activeReportIndex - 1))}
              disabled={activeReportIndex === 0}
              title="Previous Report"
              style={{
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: activeReportIndex === 0 ? '#cbd5e1' : '#475569',
                borderRadius: '5px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeReportIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronLeft size={9} />
            </button>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', padding: '0 3px' }}>
              {activeReportIndex + 1}/{reports.length}
            </span>
            <button
              type="button"
              onClick={() => onSelectReport(Math.min(reports.length - 1, activeReportIndex + 1))}
              disabled={activeReportIndex === reports.length - 1}
              title="Next Report"
              style={{
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: activeReportIndex === reports.length - 1 ? '#cbd5e1' : '#475569',
                borderRadius: '5px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeReportIndex === reports.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronRight size={9} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Add New Report Button & Smart Popover */}
      <div style={{ position: 'relative' }} ref={popoverRef}>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.55rem 0.85rem',
            fontSize: '0.825rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#065f46'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#047857'}
        >
          <FaPlus size={11} />
          <span>+ Add New Report</span>
        </button>

        {showAddMenu && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.18)',
              zIndex: 9999,
              padding: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            {/* Option A: Start Blank */}
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                onAddNewReport('blank');
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#0f172a'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <FaFileAlt size={12} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0f172a' }}>Start Blank</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Fresh report with empty location & sample info</span>
              </div>
            </button>

            {/* Option B: Reuse Active Report */}
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                onAddNewReport('reuse');
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#0f172a'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <FaCopy size={12} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0f172a' }}>Reuse Existing Info</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Retain customer, work & parameters for new location</span>
              </div>
            </button>

            {/* Option C: Import Customer Report */}
            <button
              type="button"
              onClick={() => {
                setShowAddMenu(false);
                if (onOpenCustomerImport) onOpenCustomerImport();
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#0f172a'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <FaHistory size={12} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0f172a' }}>Import Previous Report</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Search previous customer reports from database</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. Reports List with Single Print/Download Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          maxHeight: '380px',
          overflowY: 'auto',
          paddingRight: '2px'
        }}
      >
        {reports.map((rep, idx) => {
          const isSelected = activeReportIndex === idx;
          const hasParams = rep.parametersList && rep.parametersList.length > 0;
          const isReady = rep.samplingLocation && rep.reportIssuedTo && hasParams;
          const errs = validationErrors[idx] || [];
          const hasErr = errs.length > 0;

          return (
            <div
              key={rep._sessionReportId || idx}
              onClick={() => onSelectReport(idx)}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: isSelected ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: isSelected ? '0 1px 4px rgba(34, 197, 94, 0.15)' : 'none'
              }}
            >
              {/* Row 1: Seq Title & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: isSelected ? '#047857' : '#64748b',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Report 0{idx + 1}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Single Report Print / PDF Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPrintSingleReport) onPrintSingleReport(idx);
                    }}
                    title="Print / Save PDF of this report"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaPrint size={11} />
                  </button>

                  {/* Single Report Download HTML/PDF File */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDownloadSingleReport) onDownloadSingleReport(idx);
                    }}
                    title="Download this report document"
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#047857',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaFilePdf size={11} />
                  </button>

                  {/* Remove Button */}
                  {reports.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to remove Report 0${idx + 1} (${rep.samplingLocation || 'Untitled'})?`)) {
                          onRemoveReport(idx);
                        }
                      }}
                      title="Remove report"
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Location Name */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {rep.samplingLocation || 'Untitled Location'}
              </div>

              {/* Row 3: Meta & Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginTop: '1px' }}>
                <span style={{ color: '#64748b' }}>
                  {rep.parametersList?.length || 0} params
                </span>
                {hasErr ? (
                  <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <FaExclamationTriangle size={9} />
                    <span>Error</span>
                  </span>
                ) : isReady ? (
                  <span style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <FaCheck size={9} />
                    <span>Ready</span>
                  </span>
                ) : (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>In Progress</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Batch Actions Footer: Save All, Print All in One PDF, and Download All (ZIP) */}
      {reports.length > 1 && (
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          {/* Action 1: Save All Reports */}
          <button
            type="button"
            onClick={onSaveAll}
            disabled={isBatchSaving}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: isBatchSaving ? 'not-allowed' : 'pointer'
            }}
          >
            <FaSave size={11} />
            <span>{isBatchSaving ? 'Saving Reports...' : `Save All (${reports.length})`}</span>
          </button>

          {/* Action 2: Print & Download All in ONE Combined PDF */}
          <button
            type="button"
            onClick={onPrintAllCombined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Prints all reports in a single combined document or saves as one PDF"
          >
            <FaPrint size={11} />
            <span>Print All in 1 PDF ({reports.length})</span>
          </button>

          {/* Action 3: Download All as ZIP (Separate files per report) */}
          <button
            type="button"
            onClick={onDownloadAllZip}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: '#ffffff',
              color: '#047857',
              border: '1px solid #a7f3d0',
              borderRadius: '7px',
              padding: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Download individual report files packaged in one ZIP archive"
          >
            <FaFileArchive size={11} />
            <span>Download All (ZIP)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiReportNavigator;
