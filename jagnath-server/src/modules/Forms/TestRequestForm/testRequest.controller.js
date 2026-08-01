/**
 * @file testRequest.controller.js
 * @description HTTP layer for TestRequest APIs.
 */
const { createTestRequestSchema, updateTestRequestSchema } = require("./testRequest.validators");
const testRequestService = require("./testRequest.service");
const companyService = require("../../Masters/CompanyMasters/company.service");
const Company = require("../../Masters/CompanyMasters/company.model");
const Client = require("../../Masters/ClientMasters/client.model");
const TestRequestModel = require("./testRequest.model");
const { Op } = require("sequelize");
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
 * Create a new TestRequest.
 */
const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createTestRequestSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        // Find the Company using companyId
        const companyIdVal = value.companyId;
        const company = await Company.findByPk(companyIdVal);

        if (!company) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Company not found.",
                "Company not found."
            ));
        }

        // Verify that the authenticated user owns that company
        const isOwner = await companyService.checkOwnership(company.id, userId);
        if (!isOwner) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized access to this company.",
                "Unauthorized"
            ));
        }

        // Find the Client using clientId and companyId
        const client = await Client.findOne({
            where: {
                id: value.clientId,
                companyId: company.id
            }
        });

        if (!client) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Client not found in this company.",
                "Client not found."
            ));
        }

        // Auto-fetch client details (contactNumber, address) unless overridden in the request body
        const testRequestData = {
            ...value,
            companyId: company.id,
            clientId: client.id,
            cautionId: (value.cautionId && typeof value.cautionId === 'string' && value.cautionId.trim() !== "") ? value.cautionId : null,
            includeCaution: !!value.includeCaution,
            address: value.address !== undefined && value.address !== null && value.address !== "" ? value.address : client.address,
            contactNumber: value.contactNumber !== undefined && value.contactNumber !== null && value.contactNumber !== "" ? value.contactNumber : client.contactNumber
        };

        delete testRequestData.companyName;
        delete testRequestData.clientName;

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const newTR = await testRequestService.createTestRequest(testRequestData, userId, reqInfo);

        return res.status(201).json(successResponse(
            "TEST_REQUEST_CREATED",
            "Test Request created successfully.",
            "Test Request created successfully.",
            newTR
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create test request."));
    }
};

/**
 * Get all TestRequests for user's company.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let targetCompanyId = req.query.companyId || req.query.company_id;
        if (!targetCompanyId) {
            try {
                const company = await getUserCompany(userId);
                if (company) targetCompanyId = company.id;
            } catch (e) {
                targetCompanyId = null;
            }
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status,
            clientId: req.query.clientId
        };

        const result = await testRequestService.getTestRequestsByCompany(targetCompanyId, options);

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
            "TEST_REQUESTS_FETCHED",
            "Test requests fetched successfully.",
            "Test requests fetched successfully.",
            responseData
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch test requests."));
    }
};

/**
 * Get TestRequest by ID.
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;

        let companyId = null;
        try {
            const company = await getUserCompany(userId);
            if (company) companyId = company.id;
        } catch (e) {
            // Ignore company error to allow lookup by test request ID
        }

        const tr = await testRequestService.getTestRequestById(id, companyId);
        if (!tr) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Test Request not found or access denied.",
                "Test Request not found."
            ));
        }

        return res.status(200).json(successResponse(
            "TEST_REQUEST_FETCHED",
            "Test request fetched successfully.",
            "Test request fetched successfully.",
            tr
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch test request."));
    }
};

/**
 * Update TestRequest details.
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateTestRequestSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse(
                "VALIDATION_ERROR",
                error.details[0].message,
                error.details[0].message
            ));
        }

        // Find the existing TestRequest record to resolve its current keys
        const existingTR = await TestRequestModel.findByPk(id);
        if (!existingTR) {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                "Test Request not found or access denied.",
                "Test Request not found."
            ));
        }

        // Verify that the user has access to the company of the test request
        const isOwnerOfCurrent = await companyService.checkOwnership(existingTR.companyId, userId);
        if (!isOwnerOfCurrent) {
            return res.status(403).json(errorResponse(
                "FORBIDDEN",
                "Unauthorized access to this test request.",
                "Unauthorized"
            ));
        }

        let resolvedCompanyId = existingTR.companyId;
        let resolvedClientId = existingTR.clientId;

        // If companyId is updated
        if (value.companyId) {
            const comp = await Company.findByPk(value.companyId);
            if (!comp) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Company not found.", "Company not found."));
            }
            const isOwner = await companyService.checkOwnership(comp.id, userId);
            if (!isOwner) {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this company.", "Unauthorized"));
            }
            resolvedCompanyId = comp.id;
        }

        // If clientId is updated (or companyId is updated)
        if (value.clientId || value.companyId) {
            let clientIdVal = value.clientId || existingTR.clientId;

            if (clientIdVal) {
                const client = await Client.findOne({
                    where: {
                        id: clientIdVal,
                        companyId: resolvedCompanyId
                    }
                });
                if (!client) {
                    return res.status(404).json(errorResponse("NOT_FOUND", "Client not found in this company.", "Client not found."));
                }
                resolvedClientId = client.id;
                
                // Copy details automatically from the resolved client if address/contactNumber are not explicitly updated in the request body
                if (value.address === undefined) {
                    value.address = client.address;
                }
                if (value.contactNumber === undefined) {
                    value.contactNumber = client.contactNumber;
                }
            }
        }

        const updateData = {
            ...value,
            companyId: resolvedCompanyId,
            clientId: resolvedClientId
        };
        if (value.cautionId !== undefined) {
            updateData.cautionId = (value.cautionId && typeof value.cautionId === 'string' && value.cautionId.trim() !== "") ? value.cautionId : null;
        }
        if (value.includeCaution !== undefined) {
            updateData.includeCaution = !!value.includeCaution;
        }
        delete updateData.companyName;
        delete updateData.clientName;

        const reqInfo = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        };

        const updatedTR = await testRequestService.updateTestRequest(id, updateData, userId, existingTR.companyId, reqInfo);

        return res.status(200).json(successResponse(
            "TEST_REQUEST_UPDATED",
            "Test Request updated successfully.",
            "Test Request updated successfully.",
            updatedTR
        ));
    } catch (err) {
        if (err.message === "TestRequest not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Test Request not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update test request."));
    }
};

/**
 * Delete a TestRequest.
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

        await testRequestService.deleteTestRequest(id, userId, company.id, reqInfo);

        return res.status(200).json(successResponse(
            "TEST_REQUEST_DELETED",
            "Test Request deleted successfully.",
            "Test Request has been deleted.",
            null
        ));
    } catch (err) {
        if (err.message === "TestRequest not found or access denied.") {
            return res.status(404).json(errorResponse(
                "NOT_FOUND",
                err.message,
                "Test Request not found."
            ));
        }
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete test request."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};
