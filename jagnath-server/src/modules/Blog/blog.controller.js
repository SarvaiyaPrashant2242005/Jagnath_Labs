/**
 * @file blog.controller.js
 * @description Controller handling blog management and public endpoints.
 */

const blogService = require("./blog.service");
const { createBlogSchema, updateBlogSchema } = require("./blog.validators");
const { successResponse, errorResponse } = require("../../utils/response");

/**
 * Upload featured image for blog
 */
const uploadFeaturedImage = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "No file uploaded",
                "Please select an image file to upload."
            ));
        }

        // Return path relative to server root
        const relativePath = `uploads/blogs/${req.file.filename}`;
        return res.status(200).json(successResponse(
            "IMAGE_UPLOADED",
            "Image uploaded successfully",
            "Image uploaded successfully",
            { url: `/${relativePath}`, filename: req.file.filename }
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Create Blog
 */
const createBlog = async (req, res) => {
    try {
        const { error, value } = createBlogSchema.validate(req.body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const newBlog = await blogService.createBlog(value, req.user);
        return res.status(201).json(successResponse(
            "BLOG_CREATED",
            "Blog created successfully",
            "Blog created successfully",
            newBlog
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Get current user's blogs
 */
const getMyBlogs = async (req, res) => {
    try {
        const userId = req.user.id || req.user.user_id;
        const blogs = await blogService.getUserBlogs(userId, req.query);
        return res.status(200).json(successResponse(
            "BLOGS_RETRIEVED",
            "Blogs retrieved successfully",
            "Blogs retrieved successfully",
            blogs
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Get blog by ID for editing
 */
const getBlogById = async (req, res) => {
    try {
        const blog = await blogService.getBlogByIdForUser(req.params.id, req.user);
        if (!blog) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Blog not found"));
        }
        return res.status(200).json(successResponse(
            "BLOG_RETRIEVED",
            "Blog retrieved successfully",
            "Blog retrieved successfully",
            blog
        ));
    } catch (err) {
        if (err.message === "UNAUTHORIZED_ACCESS" || err.status === 403) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "You do not have permission to view or edit this blog."
            ));
        }
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Update Blog
 */
const updateBlog = async (req, res) => {
    try {
        const { error, value } = updateBlogSchema.validate(req.body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const updatedBlog = await blogService.updateBlog(req.params.id, value, req.user);
        if (!updatedBlog) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Blog not found"));
        }
        return res.status(200).json(successResponse(
            "BLOG_UPDATED",
            "Blog updated successfully",
            "Blog updated successfully",
            updatedBlog
        ));
    } catch (err) {
        if (err.message === "UNAUTHORIZED_ACCESS" || err.status === 403) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "You do not have permission to modify this blog."
            ));
        }
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Delete Blog
 */
const deleteBlog = async (req, res) => {
    try {
        const result = await blogService.deleteBlog(req.params.id, req.user);
        if (!result) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Blog not found"));
        }
        return res.status(200).json(successResponse(
            "BLOG_DELETED",
            "Blog deleted successfully",
            "Blog deleted successfully",
            null
        ));
    } catch (err) {
        if (err.message === "UNAUTHORIZED_ACCESS" || err.status === 403) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "You do not have permission to delete this blog."
            ));
        }
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Public: Get published blogs
 */
const getPublicBlogs = async (req, res) => {
    try {
        const result = await blogService.getPublicBlogs(req.query);
        return res.status(200).json(successResponse(
            "BLOGS_RETRIEVED",
            "Published blogs retrieved successfully",
            "Published blogs retrieved successfully",
            result
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Public: Get single published blog by slug
 */
const getPublicBlogBySlug = async (req, res) => {
    try {
        const result = await blogService.getPublicBlogBySlug(req.params.slug);
        if (!result || !result.blog) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Blog post not found"));
        }
        return res.status(200).json(successResponse(
            "BLOG_RETRIEVED",
            "Blog post retrieved successfully",
            "Blog post retrieved successfully",
            result
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

/**
 * Public: Get categories list for filtering
 */
const getPublicCategories = async (req, res) => {
    try {
        const categories = await blogService.getPublicCategories();
        return res.status(200).json(successResponse(
            "CATEGORIES_RETRIEVED",
            "Categories retrieved successfully",
            "Categories retrieved successfully",
            categories
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("SERVER_ERROR", err.message));
    }
};

module.exports = {
    uploadFeaturedImage,
    createBlog,
    getMyBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    getPublicBlogs,
    getPublicBlogBySlug,
    getPublicCategories
};

