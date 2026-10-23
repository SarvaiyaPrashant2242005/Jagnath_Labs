/**
 * @file provisionalQuotation.service.js
 * @description Multi-Table Service layer for Quotations.
 * Manages database persistence, financial consistency, versioning, and client/company associations
 * across three separate dedicated tables:
 * 1. audit_quotations (Audit Quotation)
 * 2. regular_quotations (Regular Quotation)
 * 3. general_testing_quotations (General Testing / Consulting Quotation)
 */

const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const AuditQuotation = require("../AuditQuotationForm/auditQuotation.model");
const RegularQuotation = require("../RegularQuotationForm/regularQuotation.model");
const GeneralTestingQuotation = require("../GeneralTestingQuotationForm/generalTestingQuotation.model");
const Client = require("../../Masters/ClientMasters/client.model");
const Company = require("../../Masters/CompanyMasters/company.model");

const isUuid = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

/**
 * Determine which dedicated model corresponds to category / quotation type.
 */
const getModelForCategoryOrType = (categoryType, quotationType) => {
  const cat = (categoryType || "").toLowerCase();
  const qType = (quotationType || "").toLowerCase();

  if (cat === "regular" || qType.includes("regular")) {
    return RegularQuotation;
  }
  if (cat === "general_testing" || cat.includes("general") || qType.includes("general") || qType.includes("consulting")) {
    return GeneralTestingQuotation;
  }
  // Default to Audit Quotation (audit_quotations)
  return AuditQuotation;
};

/**
 * Locate a quotation by ID across all dedicated tables, with legacy fallback.
 */
const findQuotationAcrossModels = async (id) => {
  if (!id) return { record: null, model: null };

  const include = [
    { model: Client, as: "client", required: false },
    { model: Company, as: "company", required: false }
  ];

  // 1. AuditQuotation (audit_quotations)
  let record = await AuditQuotation.findByPk(id, { include });
  if (record) return { record, model: AuditQuotation };

  // 2. RegularQuotation (regular_quotations)
  record = await RegularQuotation.findByPk(id, { include });
  if (record) return { record, model: RegularQuotation };

  // 3. GeneralTestingQuotation (general_testing_quotations)
  record = await GeneralTestingQuotation.findByPk(id, { include });
  if (record) return { record, model: GeneralTestingQuotation };

  return { record: null, model: null };
};

/**
 * Re-flatten quotationData so caller gets full document with authoritative fields.
 */
const formatQuotation = (record) => {
  if (!record) return null;
  const json = typeof record.toJSON === "function" ? record.toJSON() : record;
  const extra = json.quotationData || {};

  const qType = json.quotationType || extra.quotationType || (
    json.charges && json.charges.length > 0 ? "Provisional Estimated Quotation" : "Provisional Estimated Quotation"
  );
  const catType = json.categoryType || extra.categoryType || (
    qType === "Regular Quotation" || qType === "regular" ? "regular" :
    qType === "general_testing" ? "general_testing" : "provisional"
  );

  return {
    ...extra,
    ...json,
    id: json.id,
    quotationNumber: json.quotationNumber,
    quotationType: qType,
    categoryType: catType,
    quotationDate: json.quotationDate,
    status: json.status,
    version: json.version,
    grandTotal: parseFloat(json.grandTotal) || extra.grandTotal || 0,
    subtotal: parseFloat(json.subtotal) || extra.subtotal || 0,
    createdAt: json.created_at || json.createdAt,
    updatedAt: json.updated_at || json.updatedAt,
  };
};

/**
 * List quotations with search, type filters, and pagination across dedicated tables.
 */
