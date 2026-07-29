/**
 * @file priceMaster.controller.js
 * @description Controller for simple Price Master APIs.
 */

const { createPriceSchema, updatePriceSchema } = require("./priceMaster.validators");
const priceMasterService = require("./priceMaster.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const { successResponse, errorResponse } = require("../../../utils/response");

const resolveCompanyId = async (body, query, userId) => {
    const companyIdVal = body.companyId || body.company_id || query.companyId || query.company_id;
    const companyNameVal = body.companyName || query.companyName;

    if (companyIdVal) {
        const isOwner = await companyService.checkOwnership(companyIdVal, userId);
        if (!isOwner) {
            throw new Error("UNAUTHORIZED_COMPANY");
        }
        return companyIdVal;
    } else if (companyNameVal) {
        const company = await Company.findOne({ where: { company_name: companyNameVal } });
        if (!company) {
            throw new Error("COMPANY_NOT_FOUND");
        }
        const isOwner = await companyService.checkOwnership(company.id, userId);
        if (!isOwner) {
            throw new Error("UNAUTHORIZED_COMPANY");
        }
        return company.id;
    } else {
        const company = await companyService.getCompanyByUserId(userId);
        if (company) {
            return company.id;
        }
        const companies = await companyService.getCompaniesByUser(userId);
        if (companies && companies.length > 0) {
            return companies[0].id;
        }
        throw new Error("NO_COMPANY_FOUND");
    }
};

/**
 * Create Price entry.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createPriceSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }

        let companyId;
        try {
            companyId = await resolveCompanyId(body, req.query, userId);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied: You do not own this company."));
            }
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const priceData = { ...value, companyId };
        const newRecord = await priceMasterService.createPrice(priceData, userId);

        return res.status(201).json(successResponse(
            "PRICE_CREATED",
            "Price created successfully.",
            "Price created successfully.",
            newRecord
        ));
    } catch (err) {
        if (err.message && err.message.startsWith("DUPLICATE_PRICE")) {
            return res.status(400).json(errorResponse("DUPLICATE_PRICE", err.message, err.message));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create price."));
    }
};

/**
 * Get all Prices.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access.", "Unauthorized"));
            }
            if (e.message === "COMPANY_NOT_FOUND" || e.message === "NO_COMPANY_FOUND") {
                return res.status(200).json(successResponse(
                    "PRICES_FETCHED",
                    "Prices fetched successfully.",
                    "Prices fetched successfully.",
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
            categoryId: req.query.categoryId
        };

        const result = await priceMasterService.getPricesByCompany(companyId, options);

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
            "PRICES_FETCHED",
            "Prices fetched successfully.",
            "Prices fetched successfully.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch prices."));
    }
};

/**
 * Get Price by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const companyId = await resolveCompanyId({}, req.query, userId);
        const price = await priceMasterService.getPriceById(id, companyId);

        if (!price) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Price not found.", "Price not found."));
        }

        return res.status(200).json(successResponse(
            "PRICE_FETCHED",
            "Price fetched successfully.",
            "Price fetched successfully.",
            price
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch price."));
    }
};

/**
 * Update Price.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updatePriceSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }

        const companyId = await resolveCompanyId(body, req.query, userId);
        const updated = await priceMasterService.updatePrice(id, value, userId, companyId);

        return res.status(200).json(successResponse(
            "PRICE_UPDATED",
            "Price updated successfully.",
            "Price updated successfully.",
            updated
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update price."));
    }
};

/**
 * Delete Price.
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const companyId = await resolveCompanyId({}, req.query, userId);
        await priceMasterService.deletePrice(id, companyId);

        return res.status(200).json(successResponse(
            "PRICE_DELETED",
            "Price deleted successfully.",
            "Price deleted successfully.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete price."));
    }
};

/**
 * Bulk Import Price List from Excel dataset.
 */
const bulkImport = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { rows } = req.body || {};

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "No rows provided for bulk import.",
                "No valid data provided."
            ));
        }

        const companyId = await resolveCompanyId(req.body, req.query, userId);
        const result = await priceMasterService.bulkImportPrices(rows, companyId, userId);

        return res.status(200).json(successResponse(
            "PRICES_BULK_IMPORTED",
            `Successfully processed ${result.totalProcessed} price records (${result.createdCount} created, ${result.updatedCount} updated).`,
            "Bulk import completed.",
            result
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Bulk import failed."));
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

