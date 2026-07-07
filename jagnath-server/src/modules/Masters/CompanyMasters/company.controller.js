/**
 * @file company.controller.js
 * @description HTTP layer for Company APIs.
 */
const { v4: uuidv4 } = require("uuid");
const { createCompanySchema, updateCompanySchema } = require("./company.validators");
const companyService = require("./company.service");
const { successResponse, errorResponse } = require("../../../utils/response");

const create = async (req, res) => {
    try {
        // Validation using Joi
        const { error, value } = createCompanySchema.validate(req.body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        // We use req.company_id that was injected by our middleware, or fallback
        const generatedId = req.company_id || req.body.company_id || uuidv4();

        const userId = req.user.user_id; // Injected by auth.middleware

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
        const { error, value } = updateCompanySchema.validate(req.body);
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

        const updatedCompany = await companyService.updateCompany(id, value, req.files, reqInfo);

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
        const companies = await companyService.getCompaniesByUser(userId);

        return res.status(200).json(successResponse(
            "COMPANIES_FETCHED",
            "Companies fetched successfully.",
            "Companies retrieved.",
            companies
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch companies."));
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

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
