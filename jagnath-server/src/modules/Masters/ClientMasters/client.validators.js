/**
 * @file client.validators.js
 * @description Joi validation schemas for Client requests.
 */
const Joi = require("joi");

const createClientSchema = Joi.object({
    companyName: Joi.string().trim().allow("", null).optional(),
    clientName: Joi.string().min(2).max(100).required().messages({
        "any.required": "Client Name is required."
    }),
    contactNumber: Joi.string().pattern(/^[0-9]+$/).required().messages({
        "string.pattern.base": "Contact Number must contain only digits.",
        "any.required": "Contact Number is required."
    }),
    officeAddress: Joi.string().required().messages({
        "any.required": "Office Address is required.",
        "string.empty": "Office Address is required."
    }),
    plantAddress: Joi.string().required().messages({
        "any.required": "Plant / Industry Address is required.",
        "string.empty": "Plant / Industry Address is required."
    }),
    address: Joi.string().allow("", null).optional(),
    city: Joi.string().required().messages({
        "any.required": "City is required."
    }),
    state: Joi.string().allow("", null).optional(),
    email: Joi.string().pattern(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\s*,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/).allow("", null).optional().messages({
        "string.pattern.base": "Email must be a valid email format or list of comma-separated emails."
    }),
    emails: Joi.alternatives().try(
        Joi.array().items(Joi.string().email()),
        Joi.string().allow("", null)
    ).optional(),
    gender: Joi.string().valid("Male", "Female", "Other").required().messages({
        "any.only": "Gender must be Male, Female, or Other.",
        "any.required": "Gender is required."
    }),
    status: Joi.string().valid("Active", "Inactive").default("Active").optional()
});

const updateClientSchema = Joi.object({
    companyName: Joi.string().trim().min(1).optional().messages({
        "string.empty": "Company Name must not be empty."
    }),
    clientName: Joi.string().min(2).max(100).optional(),
    contactNumber: Joi.string().pattern(/^[0-9]+$/).optional().messages({
        "string.pattern.base": "Contact Number must contain only digits."
    }),
    officeAddress: Joi.string().optional(),
    plantAddress: Joi.string().optional(),
    address: Joi.string().allow("", null).optional(),
    city: Joi.string().optional(),
    state: Joi.string().allow("", null).optional(),
    email: Joi.string().pattern(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\s*,\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})*$/).allow("", null).optional().messages({
        "string.pattern.base": "Email must be a valid email format or list of comma-separated emails."
    }),
    emails: Joi.alternatives().try(
        Joi.array().items(Joi.string().email()),
        Joi.string().allow("", null)
    ).optional(),
    gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
        "any.only": "Gender must be Male, Female, or Other."
    }),
    status: Joi.string().valid("Active", "Inactive").optional()
});

module.exports = {
    createClientSchema,
    updateClientSchema
};
