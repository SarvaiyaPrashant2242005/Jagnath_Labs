/**
 * @file quotationCalculation.utils.js
 * @description Pure calculation utility functions for the Provisional Estimated Quotation module.
 * Operates purely on user-entered / existing master data without hardcoding business results.
 */

/**
 * Calculates transportation charges based on mode.
 * @param {Object} transport - Transport configuration object
 * @returns {number} Calculated transportation charge
 */
export const calculateTransport = (transport) => {
  if (!transport) return 0;
  const mode = transport.mode || 'STATIC';

  if (mode === 'CLIENT_PROVIDED') {
    return 0;
  }

  if (mode === 'STATIC') {
    const ratePerDay = parseFloat(transport.ratePerDay) || 0;
    const days = parseFloat(transport.days) || 0;
    const visits = parseFloat(transport.visits) || 0;
    return Math.round(ratePerDay * days * visits);
  }

  if (mode === 'DYNAMIC') {
    if (!Array.isArray(transport.dynamicRows)) return 0;
    return transport.dynamicRows.reduce((sum, row) => {
      const distanceKm = parseFloat(row.distanceKm) || 0;
      const ratePerKm = parseFloat(row.ratePerKm) || 0;
      const days = parseFloat(row.days) || 1;
      const visits = parseFloat(row.visits) || 1;
      return sum + Math.round(distanceKm * ratePerKm * days * visits);
    }, 0);
  }

  return 0;
};

/**
 * Calculates Dearness Allowance (DA).
 * Formula: Team Members * Days Per Visit * Visits * Rate Per Person Per Day
 * @param {Object} da - DA configuration object
 * @returns {number} Calculated DA charge
 */
export const calculateDA = (da) => {
  if (!da) return 0;
  const teamMembers = parseFloat(da.teamMembers) || 0;
  const daysPerVisit = parseFloat(da.daysPerVisit) || 0;
  const visits = parseFloat(da.visits) || 0;
  const ratePerPersonPerDay = parseFloat(da.ratePerPersonPerDay) || 0;
  return Math.round(teamMembers * daysPerVisit * visits * ratePerPersonPerDay);
};

/**
 * Calculates Accommodation Charges.
 * Formula: Rooms * Room Rate * Nights * Visits
 * @param {Object} acc - Accommodation configuration object
 * @returns {number} Calculated accommodation charge
 */
export const calculateAccommodation = (acc) => {
  if (!acc) return 0;
  const rooms = parseFloat(acc.rooms) || 0;
  const roomRate = parseFloat(acc.roomRate) || 0;
  const nights = parseFloat(acc.nights) || 0;
  const visits = parseFloat(acc.visits) || 0;
  return Math.round(rooms * roomRate * nights * visits);
};

/**
 * Calculates Annexure-I total.
 * Sum of: Audit Fee + Transport + DA + Accommodation
 * @param {Object} annexureI - Annexure-I data
 * @returns {number} Total Annexure-I amount
 */
export const calculateAnnexureI = (annexureI) => {
  if (!annexureI) return 0;
  const auditFee = parseFloat(annexureI.auditFee) || 0;
  const transportTotal = calculateTransport(annexureI.transport);
  const daTotal = calculateDA(annexureI.da);
  const accommodationTotal = calculateAccommodation(annexureI.accommodation);

  return Math.round(auditFee + transportTotal + daTotal + accommodationTotal);
};

/**
 * Calculates a single Annexure-A activity charge based on its calculation type.
 * @param {Object} activity - Single activity item
 * @param {number} defaultVisits - Default visit multiplier
 * @returns {number} Calculated activity amount
 */
