/**
 * @file category.validators.js
 * @description Joi validation schemas for Category requests.
 */
const Joi = require("joi");

const createCategorySchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Category Name is required.",
        "string.empty": "Category Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").required().messages({
        "any.only": "Status must be Active or Inactive.",
        "any.required": "Status is required."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional()
});

const updateCategorySchema = Joi.object({
    name: Joi.string().optional().messages({
        "string.empty": "Category Name must not be empty."
    }),
    description: Joi.string().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional().messages({
        "any.only": "Status must be Active or Inactive."
    }),
    companyName: Joi.string().trim().optional(),
    companyId: Joi.string().trim().optional()
});

module.exports = {
    createCategorySchema,
    updateCategorySchema
};

