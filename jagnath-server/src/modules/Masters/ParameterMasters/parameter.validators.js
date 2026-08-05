/**
 * @file parameter.validators.js
 * @description Joi validation schemas for Parameter requests.
 */
const Joi = require("joi");

const createParameterSchema = Joi.object({
    parameterName: Joi.string().required().messages({
        "any.required": "Parameter Name is required.",
        "string.empty": "Parameter Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    testMethod: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").default("Active").optional().messages({
        "any.only": "Status must be Active or Inactive."
    }),
    companyName: Joi.string().trim().optional().allow("", null),
    companyId: Joi.string().trim().optional().allow("", null),
    categoryId: Joi.string().trim().optional().allow("", null),
    subCategoryId: Joi.string().trim().optional().allow("", null)
}).unknown(true);

const updateParameterSchema = Joi.object({
    parameterName: Joi.string().optional().messages({
        "string.empty": "Parameter Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    testMethod: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().messages({
        "any.only": "Status must be Active or Inactive."
    }),
    companyName: Joi.string().trim().optional().allow("", null),
    companyId: Joi.string().trim().optional().allow("", null),
    categoryId: Joi.string().trim().optional().allow("", null),
    subCategoryId: Joi.string().trim().optional().allow("", null)
}).unknown(true);


module.exports = {
    createParameterSchema,
    updateParameterSchema
};

