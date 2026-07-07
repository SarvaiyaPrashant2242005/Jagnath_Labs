/**
 * @file users.validators.js
 * @description Joi validation schemas for Auth requests.
 */
const Joi = require("joi");

const registerSchema = Joi.object({
    full_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(6)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        .message("Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, and a number.")
        .required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refresh_token: Joi.string().required()
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema
};
