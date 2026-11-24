/**
 * @file testReport.service.js
 * @description Business logic for TestReport operations.
 */
const TestReport = require("./testReport.model");
const Company = require("../../Masters/CompanyMasters/company.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const db = require("../../../database");

const formatTestReport = (tr) => {
    if (!tr) return null;
    const trObj = tr.toJSON ? tr.toJSON() : { ...tr };
    
    // Resolve Client address mapping and sampling date dynamically from associated TestRequest -> Client or directly associated Client
    if (trObj.testRequest) {
        trObj.dateOfSampling = trObj.dateOfSampling || trObj.testRequest.dateOfCollection || trObj.testRequest.dateOfSampling || trObj.testRequest.samplingDate || null;
        if (trObj.testRequest.client) {
            const client = trObj.testRequest.client;
            trObj.reportIssuedTo = client.plantAddress ? `${client.clientName}\n${client.plantAddress}` : client.clientName;
            trObj.agencyName = client.clientName;
            trObj.agencyAddress = client.officeAddress;
        }
    } else if (trObj.client) {
        const client = trObj.client;
        trObj.reportIssuedTo = trObj.reportIssuedTo || (client.plantAddress ? `${client.clientName}\n${client.plantAddress}` : client.clientName);
        trObj.agencyName = trObj.agencyName || client.clientName;
        trObj.agencyAddress = trObj.agencyAddress || client.officeAddress;
    }
    
    if (trObj.company) {
        trObj.companyName = trObj.company.companyName || trObj.company.company_name;
        trObj.companyLogo = trObj.company.test_report_logo || trObj.company.testReportLogo || trObj.company.logo;
    } else {
        trObj.companyName = null;
        trObj.companyLogo = null;
    }
    delete trObj.company;
    delete trObj.testRequest;
    return trObj;
};

/**
 * Creates a new Test Report.
 */
const createTestReport = async (reportData) => {
    const transaction = await sequelize.transaction();
    try {
        const newReport = await TestReport.create(reportData, { transaction });
        await transaction.commit();
        return await getTestReportById(newReport.id, newReport.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing Test Report.
 */
const updateTestReport = async (id, reportData, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        let report = await TestReport.findOne({
            where: { id, companyId },
            transaction
        });
        if (!report) {
            report = await TestReport.findOne({
                where: { id },
                transaction
            });
        }
        if (!report) {
            throw new Error("Test Report not found or access denied.");
        }

        await report.update(reportData, { transaction });
        await transaction.commit();
        return await getTestReportById(id, report.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Gets all Test Reports for a company with pagination & filtering.
 */
const getTestReportsByCompany = async (companyId, options = {}) => {
    const { page, limit, search, status, clientId } = options;

    const whereClause = { companyId };

    if (status && status !== 'ALL' && status !== 'All') {
        whereClause.status = status;
    }

    if (search && search.trim() !== '') {
        const query = `%${search.trim()}%`;
        whereClause[Op.or] = [
            { reportNumber: { [Op.iLike]: query } },
            { reportIssuedTo: { [Op.iLike]: query } },
            { nameOfWork: { [Op.iLike]: query } },
            { sampleCollectedBy: { [Op.iLike]: query } }
        ];
    }

    const testRequestInclude = {
        model: db.TestRequest,
        as: "testRequest",
        include: [{ model: db.Client, as: "client" }]
    };

    if (clientId) {
        // Find all TestRequests belonging to this clientId
        const clientTRs = await db.TestRequest.findAll({
            where: { clientId },
            attributes: ['id']
        });
        const clientTRIds = clientTRs.map(tr => tr.id);

        if (clientTRIds.length > 0) {
            whereClause[Op.or] = [
                { clientId },
                { testRequestId: { [Op.in]: clientTRIds } }
            ];
        } else {
            whereClause.clientId = clientId;
        }
    }

    const queryOptions = {
        where: whereClause,
        order: [['created_at', 'DESC']],
        include: [
            { model: Company, as: "company", attributes: ["id", "company_name", "logo"] },
            { model: db.Client, as: "client", required: false },
            testRequestInclude
        ]
    };

    if (limit) {
        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page) || 1;
        queryOptions.limit = parsedLimit;
        queryOptions.offset = (parsedPage - 1) * parsedLimit;

        const { rows, count } = await TestReport.findAndCountAll(queryOptions);
        return {
            rows: rows.map(formatTestReport),
            count
        };
    }

    const reports = await TestReport.findAll(queryOptions);
    return reports.map(formatTestReport);
};

/**
 * Gets a single Test Report by ID.
 */
const getTestReportById = async (id, companyId = null) => {
    const whereClause = { id };
    if (companyId) {
        whereClause.companyId = companyId;
    }

    let report = await TestReport.findOne({
        where: whereClause,
        include: [
            { model: Company, as: "company", attributes: ["id", "company_name", "logo"] },
            { model: db.Client, as: "client", required: false },
            {
                model: db.TestRequest,
                as: "testRequest",
                include: [{ model: db.Client, as: "client" }]
            }
        ]
    });

    if (!report && companyId) {
        report = await TestReport.findOne({
            where: { id },
            include: [
                { model: Company, as: "company", attributes: ["id", "company_name", "logo"] },
                { model: db.Client, as: "client", required: false },
                {
                    model: db.TestRequest,
                    as: "testRequest",
                    include: [{ model: db.Client, as: "client" }]
                }
            ]
        });
    }

    return formatTestReport(report);
};

/**
 * Soft deletes a Test Report by ID.
 */
const deleteTestReport = async (id, companyId) => {
    const report = await TestReport.findOne({ where: { id, companyId } });
    if (!report) {
        throw new Error("Test Report not found or access denied.");
    }
    await report.destroy();
    return true;
};

/**
 * Creates multiple Test Reports in a single batch safely.
 */
const createBatchTestReports = async (reportsDataArray, companyId) => {
    if (!Array.isArray(reportsDataArray) || reportsDataArray.length === 0) {
        throw new Error("No reports provided for batch creation.");
    }

    const transaction = await sequelize.transaction();
    const createdReports = [];

    try {
        for (const reportItem of reportsDataArray) {
            const dataToInsert = {
                ...reportItem,
                companyId
            };
            const newReport = await TestReport.create(dataToInsert, { transaction });
            createdReports.push(newReport);
        }
        await transaction.commit();

        // Retrieve and format created reports
        const formattedList = [];
        for (const rep of createdReports) {
            const fullRep = await getTestReportById(rep.id, rep.companyId);
            if (fullRep) formattedList.push(fullRep);
        }
        return formattedList;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    createTestReport,
    createBatchTestReports,
    updateTestReport,
    getTestReportsByCompany,
    getTestReportById,
    deleteTestReport
};
