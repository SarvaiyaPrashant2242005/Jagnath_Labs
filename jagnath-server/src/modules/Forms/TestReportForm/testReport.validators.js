/**
 * @file testReport.validators.js
 * @description Joi validation schemas for Test Report requests.
 */
const Joi = require("joi");

const createTestReportSchema = Joi.object({
    testRequestId: Joi.string().optional().allow("", null),
    reportNumber: Joi.string().required().messages({
        "any.required": "Report Number is required.",
        "string.empty": "Report Number cannot be empty."
    }),
    referenceNo: Joi.string().optional().allow("", null),
    reportIssuedTo: Joi.string().required().messages({
        "any.required": "Report Issued To is required.",
        "string.empty": "Report Issued To cannot be empty."
    }),
    agencyName: Joi.string().optional().allow("", null),
    agencyAddress: Joi.string().optional().allow("", null),
    detailsOfSample: Joi.string().optional().allow("", null),
    packingDetails: Joi.string().optional().allow("", null),
    dateOfReceipt: Joi.string().optional().allow("", null),
    sampleQuantity: Joi.string().optional().allow("", null),
    samplingLocation: Joi.string().optional().allow("", null),
    conditionOnReceipt: Joi.string().optional().allow("", null),
    sampleCollectedBy: Joi.string().optional().allow("", null),
    nameOfWork: Joi.string().optional().allow("", null),
    startingDateOfTest: Joi.string().optional().allow("", null),
    completionDateOfTest: Joi.string().optional().allow("", null),
    sectionHeader: Joi.string().optional().allow("", null),
    formatNo: Joi.string().optional().allow("", null),
    formatDate: Joi.string().optional().allow("", null),
    reviewedBy: Joi.string().optional().allow("", null),
    authorizedSignatory: Joi.string().optional().allow("", null),
    parametersList: Joi.array().optional().default([]),
    status: Joi.string().optional().default("Completed"),
    showPermissibleLimits: Joi.boolean().optional().default(true),
    companyName: Joi.string().optional().allow("", null),
    companyId: Joi.string().optional().allow("", null)
}).unknown(true);

const updateTestReportSchema = Joi.object({
    testRequestId: Joi.string().optional().allow("", null),
    reportNumber: Joi.string().optional().allow("", null),
    referenceNo: Joi.string().optional().allow("", null),
    reportIssuedTo: Joi.string().optional().allow("", null),
    agencyName: Joi.string().optional().allow("", null),
    agencyAddress: Joi.string().optional().allow("", null),
    detailsOfSample: Joi.string().optional().allow("", null),
    packingDetails: Joi.string().optional().allow("", null),
    dateOfReceipt: Joi.string().optional().allow("", null),
    sampleQuantity: Joi.string().optional().allow("", null),
    samplingLocation: Joi.string().optional().allow("", null),
    conditionOnReceipt: Joi.string().optional().allow("", null),
    sampleCollectedBy: Joi.string().optional().allow("", null),
    nameOfWork: Joi.string().optional().allow("", null),
    startingDateOfTest: Joi.string().optional().allow("", null),
    completionDateOfTest: Joi.string().optional().allow("", null),
    sectionHeader: Joi.string().optional().allow("", null),
    formatNo: Joi.string().optional().allow("", null),
    formatDate: Joi.string().optional().allow("", null),
    reviewedBy: Joi.string().optional().allow("", null),
    authorizedSignatory: Joi.string().optional().allow("", null),
    parametersList: Joi.array().optional(),
    status: Joi.string().optional(),
    showPermissibleLimits: Joi.boolean().optional(),
    companyName: Joi.string().optional().allow("", null),
    companyId: Joi.string().optional().allow("", null)
}).unknown(true);

module.exports = {
    createTestReportSchema,
    updateTestReportSchema
};
