/**
 * @file testRequest.service.js
 * @description Business logic for TestRequest operations.
 */
const TestRequest = require("./testRequest.model");
const Company = require("../../Masters/CompanyMasters/company.model");
const Client = require("../../Masters/ClientMasters/client.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/TestRequest/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/TestRequest/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/TestRequest/Delete.txt");

const fieldLabels = {
    clientId: "Client ID",
    address: "Address",
    email: "Email",
    locationOfSample: "Location of Sample",
    contactPerson: "Contact Person",
    contactNumber: "Contact Number",
    dateOfCollection: "Date of Collection",
    dateOfReceipt: "Date of Receipt",
    sampleCollectedBy: "Sample Collected By",
    sampleQuantity: "Sample Quantity",
    fieldDataSheet: "Field Data Sheet",
    packingDetails: "Packing Details",
    sampleIdNumber: "Sample ID Number",
    reportNumber: "Report Number",
    sampleParticular: "Sample Particular",
    equipmentAvailability: "Equipment Availability",
    referenceStandardAvailability: "Reference Standard Availability",
    sampleAdequacy: "Sample Adequacy",
    testMethodAvailability: "Test Method Availability",
    trainedPersonAvailability: "Trained Person Availability",
    reportIssueDays: "Report Issue Days",
    reviewedBy: "Reviewed By",
    customerRepresentativeSignature: "Customer Representative Signature",
    sampleReceivedSignature: "Sample Received Signature",
    customerRepresentativeName: "Customer Representative Name",
    sampleReceiverName: "Sample Receiver Name",
    testProtocol: "Test Protocol",
    remarks: "Remarks",
    status: "Status"
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
 * Helper to format TestRequest response.
 */
const formatTestRequest = (tr) => {
    if (!tr) return null;
    const trObj = tr.toJSON ? tr.toJSON() : { ...tr };
    if (trObj.company) {
        trObj.companyName = trObj.company.companyName || trObj.company.company_name;
    } else {
        trObj.companyName = null;
    }
    if (trObj.client) {
        trObj.clientName = trObj.client.clientName;
    } else {
        trObj.clientName = null;
    }
    delete trObj.company;
    delete trObj.client;
    delete trObj.companyId;
    delete trObj.clientId;
    return trObj;
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
        return user ? (user.full_name || user.name || user.email) : "Unknown";
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'companyId', 'company', 'client'].includes(key)) {
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

/**
 * Creates a new TestRequest.
 */
const createTestRequest = async (testRequestData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const newTR = await TestRequest.create(testRequestData, { transaction });

        // Fetch company and client details for logging
        const company = await Company.findByPk(newTR.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const client = await Client.findByPk(newTR.clientId, { transaction });
        const clientName = client ? client.clientName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequest

Operation   : CREATE

Performed By: ${performedBy}

Company Name: ${companyName}

Client Name : ${clientName}

Test Request ID: ${newTR.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getTestRequestById(newTR.id, newTR.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing TestRequest.
 */
const updateTestRequest = async (trId, testRequestData, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const tr = await TestRequest.findOne({
            where: { id: trId, companyId },
            include: [
                { model: Company, as: "company" },
                { model: Client, as: "client" }
            ],
            transaction
        });
        if (!tr) {
            throw new Error("TestRequest not found or access denied.");
        }

        const oldValues = getLoggableValues(tr);

        const updatedTR = await tr.update(testRequestData, { transaction });
        const newValues = getLoggableValues(updatedTR);

        const companyName = tr.company ? (tr.company.companyName || tr.company.company_name) : "Unknown";
        const clientName = tr.client ? tr.client.clientName : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequest

Operation   : UPDATE

Performed By: ${performedBy}

Company Name: ${companyName}

Client Name : ${clientName}

Test Request ID: ${trId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getTestRequestById(trId, companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a TestRequest.
 */
const deleteTestRequest = async (trId, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const tr = await TestRequest.findOne({
            where: { id: trId, companyId },
            include: [
                { model: Company, as: "company" },
                { model: Client, as: "client" }
            ],
            transaction
        });
        if (!tr) {
            throw new Error("TestRequest not found or access denied.");
        }

        const companyName = tr.company ? (tr.company.companyName || tr.company.company_name) : "Unknown";
        const clientName = tr.client ? tr.client.clientName : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await tr.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : TestRequest

Operation   : DELETE

Performed By: ${performedBy}

Company Name: ${companyName}

Client Name : ${clientName}

Test Request ID: ${trId}

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
 * Get TestRequest by ID.
 */
const getTestRequestById = async (trId, companyId) => {
    try {
        const tr = await TestRequest.findOne({
            where: { id: trId, companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: Client,
                    as: "client",
                    attributes: ["clientName"]
                }
            ],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatTestRequest(tr);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all TestRequests under a company.
 */
const getTestRequestsByCompany = async (companyId) => {
    try {
        const trs = await TestRequest.findAll({
            where: { companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: Client,
                    as: "client",
                    attributes: ["clientName"]
                }
            ],
            attributes: { exclude: ["deleted_at"] }
        });
        return trs.map(tr => formatTestRequest(tr));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createTestRequest,
    updateTestRequest,
    deleteTestRequest,
    getTestRequestById,
    getTestRequestsByCompany
};
