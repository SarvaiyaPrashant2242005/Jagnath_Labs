/**
 * @file categoryParameter.validators.js
 * @description Joi validation schemas for Category-Parameter mappings.
 */
const Joi = require("joi");

const createMappingSchema = Joi.object({
    categoryId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "any.required": "Category ID is required.",
        "string.guid": "Category ID must be a valid UUIDv4.",
        "string.empty": "Category ID must not be empty."
    }),
    parameterId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "any.required": "Parameter ID is required.",
        "string.guid": "Parameter ID must be a valid UUIDv4.",
        "string.empty": "Parameter ID must not be empty."
    }),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null).messages({
        "any.only": "Status must be Active or Inactive."
    })
});

const updateMappingSchema = Joi.object({
    categoryId: Joi.string().guid({ version: 'uuidv4' }).optional().messages({
        "string.guid": "Category ID must be a valid UUIDv4."
    }),
    parameterId: Joi.string().guid({ version: 'uuidv4' }).optional().messages({
        "string.guid": "Parameter ID must be a valid UUIDv4."
    }),
    status: Joi.string().valid("Active", "Inactive").optional().allow("", null).messages({
        "any.only": "Status must be Active or Inactive."
    })
});

module.exports = {
    createMappingSchema,
    updateMappingSchema
};
