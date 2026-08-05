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
    status: Joi.string().valid("Active", "Inactive").default("Active"),
    inlet: Joi.boolean().optional().default(false),
    outlet: Joi.boolean().optional().default(false)
});

const updateLocationSampleSchema = Joi.object({
    name: Joi.string().trim().min(2).max(150).optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    inlet: Joi.boolean().optional(),
    outlet: Joi.boolean().optional()
});

module.exports = {
    createLocationSampleSchema,
    updateLocationSampleSchema
};
