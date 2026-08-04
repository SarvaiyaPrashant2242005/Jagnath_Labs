/**
 * @file client.controller.js
 * @description HTTP layer for Client APIs.
 */
const { createClientSchema, updateClientSchema } = require("./client.validators");
const clientService = require("./client.service");
const companyService = require("../CompanyMasters/company.service");
const Company = require("../CompanyMasters/company.model");
const { Op } = require("sequelize");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Create a new client.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";
        const body = req.body || {};

        const { error, value } = createClientSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        // Find the Company using companyName
        const companyNameVal = value.companyName;
        const company = await Company.findOne({
            where: {
                company_name: companyNameVal
            }
        });

        if (!company) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Company not found.",
                "Company not found."
            ));
        }

        // Verify that the authenticated user owns that company
        const isOwner = await companyService.checkOwnership(company.id, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Unauthorized"
            ));
        }

        // Replace companyName with companyId for database save
        const clientData = { ...value };
        delete clientData.companyName;
        clientData.companyId = company.id;

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newClient = await clientService.createClient(clientData, userId, reqInfo);

        return res.status(201).json(successResponse(
            "CLIENT_CREATED",
            "Client created successfully.",
            "Client created successfully.",
            newClient
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create client."));
    }
};

/**
 * Update client details.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";
        const body = req.body || {};

        const { error, value } = updateClientSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        const client = await clientService.getClientById(id);
        if (!client) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Client not found.",
                "Client not found."
            ));
        }

        // Verify ownership of the company that the client currently belongs to
        const isOwner = await companyService.checkOwnership(client.companyId, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this client."
            ));
        }

        const clientData = { ...value };

        // If companyName is supplied during update
        if (value.companyName !== undefined) {
            const company = await Company.findOne({
                where: {
                    company_name: value.companyName
                }
            });

            if (!company) {
                return res.status(404).json(errorResponse(
                    "NOT_FOUND",
                    "Company not found.",
                    "Company not found."
                ));
            }

            // Verify ownership of the target company
            const isTargetOwner = await companyService.checkOwnership(company.id, userId, isSuperAdmin);
            if (!isTargetOwner) {
                return res.status(403).json(errorResponse(
                    "FORBIDDEN",
                    "Unauthorized",
                    "Access Denied: You do not own the target company."
                ));
            }

            // Replace companyName with companyId
            delete clientData.companyName;
            clientData.companyId = company.id;
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedClient = await clientService.updateClient(id, clientData, userId, reqInfo);

        return res.status(200).json(successResponse(
            "CLIENT_UPDATED",
            "Client updated successfully.",
            "Client updated successfully.",
            updatedClient
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update client."));
    }
};

/**
 * Retrieve client by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";

        const client = await clientService.getClientById(id);
        if (!client) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Client not found.",
                "Client not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(client.companyId, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this client."
            ));
        }

        return res.status(200).json(successResponse(
            "CLIENT_FETCHED",
            "Client fetched successfully.",
            "Client retrieved.",
            client
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch client."));
    }
};

/**
 * Retrieve all clients belonging to the logged-in user's company.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";
        const requestedCompanyId = req.query.companyId || req.query.company_id || req.headers["x-company-id"];

        let companyIdToUse;

        if (requestedCompanyId) {
            // Verify ownership of the requested company
            const isOwner = await companyService.checkOwnership(requestedCompanyId, userId, isSuperAdmin);
            if (!isOwner) {
                return res.status(403).json(errorResponse(
                    "FORBIDDEN",
                    "Unauthorized access to this company's clients.",
                    "Unauthorized"
                ));
            }
            companyIdToUse = requestedCompanyId;
        } else {
            // Find default user's company
            let company = await companyService.getCompanyByUserId(userId);
            if (!company) {
                const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
                if (companies && companies.length > 0) {
                    company = companies[0];
                }
            }

            if (!company) {
                return res.status(200).json(successResponse(
                    "CLIENTS_FETCHED",
                    "Clients fetched successfully.",
                    "Clients retrieved.",
                    req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
                ));
            }
            companyIdToUse = company.id;
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status
        };

        const result = await clientService.getClientsByCompany(companyIdToUse, options);

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
            "CLIENTS_FETCHED",
            "Clients fetched successfully.",
            "Clients retrieved.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch clients."));
    }
};

/**
 * Soft-delete a client.
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";

        const client = await clientService.getClientById(id);
        if (!client) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Client not found.",
                "Client not found."
            ));
        }

        // Verify ownership
        const isOwner = await companyService.checkOwnership(client.companyId, userId, isSuperAdmin);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized",
                "Access Denied: You do not own the company associated with this client."
            ));
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        await clientService.deleteClient(id, userId, reqInfo);

        return res.status(200).json(successResponse(
            "CLIENT_DELETED",
            "Client deleted successfully.",
            "Client has been deleted.",
            null
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete client."));
    }
};

/**
 * Bulk Import Clients from Excel dataset.
 */
const bulkImport = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";
        const { rows } = req.body || {};
        const requestedCompanyId = req.headers["x-company-id"] || req.query.companyId || req.query.company_id || req.body?.companyId;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                "No rows provided for bulk import.",
                "No valid data provided."
            ));
        }

        let companyIdToUse;
        if (requestedCompanyId) {
            const isOwner = await companyService.checkOwnership(requestedCompanyId, userId, isSuperAdmin);
            if (!isOwner) {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized company access.", "Unauthorized"));
            }
            companyIdToUse = requestedCompanyId;
        } else {
            let company = await companyService.getCompanyByUserId(userId);
            if (!company) {
                const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
                if (companies && companies.length > 0) {
                    company = companies[0];
                }
            }

            if (!company) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Company not found for user.", "Company not found."));
            }
            companyIdToUse = company.id;
        }

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const result = await clientService.bulkImportClients(rows, companyIdToUse, userId, reqInfo);

        return res.status(200).json(successResponse(
            "CLIENTS_BULK_IMPORTED",
            `Successfully processed ${result.totalProcessed} records (${result.createdCount} created, ${result.updatedCount} updated).`,
            "Bulk import completed.",
            result
        ));
    } catch (err) {
        console.error("Bulk Import Controller Error:", err);
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Bulk import failed."));
    }
};

module.exports = {
    create,
    update,
    getById,
    getAll,
    remove,
    bulkImport
};

