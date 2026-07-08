/**
 * @file client.validators.js
 * @description Joi validation schemas for Client requests.
 */
const Joi = require("joi");

const createClientSchema = Joi.object({
    companyName: Joi.string().trim().min(1).required().messages({
        "any.required": "Company Name is required.",
        "string.empty": "Company Name must not be empty."
    }),
    clientName: Joi.string().min(2).max(100).required().messages({
        "any.required": "Client Name is required."
    }),
    contactNumber: Joi.string().pattern(/^[0-9]+$/).required().messages({
        "string.pattern.base": "Contact Number must contain only digits.",
        "any.required": "Contact Number is required."
    }),
    address: Joi.string().required().messages({
        "any.required": "Address is required."
    }),
    city: Joi.string().required().messages({
        "any.required": "City is required."
    }),
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
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
        "any.only": "Gender must be Male, Female, or Other."
    }),
    status: Joi.string().valid("Active", "Inactive").optional()
});

module.exports = {
    createClientSchema,
    updateClientSchema
};
