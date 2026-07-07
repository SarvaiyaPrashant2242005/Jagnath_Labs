/**
 * @file company.validators.js
 * @description Joi validation schemas for Company requests.
 */
const Joi = require("joi");

const companyBaseSchema = {
    company_code: Joi.string().required(),
    company_name: Joi.string().required(),
    address: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    contact_number: Joi.string().pattern(/^[0-9]+$/).allow('', null).messages({
        "string.pattern.base": "Phone Number must contain only digits."
    }),
    company_email: Joi.string().email().allow('', null),
    pan_card_number: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null).messages({
        "string.pattern.base": "Invalid PAN format."
    }),
    gst_number: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).allow('', null).messages({
        "string.pattern.base": "Invalid GST format."
    }),
    cha_licence_number: Joi.string().allow('', null),
    bank_name: Joi.string().allow('', null),
    account_number: Joi.string().allow('', null),
    ifsc_code: Joi.string().allow('', null),
    branch_name: Joi.string().allow('', null),
    usd_bank: Joi.string().allow('', null),
    usd_account_number: Joi.string().allow('', null),
    usd_ifsc_swift_code: Joi.string().allow('', null),
    usd_branch: Joi.string().allow('', null),
    einvoice_username: Joi.string().allow('', null),
    einvoice_password: Joi.string().allow('', null),
    status: Joi.string().valid("Active", "Inactive").default("Active")
};

const createCompanySchema = Joi.object(companyBaseSchema);

const updateCompanySchema = Joi.object({
    ...companyBaseSchema,
    company_code: Joi.string().optional(),
    company_name: Joi.string().optional()
});

module.exports = {
    createCompanySchema,
    updateCompanySchema
};
