/**
 * @file category.service.js
 * @description Business logic for Category operations.
 */
const Category = require("./category.model");
const Company = require("../CompanyMasters/company.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Category/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Category/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Category/Delete.txt");

const fieldLabels = {
    name: "Category Name",
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
 * Helper to format Category response.
 */
const formatCategory = (category) => {
    if (!category) return null;
    const catObj = category.toJSON ? category.toJSON() : { ...category };
    if (catObj.company) {
        catObj.companyName = catObj.company.companyName || catObj.company.company_name;
    } else {
        catObj.companyName = null;
    }
    delete catObj.company;
    return catObj;
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'companyId', 'company'].includes(key)) {
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
 * Creates a new category.
 */
const createCategory = async (categoryData, userId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const newCategory = await Category.create(categoryData, { transaction });

        // Fetch company name for logging
        const company = await Company.findByPk(newCategory.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Category

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${companyName}

Category Name: ${newCategory.name}

Category ID : ${newCategory.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getCategoryById(newCategory.id, newCategory.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing category.
 */
const updateCategory = async (categoryId, categoryData, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const category = await Category.findOne({
            where: { id: categoryId, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!category) {
            throw new Error("Category not found or access denied.");
        }

        const oldValues = getLoggableValues(category);

        const updatedCategory = await category.update(categoryData, { transaction });
        const newValues = getLoggableValues(updatedCategory);

        const companyName = category.company ? (category.company.companyName || category.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Category

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${companyName}

Category Name: ${updatedCategory.name}

Category ID : ${categoryId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getCategoryById(categoryId, companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a category.
 */
const deleteCategory = async (categoryId, userId, companyId, reqInfo) => {
    const transaction = await sequelize.transaction();
    try {
        const category = await Category.findOne({
            where: { id: categoryId, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!category) {
            throw new Error("Category not found or access denied.");
        }

        const companyName = category.company ? (category.company.companyName || category.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await category.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Category

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${companyName}

Category Name: ${category.name}

Category ID : ${categoryId}

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
 * Get category by ID.
 */
const getCategoryById = async (categoryId, companyId) => {
    try {
        const category = await Category.findOne({
            where: { id: categoryId, companyId },
            include: [{
                model: Company,
                as: "company",
                attributes: ["company_name"]
            }],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatCategory(category);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all categories under a company.
 */
const getCategoriesByCompany = async (companyId) => {
    try {
        const categories = await Category.findAll({
            where: { companyId },
            include: [{
                model: Company,
                as: "company",
                attributes: ["company_name"]
            }],
            attributes: { exclude: ["deleted_at"] }
        });
        return categories.map(cat => formatCategory(cat));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByCompany
};
