/**
 * @file emailTemplate.validators.js
 * @description Joi validation schemas for Email Templates.
 */

const Joi = require("joi");

const createEmailTemplateSchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Template Name is required",
        "string.empty": "Template Name cannot be empty"
    }),
    templateType: Joi.string().required().messages({
        "any.required": "Template Type is required",
        "string.empty": "Template Type cannot be empty"
    }),
    subject: Joi.string().required().messages({
        "any.required": "Subject is required",
        "string.empty": "Subject cannot be empty"
    }),
    body: Joi.string().required().messages({
        "any.required": "Body is required",
        "string.empty": "Body cannot be empty"
    }),
    status: Joi.string().valid("Active", "Inactive").default("Active"),
    companyId: Joi.string().uuid().optional()
});

const updateEmailTemplateSchema = Joi.object({
    name: Joi.string().optional(),
    templateType: Joi.string().optional(),
    subject: Joi.string().optional(),
    body: Joi.string().optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    companyId: Joi.string().uuid().optional()
});

module.exports = {
    createEmailTemplateSchema,
    updateEmailTemplateSchema
};
