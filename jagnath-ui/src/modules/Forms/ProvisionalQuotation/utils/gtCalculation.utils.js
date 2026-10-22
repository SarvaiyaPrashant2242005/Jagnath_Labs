/**
 * @file gtCalculation.utils.js
 * @description Dedicated calculation, formatting, and sanitization utilities
 * for General Testing / Consulting Quotations.
 * Completely isolated from legacy quotation utils to prevent regression.
 */

/**
 * Calculates a single pricing row.
 * Formula: Total = No. of Samples × Charges per Sample × (1 - Discount% / 100)
 * Guards against NaN, negative, and empty inputs.
 *
 * @param {Object} item - Line item object
 * @returns {Object} Row with validated fields and auto-calculated total
 */
export const calculatePricingRow = (item = {}) => {
  const rawQty = item.noOfSamples !== undefined && item.noOfSamples !== null && item.noOfSamples !== ''
    ? parseFloat(item.noOfSamples)
    : 1;
  const qty = (!isNaN(rawQty) && rawQty > 0) ? Math.max(1, Math.round(rawQty)) : 1;

  const rawCharge = item.chargesPerSample !== undefined && item.chargesPerSample !== null && item.chargesPerSample !== ''
    ? parseFloat(item.chargesPerSample)
    : 0;
  const unitCharge = (!isNaN(rawCharge) && rawCharge >= 0) ? Math.max(0, rawCharge) : 0;

  let rawDiscount = 0;
  if (item.discountPercent !== undefined && item.discountPercent !== null && item.discountPercent !== '') {
    rawDiscount = parseFloat(item.discountPercent);
  } else if (item.discount !== undefined && item.discount !== null && item.discount !== '') {
    rawDiscount = parseFloat(item.discount);
  }
  const discountPct = (!isNaN(rawDiscount) && rawDiscount >= 0)
    ? Math.max(0, Math.min(100, Math.round(rawDiscount * 100) / 100))
    : 0;

  const rawTotal = qty * unitCharge * (1 - discountPct / 100);
  const total = Math.max(0, Math.round(rawTotal));

  return {
    ...item,
    noOfSamples: qty,
    chargesPerSample: unitCharge,
    discountPercent: discountPct,
    total,
  };
};

/**
 * Calculates totals for the General Testing line items and GST.
 *
 * @param {Array} lineItems - Array of raw line items
 * @param {Object} gstConfig - { enabled: boolean, gstEnabled: boolean, percent: number, gstPercent: number }
 * @returns {Object} Calculated totals and processed rows
 */
export const calculateGeneralTestingTotals = (lineItems = [], gstConfig = {}) => {
  const safeItems = Array.isArray(lineItems) ? lineItems : [];
  const rows = safeItems.map(calculatePricingRow);

  const rawSubtotal = rows.reduce((sum, r) => sum + (r.chargesPerSample * r.noOfSamples), 0);
  const subtotal = rows.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalDiscount = Math.max(0, rawSubtotal - subtotal);

  const gstEnabled = gstConfig.enabled !== false && gstConfig.gstEnabled !== false;
  const rawGstPct = gstConfig.gstPercent !== undefined ? gstConfig.gstPercent : (gstConfig.percent !== undefined ? gstConfig.percent : 18);
  const parsedGstPct = parseFloat(rawGstPct);
  const gstPercent = (!isNaN(parsedGstPct) && parsedGstPct >= 0)
    ? Math.max(0, Math.min(100, parsedGstPct))
    : 18;

  const gstAmount = gstEnabled ? Math.round(subtotal * (gstPercent / 100)) : 0;
  const grandTotal = subtotal + gstAmount;

  return {
    rows,
    rawSubtotal,
    subtotal,
    totalDiscount,
    gstEnabled,
    gstPercent,
    gstAmount,
    grandTotal,
  };
};

/**
 * Formats a number in Indian Currency style (en-IN).
 * e.g. 150000 -> "₹1,50,000", 3500.5 -> "₹3,500.50"
 *
 * @param {number|string} amount
 * @returns {string} Formatted string with ₹ symbol
 */
export const formatIndianCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '₹0';

  const isInteger = Number.isInteger(num);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Generates financial year from a given date (April - March).
 * E.g., for date in May 2026 -> "2026-27"
 *
 * @param {Date|string} dateInput
 * @returns {string} Financial Year string (e.g. "2026-27")
 */
export const getFinancialYearFromDate = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = validDate.getMonth() + 1; // 1-12
  const year = validDate.getFullYear();

  if (month >= 4) {
    const nextYear = String(year + 1).slice(-2);
    return `${year}-${nextYear}`;
  } else {
    const prevYear = year - 1;
    const currYearShort = String(year).slice(-2);
    return `${prevYear}-${currYearShort}`;
  }
};

/**
 * Auto-suggests Quotation Number in pattern AAPL/Q/<running-no>/<financial-year>
 *
 * @param {number|string} runningNo - Running sequence number
 * @param {Date|string} dateInput - Issue date
 * @returns {string} Formatted quotation number
 */
