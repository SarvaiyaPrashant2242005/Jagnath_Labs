/**
 * @file category.controller.js
 * @description HTTP layer for Category APIs.
 */
const { createCategorySchema, updateCategorySchema } = require("./category.validators");
const categoryService = require("./category.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const Category = require("./category.model");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Resolves the company ID based on body, query parameters or user default.
 * Validates user ownership/membership.
 */
const resolveCompanyId = async (body, query, userId, headers = {}, reqUser = {}) => {
    const isSuperAdmin = reqUser?.role === "SuperAdmin" || reqUser?.role === "SUPER_ADMIN" || reqUser?.role === "SUPERADMIN" || reqUser?.role === "Super Admin" || reqUser?.email === "admin@jagnath.com";
    const companyIdVal = body?.companyId || body?.company_id || query?.companyId || query?.company_id || headers?.["x-company-id"];
    const companyNameVal = body?.companyName || query?.companyName;

    if (companyIdVal) {
        const isOwner = await companyService.checkOwnership(companyIdVal, userId, isSuperAdmin);
        if (!isOwner) {
            throw new Error("UNAUTHORIZED_COMPANY");
        }
        return companyIdVal;
    } else if (companyNameVal) {
        const company = await Company.findOne({ where: { company_name: companyNameVal } });
        if (!company) {
            throw new Error("COMPANY_NOT_FOUND");
        }
        const isOwner = await companyService.checkOwnership(company.id, userId, isSuperAdmin);
        if (!isOwner) {
            throw new Error("UNAUTHORIZED_COMPANY");
        }
        return company.id;
    } else {
        const company = await companyService.getCompanyByUserId(userId);
        if (company) {
            return company.id;
        }
        const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
        if (companies && companies.length > 0) {
            return companies[0].id;
        }
        throw new Error("NO_COMPANY_FOUND");
    }
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

        let companyId;
        try {
            companyId = await resolveCompanyId(body, req.query, userId, req.headers, req.user);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied: You do not own this company."));
            }
            if (e.message === "COMPANY_NOT_FOUND") {
                return res.status(404).json(errorResponse("NOT_FOUND", "Company not found.", "Company not found."));
            }
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const categoryData = {
            name: value.name,
            description: value.description,
            status: value.status || "Active",
            companyId
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

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this company's categories.", "Unauthorized"));
            }
            if (e.message === "COMPANY_NOT_FOUND" || e.message === "NO_COMPANY_FOUND") {
                return res.status(200).json(successResponse(
                    "CATEGORIES_FETCHED",
                    "Categories fetched successfully.",
                    "Categories fetched successfully.",
                    req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
                ));
            }
            return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", e.message, e.message));
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const result = await categoryService.getCategoriesByCompany(companyId, options);

        let responseData = result;
        if (options.limit && result.rows) {
            responseData = {
                rows: result.rows,
                total: result.count,
                page: parseInt(options.page),
                totalPages: Math.ceil(result.count / parseInt(options.limit))
            };
        }

        return res.status(200).json(successResponse(
            "CATEGORIES_FETCHED",
            "Categories fetched successfully.",
            "Categories fetched successfully.",
            responseData
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

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Category not found.",
                "Category not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(category.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this category."
            ));
        }

        const formatted = await categoryService.getCategoryById(id, category.companyId);

        return res.status(200).json(successResponse(
            "CATEGORY_FETCHED",
            "Category fetched successfully.",
            "Category fetched successfully.",
            formatted
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

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Category not found.",
                "Category not found."
            ));
        }

        // Verify ownership of current company
        const isOwner = await companyService.checkOwnership(category.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this category."
            ));
        }

        // Resolve target company only if explicitly changed in body
        let targetCompanyId = category.companyId;
        if (body.companyId || body.company_id) {
            try {
                targetCompanyId = await resolveCompanyId(body, {}, userId, req.headers);
            } catch (e) {
                if (e.message === "UNAUTHORIZED_COMPANY") {
                    return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied: You do not own the target company."));
                }
                if (e.message === "COMPANY_NOT_FOUND") {
                    return res.status(404).json(errorResponse("NOT_FOUND", "Target company not found.", "Target company not found."));
                }
                return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
            }
        }

        const categoryData = {
            name: value.name,
            description: value.description,
            status: value.status,
            companyId: targetCompanyId
        };

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedCategory = await categoryService.updateCategory(id, categoryData, userId, category.companyId, reqInfo);

        return res.status(200).json(successResponse(
            "CATEGORY_UPDATED",
            "Category updated successfully.",
            "Category updated successfully.",
            updatedCategory
        ));
    } catch (err) {
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

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Category not found.",
                "Category not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(category.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this category."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await categoryService.deleteCategory(id, userId, category.companyId, reqInfo);

        return res.status(200).json(successResponse(
            "CATEGORY_DELETED",
            "Category deleted successfully.",
            "Category has been deleted.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete category."));
    }
};

/**
 * Bulk Import Categories from Excel dataset.
 */
const bulkImport = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";
        const { rows } = req.body || {};
        const requestedCompanyId = req.headers["x-company-id"] || req.query.companyId || req.query.company_id || req.body?.companyId;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "No rows provided for bulk import.",
                "No valid data provided."
            ));
        }

        let companyIdToUse;
        if (requestedCompanyId) {
            const isOwner = await companyService.checkOwnership(requestedCompanyId, userId, isSuperAdmin);
            if (!isOwner) {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized company access.", "Unauthorized"));
            }
            companyIdToUse = requestedCompanyId;
        } else {
            let company = await companyService.getCompanyByUserId(userId);
            if (!company) {
                const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
                if (companies && companies.length > 0) {
                    company = companies[0];
                }
            }

            if (!company) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Company not found for user.", "Company not found."));
            }
            companyIdToUse = company.id;
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const result = await categoryService.bulkImportCategories(rows, companyIdToUse, userId, reqInfo);

        return res.status(200).json(successResponse(
            "CATEGORIES_BULK_IMPORTED",
            `Successfully processed ${result.totalProcessed} categories (${result.createdCount} created, ${result.updatedCount} updated).`,
            "Bulk import completed.",
            result
        ));
    } catch (err) {
        console.error("Bulk Import Category Error:", err);
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message || "Bulk import failed."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    bulkImport
};

