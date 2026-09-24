/**
 * @file department.validators.js
 * @description Joi validation schemas for Department requests.
 */
const Joi = require("joi");

const createDepartmentSchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Department Name is required.",
        "string.empty": "Department Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").required().messages({
        "any.only": "Status must be Active or Inactive.",
        "any.required": "Status is required."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional()
});

const updateDepartmentSchema = Joi.object({
    name: Joi.string().optional().messages({
        "string.empty": "Department Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().messages({
        "any.only": "Status must be Active or Inactive."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional()
});

module.exports = {
    createDepartmentSchema,
    updateDepartmentSchema
};