export const calculateActivity = (activity, defaultVisits = 3) => {
  if (!activity) return 0;
  if (activity.sampleQty !== undefined || activity.chargePerVisit !== undefined || activity.ratePerSample !== undefined) {
    const row = calculateAnnexureARowCharge(activity, defaultVisits);
    return row.totalCharge;
  }
  const type = activity.calculationType || 'PER_SAMPLE';
  const ratePerSample = parseFloat(activity.ratePerSample) || 0;
  const samplesPerVisit = parseFloat(activity.samplesPerVisit) || 1;
  const visits = parseFloat(activity.visits) || defaultVisits;
  const locations = parseFloat(activity.locations) || 1;

  switch (type) {
    case 'PER_SAMPLE':
      return Math.round(ratePerSample * samplesPerVisit * visits);
    case 'PER_LOCATION':
      return Math.round(ratePerSample * samplesPerVisit * visits * locations);
    case 'PER_VISIT':
      return Math.round(ratePerSample * visits);
    case 'FIXED':
      return Math.round(parseFloat(activity.fixedAmount) || ratePerSample);
    case 'CUSTOM':
      return Math.round(parseFloat(activity.customAmount) || 0);
    default:
      return Math.round(ratePerSample * samplesPerVisit * visits);
  }
};

/**
 * Calculates Annexure-A total charges.
 * @param {Array} activities - List of activity objects
 * @param {number} defaultVisits - Default visit multiplier
 * @returns {number} Total Annexure-A amount
 */
export const calculateAnnexureA = (activities, defaultVisits = 3) => {
  if (!Array.isArray(activities)) return 0;
  return activities.reduce((sum, act) => sum + calculateActivity(act, defaultVisits), 0);
};


/**
 * Calculates the total of main charges.
 * @param {Array} charges - List of main charge objects
 * @returns {number} Total main charges amount
 */
export const calculateMainCharges = (charges) => {
  if (!Array.isArray(charges)) return 0;
  return charges.reduce((sum, chg) => {
    const qty = parseFloat(chg.qty) || 0;
    const rate = parseFloat(chg.rate) || 0;
    return sum + Math.round(qty * rate);
  }, 0);
};

/**
 * Calculates Subtotal / Taxable amount.
 * Formula: Main Charges + Annexure-I + Annexure-A - Discount
 */
export const calculateSubtotal = (mainChargesTotal = 0, annexureITotal = 0, annexureATotal = 0, discount = 0) => {
  const rawSubtotal = (mainChargesTotal || 0) + (annexureITotal || 0) + (annexureATotal || 0) - (parseFloat(discount) || 0);
  return Math.max(0, Math.round(rawSubtotal));
};

/**
 * Calculates GST amount.
 * Formula: Taxable Amount * (GST% / 100)
 */
export const calculateGST = (taxableAmount = 0, gstPercentage = 18) => {
  const tax = parseFloat(taxableAmount) || 0;
  const pct = parseFloat(gstPercentage) || 0;
  return Math.round((tax * pct) / 100);
};

/**
 * Calculates Grand Total.
 * Formula: Taxable Amount + GST Amount
 */
export const calculateGrandTotal = (taxableAmount = 0, gstAmount = 0) => {
  return Math.round((parseFloat(taxableAmount) || 0) + (parseFloat(gstAmount) || 0));
};

/**
 * Derives and generates Annexure-B parameter rate card from selected Annexure-A activities and parameter masters.
 * @param {Array} activities - Selected Annexure-A activities with their parameter IDs
 * @param {Array} allParameters - Real Parameter Master records from API
 * @param {Object} rateOverrides - Map of parameterId -> overridden rate
 * @returns {Array} Formatted Annexure-B list
 */
