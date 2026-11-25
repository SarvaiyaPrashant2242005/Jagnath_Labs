import React from 'react';
import TestReportDocument from './TestReportDocument';

/**
 * ReportPreviewA4
 * Renders the pixel-perfect A4 document preview using the unified TestReportDocument.
 */
export const ReportPreviewA4 = ({ report, company, withHeaderFooter = true }) => {
  if (!report) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontFamily: '"Times New Roman", serif' }}>
        No report data available for preview.
      </div>
    );
  }

  return (
    <TestReportDocument
      report={report}
      parameters={report.parametersList}
      company={company}
      withHeaderFooter={withHeaderFooter}
      isPrintMode={false}
    />
  );
};

export default ReportPreviewA4;
