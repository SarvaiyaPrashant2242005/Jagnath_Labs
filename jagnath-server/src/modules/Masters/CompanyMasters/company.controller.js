/**
 * @file company.controller.js
 * @description HTTP layer for Company APIs.
 */
const { v4: uuidv4 } = require("uuid");
const { 
    createCompanySchema, 
    updateCompanySchema, 
    createCompanyNewSchema, 
    updateCompanyNewSchema 
} = require("./company.validators");
const companyService = require("./company.service");
const { successResponse, errorResponse } = require("../../../utils/response");

const create = async (req, res) => {
    try {
        const userId = req.user.user_id;



        const body = req.body || {};
        // Determine validation schema based on input fields (support backward compatibility)
        const isNewSchema = body.companyName !== undefined || body.companyEmail !== undefined;
        const schemaToUse = isNewSchema ? createCompanyNewSchema : createCompanySchema;

        const { error, value } = schemaToUse.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const generatedId = req.company_id || req.body.company_id || uuidv4();

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newCompany = await companyService.createCompany(value, userId, req.files, generatedId, reqInfo);

        return res.status(201).json(successResponse(
            "COMPANY_CREATED",
            "Company created successfully.",
            "Company created successfully.",
            newCompany
        ));
    } catch (err) {
        if (err.message === "Company Code must be unique.") {
            return res.status(409).json(errorResponse("CONFLICT", err.message, err.message));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create company."));
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.role === "SUPERADMIN" || req.user.role === "Super Admin" || req.user.email === "admin@jagnath.com";

        // Verify ownership before update
        const isOwner = await companyService.checkOwnership(id, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "You do not have permission to update this company.",
                "Access Denied: You do not own this company."
            ));
        }

        const body = req.body || {};
        // Determine validation schema based on input fields (support backward compatibility)
        const isNewSchema = body.companyName !== undefined || body.companyEmail !== undefined;
        const schemaToUse = isNewSchema ? updateCompanyNewSchema : updateCompanySchema;

        const { error, value } = schemaToUse.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedCompany = await companyService.updateCompany(id, value, userId, req.files, reqInfo);

        return res.status(200).json(successResponse(
            "COMPANY_UPDATED",
            "Company updated successfully.",
            "Company updated successfully.",
            updatedCompany
        ));
    } catch (err) {
        if (err.message === "Company not found.") {
            return res.status(404).json(errorResponse("NOT_FOUND", err.message, err.message));
        }
        if (err.message === "Company Code must be unique.") {
            return res.status(409).json(errorResponse("CONFLICT", err.message, err.message));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update company."));
    }
};

const getMyCompanies = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.role === "SUPERADMIN" || req.user.role === "Super Admin" || req.user.email === "admin@jagnath.com";
        
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status,
            isSuperAdmin
        };

        const result = await companyService.getCompaniesByUser(userId, options);

        if (!result || (Array.isArray(result) && result.length === 0) || (result.rows && result.rows.length === 0)) {
            return res.status(200).json(successResponse(
                "COMPANIES_FETCHED",
                "Companies fetched successfully.",
                "No companies found.",
                options.limit ? { rows: [], total: 0, page: parseInt(options.page), totalPages: 0 } : []
            ));
        }

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
            "COMPANIES_FETCHED",
            "Companies fetched successfully.",
            "Companies retrieved.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch companies."));
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.role === "SUPERADMIN" || req.user.role === "Super Admin" || req.user.email === "admin@jagnath.com";

        // Verify ownership before delete
        const isOwner = await companyService.checkOwnership(id, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "You do not have permission to delete this company.",
                "Access Denied: You do not own this company."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await companyService.deleteCompany(id, userId, reqInfo);

        return res.status(200).json(successResponse(
            "COMPANY_DELETED",
            "Company deleted successfully.",
            "Company has been deleted.",
            null
        ));
    } catch (err) {
        if (err.message === "Company not found.") {
            return res.status(404).json(errorResponse("NOT_FOUND", err.message, err.message));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete company."));
    }
};

module.exports = {
    create,
    update,
    remove,
    getMyCompanies
};