export const generateAnnexureB = (activities = [], allParameters = [], rateOverrides = {}) => {
  if (!Array.isArray(activities) || !Array.isArray(allParameters)) return [];

  const paramMap = new Map();
  allParameters.forEach(p => {
    if (p && p.id) {
      paramMap.set(p.id, p);
    }
  });

  const annexureBList = [];
  const processedParamKeys = new Set();

  activities.forEach(act => {
    const actParams = Array.isArray(act.parameters) ? act.parameters : [];
    actParams.forEach(paramRef => {
      const paramId = typeof paramRef === 'object' ? paramRef.id : paramRef;
      const paramData = paramMap.get(paramId) || (typeof paramRef === 'object' ? paramRef : null);

      if (paramData) {
        const uniqueKey = `${act.id || act.category || 'act'}_${paramData.id}`;
        if (!processedParamKeys.has(uniqueKey)) {
          processedParamKeys.add(uniqueKey);

          const masterRate = parseFloat(paramData.price || paramData.rate || 0);
          const overrideObj = rateOverrides[uniqueKey] || rateOverrides[paramData.id];
          const isOverridden = overrideObj && overrideObj.isOverridden;
          const quotationRate = isOverridden ? parseFloat(overrideObj.rate) || masterRate : masterRate;

          annexureBList.push({
            uniqueKey,
            activityId: act.id,
            activityName: act.category || act.description || 'General Testing',
            parameterId: paramData.id,
            parameterName: paramData.parameterName || paramData.name || 'Unnamed Parameter',
            testMethod: paramData.testMethod || 'Standard Method',
            unit: paramData.unit || '-',
            permissibleLimit: paramData.permissible_limit || paramData.permissibleLimit || '-',
            masterRate,
            quotationRate,
            isOverridden: !!isOverridden,
          });
        }
      }
    });
  });

  return annexureBList;
};

/**
 * Maps a year (e.g. 2025 -> 'H', 2026 -> 'I', 2027 -> 'J')
 */
export const getYearLetter = (year) => {
  const y = parseInt(year, 10) || new Date().getFullYear();
  // 2025 -> 'H' (ASCII 72)
  const code = 72 + (y - 2025);
  return String.fromCharCode(Math.max(65, Math.min(90, code)));
};

/**
 * Returns audit department acronym: EAC for Environment, FAC for Food, etc.
 */
export const getDepartmentCode = (dept = '') => {
  const d = String(dept).trim().toUpperCase();
  if (d.includes('FOOD') || d === 'FAC') return 'FAC';
  if (d.includes('ENV') || d === 'EAC') return 'EAC';
  return 'EAC';
};

/**
 * Strips duplicate prefix "Q-P.I :-" from quotation number
 */
export const cleanQuotationNumber = (num = '') => {
  if (!num) return '';
  return String(num).replace(/^(Q-?P\.?I\s*:-?\s*)+/gi, '').trim();
};

/**
 * Generates quotation number in format: JLT/EAC/MM-YY/A<YearLetter><SrNo>
 * Example: JLT/EAC/05-25/AH001, JLT/EAC/09-26/AI001, JLT/FAC/09-26/AI002
 */
export const generateQuotationNumber = (dept = 'ENVIRONMENTAL', date = new Date(), srNo = 1, companyPrefix = 'JLT') => {
  const d = date instanceof Date ? date : (date ? new Date(date) : new Date());
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const fullYear = validDate.getFullYear();
  const yearShort = String(fullYear).slice(-2);
  
  const deptCode = getDepartmentCode(dept);
  const yearLetter = getYearLetter(fullYear);
  const formattedSr = String(srNo).padStart(3, '0'); // e.g. 001, 002
  
  return `${companyPrefix}/${deptCode}/${month}-${yearShort}/A${yearLetter}${formattedSr}`;
};

/**
 * Calculates total rate for a single discipline group in Annexure-B.
 */
export const calculateGroupTotal = (group) => {
  if (!group || !Array.isArray(group.parameters)) return 0;
  return group.parameters.reduce((sum, p) => sum + (parseFloat(p.rate) || 0), 0);
};

/**
 * Calculates the overall total rate across all discipline groups in Annexure-B.
 */
export const calculateAnnexureBTotal = (groups = []) => {
  if (!Array.isArray(groups)) return 0;
  return groups.reduce((sum, g) => sum + calculateGroupTotal(g), 0);
};

/**
 * Maps TRF annexure items to discipline group structure for Annexure-B.
 */
