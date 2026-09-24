/**
 * @file testRequestParameter.controller.js
 * @description HTTP layer for TestRequestParameter APIs.
 */
const { createTransactionSchema, updateTransactionSchema } = require("./testRequestParameter.validators");
const testRequestParameterService = require("./testRequestParameter.service");
const companyService = require("../../Masters/CompanyMasters/company.service");
const TestRequest = require("../../Forms/TestRequestForm/testRequest.model");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Helper to resolve companyId from headers, query, body or user default
 */
const resolveCompanyId = async (req) => {
    const userId = req.user?.user_id;
    const isSuperAdmin = req.user?.role === "SuperAdmin" || req.user?.role === "SUPER_ADMIN" || req.user?.role === "SUPERADMIN" || req.user?.role === "Super Admin" || req.user?.email === "admin@jagnath.com";

    const companyIdVal = req.headers["x-company-id"] || req.query?.companyId || req.query?.company_id || req.body?.companyId || req.body?.company_id;

    if (companyIdVal && companyIdVal !== "null" && companyIdVal !== "undefined" && companyIdVal !== "ALL") {
        const isOwner = await companyService.checkOwnership(companyIdVal, userId, isSuperAdmin);
        if (isOwner) {
            return companyIdVal;
        }
    }

    const company = await companyService.getCompanyByUserId(userId);
    if (company) {
        return company.id;
    }

    const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
    if (companies && companies.length > 0) {
        return companies[0].id;
    }

    return null;
};

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
 * Create a new TestRequestParameter.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createTransactionSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const companyId = await resolveCompanyId(req);

        // Verify that the Test Request exists
        let tr = null;
        if (companyId) {
            tr = await TestRequest.findOne({ where: { id: value.testRequestId, companyId } });
        }
        if (!tr) {
            tr = await TestRequest.findByPk(value.testRequestId);
        }
        if (!tr) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Test Request not found.",
                "Test Request not found."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newTRP = await testRequestParameterService.createTransaction(value, userId, reqInfo);

        return res.status(201).json(successResponse(
            "TRANSACTION_CREATED",
            "Parameter transaction created successfully.",
            "Parameter transaction created successfully.",
            newTRP
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create parameter transaction."));
    }
};

/**
 * Get all TestRequestParameters.
 */
const getAll = async (req, res) => {
    try {
        const companyId = await resolveCompanyId(req);

        const testRequestId = req.query.testRequestId || req.query.trId;
        if (testRequestId) {
            const trps = await testRequestParameterService.getParametersByTestRequest(testRequestId, companyId);
            return res.status(200).json(successResponse(
                "TRANSACTIONS_FETCHED",
                "Parameter transactions fetched successfully.",
                "Parameter transactions fetched successfully.",
                trps
            ));
        }

        const trps = await testRequestParameterService.getAllTransactions(companyId);

        return res.status(200).json(successResponse(
            "TRANSACTIONS_FETCHED",
            "Parameter transactions fetched successfully.",
            "Parameter transactions fetched successfully.",
            trps
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch parameter transactions."));
    }
};

/**
 * Get TestRequestParameter by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter transaction not found.",
                "Record not found."
            ));
        }

        return res.status(200).json(successResponse(
            "TRANSACTION_FETCHED",
            "Parameter transaction fetched successfully.",
            "Parameter transaction fetched successfully.",
            trp
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch parameter transaction."));
    }
};

/**
 * Update TestRequestParameter details (e.g. entering results later).
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateTransactionSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter transaction not found or access denied.",
                "Record not found."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedTRP = await testRequestParameterService.updateTransaction(id, value, userId, reqInfo);

        return res.status(200).json(successResponse(
            "TRANSACTION_UPDATED",
            "Parameter transaction updated successfully.",
            "Parameter transaction updated successfully.",
            updatedTRP
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update parameter transaction."));
    }
};

/**
 * Delete a TestRequestParameter.
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter transaction not found or access denied.",
                "Record not found."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await testRequestParameterService.deleteTransaction(id, userId, reqInfo);

        return res.status(200).json(successResponse(
            "TRANSACTION_DELETED",
            "Parameter transaction deleted successfully.",
            "Parameter transaction has been deleted.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete parameter transaction."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
