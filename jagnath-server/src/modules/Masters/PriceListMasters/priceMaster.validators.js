/**
 * @file priceMaster.validators.js
 * @description Joi validation schemas for Price Master.
 */

const Joi = require("joi");

const createPriceSchema = Joi.object({
    categoryId: Joi.string().uuid().required().messages({
        "any.required": "Category is required.",
        "string.empty": "Category cannot be empty."
    }),
    parameterId: Joi.string().uuid().required().messages({
        "any.required": "Parameter is required.",
        "string.empty": "Parameter cannot be empty."
    }),
    price: Joi.number().min(0).required().messages({
        "number.min": "Price cannot be negative.",
        "any.required": "Price is required."
    }),
    status: Joi.string().valid("Active", "Inactive").default("Active"),
    companyId: Joi.string().uuid().optional(),
    company_id: Joi.string().uuid().optional()
});

const updatePriceSchema = Joi.object({
    categoryId: Joi.string().uuid().optional(),
    subCategoryId: Joi.string().uuid().optional().allow("", null),
    parameterId: Joi.string().uuid().optional(),
    price: Joi.number().min(0).optional().messages({
        "number.min": "Price cannot be negative."
    }),
    status: Joi.string().valid("Active", "Inactive").optional(),
    companyId: Joi.string().uuid().optional(),
    company_id: Joi.string().uuid().optional()
});

module.exports = {
    createPriceSchema,
    updatePriceSchema
};