export const mapTRFAnnexureToGroups = (annexureItems) => {
  if (!Array.isArray(annexureItems) || annexureItems.length === 0) return null;
  const groupsMap = new Map();
  annexureItems.forEach((item, idx) => {
    const rawCat = (item.category || item.group || '1. General Analysis').trim();
    let srNo = '';
    let cleanCat = rawCat;
    const match = rawCat.match(/^([0-9]+[A-Za-z\-]*)\.\s*(.*)$/);
    if (match) {
      srNo = match[1];
      cleanCat = match[2];
    } else {
      srNo = String(groupsMap.size + 1);
    }

    if (!groupsMap.has(rawCat)) {
      groupsMap.set(rawCat, {
        id: 'grp_' + (idx + 1) + '_' + Math.random().toString(36).substr(2, 4),
        srNo: srNo,
        category: cleanCat,
        parameters: []
      });
    }
    groupsMap.get(rawCat).parameters.push({
      id: 'p_' + idx + '_' + Math.random().toString(36).substr(2, 4),
      description: item.description || item.parameterName || item.name || 'Parameter',
      rate: parseFloat(item.ratePerSample || item.rate || 0) || 0
    });
  });
  return Array.from(groupsMap.values());
};

/**
 * Builds Annexure-B containing ONLY parameters selected in the chosen TRF, grouped by Discipline Group.
 */
export const buildAnnexureBFromTRF = (selectedTR, trParams = [], masters = {}) => {
  if (!selectedTR) return [];

  // 1. If TR has explicit annexure items saved from TRF Audit Quotation
  if (Array.isArray(selectedTR.annexure) && selectedTR.annexure.length > 0) {
    const mapped = mapTRFAnnexureToGroups(selectedTR.annexure);
    if (mapped && mapped.length > 0) return mapped;
  }

  // 2. If TR has test request parameters (checked in TRF)
  const paramList = Array.isArray(trParams) && trParams.length > 0 
    ? trParams 
    : (Array.isArray(selectedTR.testRequestParameters) ? selectedTR.testRequestParameters : (Array.isArray(selectedTR.parameters) ? selectedTR.parameters : []));

  if (Array.isArray(paramList) && paramList.length > 0) {
    const groupsMap = new Map();
    const allParams = masters.parameters || [];
    const allCats = masters.categories || [];
    const allSubCats = masters.subCategories || [];
    const priceMasters = masters.priceMasters || [];

    paramList.forEach((trp, idx) => {
      const pId = trp.parameterId || trp.parameter_id || (typeof trp.parameter === 'object' ? trp.parameter?.id : trp.id);
      const paramObj = (typeof trp.parameter === 'object' && trp.parameter) ? trp.parameter : allParams.find(p => p.id === pId);

      const desc = paramObj?.parameterName || paramObj?.name || trp.description || trp.name || `Parameter #${idx + 1}`;
      
      // Determine rate
      let rate = parseFloat(trp.price);
      if (isNaN(rate) || rate === 0) {
        const pm = priceMasters.find(pr => pr.parameterId === pId || pr.parameter_id === pId);
        if (pm) rate = parseFloat(pm.price || pm.rate || 0);
      }
      if (isNaN(rate) || rate === 0) {
        rate = parseFloat(paramObj?.price || paramObj?.rate || 0) || 0;
      }

      // Determine Category / Discipline
      let cat = '';
      if (paramObj?.category && typeof paramObj.category === 'object') {
        cat = paramObj.category.name || paramObj.category.categoryName || '';
      } else if (paramObj?.categoryId) {
        const foundCat = allCats.find(c => c.id === paramObj.categoryId);
        if (foundCat) cat = foundCat.name || foundCat.categoryName || '';
      } else if (typeof paramObj?.category === 'string') {
        cat = paramObj.category;
      }

      if (!cat && paramObj?.subCategoryId) {
        const foundSub = allSubCats.find(s => s.id === paramObj.subCategoryId);
        if (foundSub) cat = foundSub.name || foundSub.subCategoryName || '';
      }

      if (!cat) {
        cat = selectedTR.sampleParticular || selectedTR.sampleParticularName || selectedTR.category?.name || 'General Water Analysis';
      }

      const rawCat = cat.trim();
      let srNo = '';
      let cleanCat = rawCat;
      const match = rawCat.match(/^([0-9]+[A-Za-z\-]*)\.\s*(.*)$/);
      if (match) {
        srNo = match[1];
        cleanCat = match[2];
      } else {
        srNo = String(groupsMap.size + 1);
      }

      if (!groupsMap.has(rawCat)) {
        groupsMap.set(rawCat, {
          id: 'grp_' + (groupsMap.size + 1) + '_' + Math.random().toString(36).substr(2, 4),
          srNo: srNo,
          category: cleanCat,
          parameters: []
        });
      }

      groupsMap.get(rawCat).parameters.push({
        id: 'p_' + idx + '_' + Math.random().toString(36).substr(2, 4),
        description: desc,
        rate: isNaN(rate) ? 0 : rate
      });
    });

    return Array.from(groupsMap.values());
  }

  return [];
};

