/**
 * @file testReport.service.js
 * @description Business logic for TestReport operations.
 */
const TestReport = require("./testReport.model");
const Company = require("../../Masters/CompanyMasters/company.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");

const formatTestReport = (tr) => {
    if (!tr) return null;
    const trObj = tr.toJSON ? tr.toJSON() : { ...tr };
    if (trObj.company) {
        trObj.companyName = trObj.company.companyName || trObj.company.company_name;
    } else {
        trObj.companyName = null;
    }
    delete trObj.company;
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
        const report = await TestReport.findOne({
            where: { id, companyId },
            transaction
        });
        if (!report) {
            throw new Error("Test Report not found or access denied.");
        }

        await report.update(reportData, { transaction });
        await transaction.commit();
        return await getTestReportById(id, companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Gets all Test Reports for a company with pagination & filtering.
 */
const getTestReportsByCompany = async (companyId, options = {}) => {
    const { page, limit, search, status } = options;

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

    const queryOptions = {
        where: whereClause,
        order: [['created_at', 'DESC']],
        include: [{ model: Company, as: "company", attributes: ["id", "company_name"] }]
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
const getTestReportById = async (id, companyId) => {
    const report = await TestReport.findOne({
        where: { id, companyId },
        include: [{ model: Company, as: "company", attributes: ["id", "company_name"] }]
    });
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

module.exports = {
    createTestReport,
    updateTestReport,
    getTestReportsByCompany,
    getTestReportById,
    deleteTestReport
};
