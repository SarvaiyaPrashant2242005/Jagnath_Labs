/**
 * @file locationSample.controller.js
 * @description HTTP layer for Location of Sample Master APIs.
 */

const { createLocationSampleSchema, updateLocationSampleSchema } = require("./locationSample.validators");
const locationSampleService = require("./locationSample.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const { successResponse, errorResponse } = require("../../../utils/response");

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
 * Create a new location of sample.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createLocationSampleSchema.validate(body);
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

        const locData = {
            name: value.name,
            status: value.status || "Active",
            inlet: value.inlet !== undefined ? value.inlet : false,
            outlet: value.outlet !== undefined ? value.outlet : false,
            companyId
        };

        const newLoc = await locationSampleService.createLocationSample(locData, userId);
        return res.status(201).json(successResponse(
            "LOCATION_SAMPLE_CREATED",
            "Location of Sample created successfully.",
            "Location of Sample created successfully.",
            newLoc
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create location of sample."));
    }
};

/**
 * Get all locations.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied: You do not own this company."));
            }
            return res.status(200).json(successResponse(
                "LOCATION_SAMPLES_FETCHED",
                "Locations of sample fetched successfully.",
                "Locations of sample fetched successfully.",
                req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
            ));
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status
        };

        const result = await locationSampleService.getLocationSamplesByCompany(companyId, options);
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
            "LOCATION_SAMPLES_FETCHED",
            "Locations of sample fetched successfully.",
            "Locations of sample fetched successfully.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch locations of sample."));
    }
};

/**
 * Get location by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        } catch (e) {
            return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied."));
        }

        const loc = await locationSampleService.getLocationSampleById(id, companyId);
        if (!loc) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Location of Sample not found.", "Location of Sample not found."));
        }

        return res.status(200).json(successResponse(
            "LOCATION_SAMPLE_FETCHED",
            "Location of sample fetched successfully.",
            "Location of sample fetched successfully.",
            loc
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch location of sample."));
    }
};

/**
 * Update location.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateLocationSampleSchema.validate(body);
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
            return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied."));
        }

        const updated = await locationSampleService.updateLocationSample(id, value, userId, companyId);
        return res.status(200).json(successResponse(
            "LOCATION_SAMPLE_UPDATED",
            "Location of sample updated successfully.",
            "Location of sample updated successfully.",
            updated
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update location of sample."));
    }
};

/**
 * Delete location.
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        } catch (e) {
            return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized", "Access Denied."));
        }

        await locationSampleService.deleteLocationSample(id, userId, companyId);
        return res.status(200).json(successResponse(
            "LOCATION_SAMPLE_DELETED",
            "Location of sample deleted successfully.",
            "Location of sample deleted successfully.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete location of sample."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
