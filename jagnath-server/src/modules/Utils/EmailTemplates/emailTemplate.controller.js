/**
 * @file emailTemplate.controller.js
 * @description HTTP layer for Email Template APIs.
 */

const { createEmailTemplateSchema, updateEmailTemplateSchema } = require("./emailTemplate.validators");
const emailTemplateService = require("./emailTemplate.service");
const companyService = require("../../Masters/CompanyMasters/company.service");
const Company = require("../../Masters/CompanyMasters/company.model");
const { successResponse, errorResponse } = require("../../../utils/response");

const resolveCompanyId = async (body, query, userId, headers = {}, reqUser = {}) => {
    const isSuperAdmin = reqUser?.role === "SuperAdmin" || reqUser?.role === "SUPER_ADMIN" || reqUser?.role === "SUPERADMIN" || reqUser?.role === "Super Admin" || reqUser?.email === "admin@jagnath.com";
    const companyIdVal = body?.companyId || body?.company_id || query?.companyId || query?.company_id || headers?.["x-company-id"];
    const companyNameVal = body?.companyName || query?.companyName;

    if (companyIdVal) {
        const isOwner = await companyService.checkOwnership(companyIdVal, userId, isSuperAdmin);
        if (!isOwner) throw new Error("UNAUTHORIZED_COMPANY");
        return companyIdVal;
    } else if (companyNameVal) {
        const company = await Company.findOne({ where: { company_name: companyNameVal } });
        if (!company) throw new Error("COMPANY_NOT_FOUND");
        const isOwner = await companyService.checkOwnership(company.id, userId, isSuperAdmin);
        if (!isOwner) throw new Error("UNAUTHORIZED_COMPANY");
        return company.id;
    } else {
        const company = await companyService.getCompanyByUserId(userId);
        if (company) return company.id;
        const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
        if (companies && companies.length > 0) return companies[0].id;
        throw new Error("NO_COMPANY_FOUND");
    }
};

const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};
        const { error, value } = createEmailTemplateSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }
        const companyId = await resolveCompanyId(body, req.query, userId, req.headers, req.user);
        const template = await emailTemplateService.createEmailTemplate(value, companyId);
        return res.status(201).json(successResponse("TEMPLATE_CREATED", "Email template created successfully.", "Email template created successfully.", template));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message));
    }
};

const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        const templates = await emailTemplateService.getAllEmailTemplates(req.query, companyId);
        return res.status(200).json(successResponse("TEMPLATES_FETCHED", "Email templates fetched successfully.", "Email templates fetched successfully.", templates));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message));
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        const template = await emailTemplateService.getEmailTemplateById(id, companyId);
        return res.status(200).json(successResponse("TEMPLATE_FETCHED", "Email template fetched successfully.", "Email template fetched successfully.", template));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message));
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};
        const { error, value } = updateEmailTemplateSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }
        const companyId = await resolveCompanyId(body, req.query, userId, req.headers, req.user);
        const template = await emailTemplateService.updateEmailTemplate(id, value, companyId);
        return res.status(200).json(successResponse("TEMPLATE_UPDATED", "Email template updated successfully.", "Email template updated successfully.", template));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message));
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        await emailTemplateService.deleteEmailTemplate(id, companyId);
        return res.status(200).json(successResponse("TEMPLATE_DELETED", "Email template deleted successfully.", "Email template deleted successfully.", null));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, err.message));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
