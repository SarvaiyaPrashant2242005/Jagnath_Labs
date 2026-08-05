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
        const errorMsg = err.message || "Failed to create test request.";
        return res.status(400).json(errorResponse("BAD_REQUEST", errorMsg, errorMsg));
    }
};

/**
 * Get all TestRequests for user's company.
 */
const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let companyId;
        try {
            companyId = await resolveCompanyId(req.body, req.query, userId, req.headers, req.user);
        } catch (e) {
            if (e.message === "UNAUTHORIZED_COMPANY") {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this company.", "Unauthorized"));
            }
            return res.status(200).json(successResponse(
                "TEST_REQUESTS_FETCHED",
                "Test requests fetched successfully.",
                "Test requests fetched successfully.",
                req.query.limit ? { rows: [], total: 0, page: parseInt(req.query.page), totalPages: 0 } : []
            ));
        }

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status,
            clientId: req.query.clientId
        };

        const result = await testRequestService.getTestRequestsByCompany(companyId, options);

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
        const isSuperAdmin = req.user.role === "SuperAdmin" || req.user.role === "SUPER_ADMIN" || req.user.email === "admin@jagnath.com";

        let tr = await testRequestService.getTestRequestById(id, null);
        if (!tr) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Test Request not found.", "Test Request not found."));
        }

        // Verify company ownership if not SuperAdmin
        if (!isSuperAdmin) {
            const isOwner = await companyService.checkOwnership(tr.companyId, userId);
            if (!isOwner) {
                return res.status(403).json(errorResponse("FORBIDDEN", "Unauthorized access to this Test Request.", "Unauthorized"));
            }
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
        const errorMsg = err.message || "Failed to update test request.";
        return res.status(400).json(errorResponse("BAD_REQUEST", errorMsg, errorMsg));
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

/**
 * Send TestRequest email to client with template & PDF attachment.
 */
const sendEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { to, subject, body, pdfBase64, fileName } = req.body || {};

        const tr = await testRequestService.getTestRequestById(id, null);
        if (!tr) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Test Request not found."));
        }

        const emailService = require("../../../shared/services/email.service");
        const emailTemplateService = require("../../Utils/EmailTemplates/emailTemplate.service");

        // Resolve recipient email address
        const targetEmail = to || tr.email || (tr.client && tr.client.email) || "";
        if (!targetEmail) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", "No recipient email address provided or configured for this client."));
        }

        let finalSubject = subject;
        let finalBody = body;

        // If subject or body is not customized in request, load and compile template
        if (!finalSubject || !finalBody) {
            const templates = await emailTemplateService.getAllEmailTemplates({ templateType: "TEST_REQUEST" }, tr.companyId);
            const template = templates[0] || {};

            const placeholderData = {
                clientName: tr.clientName || tr.contactPerson || "Valued Client",
                contactPerson: tr.contactPerson || tr.clientName || "Valued Client",
                reportNumber: tr.reportNumber || tr.sampleIdNumber || tr.id.slice(0, 8),
                detailsOfSample: tr.sampleParticular || tr.formTitle || "Testing Sample",
                date: tr.dateOfReceipt || tr.dateOfCollection || new Date().toISOString().split("T")[0],
                companyName: tr.companyName || "Jagnath Labs"
            };

            const compileText = (str = "") => {
                let resText = str;
                Object.keys(placeholderData).forEach(k => {
                    const regex = new RegExp(`\\{${k}\\}`, "gi");
                    resText = resText.replace(regex, placeholderData[k] || "");
                });
                return resText;
            };

            if (!finalSubject) finalSubject = compileText(template.subject || "Test Request Acknowledgement - {reportNumber}");
            if (!finalBody) finalBody = compileText(template.body || "<p>Dear {clientName}, please find your Test Request Form attached.</p>");
        }

        const attachments = [];
        if (pdfBase64) {
            const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
            attachments.push({
                filename: fileName || `Test_Request_${tr.reportNumber || tr.id.slice(0, 8)}.pdf`,
                content: Buffer.from(cleanBase64, "base64"),
                contentType: "application/pdf"
            });
        }

        const emailResult = await emailService.sendDocumentEmail({
            to: targetEmail,
            subject: finalSubject,
            html: finalBody,
            attachments
        });

        return res.status(200).json(successResponse(
            "EMAIL_SENT",
            emailResult.message || `Email sent successfully to ${targetEmail}.`,
            emailResult
        ));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to send email."));
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    sendEmail
};