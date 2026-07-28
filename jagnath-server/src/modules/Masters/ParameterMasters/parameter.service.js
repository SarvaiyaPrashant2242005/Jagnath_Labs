/**
 * @file parameter.service.js
 * @description Business logic for Parameter operations.
 */
const Parameter = require("./parameter.model");
const Company = require("../CompanyMasters/company.model");
const Category = require("../CategoryMasters/category.model");
const CategoryParameter = require("../CategoryParameterMasters/categoryParameter.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Parameter/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Parameter/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Parameter/Delete.txt");

const fieldLabels = {
    parameterName: "Parameter Name",
    description: "Description",
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
 * Helper to format Parameter response.
 */
const formatParameter = (param) => {
    if (!param) return null;
    const paramObj = param.toJSON ? param.toJSON() : { ...param };
    if (paramObj.company) {
        paramObj.companyName = paramObj.company.companyName || paramObj.company.company_name;
    } else {
        paramObj.companyName = null;
    }
    delete paramObj.company;

    // Resolve category details from mapping
    if (paramObj.categoryParameters && paramObj.categoryParameters.length > 0) {
        const mapping = paramObj.categoryParameters[0];
        paramObj.categoryId = mapping.categoryId;
        paramObj.categoryName = mapping.category ? mapping.category.name : null;
    } else {
        paramObj.categoryId = null;
        paramObj.categoryName = null;
    }
    delete paramObj.categoryParameters;

    return paramObj;
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'companyId', 'company', 'categoryParameters'].includes(key)) {
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
 * Creates a new parameter.
 */
const createParameter = async (parameterData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const { categoryId, ...paramFields } = parameterData;
        const newParameter = await Parameter.create(paramFields, { transaction });

        if (categoryId) {
            await CategoryParameter.create({
                companyId: newParameter.companyId,
                categoryId,
                parameterId: newParameter.id,
                status: "Active"
            }, { transaction });
        }

        // Fetch company name for logging
        const company = await Company.findByPk(newParameter.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Parameter

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${companyName}

Parameter   : ${newParameter.parameterName}

Parameter ID: ${newParameter.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getParameterById(newParameter.id, newParameter.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing parameter.
 */
const updateParameter = async (parameterId, parameterData, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const parameter = await Parameter.findOne({
            where: { id: parameterId, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!parameter) {
            throw new Error("Parameter not found or access denied.");
        }

        const oldValues = getLoggableValues(parameter);

        const { categoryId, ...paramFields } = parameterData;
        const updatedParameter = await parameter.update(paramFields, { transaction });

        // Update category association
        if (categoryId !== undefined) {
            await CategoryParameter.destroy({
                where: { parameterId, companyId },
                transaction
            });

            if (categoryId) {
                await CategoryParameter.create({
                    companyId,
                    categoryId,
                    parameterId,
                    status: "Active"
                }, { transaction });
            }
        }

        const newValues = getLoggableValues(updatedParameter);

        const companyName = parameter.company ? (parameter.company.companyName || parameter.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Parameter

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${companyName}

Parameter   : ${updatedParameter.parameterName}w

Parameter ID: ${parameterId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getParameterById(parameterId, companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a parameter.
 */
const deleteParameter = async (parameterId, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const parameter = await Parameter.findOne({
            where: { id: parameterId, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!parameter) {
            throw new Error("Parameter not found or access denied.");
        }

        const companyName = parameter.company ? (parameter.company.companyName || parameter.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        // Delete associated CategoryParameter mappings as well
        await CategoryParameter.destroy({
            where: { parameterId, companyId },
            transaction
        });

        await parameter.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Parameter

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${companyName}

Parameter   : ${parameter.parameterName}

Parameter ID: ${parameterId}

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
 * Get parameter by ID.
 */
const getParameterById = async (parameterId, companyId) => {
    try {
        const param = await Parameter.findOne({
            where: { id: parameterId, companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: CategoryParameter,
                    as: "categoryParameters",
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["name"]
                    }]
                }
            ],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatParameter(param);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all parameters under a company.
 */
const getParametersByCompany = async (companyId, options = {}) => {
    try {
        let queryOptions = {
            where: { companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: CategoryParameter,
                    as: "categoryParameters",
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["name"]
                    }]
                }
            ],
            attributes: { exclude: ["deleted_at"] },
            distinct: true
        };

        if (options.limit && options.page) {
            queryOptions.limit = parseInt(options.limit);
            queryOptions.offset = (parseInt(options.page) - 1) * queryOptions.limit;

            if (options.search) {
                queryOptions.where = {
                    ...queryOptions.where,
                    parameterName: { [Op.iLike]: `%${options.search}%` }
                };
            }

            if (options.status && options.status !== 'ALL') {
                queryOptions.where.status = options.status;
            }

            const result = await Parameter.findAndCountAll(queryOptions);
            return {
                ...result,
                rows: result.rows.map(param => formatParameter(param))
            };
        }

        const params = await Parameter.findAll(queryOptions);
        return params.map(param => formatParameter(param));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createParameter,
    updateParameter,
    deleteParameter,
    getParameterById,
    getParametersByCompany
};
