/**
 * @file department.controller.js
 * @description HTTP layer for Department APIs.
 */
const { createDepartmentSchema, updateDepartmentSchema } = require("./department.validators");
const departmentService = require("./department.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const Department = require("./department.model");
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

const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createDepartmentSchema.validate(body);
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

        const deptData = {
            name: value.name,
            description: value.description,
            status: value.status || "Active",
            companyId
        };

        const newDept = await departmentService.createDepartment(deptData, userId);

        return res.status(201).json(successResponse(
            "DEPARTMENT_CREATED",
            "Department created successfully.",
            "Department created successfully.",
            newDept
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create department."));
    }
};

const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let companyId;
        try {
            companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this company's departments.", "Unauthorized"));
            }
            if (e.message === "COMPANY_NOT_FOUND" || e.message === "NO_COMPANY_FOUND") {
                return res.status(200).json(successResponse(
                    "DEPARTMENTS_FETCHED",
                    "Departments fetched successfully.",
                    "Departments fetched successfully.",
                    req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
                ));
            }
            return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", e.message, e.message));
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const result = await departmentService.getDepartmentsByCompany(companyId, options);

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
            "DEPARTMENTS_FETCHED",
            "Departments fetched successfully.",
            "Departments fetched successfully.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch departments."));
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const dept = await Department.findByPk(id);
        if (!dept) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Department not found.",
                "Department not found."
            ));
        }

        const isOwner = await companyService.checkOwnership(dept.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this department."
            ));
        }

        const formatted = await departmentService.getDepartmentById(id, dept.companyId);

        return res.status(200).json(successResponse(
            "DEPARTMENT_FETCHED",
            "Department fetched successfully.",
            "Department fetched successfully.",
            formatted
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch department."));
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateDepartmentSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const dept = await Department.findByPk(id);
        if (!dept) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Department not found.",
                "Department not found."
            ));
        }

        const isOwner = await companyService.checkOwnership(dept.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this department."
            ));
        }

        let targetCompanyId = dept.companyId;
        if (body.companyId || body.company_id) {
            try {
                targetCompanyId = await resolveCompanyId(body, {}, userId, req.headers);
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

        const deptData = {
            name: value.name,
            description: value.description,
            status: value.status,
            companyId: targetCompanyId
        };

        const updatedDept = await departmentService.updateDepartment(id, deptData, userId, dept.companyId);

        return res.status(200).json(successResponse(
            "DEPARTMENT_UPDATED",
            "Department updated successfully.",
            "Department updated successfully.",
            updatedDept
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update department."));
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        const dept = await Department.findByPk(id);
        if (!dept) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Department not found.",
                "Department not found."
            ));
        }

        const isOwner = await companyService.checkOwnership(dept.companyId, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this department."
            ));
        }

        await departmentService.deleteDepartment(id, userId, dept.companyId);

        return res.status(200).json(successResponse(
            "DEPARTMENT_DELETED",
            "Department deleted successfully.",
            "Department has been deleted.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete department."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
