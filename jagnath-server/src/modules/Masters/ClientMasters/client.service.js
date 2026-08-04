/**
 * @file client.service.js
 * @description Business logic for Client operations.
 */
const Client = require("./client.model");
const Company = require("../CompanyMasters/company.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Client/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Client/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Client/Delete.txt");

const fieldLabels = {
    clientName: "Client Name",
    contactNumber: "Contact Number",
    address: "Address",
    city: "City",
    gender: "Gender",
    status: "Status",
    companyId: "Company ID"
};

/**
 * Helper to clean and format database model attributes for logs.
 * Removes Sequelize-specific timestamps and tracking properties to keep logs readable.
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
 * Helper to format Client response by adding companyName at the top level and removing nested company model.
 */
const formatClient = (client) => {
    if (!client) return null;
    const clientObj = client.toJSON ? client.toJSON() : { ...client };
    if (clientObj.company) {
        clientObj.companyName = clientObj.company.companyName || clientObj.company.company_name;
    } else {
        clientObj.companyName = null;
    }
    delete clientObj.company;
    return clientObj;
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'company'].includes(key)) {
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
 * Creates a new client.
 */
const createClient = async (clientData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const newClient = await Client.create(clientData, { transaction });

        // Fetch company name for logging
        const company = await Company.findByPk(newClient.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Client

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${companyName}

Client      : ${newClient.clientName}

Client ID   : ${newClient.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getClientById(newClient.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing client.
 */
const updateClient = async (clientId, clientData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const client = await Client.findByPk(clientId, {
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!client) {
            throw new Error("Client not found.");
        }

        const oldValues = getLoggableValues(client);

        const updatedClient = await client.update(clientData, { transaction });
        const newValues = getLoggableValues(updatedClient);

        // Fetch company name for logging
        const company = await Company.findByPk(updatedClient.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Client

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${companyName}

Client      : ${updatedClient.clientName}

Client ID   : ${clientId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getClientById(clientId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a client.
 */
const deleteClient = async (clientId, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const client = await Client.findByPk(clientId, {
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!client) {
            throw new Error("Client not found.");
        }

        const companyName = client.company ? (client.company.companyName || client.company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await client.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Client

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${companyName}

Client      : ${client.clientName}

Client ID   : ${clientId}

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
 * Get client by ID.
 */
const getClientById = async (clientId) => {
    try {
        const client = await Client.findByPk(clientId, {
            include: [{
                model: Company,
                as: "company",
                attributes: ["company_name"]
            }],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatClient(client);
    } catch (error) {
        throw error;
    }
};

const getClientsByCompany = async (companyId, options = {}) => {
    try {
        let queryOptions = {
            where: { companyId },
            include: [{
                model: Company,
                as: "company",
                attributes: ["company_name"]
            }],
            attributes: { exclude: ["deleted_at"] }
        };

        if (options.limit && options.page) {
            queryOptions.limit = parseInt(options.limit);
            queryOptions.offset = (parseInt(options.page) - 1) * queryOptions.limit;

            if (options.search) {
                queryOptions.where = {
                    ...queryOptions.where,
                    [Op.or]: [
                        { clientName: { [Op.iLike]: `%${options.search}%` } },
                        { email: { [Op.iLike]: `%${options.search}%` } }
                    ]
                };
            }

            if (options.status && options.status !== 'ALL') {
                queryOptions.where.status = options.status;
            }

            const result = await Client.findAndCountAll(queryOptions);
            return {
                ...result,
                rows: result.rows.map(client => formatClient(client))
            };
        }

        const clients = await Client.findAll(queryOptions);
        return clients.map(client => formatClient(client));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientsByCompany,
    bulkImportClients: async (records, companyId, userId, reqInfo) => {
        const transaction = await sequelize.transaction();
        try {
            let createdCount = 0;
            let updatedCount = 0;

            for (const item of records) {
                const raw = item.data || item;
                const data = {
                    clientName: raw.clientName || 'Unnamed Client',
                    contactNumber: raw.contactNumber || 'N/A',
                    address: raw.address || 'N/A',
                    city: raw.city || 'N/A',
                    state: raw.state || 'N/A',
                    email: raw.email && String(raw.email).trim() !== '' ? String(raw.email).trim() : null,
                    gender: raw.gender || 'Male',
                    status: (raw.status && ['Active', 'Inactive'].includes(String(raw.status).trim())) ? String(raw.status).trim() : 'Active',
                    companyId
                };

                let existing = null;
                if (item._dbId) {
                    existing = await Client.findOne({ where: { id: item._dbId, companyId }, transaction });
                } else if (data.email) {
                    existing = await Client.findOne({ where: { email: data.email, companyId }, transaction });
                } else if (data.clientName) {
                    existing = await Client.findOne({ where: { clientName: data.clientName, companyId }, transaction });
                }

                if (existing) {
                    await existing.update(data, { transaction });
                    updatedCount++;
                } else {
                    await Client.create(data, { transaction });
                    createdCount++;
                }
            }

            await transaction.commit();
            return { createdCount, updatedCount, totalProcessed: records.length };
        } catch (error) {
            await transaction.rollback();
            console.error("Error in bulkImportClients service:", error);
            throw error;
        }
    }
};

