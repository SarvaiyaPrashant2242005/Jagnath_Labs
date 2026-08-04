/**
 * @file excelService.js
 * @description Excel template generation, file parsing, and schema validation service for Master modules.
 */
import * as XLSX from 'xlsx';

/**
 * Normalizes an Excel header for comparison.
 * Trims whitespace, lowercases, removes asterisks, and strips special characters (dots, underscores, hyphens, slashes, spaces).
 */
export const normalizeExcelHeader = (header) => {
  if (!header || typeof header !== 'string') return '';
  return header
    .trim()
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/[._\-/\s]+/g, '');
};

/**
 * Normalizes email address.
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Normalizes phone numbers: converts numbers to strings, trims, and strips formatting.
 */
export const normalizePhone = (phone) => {
  if (phone === null || phone === undefined) return '';
  let str = String(phone).trim();
  if (typeof phone === 'number') {
    if (Number.isInteger(phone)) {
      str = String(phone);
    } else {
      str = phone.toFixed(0);
    }
  }
  return str.replace(/[\s\-\(\)\+]/g, '');
};

/**
 * Normalizes general strings for case-insensitive comparisons.
 */
export const normalizeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str).trim().toLowerCase();
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
 * Master Schema definitions for Excel templates and validation.
 */
export const MASTER_SCHEMAS = {
  client: {
    title: 'Client Master',
    filename: 'Client_Master_Template.xlsx',
    uniqueKeys: ['email', 'clientName'],
    headers: [
      { key: 'clientName', label: 'Client Name *', required: true, type: 'string', aliases: ['clientname', 'clientname*', 'name', 'client_name', 'client Name', 'Client Name *'] },
      { key: 'contactNumber', label: 'Contact Number *', required: true, type: 'string', aliases: ['contactnumber', 'contactnumber*', 'contactno', 'contactno.', 'mobilenumber', 'mobile', 'phone', 'contact_number', 'Contact Number *', 'Contact No'] },
      { key: 'email', label: 'Email', required: false, type: 'email', aliases: ['email', 'emailaddress', 'email_address', 'Email Address'] },
      { key: 'gender', label: 'Gender', required: false, type: 'select', options: ['Male', 'Female', 'Other'], aliases: ['gender', 'Gender'] },
      { key: 'address', label: 'Address', required: false, type: 'string', aliases: ['address', 'communicationaddress', 'communication_address', 'Address', 'Communication Address'] },
      { key: 'city', label: 'City', required: false, type: 'string', aliases: ['city', 'City'] },
      { key: 'state', label: 'State', required: false, type: 'string', aliases: ['state', 'State'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
      { key: 'categoryName', label: 'Discipline Group Name *', required: true, type: 'string', aliases: ['disciplinegroupname', 'disciplinegroupname*', 'disciplinegroup', 'discipline_group', 'groupname', 'name', 'categoryname', 'categoryname*', 'category', 'Discipline Group Name *', 'Category Name'] },
      { key: 'description', label: 'Description', required: false, type: 'string', aliases: ['description', 'Description'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string', aliases: ['disciplinegroup', 'disciplinegroup*', 'disciplinegroupname', 'groupname', 'category', 'categoryname', 'Discipline Group *', 'Discipline Group'] },
      { key: 'name', label: 'Sub Category Name *', required: true, type: 'string', aliases: ['subcategoryname', 'subcategoryname*', 'subcategory', 'subcategory_name', 'name', 'Sub Category Name *'] },
      { key: 'description', label: 'Description', required: false, type: 'string', aliases: ['description', 'Description'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string', aliases: ['disciplinegroup', 'disciplinegroup*', 'disciplinegroupname', 'groupname', 'category', 'categoryname', 'Discipline Group *'] },
      { key: 'subCategoryName', label: 'Sub Category', required: false, type: 'string', aliases: ['subcategory', 'subcategoryname', 'subcategory_name', 'Sub Category'] },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string', aliases: ['parametername', 'parametername*', 'name', 'parameter', 'Parameter Name *'] },
      { key: 'testMethod', label: 'Test Method', required: false, type: 'string', aliases: ['testmethod', 'test_method', 'Test Method'] },
      { key: 'description', label: 'Description', required: false, type: 'string', aliases: ['description', 'Description'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
      { key: 'categoryName', label: 'Discipline Group *', required: true, type: 'string', aliases: ['disciplinegroup', 'disciplinegroup*', 'disciplinegroupname', 'groupname', 'category', 'categoryname', 'Discipline Group *'] },
      { key: 'subCategoryName', label: 'Sub Category', required: false, type: 'string', aliases: ['subcategory', 'subcategoryname', 'subcategory_name', 'Sub Category'] },
      { key: 'parameterName', label: 'Parameter Name *', required: true, type: 'string', aliases: ['parametername', 'parametername*', 'name', 'parameter', 'Parameter Name *'] },
      { key: 'price', label: 'Price *', required: true, type: 'number', aliases: ['price', 'price*', 'rate', 'Price *'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
      { key: 'name', label: 'Full Name *', required: true, type: 'string', aliases: ['fullname', 'fullname*', 'name', 'Full Name *'] },
      { key: 'email', label: 'Email *', required: true, type: 'email', aliases: ['email', 'email*', 'emailaddress', 'Email *'] },
      { key: 'password', label: 'Initial Password', required: false, type: 'string', aliases: ['password', 'initialpassword', 'Initial Password'] },
      { key: 'role', label: 'Role', required: false, type: 'select', options: ['Admin', 'Technician', 'Sampler', 'User'], aliases: ['role', 'Role'] },
      { key: 'status', label: 'Status', required: false, type: 'select', options: ['Active', 'Inactive'], aliases: ['status', 'Status'] }
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
 * @param {string} masterType
 */
export const downloadTemplate = (masterType) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema) return;

  const worksheet = XLSX.utils.json_to_sheet(schema.sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

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

  XLSX.writeFile(workbook, `${masterType}_Failed_Rows_${Date.now()}.xlsx`);
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

  const evaluatedRows = [];
  const seenEmailsInFile = new Map();
  const seenPhonesInFile = new Map();
  const seenNamesInFile = new Map();

  let validRowNum = 0;

  rawRows.forEach((row) => {
    // 14. Ignore completely empty Excel rows
    const isRowEmpty = Object.values(row).every(val => val === null || val === undefined || String(val).trim() === '');
    if (isRowEmpty) {
      return;
    }

    validRowNum++;
    const normalizedData = {};
    const cellErrors = {};
    let isRowValid = true;

    // Initialize all schema fields with empty strings
    schema.headers.forEach(h => {
      normalizedData[h.key] = '';
    });

    // Map Excel header labels to internal keys using central header normalization & aliases
    Object.keys(row).forEach(rawHeader => {
      const normRaw = normalizeExcelHeader(rawHeader);
      
      // Look for a matching schema header field
      const matchedField = schema.headers.find(h => {
        if (normalizeExcelHeader(h.key) === normRaw) return true;
        if (normalizeExcelHeader(h.label) === normRaw) return true;
        if (h.aliases && h.aliases.some(alias => normalizeExcelHeader(alias) === normRaw)) return true;
        return false;
      });

      if (matchedField) {
        const rawVal = row[rawHeader];
        let cleanedVal = '';
        if (rawVal !== undefined && rawVal !== null) {
          if (matchedField.key === 'contactNumber') {
            cleanedVal = normalizePhone(rawVal);
          } else {
            cleanedVal = String(rawVal).trim();
          }
        }
        normalizedData[matchedField.key] = cleanedVal;
      }
    });

    // Run schema validations per field
    schema.headers.forEach(h => {
      const val = (normalizedData[h.key] || '').trim();

      // Required field check
      if (h.required && (!val || val === '')) {
        cellErrors[h.key] = `${h.label} is required.`;
        isRowValid = false;
      }

      // Email format check
      if (h.type === 'email' && val && val !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          cellErrors[h.key] = 'Invalid email address format.';
          isRowValid = false;
        }
      }

      // Number validation (e.g. Price)
      if (h.type === 'number' && val && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          cellErrors[h.key] = 'Must be a valid number.';
          isRowValid = false;
        } else if (num < 0) {
          cellErrors[h.key] = 'Cannot be a negative number.';
          isRowValid = false;
        }
      }

      // Case-insensitive matching for select options (Status / Gender)
      if (h.type === 'select' && val && val !== '') {
        const matchedOption = h.options.find(opt => opt.trim().toLowerCase() === val.toLowerCase());
        if (matchedOption) {
          normalizedData[h.key] = matchedOption;
        } else {
          cellErrors[h.key] = `Invalid value. Choose from: ${h.options.join(', ')}`;
          isRowValid = false;
        }
      }

      // Default Status to Active if not provided
      if (h.key === 'status' && !normalizedData['status']) {
        normalizedData['status'] = 'Active';
      }
    });

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
        if (nEmail) seenEmailsInFile.set(nEmail, validRowNum);
        if (nPhone) seenPhonesInFile.set(nPhone, validRowNum);
      }
    } else if (masterType === 'category' || masterType === 'parameter') {
      const fieldKey = masterType === 'category' ? 'categoryName' : 'parameterName';
      const nName = normalizeString(normalizedData[fieldKey]);

      if (nName && seenNamesInFile.has(nName)) {
        const msg = `Duplicate ${masterType === 'category' ? 'discipline group' : 'parameter'} in uploaded file. First found at row ${seenNamesInFile.get(nName)}.`;
        cellErrors[fieldKey] = msg;
        cellErrors['_row'] = msg;
        isRowValid = false;
      } else if (nName) {
        seenNamesInFile.set(nName, validRowNum);
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
        const nCatName = normalizeString(normalizedData.categoryName);
        const dbCat = existingDbRecords.find(c => normalizeString(c.name || c.categoryName) === nCatName);
        if (dbCat) {
          isDbMatch = true;
          matchingDbId = dbCat.id;
        }
      } else if (masterType === 'parameter') {
        const nParamName = normalizeString(normalizedData.parameterName);
        const dbParam = existingDbRecords.find(p => normalizeString(p.parameterName || p.name) === nParamName);
        if (dbParam) {
          isDbMatch = true;
          matchingDbId = dbParam.id;
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
      _id: `row_${validRowNum}_${Date.now()}`,
      _originalIndex: validRowNum,
      _status: statusTag,
      _errors: cellErrors,
      _dbId: matchingDbId,
      data: normalizedData
    });
  });

  return evaluatedRows;
};
