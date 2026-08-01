/**
 * @file parameter.controller.js
 * @description HTTP layer for Parameter APIs.
 */
const { createParameterSchema, updateParameterSchema } = require("./parameter.validators");
const parameterService = require("./parameter.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const Parameter = require("./parameter.model");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Resolves the company ID based on body, query parameters or user default.
 * Validates user ownership/membership.
 */
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

        let companyId;
        try {
            companyId = await resolveCompanyId(body, req.query, userId);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied: You do not own this company."));
            }
            if (e.message === "COMPANY_NOT_FOUND") {
                return res.status(404).json(errorResponse("NOT_FOUND", "Company not found.", "Company not found."));
            }
            return res.status(404).json(errorResponse("NOT_FOUND", e.message, e.message));
        }

        const parameterData = { 
            parameterName: value.parameterName,
            description: value.description,
            testMethod: value.testMethod,
            status: value.status || "Active",
            companyId,
            categoryId: value.categoryId
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

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this company's parameters.", "Unauthorized"));
            }
            if (e.message === "COMPANY_NOT_FOUND" || e.message === "NO_COMPANY_FOUND") {
                return res.status(200).json(successResponse(
                    "PARAMETERS_FETCHED",
                    "Parameters fetched successfully.",
                    "Parameters fetched successfully.",
                    req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
                ));
            }
            return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", e.message, e.message));
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status
        };

        const result = await parameterService.getParametersByCompany(companyId, options);

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
            "PARAMETERS_FETCHED",
            "Parameters fetched successfully.",
            "Parameters fetched successfully.",
            responseData
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

        const param = await Parameter.findByPk(id);
        if (!param) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter not found.",
                "Parameter not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(param.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this parameter."
            ));
        }

        const formatted = await parameterService.getParameterById(id, param.companyId);

        return res.status(200).json(successResponse(
            "PARAMETER_FETCHED",
            "Parameter fetched successfully.",
            "Parameter fetched successfully.",
            formatted
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

        const param = await Parameter.findByPk(id);
        if (!param) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter not found.",
                "Parameter not found."
            ));
        }

        // Verify ownership of current company
        const isOwner = await companyService.checkOwnership(param.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this parameter."
            ));
        }

        // Resolve target company
        let targetCompanyId = param.companyId;
        if (body.companyId || body.company_id || body.companyName) {
            try {
                targetCompanyId = await resolveCompanyId(body, {}, userId);
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

        const parameterData = {
            parameterName: value.parameterName,
            description: value.description,
            testMethod: value.testMethod,
            status: value.status,
            companyId: targetCompanyId,
            categoryId: value.categoryId
        };

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedParam = await parameterService.updateParameter(id, parameterData, userId, param.companyId, reqInfo);

        return res.status(200).json(successResponse(
            "PARAMETER_UPDATED",
            "Parameter updated successfully.",
            "Parameter updated successfully.",
            updatedParam
        ));
    } catch (err) {
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

        const param = await Parameter.findByPk(id);
        if (!param) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Parameter not found.",
                "Parameter not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(param.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this parameter."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await parameterService.deleteParameter(id, userId, param.companyId, reqInfo);

        return res.status(200).json(successResponse(
            "PARAMETER_DELETED",
            "Parameter deleted successfully.",
            "Parameter has been deleted.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete parameter."));
    }
};

/**
 * Bulk Import Parameters from Excel dataset.
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

        let reqCompanyId = req.body?.companyId || req.query?.companyId || req.headers['x-company-id'];
        if (reqCompanyId === 'undefined' || reqCompanyId === 'null' || !reqCompanyId) {
            reqCompanyId = null;
        }
        let companyId = reqCompanyId;

        if (!companyId) {
            let company = await companyService.getCompanyByUserId(userId);
            if (!company) {
                const companies = await companyService.getCompaniesByUser(userId);
                if (companies && companies.length > 0) {
                    company = companies[0];
                } else {
                    const allCompanies = await companyService.getAllCompanies();
                    if (allCompanies && allCompanies.length > 0) {
                        company = allCompanies[0];
                    }
                }
            }
            if (company) {
                companyId = company.id;
            }
        }

        if (!companyId) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required for parameter bulk import.", "Company not found."));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const result = await parameterService.bulkImportParameters(rows, companyId, userId, reqInfo);

        return res.status(200).json(successResponse(
            "PARAMETERS_BULK_IMPORTED",
            `Successfully processed ${result.totalProcessed} parameters (${result.createdCount} created, ${result.updatedCount} updated).`,
            "Bulk import completed.",
            result
        ));
    } catch (err) {
        console.error("PARAMETER BULK IMPORT ERROR:", err);
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

