/**
 * @file categoryParameter.service.js
 * @description Business logic for CategoryParameter operations.
 */
const CategoryParameter = require("./categoryParameter.model");
const Company = require("../CompanyMasters/company.model");
const Category = require("../CategoryMasters/category.model");
const Parameter = require("../ParameterMasters/parameter.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/CategoryParameter/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/CategoryParameter/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/CategoryParameter/Delete.txt");

const fieldLabels = {
    categoryId: "Category ID",
    parameterId: "Parameter ID",
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
 * Helper to format CategoryParameter response.
 */
const formatMapping = (mapping) => {
    if (!mapping) return null;
    const mapObj = mapping.toJSON ? mapping.toJSON() : { ...mapping };
    if (mapObj.company) {
        mapObj.companyName = mapObj.company.companyName || mapObj.company.company_name;
    } else {
        mapObj.companyName = null;
    }
    if (mapObj.category) {
        mapObj.categoryName = mapObj.category.name;
    } else {
        mapObj.categoryName = null;
    }
    if (mapObj.parameter) {
        mapObj.parameterName = mapObj.parameter.parameterName;
    } else {
        mapObj.parameterName = null;
    }
    delete mapObj.company;
    delete mapObj.category;
    delete mapObj.parameter;
    return mapObj;
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'companyId', 'company', 'category', 'parameter'].includes(key)) {
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
 * Creates a new mapping.
 */
const createMapping = async (mappingData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const newMapping = await CategoryParameter.create(mappingData, { transaction });

        // Fetch details for logging
        const company = await Company.findByPk(newMapping.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const category = await Category.findByPk(newMapping.categoryId, { transaction });
        const categoryName = category ? category.name : "Unknown";

        const parameter = await Parameter.findByPk(newMapping.parameterId, { transaction });
        const parameterName = parameter ? parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : CategoryParameter

Operation   : CREATE

Performed By: ${performedBy}

Company Name: ${companyName}

Category Name: ${categoryName}

Parameter Name: ${parameterName}

Mapping ID  : ${newMapping.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getMappingById(newMapping.id, newMapping.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing mapping.
 */
const updateMapping = async (mappingId, mappingData, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const mapping = await CategoryParameter.findOne({
            where: { id: mappingId, companyId },
            include: [
                { model: Company, as: "company" },
                { model: Category, as: "category" },
                { model: Parameter, as: "parameter" }
            ],
            transaction
        });
        if (!mapping) {
            throw new Error("Mapping not found or access denied.");
        }

        const oldValues = getLoggableValues(mapping);

        const updatedMapping = await mapping.update(mappingData, { transaction });
        const newValues = getLoggableValues(updatedMapping);

        const companyName = mapping.company ? (mapping.company.companyName || mapping.company.company_name) : "Unknown";
        const categoryName = mapping.category ? mapping.category.name : "Unknown";
        const parameterName = mapping.parameter ? mapping.parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : CategoryParameter

Operation   : UPDATE

Performed By: ${performedBy}

Company Name: ${companyName}

Category Name: ${categoryName}

Parameter Name: ${parameterName}

Mapping ID  : ${mappingId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getMappingById(mappingId, companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Deletes a mapping (soft-delete).
 */
const deleteMapping = async (mappingId, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const mapping = await CategoryParameter.findOne({
            where: { id: mappingId, companyId },
            include: [
                { model: Company, as: "company" },
                { model: Category, as: "category" },
                { model: Parameter, as: "parameter" }
            ],
            transaction
        });
        if (!mapping) {
            throw new Error("Mapping not found or access denied.");
        }

        const companyName = mapping.company ? (mapping.company.companyName || mapping.company.company_name) : "Unknown";
        const categoryName = mapping.category ? mapping.category.name : "Unknown";
        const parameterName = mapping.parameter ? mapping.parameter.parameterName : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await mapping.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : CategoryParameter

Operation   : DELETE

Performed By: ${performedBy}

Company Name: ${companyName}

Category Name: ${categoryName}

Parameter Name: ${parameterName}

Mapping ID  : ${mappingId}

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
 * Get mapping by ID.
 */
const getMappingById = async (mappingId, companyId) => {
    try {
        const mapping = await CategoryParameter.findOne({
            where: { id: mappingId, companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: Category,
                    as: "category",
                    attributes: ["name"]
                },
                {
                    model: Parameter,
                    as: "parameter",
                    attributes: ["parameterName"]
                }
            ]
        });
        return formatMapping(mapping);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all mappings.
 */
const getAllMappings = async (companyId) => {
    try {
        const mappings = await CategoryParameter.findAll({
            where: { companyId },
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                },
                {
                    model: Category,
                    as: "category",
                    attributes: ["name"]
                },
                {
                    model: Parameter,
                    as: "parameter",
                    attributes: ["parameterName"]
                }
            ]
        });
        return mappings.map(m => formatMapping(m));
    } catch (error) {
        throw error;
    }
};

/**
 * Get parameters by category ID.
 */
const getParametersByCategoryId = async (categoryId, companyId) => {
    try {
        const mappings = await CategoryParameter.findAll({
            where: { categoryId, companyId },
            include: [{
                model: Parameter,
                as: "parameter",
                include: [{
                    model: Company,
                    as: "company",
                    attributes: ["company_name"]
                }]
            }]
        });

        const formatParam = (param) => {
            if (!param) return null;
            const paramObj = param.toJSON ? param.toJSON() : { ...param };
            if (paramObj.company) {
                paramObj.companyName = paramObj.company.companyName || paramObj.company.company_name;
            } else {
                paramObj.companyName = null;
            }
            delete paramObj.company;
            return paramObj;
        };

        return mappings.map(m => formatParam(m.parameter)).filter(Boolean);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createMapping,
    updateMapping,
    deleteMapping,
    getMappingById,
    getAllMappings,
    getParametersByCategoryId
};
