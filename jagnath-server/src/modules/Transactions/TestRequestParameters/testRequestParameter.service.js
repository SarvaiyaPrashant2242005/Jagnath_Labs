/**
 * @file testRequestParameter.service.js
 * @description Business logic for TestRequestParameter operations.
 */
const TestRequestParameter = require("./testRequestParameter.model");
const TestRequest = require("../../Forms/TestRequestForm/testRequest.model");
const Company = require("../../Masters/CompanyMasters/company.model");
const Parameter = require("../../Masters/ParameterMasters/parameter.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/TestRequestParameter/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/TestRequestParameter/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/TestRequestParameter/Delete.txt");

const fieldLabels = {
    testMethod: "Test Method",
    unit: "Unit",
    result: "Result",
    remark: "Remark",
    status: "Status",
    enteredBy: "Entered By",
    enteredAt: "Entered At"
};

/**
 * Helper to clean and format database model attributes for logs.
 */
const getLoggableValues = (instance) => {
    if (!instance) return null;
    const values = instance.toJSON ? instance.toJSON() : { ...instance };
    delete values.created_at;
    delete values.updated_at;
    delete values.deleted_at;
    delete values.createdAt;
    delete values.updatedAt;
    delete values.deletedAt;
    return values;
};

/**
 * Helper to format TestRequestParameter response.
 */
const formatTransaction = (trp) => {
    if (!trp) return null;
    const trpObj = trp.toJSON ? trp.toJSON() : { ...trp };
    if (trpObj.testRequest && trpObj.testRequest.company) {
        trpObj.companyName = trpObj.testRequest.company.companyName || trpObj.testRequest.company.company_name;
    } else {
        trpObj.companyName = null;
    }
    if (trpObj.parameter) {
        trpObj.parameterName = trpObj.parameter.parameterName;
    } else {
        trpObj.parameterName = null;
    }
    delete trpObj.testRequest;
    delete trpObj.parameter;
    return trpObj;
};

/**
 * Helper to format timestamp as YYYY-MM-DD HH:MM:SS
 */
const formatDateTime = (date = new Date()) => {
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

/**
 * Helper to fetch performing user's name/email
 */
const getPerformedBy = async (userId) => {
    try {
        const user = await Users.findByPk(userId);
        return user ? (user.name || user.email) : "Unknown";
    } catch {
        return "Unknown";
    }
};

/**
 * Compare two sets of values and return a formatted block showing only changes
 */
const getChangesBlock = (oldValues, newValues) => {
    const lines = [];
    const keysToCheck = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    for (const key of keysToCheck) {
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'testRequestId', 'parameterId', 'testRequest', 'parameter'].includes(key)) {
            continue;
        }
        const oldValue = oldValues[key];
        const newValue = newValues[key];
        if (String(oldValue) !== String(newValue)) {
            const label = fieldLabels[key] || key;
            const oldText = (oldValue === undefined || oldValue === null || oldValue === '') ? "None" : oldValue;
            const newText = (newValue === undefined || newValue === null || newValue === '') ? "None" : newValue;
            lines.push(`${label}\n\n${oldText}\n↓\n\n${newText}`);
        }
    }
    if (lines.length === 0) {
        return "\nNo changes detected.";
    }
    return "\nChanges\n\n" + lines.join("\n\n");
};

const PriceMaster = require("../../Masters/PriceListMasters/price_master.model");

/**
 * Creates a new TestRequestParameter.
 */
