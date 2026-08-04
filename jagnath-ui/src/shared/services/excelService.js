/**
 * @file excelService.js
 * @description Excel template generation, file parsing, and schema validation service for Master modules.
 */
import * as XLSX from 'xlsx';

/**
 * Master Schema definitions for Excel templates and validation.
 */
export const MASTER_SCHEMAS = {
  client: {
    title: 'Client Master',
    filename: 'Client_Master_Template.xlsx',
    uniqueKeys: ['email', 'clientName'],
    headers: [
      { key: 'clientName', label: 'Client Name *', required: true, type: 'string' },
      { key: 'contactNumber', label: 'Contact Number *', required: true, type: 'string' },
      { key: 'email', label: 'Email', required: false, type: 'email' },
      { key: 'gender', label: 'Gender', required: false, type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'address', label: 'Address', required: false, type: 'string' },
      { key: 'city', label: 'City', required: false, type: 'string' },
      { key: 'state', label: 'State', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Client Name *': 'Alpha Technologies Pvt Ltd',
        'Contact Number *': '9876543210',
        'Email': 'contact@alphatech.com',
        'Gender': 'Male',
        'Address': '123 Tech Park',
        'City': 'Surat',
        'State': 'Gujarat',
        'Status': 'Active'
      },
      {
        'Client Name *': 'Green Eco Solutions',
        'Contact Number *': '9123456789',
        'Email': 'info@greeneco.org',
        'Gender': 'Female',
        'Address': '45 Eco Zone',
        'City': 'Ahmedabad',
        'State': 'Gujarat',
        'Status': 'Active'
      }
    ]
  },

  category: {
    title: 'Discipline Group Master',
    filename: 'Discipline_Group_Master_Template.xlsx',
    uniqueKeys: ['categoryName'],
    headers: [
      { key: 'categoryName', label: 'Discipline Group Name *', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Discipline Group Name *': 'Drinking Water',
        'Description': 'Packaged and municipal drinking water quality testing',
        'Status': 'Active'
      },
      {
        'Discipline Group Name *': 'Industrial Effluent',
        'Description': 'Chemical and biological testing of industrial discharge water',
        'Status': 'Active'
      }
    ]
  },

  subCategory: {
    title: 'Sub Category Master',
    filename: 'Sub_Category_Master_Template.xlsx',
    uniqueKeys: ['categoryName', 'name'],
    headers: [
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string' },
      { key: 'name', label: 'Sub Category Name *', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category Name *': 'Physical Parameters',
        'Description': 'Color, Odor, pH and Physical attributes',
        'Status': 'Active'
      },
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category Name *': 'Chemical Parameters',
        'Description': 'Hardness, Chlorides, Nitrates and Heavy metals',
        'Status': 'Active'
      }
    ]
  },

  parameter: {
    title: 'Parameter Master',
    filename: 'Parameter_Master_Template.xlsx',
    uniqueKeys: ['parameterName'],
    headers: [
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string' },
      { key: 'subCategoryName', label: 'Sub Category', required: false, type: 'string' },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string' },
      { key: 'testMethod', label: 'Test Method', required: false, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category': 'Physical Parameters',
        'Parameter Name *': 'pH Level',
        'Test Method': 'APHA, 23rd Edition 2017/4500-H-B',
        'Description': 'Acidity or alkalinity measure of water',
        'Status': 'Active'
      },
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category': 'Physical Parameters',
        'Parameter Name *': 'Total Dissolved Solids (TDS)',
        'Test Method': 'IS 3025 (Part 16)',
        'Description': 'Inorganic salts and small amounts of organic matter dissolved in water',
        'Status': 'Active'
      }
    ]
  },

  pricelist: {
    title: 'Price List Master',
    filename: 'Price_List_Template.xlsx',
    uniqueKeys: ['categoryName', 'parameterName'],
    headers: [
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string' },
      { key: 'subCategoryName', label: 'Sub Category', required: false, type: 'string' },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string' },
      { key: 'price', label: 'Price *', required: true, type: 'number' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category': 'Physical Parameters',
        'Parameter Name *': 'pH Value',
        'Price *': 250,
        'Status': 'Active'
      },
      {
        'Discipline Group *': 'Drinking Water',
        'Sub Category': 'Physical Parameters',
        'Parameter Name *': 'Total Dissolved Solids (TDS)',
        'Price *': 350,
        'Status': 'Active'
      }
    ]
  },

  user: {
    title: 'User Master',
    filename: 'User_Master_Template.xlsx',
    uniqueKeys: ['email'],
    headers: [
      { key: 'name', label: 'Full Name *', required: true, type: 'string' },
      { key: 'email', label: 'Email *', required: true, type: 'email' },
      { key: 'password', label: 'Initial Password', required: false, type: 'string' },
      { key: 'role', label: 'Role', required: false, type: 'select', options: ['Admin', 'Technician', 'Sampler', 'User'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Full Name *': 'Ramesh Patel',
        'Email *': 'ramesh@jagnath.com',
        'Initial Password': 'User@123',
        'Role': 'Technician',
        'Status': 'Active'
      },
      {
        'Full Name *': 'Suresh Shah',
        'Email *': 'suresh@jagnath.com',
        'Initial Password': 'User@123',
        'Role': 'Sampler',
        'Status': 'Active'
      }
    ]
  }
};

