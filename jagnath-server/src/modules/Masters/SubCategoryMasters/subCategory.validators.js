/**
 * @file subCategory.validators.js
 * @description Joi validation schemas for SubCategories.
 */

const Joi = require("joi");

const createSubCategorySchema = Joi.object({
    companyId: Joi.string().uuid().optional(),
    categoryId: Joi.string().uuid().required().messages({
        "any.required": "Discipline Group (Category) ID is required",
        "string.guid": "Discipline Group (Category) ID must be a valid UUID"
    }),
    name: Joi.string().trim().min(2).max(150).required().messages({
        "string.empty": "Sub Category name cannot be empty",
        "any.required": "Sub Category name is required"
    }),
    description: Joi.string().trim().allow("", null).optional(),
    status: Joi.string().valid("Active", "Inactive").default("Active")
});

const updateSubCategorySchema = Joi.object({
    categoryId: Joi.string().uuid().optional(),
    name: Joi.string().trim().min(2).max(150).optional(),
    description: Joi.string().trim().allow("", null).optional(),
    status: Joi.string().valid("Active", "Inactive").optional()
});

module.exports = {
    createSubCategorySchema,
    updateSubCategorySchema
};
