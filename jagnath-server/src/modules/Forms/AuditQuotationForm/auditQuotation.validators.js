/**
 * @file auditQuotation.validators.js
 * @description Joi validation schemas for Audit Quotation requests.
 */

const Joi = require("joi");

const createAuditQuotationSchema = Joi.object({
    testRequestId: Joi.string().required().messages({
        "any.required": "Test Request ID is required.",
        "string.empty": "Test Request ID must not be empty."
    }),
    companyId: Joi.string().required().messages({
        "any.required": "Company ID is required.",
        "string.empty": "Company ID must not be empty."
    }),
    clientId: Joi.string().required().messages({
        "any.required": "Client ID is required.",
        "string.empty": "Client ID must not be empty."
    }),
    quotationNumber: Joi.string().optional().allow("", null),
    quotationDate: Joi.string().optional().allow("", null),
    revisedDate: Joi.string().optional().allow("", null),
    financialYear: Joi.string().optional().allow("", null),
    reference: Joi.string().optional().allow("", null),
    subject: Joi.string().optional().allow("", null),
    introText: Joi.string().optional().allow("", null),
    accreditationText: Joi.string().optional().allow("", null),
    scopeText: Joi.string().optional().allow("", null),
    termsText: Joi.string().optional().allow("", null),
    charges: Joi.array().items(Joi.object({
        srNo: Joi.any().optional(),
        description: Joi.string().optional().allow(""),
        qty: Joi.any().optional(),
        unit: Joi.string().optional().allow(""),
        rate: Joi.any().optional(),
        amount: Joi.any().optional()
    })).optional().allow(null),
    annexure: Joi.array().items(Joi.object({
        category: Joi.string().optional().allow(""),
        description: Joi.string().optional().allow(""),
        ratePerSample: Joi.any().optional(),
        samplePerVisit: Joi.any().optional(),
        chargesPerVisit: Joi.any().optional(),
        total: Joi.any().optional()
    })).optional().allow(null),
    contactPerson: Joi.string().optional().allow("", null),
    signatoryName: Joi.string().optional().allow("", null),
    signatoryDesignation: Joi.string().optional().allow("", null),
    signatorySignature: Joi.string().optional().allow("", null),
    stampImage: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null)
});

const updateAuditQuotationSchema = Joi.object({
    testRequestId: Joi.string().optional(),
    companyId: Joi.string().optional(),
    clientId: Joi.string().optional(),
    quotationNumber: Joi.string().optional().allow("", null),
    quotationDate: Joi.string().optional().allow("", null),
    revisedDate: Joi.string().optional().allow("", null),
    financialYear: Joi.string().optional().allow("", null),
    reference: Joi.string().optional().allow("", null),
    subject: Joi.string().optional().allow("", null),
    introText: Joi.string().optional().allow("", null),
    accreditationText: Joi.string().optional().allow("", null),
    scopeText: Joi.string().optional().allow("", null),
    termsText: Joi.string().optional().allow("", null),
    charges: Joi.array().items(Joi.object({
        srNo: Joi.any().optional(),
        description: Joi.string().optional().allow(""),
        qty: Joi.any().optional(),
        unit: Joi.string().optional().allow(""),
        rate: Joi.any().optional(),
        amount: Joi.any().optional()
    })).optional().allow(null),
    annexure: Joi.array().items(Joi.object({
        category: Joi.string().optional().allow(""),
        description: Joi.string().optional().allow(""),
        ratePerSample: Joi.any().optional(),
        samplePerVisit: Joi.any().optional(),
        chargesPerVisit: Joi.any().optional(),
        total: Joi.any().optional()
    })).optional().allow(null),
    contactPerson: Joi.string().optional().allow("", null),
    signatoryName: Joi.string().optional().allow("", null),
    signatoryDesignation: Joi.string().optional().allow("", null),
    signatorySignature: Joi.string().optional().allow("", null),
    stampImage: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null)
});

module.exports = {
    createAuditQuotationSchema,
    updateAuditQuotationSchema
};