/**
 * Calculates a single Annexure-A activity row charges.
 */
export const calculateAnnexureARowCharge = (activity, globalVisits = 3) => {
  if (!activity) return { rate: 0, qty: 1, visits: 3, chargePerVisit: 0, totalCharge: 0 };
  const rate = parseFloat(activity.ratePerSample) || 0;
  const qty = parseFloat(activity.sampleQty !== undefined ? activity.sampleQty : 1) || 1;
  const visits = parseInt(activity.visits !== undefined ? activity.visits : globalVisits, 10) || 3;
  
  const chargePerVisit = activity.isChargeOverridden && activity.chargePerVisit !== undefined
    ? (parseFloat(activity.chargePerVisit) || 0)
    : Math.round(rate * qty);

  const totalCharge = Math.round(chargePerVisit * visits);
  return { rate, qty, visits, chargePerVisit, totalCharge };
};

/**
 * Calculates Annexure-A grand totals across all activity rows.
 */
export const calculateAnnexureATotals = (activities = [], globalVisits = 3) => {
  if (!Array.isArray(activities)) return { totalRate: 0, totalChargePerVisit: 0, totalAnnualCharge: 0 };
  return activities.reduce((acc, act) => {
    const { rate, chargePerVisit, totalCharge } = calculateAnnexureARowCharge(act, globalVisits);
    return {
      totalRate: acc.totalRate + rate,
      totalChargePerVisit: acc.totalChargePerVisit + chargePerVisit,
      totalAnnualCharge: acc.totalAnnualCharge + totalCharge,
    };
  }, { totalRate: 0, totalChargePerVisit: 0, totalAnnualCharge: 0 });
};

/**
 * Builds or synchronizes Annexure-A rows dynamically from Annexure-B Discipline Groups.
 */