const getAllQuotations = async (query = {}) => {
  const {
    companyId,
    quotationType,
    categoryType,
    search,
    limit = 50,
    offset = 0
  } = query;

  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    where[Op.or] = [
      { quotationNumber: { [Op.iLike]: s } },
      { clientName: { [Op.iLike]: s } },
      { plantName: { [Op.iLike]: s } }
    ];
  }

  const include = [
    { model: Client, as: "client", required: false },
    { model: Company, as: "company", required: false }
  ];

  const cat = (categoryType || "").toLowerCase();
  const qType = (quotationType || "").toLowerCase();

  let allRows = [];
  let totalCount = 0;

  if (cat === "regular" || qType.includes("regular")) {
    const { rows, count } = await RegularQuotation.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include
    });
    allRows = rows;
    totalCount = count;
  } else if (cat === "general_testing" || cat.includes("general") || qType.includes("general") || qType.includes("consulting")) {
    const { rows, count } = await GeneralTestingQuotation.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include
    });
    allRows = rows;
    totalCount = count;
  } else if (cat === "provisional" || cat === "audit" || qType.includes("provisional") || qType.includes("audit")) {
    const { rows, count } = await AuditQuotation.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      include
    });
    allRows = rows;
    totalCount = count;
  } else {
    // "all" or unspecified - Fetch from all 3 tables!
    const [auditRes, regRes, genRes] = await Promise.all([
      AuditQuotation.findAll({ where, include, order: [["created_at", "DESC"]] }),
      RegularQuotation.findAll({ where, include, order: [["created_at", "DESC"]] }),
      GeneralTestingQuotation.findAll({ where, include, order: [["created_at", "DESC"]] })
    ]);

    const combined = [...auditRes, ...regRes, ...genRes];

    // Sort chronologically descending
    combined.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    totalCount = combined.length;
    const l = parseInt(limit, 10);
    const o = parseInt(offset, 10);
    allRows = combined.slice(o, o + l);
  }

  const quotations = allRows.map(formatQuotation);
  return { quotations, total: totalCount };
};

/**
 * Fetch single quotation by ID with full snapshot merged across dedicated tables.
 */
const getQuotationById = async (id) => {
  const { record } = await findQuotationAcrossModels(id);
  return formatQuotation(record);
};

/**
 * Save or update quotation snapshot in the appropriate dedicated database table.
 */
