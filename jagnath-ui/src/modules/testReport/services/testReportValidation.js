/**
 * @file testReportValidation.js
 * @description Advanced Report Reliability and Data Integrity Validator (Part 9).
 * Provides strict parameter completeness, unit consistency, reference method validation,
 * duplicate detection, and intelligent report grouping by sampling location & discipline scope.
 */

/**
 * Validates report fields and parameter entries before report generation/saving.
 * @param {Object} formData 
 * @param {Array} parametersList 
 * @returns {Object} { isValid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export const validateReportDataIntegrity = (formData, parametersList = []) => {
  const errors = [];
  const warnings = [];

  // 1. Mandatory Metadata Checks
  if (!formData.reportNumber || !formData.reportNumber.trim()) {
    errors.push('Report Number is required.');
  }
  if (!formData.reportIssuedTo || !formData.reportIssuedTo.trim()) {
    errors.push('Report Issued To (Client details) is required.');
  }
  if (!formData.detailsOfSample || !formData.detailsOfSample.trim()) {
    errors.push('Details of Sample / Sample Particular is required.');
  }
  if (!formData.dateOfReceipt) {
    errors.push('Date of Receipt is required.');
  }

  // 2. Dates chronological consistency
  if (formData.startingDateOfTest && formData.dateOfReceipt) {
    if (formData.startingDateOfTest < formData.dateOfReceipt) {
      errors.push('Starting date of test cannot precede Date of Receipt.');
    }
  }
  if (formData.completionDateOfTest && formData.startingDateOfTest) {
    if (formData.completionDateOfTest < formData.startingDateOfTest) {
      errors.push('Completion date of test cannot precede Starting date of test.');
    }
  }

  // 3. Parameter Completeness & Deduplication (Section 9.2)
  if (!parametersList || parametersList.length === 0) {
    errors.push('At least one testing parameter must be included in the report.');
  } else {
    const seenParams = new Map();

    parametersList.forEach((param, idx) => {
      const pNum = idx + 1;
      const pName = (param.parameterName || '').trim();
      const pLoc = (param.locationOfSample || '').trim();

      if (!pName) {
        errors.push(`Row #${pNum}: Parameter name cannot be empty.`);
      }

      // Check duplicates for same location
      const dedupeKey = `${pLoc}:::${pName.toLowerCase()}`;
      if (pName && seenParams.has(dedupeKey)) {
        errors.push(`Duplicate parameter detected: "${pName}" appears multiple times under location "${pLoc || 'Default'}".`);
      } else if (pName) {
        seenParams.set(dedupeKey, true);
      }

      // Units and reference methods
      if (!param.referenceMethod || !param.referenceMethod.trim()) {
        warnings.push(`Row #${pNum} (${pName || 'Unnamed'}): Reference method is empty.`);
      }

      if (!param.unit || !param.unit.trim()) {
        warnings.push(`Row #${pNum} (${pName || 'Unnamed'}): Unit is unspecified.`);
      }

      // Result availability check
      if (param.result === undefined || param.result === null || String(param.result).trim() === '') {
        warnings.push(`Row #${pNum} (${pName || 'Unnamed'}): Test result is currently blank or pending entry.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Intelligent Report Grouping (Section 9.1).
 * Detects multiple sampling locations or disciplines in a single quotation/TRF
 * and groups parameters into appropriate discrete report datasets.
 * @param {Array} parametersList 
 * @returns {Array<Object>} groups: [{ location: string, parameters: Array, count: number }]
 */
export const groupParametersByLocationScope = (parametersList = []) => {
  if (!Array.isArray(parametersList) || parametersList.length === 0) return [];

  const groupsMap = new Map();

  parametersList.forEach((p, idx) => {
    const loc = (p.locationOfSample || 'Default').trim();
    if (!groupsMap.has(loc)) {
      groupsMap.set(loc, []);
    }
    groupsMap.get(loc).push({
      ...p,
      srNo: String(groupsMap.get(loc).length + 1).padStart(2, '0')
    });
  });

  const result = [];
  groupsMap.forEach((params, location) => {
    result.push({
      location,
      parameters: params,
      count: params.length
    });
  });

  return result;
};

