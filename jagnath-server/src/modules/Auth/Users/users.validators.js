/**
 * @file users.validators.js
 * @description Joi validation schemas for Auth requests.
 */
const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "any.required": "Name is required."
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email address.",
        "any.required": "Email is required."
    }),
    password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long.",
        "any.required": "Password is required."
    }),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
        "any.only": "Confirm password must match password.",
        "any.required": "Confirm password is required."
    })
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
