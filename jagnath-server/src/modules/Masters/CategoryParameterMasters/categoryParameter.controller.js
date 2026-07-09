/**
 * @file categoryParameter.controller.js
 * @description HTTP layer for CategoryParameter APIs.
 */
const { createMappingSchema, updateMappingSchema } = require("./categoryParameter.validators");
const categoryParameterService = require("./categoryParameter.service");
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
 * Create a new mapping.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createMappingSchema.validate(body);
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

        const mappingData = {
            ...value,
            companyId: company.id
        };

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newMapping = await categoryParameterService.createMapping(mappingData, userId, reqInfo);

        return res.status(201).json(successResponse(
            "MAPPING_CREATED",
            "Mapping created successfully.",
            "Mapping created successfully.",
            newMapping
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create mapping."));
    }
};

/**
 * Get all mappings.
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

        const mappings = await categoryParameterService.getAllMappings(company.id);

        return res.status(200).json(successResponse(
            "MAPPINGS_FETCHED",
            "Mappings fetched successfully.",
            "Mappings fetched successfully.",
            mappings
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch mappings."));
    }
};

/**
 * Combined GET endpoint (Mapping Details by mapping ID OR mapped parameters list by Category ID).
 */
const getByIdOrCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        // 1. Try to find the mapping by primary key ID
        const mapping = await categoryParameterService.getMappingById(id, company.id);
        if (mapping) {
            return res.status(200).json(successResponse(
                "MAPPING_FETCHED",
                "Mapping fetched successfully.",
                "Mapping fetched successfully.",
                mapping
            ));
        }

        // 2. Fallback to check if it's a categoryId and return mapped parameters
        const parameters = await categoryParameterService.getParametersByCategoryId(id, company.id);
        if (parameters && parameters.length > 0) {
            return res.status(200).json(successResponse(
                "PARAMETERS_FETCHED",
                "Parameters fetched successfully.",
                "Parameters fetched successfully.",
                parameters
            ));
        }

        return res.status(404).json(errorResponse(
            "NOT_FOUND",
            "Mapping or Category parameters not found.",
            "Record not found."
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch mapping."));
    }
};

/**
 * Explicit helper to fetch parameters by Category ID.
 */
const getParametersByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user.user_id;

        let company;
        try {
            company = await getUserCompany(userId);
        } catch (e) {
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const parameters = await categoryParameterService.getParametersByCategoryId(categoryId, company.id);

        return res.status(200).json(successResponse(
            "PARAMETERS_FETCHED",
            "Parameters fetched successfully.",
            "Parameters fetched successfully.",
            parameters
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch parameters."));
    }
};

/**
 * Update mapping details.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateMappingSchema.validate(body);
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

        const updatedMapping = await categoryParameterService.updateMapping(id, value, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "MAPPING_UPDATED",
            "Mapping updated successfully.",
            "Mapping updated successfully.",
            updatedMapping
        ));
    } catch (err) {
        if (err.message === "Mapping not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Mapping not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update mapping."));
    }
};

/**
 * Delete a mapping.
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

        await categoryParameterService.deleteMapping(id, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "MAPPING_DELETED",
            "Mapping deleted successfully.",
            "Mapping has been deleted.",
            null
        ));
    } catch (err) {
        if (err.message === "Mapping not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Mapping not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete mapping."));
    }
};

module.exports = {
    create,
    getAll,
    getByIdOrCategory,
    getParametersByCategory,
    update,
    remove
};