/**
 * Downloads pre-structured Excel template file for specified Master.
 * @param {string} masterType - 'client' | 'category' | 'parameter' | 'pricelist' | 'user'
 */
export const downloadTemplate = (masterType) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema) return;

  const worksheet = XLSX.utils.json_to_sheet(schema.sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, schema.filename);
};

/**
 * Parses uploaded Excel file into raw JSON rows.
 * @param {File} file
 * @returns {Promise<Array<object>>}
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rawJson);
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validates parsed Excel rows against master schema rules and existing database records.
 *
 * @param {string} masterType
 * @param {Array<object>} rawRows - Raw rows from XLSX sheet
 * @param {Array<object>} existingDbRecords - List of existing records in database for matching
 * @returns {Array<object>} Evaluated row items with status, errors, and normalized field values.
 */
export const validateMasterRows = (masterType, rawRows, existingDbRecords = []) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema) return [];

  // Map header labels to internal object keys
  const labelToKeyMap = {};
  schema.headers.forEach(h => {
    labelToKeyMap[h.label] = h.key;
    // Also support label without asterisk or spaces
    labelToKeyMap[h.label.replace(' *', '').trim()] = h.key;
    // Support internal key name directly (for re-validating edited/deleted rows)
    labelToKeyMap[h.key] = h.key;
  });

  const evaluatedRows = [];
  const seenKeys = new Set(); // To track internal file duplicates

  rawRows.forEach((row, index) => {
    const normalizedData = {};
    const cellErrors = {};
    let isRowValid = true;

    // Normalize keys from Excel labels
    Object.keys(row).forEach(rawHeader => {
      const trimmedHeader = rawHeader.trim();
      const matchedKey = labelToKeyMap[trimmedHeader] || labelToKeyMap[trimmedHeader.replace(' *', '')];
      if (matchedKey) {
        normalizedData[matchedKey] = row[rawHeader] !== undefined && row[rawHeader] !== null ? String(row[rawHeader]) : '';
      }
    });

    // Run schema validations per field
    schema.headers.forEach(h => {
      const rawVal = normalizedData[h.key] !== undefined && normalizedData[h.key] !== null ? String(normalizedData[h.key]) : '';
      const val = rawVal.trim();

      // 1. Required check
      if (h.required && (!val || val === '')) {
        cellErrors[h.key] = `${h.label} is required.`;
        isRowValid = false;
      }

      // 2. Email format check
      if (h.type === 'email' && val && val !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          cellErrors[h.key] = 'Invalid email address format.';
          isRowValid = false;
        }
      }

      // 3. Numeric format check
      if (h.type === 'number' && val && val !== '') {
        if (isNaN(Number(val))) {
          cellErrors[h.key] = 'Must be a valid number.';
          isRowValid = false;
        }
      }

      // 4. Default values for status/role/gender
      if (h.key === 'status' && !normalizedData['status']) {
        normalizedData['status'] = 'Active';
      }
    });

    // Check for internal file duplicates
    let fileDuplicate = false;
    let duplicateKeyVal = '';

    if (schema.uniqueKeys.length > 1) {
      // Composite unique key check (e.g. Category + Parameter for Price List)
      if (schema.uniqueKeys.every(uk => normalizedData[uk] && normalizedData[uk] !== '')) {
        const compositeKeyStr = schema.uniqueKeys
          .map(uk => normalizedData[uk].toLowerCase())
          .join('___');
        if (seenKeys.has(compositeKeyStr)) {
          fileDuplicate = true;
          duplicateKeyVal = schema.uniqueKeys.map(uk => normalizedData[uk]).join(' / ');
        } else {
          seenKeys.add(compositeKeyStr);
        }
      }
    } else {
      // Single unique key check (e.g. email or categoryName)
      schema.uniqueKeys.forEach(uk => {
        if (normalizedData[uk] && normalizedData[uk] !== '') {
          const checkStr = `${uk}:${normalizedData[uk].toLowerCase()}`;
          if (seenKeys.has(checkStr)) {
            fileDuplicate = true;
            duplicateKeyVal = normalizedData[uk];
          } else {
            seenKeys.add(checkStr);
          }
        }
      });
    }

    if (fileDuplicate) {
      cellErrors['_row'] = `Duplicate entry in Excel file (${duplicateKeyVal}).`;
      isRowValid = false;
    }

    // Check for database existing match (Insert vs Update detection)
    let isDbMatch = false;
    let matchingDbId = null;

    if (existingDbRecords && existingDbRecords.length > 0) {
      const dbMatch = existingDbRecords.find(record => {
        // Compare unique keys
        if (masterType === 'client') {
          return (record.email && normalizedData.email && record.email.toLowerCase() === normalizedData.email.toLowerCase()) ||
                 (record.clientName && normalizedData.clientName && record.clientName.toLowerCase() === normalizedData.clientName.toLowerCase());
        }
        if (masterType === 'category') {
          return record.categoryName && normalizedData.categoryName && record.categoryName.toLowerCase() === normalizedData.categoryName.toLowerCase();
        }
        if (masterType === 'parameter') {
          return record.parameterName && normalizedData.parameterName && record.parameterName.toLowerCase() === normalizedData.parameterName.toLowerCase();
        }
        if (masterType === 'user') {
          return record.email && normalizedData.email && record.email.toLowerCase() === normalizedData.email.toLowerCase();
        }
        if (masterType === 'pricelist') {
          return record.categoryName && normalizedData.categoryName && record.categoryName.toLowerCase() === normalizedData.categoryName.toLowerCase() &&
                 record.parameterName && normalizedData.parameterName && record.parameterName.toLowerCase() === normalizedData.parameterName.toLowerCase();
        }
        return false;
      });

      if (dbMatch) {
        isDbMatch = true;
        matchingDbId = dbMatch.id;
      }
    }

    // Determine row overall status tag
    let statusTag = 'NEW';
    if (!isRowValid) {
      statusTag = 'ERROR';
    } else if (isDbMatch) {
      statusTag = 'UPDATE';
    }

    evaluatedRows.push({
      _id: `row_${index}_${Date.now()}`,
      _originalIndex: index + 1,
      _status: statusTag, // 'NEW' | 'UPDATE' | 'ERROR'
      _errors: cellErrors,
      _dbId: matchingDbId,
      data: normalizedData
    });
  });

  return evaluatedRows;
};