const saveQuotationSnapshot = async (data, userCompanyId = null) => {
  const incomingId = data.id;
  const isExistingUuid = incomingId && isUuid(incomingId);

  let existing = null;
  let TargetModel = null;

  if (isExistingUuid) {
    const found = await findQuotationAcrossModels(incomingId);
    if (found.record) {
      existing = found.record;
      TargetModel = found.model;
    }
  }

  // Determine category and quotation types
  const qType = data.quotationType || (existing && existing.quotationType) || "Provisional Estimated Quotation";
  const catType = data.categoryType || data.quotationCategoryType || (existing && existing.categoryType) || (
    qType === 'Regular Quotation' || qType === 'regular' ? 'regular' :
    qType === 'general_testing' ? 'general_testing' : 'provisional'
  );

  if (!TargetModel) {
    TargetModel = getModelForCategoryOrType(catType, qType);
  }

  // Authoritative calculations
  const subtotal = parseFloat(data.subtotal || data.mainChargesTotal || 0);
  const discount = parseFloat(data.discount || data.discountAmount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstPct = parseFloat(data.gstPercentage || 18);
  const gstAmount = parseFloat(data.gstAmount || ((taxableAmount * gstPct) / 100));
  const grandTotal = parseFloat(data.grandTotal || Math.round(taxableAmount + gstAmount));

  // Preserve entire snapshot in quotationData
  const snapshotData = {
    ...data,
    quotationType: qType,
    categoryType: catType,
    subtotal,
    discount,
    taxableAmount,
    gstPercentage: gstPct,
    gstAmount,
    grandTotal
  };

  const payload = {
    companyId: data.companyId || userCompanyId || null,
    clientId: (data.clientId && isUuid(data.clientId)) ? data.clientId : null,
    testRequestId: (data.testRequestId && isUuid(data.testRequestId)) ? data.testRequestId : null,
    quotationNumber: data.quotationNumber || `Q-${Date.now()}`,
    quotationType: qType,
    categoryType: catType,
    quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
    revisedDate: data.revisedDate || "",
    financialYear: data.financialYear || "",
    referenceNo: data.referenceNo || data.reference || "",
    reference: data.reference || data.referenceNo || "",
    qpiNo: data.qpiNo || "",
    clientName: data.clientName || (data.client && data.client.clientName) || "",
    plantName: data.plantName || "",
    plantAddress: data.plantAddress || "",
    industryType: data.industryType || "large",
    subtotal,
    discount,
    taxableAmount,
    gstPercentage: gstPct,
    gstAmount,
    grandTotal,
    status: data.status || "Draft",
    version: parseInt(data.version, 10) || 1,
    previousVersionId: data.previousVersionId || null,
    contactPerson: data.contactPerson || "",
    signatoryName: data.signatoryName || "",
    signatoryDesignation: data.signatoryDesignation || "",
    signatorySignature: data.signatorySignature || "",
    stampImage: data.stampImage || "",
    introText: data.introText || "",
    accreditationText: data.accreditationText || "",
    scopeText: data.scopeText || "",
    termsText: data.termsText || "",
    subject: data.subject || "",
    charges: data.activities || data.charges || [],
    annexure: data.annexureB || data.annexure || [],
    quotationData: snapshotData
  };

  let record;
  if (existing && TargetModel) {
    await existing.update(payload);
    record = existing;
  } else {
    payload.id = isExistingUuid ? incomingId : uuidv4();
    record = await TargetModel.create(payload);
  }

  return await getQuotationById(record.id);
};

/**
 * Soft delete quotation across dedicated tables (Idempotent).
 */
const deleteQuotation = async (id) => {
  if (!id) return false;

  // 1. Try to find active record across models
  const { record } = await findQuotationAcrossModels(id);
  if (record) {
    await record.destroy();
    return true;
  }

  // 2. Check if already soft-deleted in any model (idempotent success)
  const models = [AuditQuotation, RegularQuotation, GeneralTestingQuotation];
  for (const m of models) {
    try {
      const softDeleted = await m.findByPk(id, { paranoid: false });
      if (softDeleted) {
        return true;
      }
    } catch (e) {
      // Continue checking other models
    }
  }

  // If valid UUID format, treat delete as successful idempotently
  if (isUuid(id)) {
    return true;
  }

  return false;
};

/**
 * Duplicate an existing quotation.
 */
const duplicateQuotation = async (id) => {
  const source = await getQuotationById(id);
  if (!source) return null;

  const copy = JSON.parse(JSON.stringify(source));
  delete copy.id;
  copy.quotationNumber = `${source.quotationNumber || 'Q'}-COPY`;
  copy.version = 1;
  copy.status = 'Draft';
  copy.createdAt = new Date().toISOString();

  return await saveQuotationSnapshot(copy);
};

/**
 * Create a new revision of an existing quotation.
 */
const createQuotationRevision = async (id, changeSummary = 'Revision created') => {
  const source = await getQuotationById(id);
  if (!source) return null;

  const currentVersion = parseInt(source.version, 10) || 1;
  const newVersion = currentVersion + 1;

  const revised = JSON.parse(JSON.stringify(source));
  delete revised.id;
  revised.previousVersionId = source.id;
  revised.version = newVersion;
  revised.quotationNumber = source.quotationNumber ? `${source.quotationNumber.split('-R')[0]}-R${newVersion - 1}` : `Q-R${newVersion - 1}`;
  revised.revisedDate = new Date().toISOString().split('T')[0];
  revised.status = 'Revised';
  revised.revisions = [
    ...(source.revisions || []),
    {
      version: currentVersion,
      quotationId: source.id,
      date: source.updatedAt || source.createdAt,
      changeSummary,
      amount: source.grandTotal || 0,
    }
  ];

  return await saveQuotationSnapshot(revised);
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  saveQuotationSnapshot,
  deleteQuotation,
  duplicateQuotation,
  createQuotationRevision
};
