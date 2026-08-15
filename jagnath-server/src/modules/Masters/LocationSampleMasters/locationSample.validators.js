/**
 * @file locationSample.validators.js
 * @description Joi validation schemas for Location of Sample Master.
 */

const Joi = require("joi");

const createLocationSampleSchema = Joi.object({
    companyId: Joi.string().uuid().optional(),
    name: Joi.string().trim().min(2).max(150).required().messages({
        "string.empty": "Location Name cannot be empty",
        "any.required": "Location Name is required"
    }),
    subCategoryId: Joi.string().uuid().optional().allow("", null),
    description: Joi.string().trim().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").default("Active")
});

const updateLocationSampleSchema = Joi.object({
    companyId: Joi.string().uuid().optional().allow("", null),
    name: Joi.string().trim().min(2).max(150).optional(),
    subCategoryId: Joi.string().uuid().optional().allow("", null),
    description: Joi.string().trim().optional().allow("", null),
    status: Joi.string().valid("Active", "Inactive").optional()
});

module.exports = {
    createLocationSampleSchema,
    updateLocationSampleSchema
};
