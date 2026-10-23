/**
 * @file provisionalQuotation.validators.js
 * @description Joi validation schemas for Provisional and General Quotations.
 */

const Joi = require("joi");

const saveProvisionalQuotationSchema = Joi.object({
    id: Joi.string().optional().allow("", null),
    companyId: Joi.string().optional().allow("", null),
    clientId: Joi.string().optional().allow("", null),
    testRequestId: Joi.string().optional().allow("", null),
    quotationNumber: Joi.string().optional().allow("", null),
    quotationType: Joi.string().optional().allow("", null),
    categoryType: Joi.string().optional().allow("", null),
    quotationCategoryType: Joi.string().optional().allow("", null),
    quotationDate: Joi.string().optional().allow("", null),
    revisedDate: Joi.string().optional().allow("", null),
    financialYear: Joi.string().optional().allow("", null),
    referenceNo: Joi.string().optional().allow("", null),
    qpiNo: Joi.string().optional().allow("", null),
    clientName: Joi.string().optional().allow("", null),
    plantName: Joi.string().optional().allow("", null),
    plantAddress: Joi.string().optional().allow("", null),
    industryType: Joi.string().optional().allow("", null),
    subtotal: Joi.number().optional().allow(null),
    discount: Joi.number().optional().allow(null),
    taxableAmount: Joi.number().optional().allow(null),
    gstPercentage: Joi.number().optional().allow(null),
    gstAmount: Joi.number().optional().allow(null),
    grandTotal: Joi.number().optional().allow(null),
    status: Joi.string().optional().allow("", null),
    version: Joi.any().optional(),
    previousVersionId: Joi.string().optional().allow("", null),
    contactPerson: Joi.string().optional().allow("", null),
    signatoryName: Joi.string().optional().allow("", null),
    signatoryDesignation: Joi.string().optional().allow("", null),
    signatorySignature: Joi.string().optional().allow("", null),
    stampImage: Joi.string().optional().allow("", null),
    quotationData: Joi.any().optional()
}).unknown(true);

module.exports = {
    saveProvisionalQuotationSchema
};
