/**
 * @file categoryParameterMapping.controller.js
 * @description HTTP layer for CategoryParameterMapping APIs.
 */
const { createMappingSchema, updateMappingSchema } = require("./categoryParameterMapping.validators");
const categoryParameterMappingService = require("./categoryParameterMapping.service");
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
 * Create a new CategoryParameterMapping.
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

        const newMapping = await categoryParameterMappingService.createMapping(mappingData, userId, reqInfo);

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
 * Get all CategoryParameterMappings.
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

        const mappings = await categoryParameterMappingService.getAllMappings(company.id);

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
 * Get CategoryParameterMapping by ID OR fetch Parameters mapped to a Category ID.
 * Combined logic resolving the request based on what ID type is provided.
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

        // 1. Try to find the CategoryParameterMapping by primary key ID
        const mapping = await categoryParameterMappingService.getMappingById(id, company.id);
        if (mapping) {
            return res.status(200).json(successResponse(
                "MAPPING_FETCHED",
                "Mapping fetched successfully.",
                "Mapping fetched successfully.",
                mapping
            ));
        }

        // 2. If not found, check if it maps category parameters (acting as categoryId lookup)
        const parameters = await categoryParameterMappingService.getParametersByCategoryId(id, company.id);
        if (parameters && parameters.length > 0) {
            return res.status(200).json(successResponse(
                "PARAMETERS_FETCHED",
                "Parameters fetched successfully.",
                "Parameters fetched successfully.",
                parameters
            ));
        }

        // 3. Otherwise return 404
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
 * Get Parameters mapped to a Category ID.
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

        const parameters = await categoryParameterMappingService.getParametersByCategoryId(categoryId, company.id);

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
 * Update CategoryParameterMapping details.
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

        const updatedMapping = await categoryParameterMappingService.updateMapping(id, value, userId, company.id, reqInfo);

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

        await categoryParameterMappingService.deleteMapping(id, userId, company.id, reqInfo);

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