export const syncAnnexureAFromAnnexureB = (annexureBGroups = [], existingActivities = [], defaultVisits = 3) => {
  if (!Array.isArray(annexureBGroups) || annexureBGroups.length === 0) {
    return existingActivities || [];
  }

  const existingMap = new Map();
  (existingActivities || []).forEach(act => {
    if (act.groupId) existingMap.set(act.groupId, act);
    else if (act.srNo) existingMap.set(act.srNo, act);
    else if (act.description) existingMap.set(act.description.trim().toLowerCase(), act);
  });

  return annexureBGroups.map((group, idx) => {
    const existing = existingMap.get(group.id) || existingMap.get(group.srNo) || existingMap.get((group.category || '').trim().toLowerCase());
    const groupRateTotal = calculateGroupTotal(group);
    const catLower = (group.category || '').toLowerCase();
    const isLocation = catLower.includes('air') || catLower.includes('noise') || catLower.includes('stack');

    if (existing) {
      const ratePerSample = existing.isRateOverridden ? (parseFloat(existing.ratePerSample) || groupRateTotal) : groupRateTotal;
      const sampleQty = parseFloat(existing.sampleQty) || 1;
      const chargePerVisit = existing.isChargeOverridden && existing.chargePerVisit !== undefined
        ? parseFloat(existing.chargePerVisit) || 0
        : Math.round(ratePerSample * sampleQty);

      return {
        ...existing,
        groupId: group.id,
        srNo: group.srNo || String(idx + 1),
        description: existing.description || group.category || `Discipline Group ${idx + 1}`,
        parametersMonitored: existing.parametersMonitored || `As per annexure- B, Sr. No. ${group.srNo || idx + 1}`,
        ratePerSample,
        visits: existing.visits !== undefined ? existing.visits : defaultVisits,
        sampleQuarter: existing.sampleQuarter || (isLocation ? `${String(sampleQty).padStart(2, '0')} Locations` : `${String(sampleQty).padStart(2, '0')} Sample`),
        sampleQty,
        chargePerVisit,
      };
    }

    const defaultQty = 1;
    const defaultSampleStr = isLocation ? '01 Locations' : '01 Sample';
    return {
      id: 'act_' + (group.id || (idx + 1)) + '_' + Math.random().toString(36).substr(2, 4),
      groupId: group.id,
      srNo: group.srNo || String(idx + 1),
      description: group.category || `Discipline Group ${idx + 1}`,
      parametersMonitored: `As per annexure- B, Sr. No. ${group.srNo || idx + 1}`,
      ratePerSample: groupRateTotal,
      isRateOverridden: false,
      visits: defaultVisits,
      sampleQuarter: defaultSampleStr,
      sampleQty: defaultQty,
      chargePerVisit: groupRateTotal * defaultQty,
      isChargeOverridden: false,
    };
  });
};

/**
 * Converts a positive integer into words (e.g. 6 -> "six", 9 -> "nine", 12 -> "twelve")
 */
export const getNumberInWords = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return '';
  const words = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 20) return words[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + words[n % 10] : '');
  return String(n);
};

/**
 * Calculates Page 2 "Detail of Charges for carrying out environment audit as per GPCB"
 */
