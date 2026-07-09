/**
 * @file category.controller.js
 * @description HTTP layer for Category APIs.
 */
const { createCategorySchema, updateCategorySchema } = require("./category.validators");
const categoryService = require("./category.service");
const companyService = require("../CompanyMasters/company.service");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Helper to fetch user's company and ensure they have one
 */
const getUserCompany = async (userId) => {
    const company = await companyService.getCompanyByUserId(userId);
    if (!company) {
        throw new Error("No company associated with this user.");
    }
    return company;
};

/**
 * Create a new category.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createCategorySchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        // Automatically fetch companyId from user
        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const categoryData = { 
            ...value,
            companyId: company.id
        };

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newCategory = await categoryService.createCategory(categoryData, userId, reqInfo);

        return res.status(201).json(successResponse(
            "CATEGORY_CREATED",
            "Category created successfully.",
            "Category created successfully.",
            newCategory
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create category."));
    }
};

/**
 * Get all categories for user's company.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const categories = await categoryService.getCategoriesByCompany(company.id);

        return res.status(200).json(successResponse(
            "CATEGORIES_FETCHED",
            "Categories fetched successfully.",
            "Categories fetched successfully.",
            categories
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch categories."));
    }
};

/**
 * Get category by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const category = await categoryService.getCategoryById(id, company.id);
        if (!category) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Category not found or access denied.",
                "Category not found."
            ));
        }

        return res.status(200).json(successResponse(
            "CATEGORY_FETCHED",
            "Category fetched successfully.",
            "Category fetched successfully.",
            category
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch category."));
    }
};

/**
 * Update category details.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateCategorySchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedCategory = await categoryService.updateCategory(id, value, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "CATEGORY_UPDATED",
            "Category updated successfully.",
            "Category updated successfully.",
            updatedCategory
        ));
    } catch (err) {
        if (err.message === "Category not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Category not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update category."));
    }
};

/**
 * Delete a category.
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await categoryService.deleteCategory(id, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "CATEGORY_DELETED",
            "Category deleted successfully.",
            "Category has been deleted.",
            null
        ));
    } catch (err) {
        if (err.message === "Category not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Category not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete category."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