export const generateGTQuotationNumber = (runningNo = '2305000126', dateInput = new Date()) => {
  const fy = getFinancialYearFromDate(dateInput);
  const cleanSeq = String(runningNo).replace(/^0+/, '') || '1';
  const paddedSeq = String(runningNo).length >= 8 ? String(runningNo) : cleanSeq.padStart(8, '0');
  return `AAPL/Q/${paddedSeq}/${fy}`;
};

/**
 * Sanitizes HTML content for Rich Text rendering.
 * Allows safe tags and restricts styles only to list-style-type, padding-left, color, background-color, text-align.
 * Strips script, iframe, embed, object, javascript: URLs, and all on* attributes.
 *
 * @param {string} html - Raw HTML
 * @returns {string} Sanitized safe HTML
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:[^"']*/gi, '#')
    .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '');

  // Filter inline styles to allowed properties only
  sanitized = sanitized.replace(/style=(["'])(.*?)\1/gi, (match, quote, styleStr) => {
    const allowedProps = ['list-style-type', 'padding-left', 'color', 'background-color', 'text-align', 'font-weight', 'text-decoration'];
    const filteredRules = styleStr
      .split(';')
      .map(rule => rule.trim())
      .filter(rule => {
        if (!rule) return false;
        const [prop] = rule.split(':').map(p => p.trim().toLowerCase());
        return allowedProps.includes(prop);
      });
    return filteredRules.length > 0 ? `style=${quote}${filteredRules.join('; ')}${quote}` : '';
  });

  return sanitized;
};

/**
 * Self-executing Dev-Time Verification / Assertion Block.
 * Runs in development environments to ensure calculation precision and zero regression.
 */
export const runGTCalculationSelfTests = () => {
  const results = [];

  // Test 1: Indian Currency Formatting
  const t1 = formatIndianCurrency(150000) === '₹1,50,000';
  results.push({ name: 'Indian Grouping 150000 -> ₹1,50,000', passed: t1 });

  // Test 2: Currency with Decimals
  const t2 = formatIndianCurrency(3500.5) === '₹3,500.50';
  results.push({ name: 'Indian Grouping 3500.5 -> ₹3,500.50', passed: t2 });

  // Test 3: Currency Guard NaN / Empty
  const t3 = formatIndianCurrency(null) === '₹0' && formatIndianCurrency('abc') === '₹0';
  results.push({ name: 'Currency Guard NaN / Null -> ₹0', passed: t3 });

  // Test 4: Row Calculation 0% Discount
  const r0 = calculatePricingRow({ noOfSamples: 2, chargesPerSample: 5000, discountPercent: 0 });
  const t4 = r0.total === 10000;
  results.push({ name: 'Row Calc: 2 × 5000 (0% disc) = 10000', passed: t4 });

  // Test 5: Row Calculation 50% Discount
  const r50 = calculatePricingRow({ noOfSamples: 1, chargesPerSample: 8000, discountPercent: 50 });
  const t5 = r50.total === 4000;
  results.push({ name: 'Row Calc: 1 × 8000 (50% disc) = 4000', passed: t5 });

  // Test 6: Row Calculation 100% Discount
  const r100 = calculatePricingRow({ noOfSamples: 3, chargesPerSample: 2000, discountPercent: 100 });
  const t6 = r100.total === 0;
  results.push({ name: 'Row Calc: 3 × 2000 (100% disc) = 0', passed: t6 });

  // Test 7: GST Calculation ON (18%)
  const items = [
    { noOfSamples: 1, chargesPerSample: 5500, discountPercent: (2000 / 5500) * 100, total: 3500 }, // row 1 in photo: 3500
    { noOfSamples: 1, chargesPerSample: 3000, discountPercent: (1000 / 3000) * 100, total: 2000 }, // row 2 in photo: 2000
  ];
  const gstOn = calculateGeneralTestingTotals(items, { enabled: true, gstPercent: 18 });
  const t7 = gstOn.subtotal === 5500 && gstOn.gstAmount === 990 && gstOn.grandTotal === 6490;
  results.push({ name: 'Totals with GST 18%: Subtotal 5500 + GST 990 = 6490', passed: t7 });

  // Test 8: GST Calculation OFF
  const gstOff = calculateGeneralTestingTotals(items, { enabled: false, gstPercent: 18 });
  const t8 = gstOff.subtotal === 5500 && gstOff.gstAmount === 0 && gstOff.grandTotal === 5500;
  results.push({ name: 'Totals with GST OFF: Subtotal 5500 + GST 0 = 5500', passed: t8 });

  // Test 9: HTML Sanitization of script tags and inline on* handlers
  const dirty = '<p onclick="alert(1)">Hello <script>alert(2)</script><span style="color: red; position: absolute;">World</span></p>';
  const clean = sanitizeHtml(dirty);
  const t9 = !clean.includes('script') && !clean.includes('onclick') && clean.includes('color: red');
  results.push({ name: 'HTML Sanitizer cleans scripts & events, keeps safe style', passed: t9 });

  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    console.warn('[GT Calculation Tests Failed]:', results.filter(r => !r.passed));
  }
  return { allPassed, results };
};

// Run dev-time assertion verification on module load
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  try {
    runGTCalculationSelfTests();
  } catch (e) {
    console.error('GT calculation self-test error:', e);
  }
}
