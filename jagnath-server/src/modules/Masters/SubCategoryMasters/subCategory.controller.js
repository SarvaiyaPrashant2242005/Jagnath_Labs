/**
 * @file subCategory.controller.js
 * @description Controller for handling SubCategory HTTP routes.
 */

const subCategoryService = require("./subCategory.service");
const { createSubCategorySchema, updateSubCategorySchema } = require("./subCategory.validators");
const db = require("../../../database");

/**
 * Resolves companyId from headers, body, query, user token or database fallback.
 */
const resolveCompanyId = async (req) => {
    let companyId = req.headers["x-company-id"] || req.body?.companyId || req.query?.companyId || req.user?.companyId;
    if (!companyId) {
        const firstCompany = await db.Company.findOne();
        if (firstCompany) {
            companyId = firstCompany.id;
        }
    }
    return companyId;
};

const create = async (req, res) => {
    try {
        const { error, value } = createSubCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const companyId = await resolveCompanyId(req);
        const result = await subCategoryService.createSubCategory(value, companyId);
        return res.status(201).json({
            success: true,
            message: "Sub Category created successfully",
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            messageToShow: err.message
        });
    }
};

const getAll = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req);
        const result = await subCategoryService.getAllSubCategories(req.query, companyId);
        return res.status(200).json({
            success: true,
            data: result.subCategories,
            meta: {
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                currentPage: result.currentPage
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getById = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req);
        const result = await subCategoryService.getSubCategoryById(req.params.id, companyId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(440).json({
            success: false,
            message: err.message
        });
    }
};

const update = async (req, res) => {
    try {
        const { error, value } = updateSubCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const companyId = await resolveCompanyId(req);
        const result = await subCategoryService.updateSubCategory(req.params.id, value, companyId);
        return res.status(200).json({
            success: true,
            message: "Sub Category updated successfully",
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            messageToShow: err.message
        });
    }
};

const remove = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req);
        await subCategoryService.deleteSubCategory(req.params.id, companyId);
        return res.status(200).json({
            success: true,
            message: "Sub Category deleted successfully"
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

const bulkImport = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req);
        const { rows } = req.body;
        const result = await subCategoryService.bulkImportSubCategories(rows, companyId);
        return res.status(200).json({
            success: true,
            message: `Successfully imported ${result.importedCount} Sub Categories.`,
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
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
