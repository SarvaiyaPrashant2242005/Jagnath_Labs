/**
 * @file category.service.js
 * @description Business logic for Category operations.
 */
const Category = require("./category.model");
const Company = require("../CompanyMasters/company.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");
const { normalizeString } = require("../../../utils/normalizers");

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
        const whereClause = { id: categoryId };
        if (companyId) {
            whereClause.companyId = companyId;
        }
        let category = await Category.findOne({
            where: whereClause,
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!category) {
            category = await Category.findByPk(categoryId, {
                include: [{ model: Company, as: "company" }],
                transaction
            });
        }
        if (!category) {
            throw new Error("Category not found or access denied.");
        }

        const oldValues = getLoggableValues(category);

        const updatedCategory = await category.update(categoryData, { transaction });
        const newValues = getLoggableValues(updatedCategory);

        // If category is marked Inactive, mark all mapped parameters as Inactive automatically
        if (categoryData.status === 'Inactive' || categoryData.status === false) {
            const CategoryParameter = require("../CategoryParameterMasters/categoryParameter.model");
            const Parameter = require("../ParameterMasters/parameter.model");

            const mappings = await CategoryParameter.findAll({ where: { categoryId: category.id }, transaction });
            const paramIds = mappings.map(m => m.parameterId);
            if (paramIds.length > 0) {
                await Parameter.update({ status: 'Inactive' }, { where: { id: { [Op.in]: paramIds } }, transaction });
            }
        }

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

        return await getCategoryById(categoryId, updatedCategory.companyId);
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
const getCategoriesByCompany = async (companyId, options = {}) => {
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
                    name: { [Op.iLike]: `%${options.search}%` }
                };
            }

            if (options.status && options.status !== 'ALL') {
                queryOptions.where.status = options.status;
            }

            const result = await Category.findAndCountAll(queryOptions);
            return {
                ...result,
                rows: result.rows.map(cat => formatCategory(cat))
            };
        }

        const categories = await Category.findAll(queryOptions);
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
    getCategoriesByCompany,
    bulkImportCategories: async (records, companyId, userId, reqInfo) => {
        const transaction = await sequelize.transaction();
        try {
            // Batch fetch existing categories for companyId
            const existingCategories = await Category.findAll({
                where: { companyId },
                transaction
            });

            // Map normalized category name -> category DB record
            const categoryMap = new Map();
            existingCategories.forEach(c => {
                const plain = c.get ? c.get({ plain: true }) : c;
                const normName = normalizeString(plain.name);
                if (normName) categoryMap.set(normName, plain);
            });

            const seenCategoriesInFile = new Map(); // normName -> rowNumber

            let insertedCount = 0;
            let updatedCount = 0;
            let failedCount = 0;
            let skippedCount = 0;
            const rowResults = [];

            for (const item of records) {
                const raw = item.data || item;
                const catName = (raw.name || raw.categoryName || '').trim();
                const statusVal = (raw.status && ['Active', 'Inactive'].includes(String(raw.status).trim())) ? String(raw.status).trim() : 'Active';

                const data = {
                    name: catName || 'Unnamed Group',
                    description: raw.description || '',
                    status: statusVal,
                    companyId
                };

                const { name, description, status } = data;
                const rawData = raw;
                const rowNum = item._originalIndex || (records.indexOf(item) + 1);
                const errors = [];

                const normName = normalizeString(name);

                if (seenCategoriesInFile.has(normName)) {
                    errors.push(`Duplicate category in uploaded file. First found at row ${seenCategoriesInFile.get(normName)}.`);
                }

                if (errors.length > 0) {
                    failedCount++;
                    rowResults.push({
                        rowNumber: rowNum,
                        action: "error",
                        errors,
                        data: rawData
                    });
                    continue;
                }

                seenCategoriesInFile.set(normName, rowNum);

                try {
                    // If Category exists, update it; otherwise create new
                    const dbMatch = categoryMap.get(normName);
                    if (dbMatch) {
                        const existingInstance = await Category.findByPk(dbMatch.id, { transaction });
                        if (existingInstance) {
                            await existingInstance.update({
                                description: description !== null ? description : existingInstance.description,
                                status: status || existingInstance.status
                            }, { transaction });

                            if (status === 'Inactive') {
                                const CategoryParameter = require("../CategoryParameterMasters/categoryParameter.model");
                                const Parameter = require("../ParameterMasters/parameter.model");
                                const mappings = await CategoryParameter.findAll({ where: { categoryId: existingInstance.id }, transaction });
                                const paramIds = mappings.map(m => m.parameterId);
                                if (paramIds.length > 0) {
                                    await Parameter.update({ status: 'Inactive' }, { where: { id: paramIds }, transaction });
                                }
                            }

                            const updatedObj = existingInstance.get ? existingInstance.get({ plain: true }) : existingInstance;
                            categoryMap.set(normName, updatedObj);
                            updatedCount++;
                            rowResults.push({
                                rowNumber: rowNum,
                                action: "updated",
                                recordId: updatedObj.id,
                                message: "Category updated successfully"
                            });
                        }
                    } else {
                        // Insert New Category
                        const newCat = await Category.create({
                            companyId,
                            name: String(name).trim(),
                            description,
                            status
                        }, { transaction });

                        const createdObj = newCat.get ? newCat.get({ plain: true }) : newCat;
                        categoryMap.set(normName, createdObj);

                        insertedCount++;
                        rowResults.push({
                            rowNumber: rowNum,
                            action: "inserted",
                            recordId: createdObj.id,
                            message: "Category created successfully"
                        });
                    }
                } catch (rowErr) {
                    failedCount++;
                    rowResults.push({
                        rowNumber: rowNum,
                        action: "error",
                        errors: [rowErr.message || "Failed to process category record."],
                        data: rawData
                    });
                }
            }

            await transaction.commit();

            return {
                totalRows: records.length,
                inserted: insertedCount,
                updated: updatedCount,
                failed: failedCount,
                skipped: skippedCount,
                createdCount: insertedCount,
                updatedCount: updatedCount,
                totalProcessed: records.length,
                rows: rowResults
            };
        } catch (error) {
            await transaction.rollback();
            console.error("Error in bulkImportCategories service:", error);
            throw error;
        }
    }
};

