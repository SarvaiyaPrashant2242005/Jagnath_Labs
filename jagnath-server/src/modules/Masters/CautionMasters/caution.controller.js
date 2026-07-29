/**
 * @file caution.controller.js
 * @description HTTP Controller handlers for Caution Master API endpoints.
 */

const cautionService = require("./caution.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const { createCautionSchema, updateCautionSchema } = require("./caution.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Helper to resolve company ID from request body, query or user ownership.
 */
const resolveCompanyId = async (body, query, userId) => {
    const companyIdVal = body.companyId || body.company_id || query.companyId || query.company_id;
    const companyNameVal = body.companyName || query.companyName;

    if (companyIdVal) {
        return companyIdVal;
    } else if (companyNameVal) {
        const company = await Company.findOne({ where: { company_name: companyNameVal } });
        if (company) return company.id;
    }
    if (userId) {
        const company = await companyService.getCompanyByUserId(userId);
        if (company) return company.id;
        const companies = await companyService.getCompaniesByUser(userId);
        if (companies && companies.length > 0) return companies[0].id;
    }
    return null;
};

/**
 * Creates a new Caution record.
 */
const createCautionHandler = async (req, res) => {
    try {
        const { error, value } = createCautionSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "Invalid input parameters",
                error.details.map(d => d.message).join(", ")
            ));
        }

        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const companyId = await resolveCompanyId(req.body, req.query, userId);

        const caution = await cautionService.createCaution(
            { ...value, companyId },
            userId
        );

        return res.status(201).json(successResponse(
            "CAUTION_CREATED",
            "Caution record created successfully",
            "Caution record created successfully",
            caution
        ));
    } catch (err) {
        return res.status(500).json(errorResponse(
            "SERVER_ERROR",
            err.message,
            "Failed to create caution record"
        ));
    }
};

/**
 * Fetches list of Cautions (supports filtering status, reportType, search, limit, page).
 */
const getCautionsHandler = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId);
        const { status, reportType, search, limit, page } = req.query;

        const result = await cautionService.getCautions({
            companyId,
            status,
            reportType,
            search,
            limit,
            page
        });

        let responseData = result;
        if (limit && result.rows) {
            responseData = {
                rows: result.rows,
                total: result.count,
                page: parseInt(page) || 1,
                totalPages: Math.ceil(result.count / parseInt(limit))
            };
        }

        return res.status(200).json(successResponse(
            "CAUTIONS_FETCHED",
            "Caution list fetched successfully",
            "Caution list fetched successfully",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse(
            "SERVER_ERROR",
            err.message,
            "Failed to fetch caution list"
        ));
    }
};

/**
 * Fetches single Caution record by ID.
 */
const getCautionByIdHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId);

        const caution = await cautionService.getCautionById(id, companyId);
        return res.status(200).json(successResponse(
            "CAUTION_FETCHED",
            "Caution record fetched successfully",
            "Caution record fetched successfully",
            caution
        ));
    } catch (err) {
        const statusCode = err.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json(errorResponse(
            statusCode === 404 ? "NOT_FOUND" : "SERVER_ERROR",
            err.message,
            "Failed to fetch caution record"
        ));
    }
};

/**
 * Updates an existing Caution record.
 */
const updateCautionHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCautionSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "Invalid input parameters",
                error.details.map(d => d.message).join(", ")
            ));
        }

        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const companyId = await resolveCompanyId(req.body, req.query, userId);

        const updatedCaution = await cautionService.updateCaution(id, value, userId, companyId);
        return res.status(200).json(successResponse(
            "CAUTION_UPDATED",
            "Caution record updated successfully",
            "Caution record updated successfully",
            updatedCaution
        ));
    } catch (err) {
        const statusCode = err.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json(errorResponse(
            statusCode === 404 ? "NOT_FOUND" : "SERVER_ERROR",
            err.message,
            "Failed to update caution record"
        ));
    }
};

/**
 * Soft-deletes a Caution record.
 */
const deleteCautionHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId);

        await cautionService.deleteCaution(id, userId, companyId);
        return res.status(200).json(successResponse(
            "CAUTION_DELETED",
            "Caution record deleted successfully",
            "Caution record deleted successfully",
            null
        ));
    } catch (err) {
        const statusCode = err.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json(errorResponse(
            statusCode === 404 ? "NOT_FOUND" : "SERVER_ERROR",
            err.message,
            "Failed to delete caution record"
        ));
    }
};

module.exports = {
    createCautionHandler,
    getCautionsHandler,
    getCautionByIdHandler,
    updateCautionHandler,
    deleteCautionHandler
};
