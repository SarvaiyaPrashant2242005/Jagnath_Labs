/**
 * @file testRequest.validators.js
 * @description Joi validation schemas for TestRequest requests.
 */
const Joi = require("joi");

const createTestRequestSchema = Joi.object({
    companyId: Joi.string().required().messages({
        "any.required": "Company ID is required.",
        "string.empty": "Company ID must not be empty."
    }),
    clientId: Joi.string().required().messages({
        "any.required": "Client ID is required.",
        "string.empty": "Client ID must not be empty."
    }),
    address: Joi.string().optional().allow("", null),
    email: Joi.string().optional().allow("", null),
    locationOfSample: Joi.string().optional().allow("", null),
    contactPerson: Joi.string().optional().allow("", null),
    contactNumber: Joi.string().optional().allow("", null),
    dateOfCollection: Joi.string().optional().allow("", null),
    dateOfReceipt: Joi.string().optional().allow("", null),
    sampleCollectedBy: Joi.string().optional().allow("", null),
    sampleQuantity: Joi.string().optional().allow("", null),
    fieldDataSheet: Joi.string().optional().allow("", null),
    packingDetails: Joi.string().optional().allow("", null),
    sampleIdNumber: Joi.string().optional().allow("", null),
    reportNumber: Joi.string().optional().allow("", null),
    sampleParticular: Joi.string().optional().allow("", null),
    equipmentAvailability: Joi.string().optional().allow("", null),
    referenceStandardAvailability: Joi.string().optional().allow("", null),
    sampleAdequacy: Joi.string().optional().allow("", null),
    testMethodAvailability: Joi.string().optional().allow("", null),
    trainedPersonAvailability: Joi.string().optional().allow("", null),
    reportIssueDays: Joi.string().optional().allow("", null),
    reviewedBy: Joi.string().optional().allow("", null),
    customerRepresentativeSignature: Joi.string().optional().allow("", null),
    sampleReceivedSignature: Joi.string().optional().allow("", null),
    customerRepresentativeName: Joi.string().optional().allow("", null),
    sampleReceiverName: Joi.string().optional().allow("", null),
    testProtocol: Joi.string().optional().allow("", null),
    remarks: Joi.string().optional().allow("", null),
    formTitle: Joi.string().optional().allow("", null),
    formType: Joi.string().valid("NABL", "Regular").optional().allow("", null).messages({
        "any.only": "Form Type must be NABL or Regular."
    }),
    includeCaution: Joi.boolean().optional().allow(null),
    cautionId: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null).messages({
        "any.only": "Status must be Active or Inactive."
    })
});

const updateTestRequestSchema = Joi.object({
    companyId: Joi.string().optional().messages({
        "string.empty": "Company ID must not be empty."
    }),
    clientId: Joi.string().optional().messages({
        "string.empty": "Client ID must not be empty."
    }),
    address: Joi.string().optional().allow("", null),
    email: Joi.string().optional().allow("", null),
    locationOfSample: Joi.string().optional().allow("", null),
    contactPerson: Joi.string().optional().allow("", null),
    contactNumber: Joi.string().optional().allow("", null),
    dateOfCollection: Joi.string().optional().allow("", null),
    dateOfReceipt: Joi.string().optional().allow("", null),
    sampleCollectedBy: Joi.string().optional().allow("", null),
    sampleQuantity: Joi.string().optional().allow("", null),
    fieldDataSheet: Joi.string().optional().allow("", null),
    packingDetails: Joi.string().optional().allow("", null),
    sampleIdNumber: Joi.string().optional().allow("", null),
    reportNumber: Joi.string().optional().allow("", null),
    sampleParticular: Joi.string().optional().allow("", null),
    equipmentAvailability: Joi.string().optional().allow("", null),
    referenceStandardAvailability: Joi.string().optional().allow("", null),
    sampleAdequacy: Joi.string().optional().allow("", null),
    testMethodAvailability: Joi.string().optional().allow("", null),
    trainedPersonAvailability: Joi.string().optional().allow("", null),
    reportIssueDays: Joi.string().optional().allow("", null),
    reviewedBy: Joi.string().optional().allow("", null),
    customerRepresentativeSignature: Joi.string().optional().allow("", null),
    sampleReceivedSignature: Joi.string().optional().allow("", null),
    customerRepresentativeName: Joi.string().optional().allow("", null),
    sampleReceiverName: Joi.string().optional().allow("", null),
    testProtocol: Joi.string().optional().allow("", null),
    remarks: Joi.string().optional().allow("", null),
    formTitle: Joi.string().optional().allow("", null),
    formType: Joi.string().valid("NABL", "Regular").optional().allow("", null).messages({
        "any.only": "Form Type must be NABL or Regular."
    }),
    includeCaution: Joi.boolean().optional().allow(null),
    cautionId: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null).messages({
        "any.only": "Status must be Active or Inactive."
    })
});

module.exports = {
    createTestRequestSchema,
    updateTestRequestSchema
};
