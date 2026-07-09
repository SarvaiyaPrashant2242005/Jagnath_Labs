/**
 * @file parameter.controller.js
 * @description HTTP layer for Parameter APIs.
 */
const { createParameterSchema, updateParameterSchema } = require("./parameter.validators");
const parameterService = require("./parameter.service");
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
 * Create a new parameter.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createParameterSchema.validate(body);
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

        const parameterData = { 
            ...value,
            companyId: company.id
        };

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newParam = await parameterService.createParameter(parameterData, userId, reqInfo);

        return res.status(201).json(successResponse(
            "PARAMETER_CREATED",
            "Parameter created successfully.",
            "Parameter created successfully.",
            newParam
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create parameter."));
    }
};

/**
 * Get all parameters for user's company.
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

        const params = await parameterService.getParametersByCompany(company.id);

        return res.status(200).json(successResponse(
            "PARAMETERS_FETCHED",
            "Parameters fetched successfully.",
            "Parameters fetched successfully.",
            params
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch parameters."));
    }
};

/**
 * Get parameter by ID.
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

        const param = await parameterService.getParameterById(id, company.id);
        if (!param) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter not found or access denied.",
                "Parameter not found."
            ));
        }

        return res.status(200).json(successResponse(
            "PARAMETER_FETCHED",
            "Parameter fetched successfully.",
            "Parameter fetched successfully.",
            param
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch parameter."));
    }
};

/**
 * Update parameter details.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateParameterSchema.validate(body);
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

        const updatedParam = await parameterService.updateParameter(id, value, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "PARAMETER_UPDATED",
            "Parameter updated successfully.",
            "Parameter updated successfully.",
            updatedParam
        ));
    } catch (err) {
        if (err.message === "Parameter not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Parameter not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update parameter."));
    }
};

/**
 * Delete a parameter.
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

        await parameterService.deleteParameter(id, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "PARAMETER_DELETED",
            "Parameter deleted successfully.",
            "Parameter has been deleted.",
            null
        ));
    } catch (err) {
        if (err.message === "Parameter not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Parameter not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete parameter."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
