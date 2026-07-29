/**
 * @file caution.validators.js
 * @description Joi validation schema for Caution Master module.
 */

const Joi = require("joi");

const createCautionSchema = Joi.object({
    title: Joi.string().max(150).required().messages({
        "any.required": "Title is required",
        "string.empty": "Title cannot be empty",
        "string.max": "Title must not exceed 150 characters"
    }),
    description: Joi.string().required().messages({
        "any.required": "Description is required",
        "string.empty": "Description cannot be empty"
    }),
    reportType: Joi.string().valid("REGULAR", "NABL", "BOTH").default("BOTH").messages({
        "any.only": "Report Type must be one of REGULAR, NABL, or BOTH"
    }),
    status: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().min(1).default(1),
    companyId: Joi.string().uuid().optional().allow(null, "")
});

const updateCautionSchema = Joi.object({
    title: Joi.string().max(150).optional(),
    description: Joi.string().optional(),
    reportType: Joi.string().valid("REGULAR", "NABL", "BOTH").optional(),
    status: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(1).optional(),
    companyId: Joi.string().uuid().optional().allow(null, "")
}).min(1).messages({
    "object.min": "At least one field must be provided for update"
});

module.exports = {
    createCautionSchema,
    updateCautionSchema
};
