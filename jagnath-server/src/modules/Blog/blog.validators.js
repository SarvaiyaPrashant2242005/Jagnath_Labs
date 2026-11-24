/**
 * @file blog.validators.js
 * @description Joi validation schemas for Blog requests.
 */

const Joi = require("joi");

const createBlogSchema = Joi.object({
    title: Joi.string().trim().required().messages({
        "any.required": "Blog Title is required.",
        "string.empty": "Blog Title cannot be empty."
    }),
    short_description: Joi.string().trim().allow("", null).optional(),
    content: Joi.string().required().messages({
        "any.required": "Blog Content is required.",
        "string.empty": "Blog Content cannot be empty."
    }),
    category: Joi.string().trim().required().messages({
        "any.required": "Category is required.",
        "string.empty": "Category cannot be empty."
    }),
    tags: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()),
        Joi.string().trim()
    ).optional(),
    status: Joi.string().valid("Draft", "Published").default("Draft"),
    featured_image: Joi.string().allow("", null).optional(),
    author_name: Joi.string().allow("", null).optional()
});

const updateBlogSchema = Joi.object({
    title: Joi.string().trim().optional(),
    short_description: Joi.string().trim().allow("", null).optional(),
    content: Joi.string().optional(),
    category: Joi.string().trim().optional(),
    tags: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()),
        Joi.string().trim()
    ).optional(),
    status: Joi.string().valid("Draft", "Published").optional(),
    featured_image: Joi.string().allow("", null).optional(),
    author_name: Joi.string().allow("", null).optional()
});

module.exports = {
    createBlogSchema,
    updateBlogSchema
};

