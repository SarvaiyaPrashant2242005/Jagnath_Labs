/**
 * @file company.service.js
 * @description Business logic for Company operations.
 */
const Company = require("./company.model");
const UserCompanies = require("./user_companies.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Company/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Company/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Company/Delete.txt");

const fieldLabels = {
    companyName: "Company Name",
    company_name: "Company Name",
    companyEmail: "Company Email",
    company_email: "Company Email",
    phone: "Phone Number",
    contact_number: "Phone Number",
    website: "Website",
    address: "Address",
    city: "City",
    description: "Description",
    status: "Status",
    company_code: "Company Code",
    logo: "Logo File",
    signature: "Signature File"
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'companyId'].includes(key)) {
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
 * Creates a new company and links it to the creating user.
 * Uses a Sequelize transaction to ensure atomicity.
 */
const createCompany = async (companyData, userId, files, generatedId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        let companyCode = companyData.company_code;
        if (!companyCode) {
            companyCode = "COMP-" + Math.random().toString(36).substring(2, 11).toUpperCase();
        }

        // Check uniqueness of company_code
        const existingCompany = await Company.findOne({
            where: { company_code: companyCode },
            transaction
        });

        if (existingCompany) {
            throw new Error("Company Code must be unique.");
        }

        const dataToInsert = {
            ...companyData,
            id: generatedId,
            userId: userId,
            company_code: companyCode,
            company_name: companyData.company_name || companyData.companyName,
            company_email: companyData.company_email || companyData.companyEmail,
            contact_number: companyData.contact_number || companyData.phone
        };

        if (files) {
            if (files.logo && files.logo.length > 0) {
                dataToInsert.logo = files.logo[0].path;
            }
            if (files.signature && files.signature.length > 0) {
                dataToInsert.signature = files.signature[0].path;
            }
        }

        const bcrypt = require("bcrypt");
        let targetUserId = userId;

        if (companyData.createNewUser && companyData.newUser) {
            const newUserObj = typeof companyData.newUser === 'string' ? JSON.parse(companyData.newUser) : companyData.newUser;
            if (newUserObj.name && newUserObj.email && newUserObj.password) {
                const hashedPassword = await bcrypt.hash(newUserObj.password, 10);
                const createdUser = await Users.create({
                    name: newUserObj.name,
                    email: newUserObj.email,
                    password: hashedPassword,
                    role: newUserObj.role || "Admin",
                    status: "Active"
                }, { transaction });
                targetUserId = createdUser.id;
            }
        } else if (companyData.assignedUserId && companyData.assignedUserId.trim() !== '') {
            targetUserId = companyData.assignedUserId;
        }

        const newCompany = await Company.create(dataToInsert, { transaction });

        await UserCompanies.findOrCreate({
            where: { user_id: targetUserId, company_id: newCompany.id },
            defaults: { user_id: targetUserId, company_id: newCompany.id, is_default: true },
            transaction
        });

        if (targetUserId !== userId) {
            await UserCompanies.findOrCreate({
                where: { user_id: userId, company_id: newCompany.id },
                defaults: { user_id: userId, company_id: newCompany.id, is_default: false },
                transaction
            });
        }

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Company

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${newCompany.companyName || newCompany.company_name}

Company ID  : ${newCompany.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return newCompany;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing company.
 */
const updateCompany = async (companyId, companyData, userId, files, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const company = await Company.findByPk(companyId, { transaction });
        if (!company) {
            throw new Error("Company not found.");
        }

        if (companyData.company_code && companyData.company_code !== company.company_code) {
            const existingCompany = await Company.findOne({
                where: { company_code: companyData.company_code },
                transaction
            });
            if (existingCompany) {
                throw new Error("Company Code must be unique.");
            }
        }

        const oldCompanyData = getLoggableValues(company);

        const dataToUpdate = { ...companyData };
        if (companyData.companyName !== undefined && dataToUpdate.company_name === undefined) {
            dataToUpdate.company_name = companyData.companyName;
        }
        if (companyData.companyEmail !== undefined && dataToUpdate.company_email === undefined) {
            dataToUpdate.company_email = companyData.companyEmail;
        }
        if (companyData.phone !== undefined && dataToUpdate.contact_number === undefined) {
            dataToUpdate.contact_number = companyData.phone;
        }

        if (files) {
            if (files.logo && files.logo.length > 0) {
                dataToUpdate.logo = files.logo[0].path;
            }
            if (files.signature && files.signature.length > 0) {
                dataToUpdate.signature = files.signature[0].path;
            }
        }

        const bcrypt = require("bcrypt");
        let targetUserId = null;

        if (companyData.createNewUser && companyData.newUser) {
            const newUserObj = typeof companyData.newUser === 'string' ? JSON.parse(companyData.newUser) : companyData.newUser;
            if (newUserObj.name && newUserObj.email && newUserObj.password) {
                const hashedPassword = await bcrypt.hash(newUserObj.password, 10);
                const createdUser = await Users.create({
                    name: newUserObj.name,
                    email: newUserObj.email,
                    password: hashedPassword,
                    role: newUserObj.role || "Admin",
                    status: "Active"
                }, { transaction });
                targetUserId = createdUser.id;
            }
        } else if (companyData.assignedUserId && companyData.assignedUserId.trim() !== '') {
            targetUserId = companyData.assignedUserId;
        }

        if (targetUserId) {
            await UserCompanies.findOrCreate({
                where: { user_id: targetUserId, company_id: companyId },
                defaults: { user_id: targetUserId, company_id: companyId, is_default: true },
                transaction
            });
        }

        const updatedCompany = await company.update(dataToUpdate, { transaction });
        const newCompanyData = getLoggableValues(updatedCompany);

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldCompanyData, newCompanyData);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Company

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${updatedCompany.companyName || updatedCompany.company_name}

Company ID  : ${companyId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return updatedCompany;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Deletes an existing company (Soft Delete).
 */
const deleteCompany = async (companyId, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const company = await Company.findByPk(companyId, { transaction });
        if (!company) {
            throw new Error("Company not found.");
        }

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await company.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Company

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${company.companyName || company.company_name}

Company ID  : ${companyId}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, deleteLogPath);

        return true;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const getCompaniesByUser = async (userId, options = {}) => {
    let whereClause = {};

    if (!options.isSuperAdmin) {
        // Find all mapping records for standard user
        const mappings = await UserCompanies.findAll({
            where: { user_id: userId }
        });

        if (!mappings.length) {
            return options.limit ? { rows: [], count: 0 } : [];
        }

        const companyIds = mappings.map(m => m.company_id);
        whereClause.id = companyIds;
    }

    if (options.search) {
        whereClause = {
            ...whereClause,
            [Op.or]: [
                { company_name: { [Op.iLike]: `%${options.search}%` } },
                { company_email: { [Op.iLike]: `%${options.search}%` } },
                { company_code: { [Op.iLike]: `%${options.search}%` } }
            ]
        };
    }

    if (options.status && options.status !== 'ALL') {
        whereClause.status = options.status;
    }

    let queryOptions = {
        where: whereClause,
        order: [['created_at', 'DESC']]
    };

    if (options.limit && options.page) {
        queryOptions.limit = parseInt(options.limit);
        queryOptions.offset = (parseInt(options.page) - 1) * queryOptions.limit;
        return await Company.findAndCountAll(queryOptions);
    }

    const companies = await Company.findAll(queryOptions);
    return companies;
};

const getCompanyByUserId = async (userId) => {
    try {
        const company = await Company.findOne({
            where: { userId }
        });
        return company;
    } catch (error) {
        throw error;
    }
};

const checkOwnership = async (companyId, userId, isSuperAdmin = false) => {
    if (!companyId) return true;
    try {
        if (!userId) return true;

        const user = await Users.findByPk(userId);
        if (!user) return false;

        // SuperAdmin & Admin roles have full operational permissions for company data
        if (['SuperAdmin', 'superadmin', 'Admin', 'admin'].includes(user.role) || isSuperAdmin) {
            return true;
        }

        const company = await Company.findByPk(companyId);
        if (!company) {
            // If company does not exist in database, allow query to complete with empty dataset (200 OK)
            return true;
        }
        if (company.userId === userId) return true;

        // Check fallback mapping table UserCompanies
        const mapping = await UserCompanies.findOne({
            where: { company_id: companyId, user_id: userId }
        });
        return !!mapping;
    } catch (error) {
        return false;
    }
};

module.exports = {
    createCompany,
    updateCompany,
    deleteCompany,
    getCompaniesByUser,
    getCompanyByUserId,
    checkOwnership
};
