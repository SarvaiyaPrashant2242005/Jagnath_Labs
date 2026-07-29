/**
 * @file testRequestParameter.validators.js
 * @description Joi validation schemas for TestRequestParameter requests.
 */
const Joi = require("joi");

const createTransactionSchema = Joi.object({
    testRequestId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "any.required": "Test Request ID is required.",
        "string.guid": "Test Request ID must be a valid UUIDv4.",
        "string.empty": "Test Request ID must not be empty."
    }),
    parameterId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "any.required": "Parameter ID is required.",
        "string.guid": "Parameter ID must be a valid UUIDv4.",
        "string.empty": "Parameter ID must not be empty."
    }),
    testMethod: Joi.string().optional().allow("", null),
    price: Joi.number().optional().allow(null),
    unit: Joi.string().optional().allow("", null),
    result: Joi.string().optional().allow("", null),
    remark: Joi.string().optional().allow("", null),
    status: Joi.string().optional().allow("", null),
    enteredBy: Joi.string().optional().allow("", null),
    enteredAt: Joi.string().optional().allow("", null)
}).unknown(true);

const updateTransactionSchema = Joi.object({
    testRequestId: Joi.string().guid({ version: 'uuidv4' }).optional().messages({
        "string.guid": "Test Request ID must be a valid UUIDv4."
    }),
    parameterId: Joi.string().guid({ version: 'uuidv4' }).optional().messages({
        "string.guid": "Parameter ID must be a valid UUIDv4."
    }),
    testMethod: Joi.string().optional().allow("", null),
    price: Joi.number().optional().allow(null),
    unit: Joi.string().optional().allow("", null),
    result: Joi.string().optional().allow("", null),
    remark: Joi.string().optional().allow("", null),
    status: Joi.string().optional().allow("", null),
    enteredBy: Joi.string().optional().allow("", null),
    enteredAt: Joi.string().optional().allow("", null)
}).unknown(true);

module.exports = {
    createTransactionSchema,
    updateTransactionSchema
};