const createTransaction = async (trpData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const tr = await TestRequest.findByPk(trpData.testRequestId, { transaction });
        const parameter = await Parameter.findByPk(trpData.parameterId, { transaction });

        let finalTestMethod = trpData.testMethod || (parameter ? (parameter.defaultTestMethod || parameter.testMethod) : null);
        let finalUnit = trpData.unit || (parameter ? (parameter.defaultUnit || parameter.unit) : null);
        let finalPrice = trpData.price;

        if (finalPrice === undefined || finalPrice === null) {
            if (tr && tr.companyId && tr.sampleParticular && trpData.parameterId) {
                const priceRecord = await PriceMaster.findOne({
                    where: {
                        companyId: tr.companyId,
                        categoryId: tr.sampleParticular,
                        parameterId: trpData.parameterId,
                        status: "Active"
                    },
                    transaction
                });
                if (priceRecord) {
                    finalPrice = priceRecord.price;
                }
            }
        }

        const payload = {
            ...trpData,
            testMethod: finalTestMethod,
            unit: finalUnit,
            price: finalPrice || 0
        };

        const newTRP = await TestRequestParameter.create(payload, { transaction });

        // Fetch details for logging
        const company = tr ? await Company.findByPk(tr.companyId, { transaction }) : null;
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";
        const parameterName = parameter ? parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequestParameter

Operation   : CREATE

Performed By: ${performedBy}

Company Name: ${companyName}

Test Request ID: ${newTRP.testRequestId}

Parameter Name: ${parameterName}

Record ID   : ${newTRP.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getTransactionById(newTRP.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing TestRequestParameter.
 */
const updateTransaction = async (trpId, trpData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const trp = await TestRequestParameter.findOne({
            where: { id: trpId },
            include: [
                {
                    model: TestRequest,
                    as: "testRequest",
                    include: [{ model: Company, as: "company" }]
                },
                { model: Parameter, as: "parameter" }
            ],
            transaction
        });
        if (!trp) {
            throw new Error("TestRequestParameter not found.");
        }

        const oldValues = getLoggableValues(trp);

        const updatedTRP = await trp.update(trpData, { transaction });
        const newValues = getLoggableValues(updatedTRP);

        const companyName = (trp.testRequest && trp.testRequest.company)
            ? (trp.testRequest.company.companyName || trp.testRequest.company.company_name)
            : "Unknown";
        const parameterName = trp.parameter ? trp.parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequestParameter

Operation   : UPDATE

Performed By: ${performedBy}

Company Name: ${companyName}

Test Request ID: ${trp.testRequestId}

Parameter Name: ${parameterName}

Record ID   : ${trpId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getTransactionById(trpId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a TestRequestParameter.
 */
const deleteTransaction = async (trpId, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const trp = await TestRequestParameter.findOne({
            where: { id: trpId },
            include: [
                {
                    model: TestRequest,
                    as: "testRequest",
                    include: [{ model: Company, as: "company" }]
                },
                { model: Parameter, as: "parameter" }
            ],
            transaction
        });
        if (!trp) {
            throw new Error("TestRequestParameter not found.");
        }

        const companyName = (trp.testRequest && trp.testRequest.company)
            ? (trp.testRequest.company.companyName || trp.testRequest.company.company_name)
            : "Unknown";
        const parameterName = trp.parameter ? trp.parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await trp.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequestParameter

Operation   : DELETE

Performed By: ${performedBy}

Company Name: ${companyName}

Test Request ID: ${trp.testRequestId}

Parameter Name: ${parameterName}

Record ID   : ${trpId}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, deleteLogPath);

        return true;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Get transaction by ID.
 */
const getTransactionById = async (trpId) => {
    try {
        const trp = await TestRequestParameter.findOne({
            where: { id: trpId },
            include: [
                {
                    model: TestRequest,
                    as: "testRequest",
                    include: [{
                        model: Company,
                        as: "company",
                        attributes: ["company_name"]
                    }]
                },
                {
                    model: Parameter,
                    as: "parameter",
                    attributes: ["parameterName"]
                }
            ],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatTransaction(trp);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all transactions.
 */
const getAllTransactions = async (companyId) => {
    try {
        const trps = await TestRequestParameter.findAll({
            include: [
                {
                    model: TestRequest,
                    as: "testRequest",
                    where: { companyId },
                    include: [{
                        model: Company,
                        as: "company",
                        attributes: ["company_name"]
                    }]
                },
                {
                    model: Parameter,
                    as: "parameter",
                    attributes: ["parameterName"]
                }
            ],
            attributes: { exclude: ["deleted_at"] },
            order: [['sequence', 'ASC'], ['created_at', 'ASC']]
        });
        return trps.map(t => formatTransaction(t));
    } catch (error) {
        throw error;
    }
};

/**
 * Get parameters by Test Request ID.
 */
const getParametersByTestRequest = async (testRequestId, companyId) => {
    try {
        const trps = await TestRequestParameter.findAll({
            where: { testRequestId },
            include: [
                {
                    model: TestRequest,
                    as: "testRequest",
                    where: { companyId },
                    include: [{
                        model: Company,
                        as: "company",
                        attributes: ["company_name"]
                    }]
                },
                {
                    model: Parameter,
                    as: "parameter",
                    attributes: ["parameterName"]
                }
            ],
            attributes: { exclude: ["deleted_at"] },
            order: [['sequence', 'ASC'], ['created_at', 'ASC']]
        });
        return trps.map(t => formatTransaction(t));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    getAllTransactions,
    getParametersByTestRequest
};
