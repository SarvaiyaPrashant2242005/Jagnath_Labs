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

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        // Verify that the Test Request exists (check company scope first, then PK fallback)
        let tr = null;
        if (company && company.id) {
            tr = await TestRequest.findOne({ where: { id: value.testRequestId, companyId: company.id } });
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
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const trps = await testRequestParameterService.getAllTransactions(company.id);

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
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter transaction not found.",
                "Record not found."
            ));
        }

        // Verify company ownership of the transaction
        if (trp.companyName !== (company.companyName || company.company_name)) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized access to this parameter transaction.",
                "Unauthorized"
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

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp || trp.companyName !== (company.companyName || company.company_name)) {
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

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const trp = await testRequestParameterService.getTransactionById(id);
        if (!trp || trp.companyName !== (company.companyName || company.company_name)) {
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