export const calculatePage2Charges = (quotation = {}, annexureATotalParam = null) => {
  const p2 = quotation.page2Charges || {};
  const annI = quotation.annexureI || {};

  // Industry Scale & Audit Fee (Row 1)
  const auditFee = Number(p2.auditFee !== undefined ? p2.auditFee : (annI.auditFee !== undefined ? annI.auditFee : 25000));

  // Visits & Days
  const visits = parseInt(p2.visits !== undefined ? p2.visits : (annI.visits !== undefined ? annI.visits : (quotation.annexureAVisits || 3)), 10) || 3;
  const daysPerVisit = parseInt(p2.daysPerVisit !== undefined ? p2.daysPerVisit : (annI.daysPerVisit !== undefined ? annI.daysPerVisit : 4), 10) || 4;
  const totalDays = Number(p2.daDaysPerYear !== undefined ? p2.daDaysPerYear : (visits * daysPerVisit));

  // Row 1: Audit Report Charges
  const row1Qty = p2.row1Qty !== undefined ? p2.row1Qty : 1;
  const row1Unit = p2.row1Unit || 'No.';
  const row1Amount = Math.round(auditFee * (parseFloat(row1Qty) || 1));

  // Row 2.1: Transportation
  const transportQty = p2.transportQty !== undefined ? p2.transportQty : visits;
  const transportUnit = p2.transportUnit || 'Visit';
  const jltVehicleRatePerDay = Number(p2.jltVehicleRatePerDay !== undefined ? p2.jltVehicleRatePerDay : (annI.jltVehicleRatePerDay !== undefined ? annI.jltVehicleRatePerDay : 5000));
  const defaultTransportRatePerVisit = jltVehicleRatePerDay * daysPerVisit;
  const transportRatePerVisit = Number(p2.transportRatePerVisit !== undefined ? p2.transportRatePerVisit : (annI.transportRatePerVisit !== undefined ? annI.transportRatePerVisit : defaultTransportRatePerVisit));
  const transportTotal = Number(p2.transportTotalAmount !== undefined ? p2.transportTotalAmount : (annI.transportTotalAmount !== undefined ? annI.transportTotalAmount : (transportRatePerVisit * (parseFloat(transportQty) || visits))));
  const autoTransportDaysWord = getNumberInWords(visits * daysPerVisit);
  const transportDaysText = (p2.transportDaysText && p2.transportDaysText !== 'six days') ? p2.transportDaysText : (autoTransportDaysWord ? `${autoTransportDaysWord} days` : `${visits * daysPerVisit} days`);

  // Row 2.2: Dearness Allowance (DA)
  const daQty = p2.daQty !== undefined ? p2.daQty : visits;
  const daUnit = p2.daUnit || 'Visit';
  const daRatePerPerson = Number(p2.daRatePerPerson !== undefined ? p2.daRatePerPerson : 520);
  const daPersons = Number(p2.daPersons !== undefined ? p2.daPersons : 4);
  const daDaysPerYear = Number(p2.daDaysPerYear !== undefined ? p2.daDaysPerYear : totalDays);
  // Formula: Amount = rate(520) * Person per day (4) * Days per year
  const daTotal = Math.round(daRatePerPerson * daPersons * daDaysPerYear);
  // Formula: Rate = amount / Visit
  const daRatePerVisit = (visits && visits > 0) ? Math.round(daTotal / visits) : daTotal;

  // Row 2.3: Accommodation
  const accomQty = p2.accomQty !== undefined ? p2.accomQty : visits;
  const accomUnit = p2.accomUnit || 'Visit';
  const hotelRoomRate = Number(p2.hotelRoomRate !== undefined ? p2.hotelRoomRate : 3000);
  const hotelRoomsCount = Number(p2.hotelRoomsCount !== undefined ? p2.hotelRoomsCount : 2);
  const hotelNightsPerVisit = Number(p2.hotelNightsPerVisit !== undefined ? p2.hotelNightsPerVisit : 2);
  const dailyRoomCost = hotelRoomRate * hotelRoomsCount; // 3000 * 2 = 6000
  const defaultAccomPerVisit = dailyRoomCost * hotelNightsPerVisit; // 6000 * 2 = 12000
  const accomRatePerVisit = Number(p2.accomRatePerVisit !== undefined ? p2.accomRatePerVisit : defaultAccomPerVisit);
  const accomTotal = Number(p2.accomTotalAmount !== undefined ? p2.accomTotalAmount : (accomRatePerVisit * (parseFloat(accomQty) || visits))); // 12000 * 3 = 36000

  // Row 3: Sampling & Analysis (Annexure-A Total)
  let annexureATotal = annexureATotalParam;
  if (annexureATotal === null || annexureATotal === undefined) {
    const actTotals = calculateAnnexureATotals(quotation.activities || [], visits);
    annexureATotal = actTotals.totalAnnualCharge;
  }
  const samplingTotal = Number(annexureATotal || 0);

  // Grand Total & Tax
  const taxableTotal = row1Amount + transportTotal + daTotal + accomTotal + samplingTotal;
  const gstPercentage = parseFloat(quotation.gstPercentage !== undefined ? quotation.gstPercentage : 18);
  const gstAmount = Math.round(taxableTotal * (gstPercentage / 100));
  const grandTotal = taxableTotal + gstAmount;

  return {
    auditFee,
    row1Qty,
    row1Unit,
    row1Amount,
    visits,
    daysPerVisit,
    totalDays,
    transportDaysText,
    // Transport
    jltVehicleRatePerDay,
    transportQty,
    transportUnit,
    transportRatePerVisit,
    transportTotal,
    // DA
    daRatePerPerson,
    daPersons,
    daDaysPerYear,
    daQty,
    daUnit,
    daRatePerVisit,
    daTotal,
    // Accommodation
    hotelRoomRate,
    hotelRoomsCount,
    hotelNightsPerVisit,
    accomQty,
    accomUnit,
    dailyRoomCost,
    accomRatePerVisit,
    accomTotal,
    // Sampling
    samplingTotal,
    // Totals
    taxableTotal,
    gstPercentage,
    gstAmount,
    grandTotal
  };
};

