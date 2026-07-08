/**
 * @file company.service.js
 * @description Business logic for Company operations.
 */
const Company = require("./company.model");
const UserCompanies = require("./user_companies.model");
const sequelize = require("../../../config/database");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Company/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Company/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Company/Delete.txt");

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

        const newCompany = await Company.create(dataToInsert, { transaction });

        await UserCompanies.create({
            user_id: userId,
            company_id: newCompany.id,
            is_default: true // Assume first created company is default
        }, { transaction });

        await transaction.commit();
        
        writeLogToFile(`[${new Date().toISOString()}] Action: CREATE_COMPANY | User: ${userId} | IP: ${reqInfo.ip} | Company Code: ${newCompany.company_code} | Success: true`, createLogPath);
        
        return newCompany;
    } catch (error) {
        await transaction.rollback();
        writeLogToFile(`[${new Date().toISOString()}] Action: CREATE_COMPANY | User: ${userId} | IP: ${reqInfo.ip} | Success: false | Reason: ${error.message}`, createLogPath);
        throw error;
    }
};

/**
 * Updates an existing company.
 */
const updateCompany = async (companyId, companyData, files, reqInfo) => {
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

        const updatedCompany = await company.update(dataToUpdate, { transaction });
        await transaction.commit();
        
        writeLogToFile(`[${new Date().toISOString()}] Action: UPDATE_COMPANY | Company ID: ${companyId} | IP: ${reqInfo.ip} | Success: true`, updateLogPath);
        
        return updatedCompany;
    } catch (error) {
        await transaction.rollback();
        writeLogToFile(`[${new Date().toISOString()}] Action: UPDATE_COMPANY | Company ID: ${companyId} | IP: ${reqInfo.ip} | Success: false | Reason: ${error.message}`, updateLogPath);
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

        await company.destroy({ transaction });
        await transaction.commit();

        writeLogToFile(`[${new Date().toISOString()}] Action: DELETE_COMPANY | Company ID: ${companyId} | User: ${userId} | IP: ${reqInfo.ip} | Success: true`, deleteLogPath);

        return true;
    } catch (error) {
        await transaction.rollback();
        writeLogToFile(`[${new Date().toISOString()}] Action: DELETE_COMPANY | Company ID: ${companyId} | User: ${userId} | IP: ${reqInfo.ip} | Success: false | Reason: ${error.message}`, deleteLogPath);
        throw error;
    }
};

const getCompaniesByUser = async (userId) => {
    // Find all mapping records for the user
    const mappings = await UserCompanies.findAll({
        where: { user_id: userId }
    });

    if (!mappings.length) return [];

    const companyIds = mappings.map(m => m.company_id);

    // Fetch actual companies
    const companies = await Company.findAll({
        where: { id: companyIds }
    });

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

const checkOwnership = async (companyId, userId) => {
    try {
        const company = await Company.findByPk(companyId);
        if (!company) return false;
        if (company.userId === userId) return true;

        // Check fallback mapping table UserCompanies
        const mapping = await UserCompanies.findOne({
            where: { company_id: companyId, user_id: userId }
        });
        return !!mapping;
    } catch (error) {
        throw error;
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
