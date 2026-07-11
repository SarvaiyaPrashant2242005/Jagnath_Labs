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
    status: Joi.string().valid("Active", "Inactive").required().messages({
        "any.only": "Status must be Active or Inactive.",
        "any.required": "Status is required."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional(),
    categoryId: Joi.string().trim().optional().allow("", null)
});

const updateParameterSchema = Joi.object({
    parameterName: Joi.string().optional().messages({
        "string.empty": "Parameter Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().messages({
        "any.only": "Status must be Active or Inactive."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional(),
    categoryId: Joi.string().trim().optional().allow("", null)
});


module.exports = {
    createParameterSchema,
    updateParameterSchema
};

