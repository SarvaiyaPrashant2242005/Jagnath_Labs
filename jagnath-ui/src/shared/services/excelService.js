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
    title: 'Category Master',
    filename: 'Category_Master_Template.xlsx',
    uniqueKeys: ['categoryName'],
    headers: [
      { key: 'categoryName', label: 'Category Name *', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Category Name *': 'Drinking Water',
        'Description': 'Packaged and municipal drinking water quality testing',
        'Status': 'Active'
      },
      {
        'Category Name *': 'Industrial Effluent',
        'Description': 'Chemical and biological testing of industrial discharge water',
        'Status': 'Active'
      }
    ]
  },

  parameter: {
    title: 'Parameter Master',
    filename: 'Parameter_Master_Template.xlsx',
    uniqueKeys: ['parameterName'],
    headers: [
      { key: 'categoryName', label: 'Category', required: false, type: 'string' },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string' },
      { key: 'description', label: 'Description', required: false, type: 'string' },
      { key: 'testMethod', label: 'Test Method', required: false, type: 'string' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Category': 'Drinking Water',
        'Parameter Name *': 'pH Level',
        'Description': 'Acidity or alkalinity measure of water',
        'Test Method': 'APHA, 23rd Edition 2017/4500-H-B',
        'Status': 'Active'
      },
      {
        'Category': 'Drinking Water',
        'Parameter Name *': 'Total Dissolved Solids (TDS)',
        'Description': 'Inorganic salts and small amounts of organic matter dissolved in water',
        'Test Method': 'IS 3025 (Part 16)',
        'Status': 'Active'
      }
    ]
  },

  pricelist: {
    title: 'Price List Master',
    filename: 'Price_List_Template.xlsx',
    uniqueKeys: ['categoryName', 'parameterName'],
    headers: [
      { key: 'categoryName', label: 'Category Name *', required: true, type: 'string' },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string' },
      { key: 'price', label: 'Price *', required: true, type: 'number' },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'] }
    ],
    sampleData: [
      {
        'Category Name *': 'Drinking Water',
        'Parameter Name *': 'pH Value',
        'Price *': 250,
        'Status': 'Active'
      },
      {
        'Category Name *': 'Drinking Water',
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

  // Generate Excel file base64 data URL to bypass Chrome insecure download blocks
  const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = schema.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
 * Normalization helpers
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

export const normalizePhone = (phone) => {
  if (phone === null || phone === undefined) return '';
  const str = String(phone).trim();
  return str.replace(/[\s\-\(\)\+]/g, '');
};

export const normalizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
};

/**
 * Sanitizes cell text to protect against formula injection when exporting Excel / CSV.
 */
export const sanitizeSpreadsheetValue = (val) => {
  if (typeof val === 'string' && /^[=\+\-@]/.test(val)) {
    return `'${val}`;
  }
  return val;
};

/**
 * Exports failed rows into a downloadable Excel file.
 */
export const exportFailedRowsToExcel = (masterType, failedRows) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema || !failedRows || failedRows.length === 0) return;

  const exportData = failedRows.map(r => {
    const rowObj = {
      'Row Number': r._originalIndex,
      'Error Messages': Object.values(r._errors || {}).join(' | ')
    };

    schema.headers.forEach(h => {
      rowObj[h.label] = sanitizeSpreadsheetValue(r.data[h.key] || '');
    });

    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Rows');

  const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${masterType}_Failed_Rows_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    const key = h.key;
    const label = h.label;

    labelToKeyMap[label.toLowerCase()] = key;
    labelToKeyMap[label.replace(' *', '').trim().toLowerCase()] = key;
    labelToKeyMap[key.toLowerCase()] = key;
    labelToKeyMap[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = key;

    if (key === 'categoryName' || key === 'name') {
      ['category', 'category name', 'category_name', 'cat name', 'name', 'particulars', 'sample particular'].forEach(alias => {
        labelToKeyMap[alias] = key;
      });
    }
    if (key === 'parameterName') {
      ['parameter', 'parameter name', 'parameter_name', 'param name', 'name', 'test parameter', 'test_parameter'].forEach(alias => {
        labelToKeyMap[alias] = key;
      });
    }
    if (key === 'clientName') {
      ['client', 'client name', 'client_name', 'name', 'customer', 'customer name'].forEach(alias => {
        labelToKeyMap[alias] = key;
      });
    }
    if (key === 'contactNumber') {
      ['contact', 'contact number', 'phone', 'mobile', 'mobile number', 'contact_number', 'phone number'].forEach(alias => {
        labelToKeyMap[alias] = key;
      });
    }
    if (key === 'testMethod') {
      ['method', 'test method', 'test_method', 'standard', 'specification'].forEach(alias => {
        labelToKeyMap[alias] = key;
      });
    }
  });

  const evaluatedRows = [];
  const seenEmailsInFile = new Map();
  const seenPhonesInFile = new Map();
  const seenNamesInFile = new Map();
  const seenCompositeKeys = new Map();

  rawRows.forEach((row, index) => {
    const normalizedData = {};
    const cellErrors = {};
    let isRowValid = true;

    // Map Excel header labels to internal keys
    Object.keys(row).forEach(rawHeader => {
      const cleanHeader = rawHeader.trim().toLowerCase();
      const cleanWithoutStar = cleanHeader.replace(' *', '').trim();
      const matchedKey = labelToKeyMap[cleanHeader] || labelToKeyMap[cleanWithoutStar];
      if (matchedKey) {
        normalizedData[matchedKey] = String(row[rawHeader]).trim();
      }
    });

    // Run schema validations per field
    schema.headers.forEach(h => {
      const val = normalizedData[h.key] || '';

      if (h.required && (!val || val === '')) {
        cellErrors[h.key] = `${h.label} is required.`;
        isRowValid = false;
      }

      if (h.type === 'email' && val && val !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          cellErrors[h.key] = 'Invalid email address format.';
          isRowValid = false;
        }
      }

      if (h.type === 'number' && val && val !== '') {
        if (isNaN(Number(val))) {
          cellErrors[h.key] = 'Must be a valid number.';
          isRowValid = false;
        }
      }

      if (h.key === 'status' && !normalizedData['status']) {
        normalizedData['status'] = 'Active';
      }
    });

    const rowNum = index + 1;

    // Check for internal file duplicates
    if (masterType === 'client') {
      const nEmail = normalizeEmail(normalizedData.email);
      const nPhone = normalizePhone(normalizedData.contactNumber);

      if (nEmail && seenEmailsInFile.has(nEmail)) {
        const msg = `Duplicate email in uploaded file. First found at row ${seenEmailsInFile.get(nEmail)}.`;
        cellErrors['email'] = msg;
        cellErrors['_row'] = msg;
        isRowValid = false;
      }
      
      if (nPhone && seenPhonesInFile.has(nPhone)) {
        const msg = `Duplicate phone number in uploaded file. First found at row ${seenPhonesInFile.get(nPhone)}.`;
        cellErrors['contactNumber'] = msg;
        cellErrors['_row'] = cellErrors['_row'] ? `${cellErrors['_row']} | ${msg}` : msg;
        isRowValid = false;
      }

      if (isRowValid) {
        if (nEmail) seenEmailsInFile.set(nEmail, rowNum);
        if (nPhone) seenPhonesInFile.set(nPhone, rowNum);
      }
    } else if (masterType === 'category' || masterType === 'parameter') {
      const fieldKey = masterType === 'category' ? 'categoryName' : 'parameterName';
      const nName = normalizeString(normalizedData[fieldKey] || normalizedData.name);

      if (nName && seenNamesInFile.has(nName)) {
        const msg = `Duplicate ${masterType} in uploaded file. First found at row ${seenNamesInFile.get(nName)}.`;
        cellErrors[fieldKey] = msg;
        cellErrors['_row'] = msg;
        isRowValid = false;
      } else if (nName) {
        seenNamesInFile.set(nName, rowNum);
      }
    }

    // Check for database existing match (Insert vs Update vs Duplicate Error)
    let isDbMatch = false;
    let matchingDbId = null;

    if (existingDbRecords && existingDbRecords.length > 0) {
      if (masterType === 'client') {
        const nEmail = normalizeEmail(normalizedData.email);
        const nPhone = normalizePhone(normalizedData.contactNumber);

        const emailClient = nEmail ? existingDbRecords.find(c => normalizeEmail(c.email) === nEmail) : null;
        const phoneClient = nPhone ? existingDbRecords.find(c => normalizePhone(c.contactNumber) === nPhone) : null;

        if (emailClient && phoneClient && emailClient.id !== phoneClient.id) {
          const msg = `Email belongs to client ID ${emailClient.id}, but phone number belongs to client ID ${phoneClient.id}.`;
          cellErrors['email'] = msg;
          cellErrors['contactNumber'] = msg;
          cellErrors['_row'] = msg;
          isRowValid = false;
        } else if (emailClient || phoneClient) {
          isDbMatch = true;
          matchingDbId = (emailClient || phoneClient).id;
        }
      } else if (masterType === 'category') {
        const nCatName = normalizeString(normalizedData.categoryName || normalizedData.name);
        const dbCat = existingDbRecords.find(c => normalizeString(c.name || c.categoryName) === nCatName);
        if (dbCat) {
          const msg = 'Category already exists for the selected company.';
          cellErrors['categoryName'] = msg;
          cellErrors['_row'] = msg;
          isRowValid = false;
        }
      } else if (masterType === 'parameter') {
        const nParamName = normalizeString(normalizedData.parameterName || normalizedData.name);
        const dbParam = existingDbRecords.find(p => normalizeString(p.parameterName || p.name) === nParamName);
        if (dbParam) {
          const msg = 'Parameter already exists for the selected company.';
          cellErrors['parameterName'] = msg;
          cellErrors['_row'] = msg;
          isRowValid = false;
        }
      }
    }

    let statusTag = 'NEW';
    if (!isRowValid) {
      statusTag = 'ERROR';
    } else if (isDbMatch) {
      statusTag = 'UPDATE';
    }

    evaluatedRows.push({
      _id: `row_${index}_${Date.now()}`,
      _originalIndex: rowNum,
      _status: statusTag,
      _errors: cellErrors,
      _dbId: matchingDbId,
      data: normalizedData
    });
  });

  return evaluatedRows;
};
