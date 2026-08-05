/**
 * @file testReport.controller.js
 * @description HTTP controller endpoints for Test Reports.
 */
const { createTestReportSchema, updateTestReportSchema } = require("./testReport.validators");
const testReportService = require("./testReport.service");
const companyService = require("../../Masters/CompanyMasters/company.service");
const Company = require("../../Masters/CompanyMasters/company.model");
const TestReport = require("./testReport.model");
const { successResponse, errorResponse } = require("../../../utils/response");

const resolveCompanyId = async (body, query, userId, headers = {}, reqUser = {}) => {
    const isSuperAdmin = reqUser?.role === "SuperAdmin" || reqUser?.role === "SUPER_ADMIN" || reqUser?.email === "admin@jagnath.com";
    const companyIdVal = body?.companyId || body?.company_id || query?.companyId || query?.company_id || headers?.["x-company-id"];

    if (companyIdVal && companyIdVal !== 'null' && companyIdVal !== 'undefined') {
        const comp = await Company.findByPk(companyIdVal);
        if (comp) return comp.id;
    }

    const company = await companyService.getCompanyByUserId(userId);
    if (company) return company.id;

    const companies = await companyService.getCompaniesByUser(userId, { isSuperAdmin });
    if (companies && companies.length > 0) return companies[0].id;

    const anyComp = await Company.findOne();
    if (anyComp) return anyComp.id;

    throw new Error("NO_COMPANY_FOUND");
};

const create = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = createTestReportSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }

        const companyId = await resolveCompanyId(body, req.query, userId, req.headers, req.user);

        const sanitizeDate = (d) => (d && typeof d === 'string' && d.trim() !== '' ? d.trim() : null);
        const sanitizeUUID = (u) => (u && typeof u === 'string' && u.length === 36 ? u : null);

        const reportData = {
            companyId,
            testRequestId: sanitizeUUID(value.testRequestId),
            reportNumber: value.reportNumber,
            referenceNo: value.referenceNo || value.reportNumber,
            reportIssuedTo: value.reportIssuedTo,
            agencyName: value.agencyName || value.reportIssuedTo,
            agencyAddress: value.agencyAddress || "",
            detailsOfSample: value.detailsOfSample || "",
            packingDetails: value.packingDetails || "",
            dateOfReceipt: sanitizeDate(value.dateOfReceipt),
            sampleQuantity: value.sampleQuantity || "",
            samplingLocation: value.samplingLocation || "",
            conditionOnReceipt: value.conditionOnReceipt || "Satisfactory",
            sampleCollectedBy: value.sampleCollectedBy || "",
            nameOfWork: value.nameOfWork || "",
            startingDateOfTest: sanitizeDate(value.startingDateOfTest),
            completionDateOfTest: sanitizeDate(value.completionDateOfTest),
            sectionHeader: value.sectionHeader || "",
            formatNo: value.formatNo || "",
            formatDate: value.formatDate || "",
            reviewedBy: value.reviewedBy || "",
            authorizedSignatory: value.authorizedSignatory || "",
            parametersList: value.parametersList || [],
            status: value.status || "Completed"
        };

        const newReport = await testReportService.createTestReport(reportData);
        return res.status(201).json(successResponse("TEST_REPORT_CREATED", "Test report saved successfully.", "Test report saved successfully.", newReport));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to create test report."));
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const body = req.body || {};

        const { error, value } = updateTestReportSchema.validate(body);
        if (error) {
            return res.status(400).json(errorResponse("VALIDATION_ERROR", error.details[0].message, error.details[0].message));
        }

        const report = await TestReport.findByPk(id);
        if (!report) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Test report not found.", "Test report not found."));
        }

        const companyId = await resolveCompanyId(body, req.query, userId, req.headers, req.user);

        const reportData = {
            testRequestId: value.testRequestId !== undefined ? value.testRequestId : report.testRequestId,
            reportNumber: value.reportNumber || report.reportNumber,
            referenceNo: value.referenceNo || report.referenceNo,
            reportIssuedTo: value.reportIssuedTo || report.reportIssuedTo,
            agencyName: value.agencyName !== undefined ? value.agencyName : report.agencyName,
            agencyAddress: value.agencyAddress !== undefined ? value.agencyAddress : report.agencyAddress,
            detailsOfSample: value.detailsOfSample !== undefined ? value.detailsOfSample : report.detailsOfSample,
            packingDetails: value.packingDetails !== undefined ? value.packingDetails : report.packingDetails,
            dateOfReceipt: value.dateOfReceipt !== undefined ? value.dateOfReceipt : report.dateOfReceipt,
            sampleQuantity: value.sampleQuantity !== undefined ? value.sampleQuantity : report.sampleQuantity,
            samplingLocation: value.samplingLocation !== undefined ? value.samplingLocation : report.samplingLocation,
            conditionOnReceipt: value.conditionOnReceipt !== undefined ? value.conditionOnReceipt : report.conditionOnReceipt,
            sampleCollectedBy: value.sampleCollectedBy !== undefined ? value.sampleCollectedBy : report.sampleCollectedBy,
            nameOfWork: value.nameOfWork !== undefined ? value.nameOfWork : report.nameOfWork,
            startingDateOfTest: value.startingDateOfTest !== undefined ? value.startingDateOfTest : report.startingDateOfTest,
            completionDateOfTest: value.completionDateOfTest !== undefined ? value.completionDateOfTest : report.completionDateOfTest,
            sectionHeader: value.sectionHeader !== undefined ? value.sectionHeader : report.sectionHeader,
            formatNo: value.formatNo !== undefined ? value.formatNo : report.formatNo,
            formatDate: value.formatDate !== undefined ? value.formatDate : report.formatDate,
            reviewedBy: value.reviewedBy !== undefined ? value.reviewedBy : report.reviewedBy,
            authorizedSignatory: value.authorizedSignatory !== undefined ? value.authorizedSignatory : report.authorizedSignatory,
            parametersList: value.parametersList !== undefined ? value.parametersList : report.parametersList,
            status: value.status || report.status
        };

        const updatedReport = await testReportService.updateTestReport(id, reportData, companyId);
        return res.status(200).json(successResponse("TEST_REPORT_UPDATED", "Test report updated successfully.", "Test report updated successfully.", updatedReport));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to update test report."));
    }
};

const getAll = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
            status: req.query.status
        };

        const result = await testReportService.getTestReportsByCompany(companyId, options);
        let responseData = result;
        if (options.limit && result.rows) {
            responseData = {
                rows: result.rows,
                total: result.count,
                page: parseInt(options.page),
                totalPages: Math.ceil(result.count / parseInt(options.limit))
            };
        }

        return res.status(200).json(successResponse("TEST_REPORTS_FETCHED", "Test reports fetched successfully.", "Test reports fetched successfully.", responseData));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch test reports."));
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);

        const report = await testReportService.getTestReportById(id, companyId);
        if (!report) {
            return res.status(404).json(errorResponse("NOT_FOUND", "Test report not found.", "Test report not found."));
        }
        return res.status(200).json(successResponse("TEST_REPORT_FETCHED", "Test report fetched successfully.", "Test report fetched successfully.", report));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to fetch test report."));
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const companyId = await resolveCompanyId({}, req.query, userId, req.headers, req.user);

        await testReportService.deleteTestReport(id, companyId);
        return res.status(200).json(successResponse("TEST_REPORT_DELETED", "Test report deleted successfully.", "Test report deleted successfully."));
    } catch (err) {
        return res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR", err.message, "Failed to delete test report."));
    }
};

module.exports = {
    create,
    update,
    getAll,
    getById,
    remove
};
