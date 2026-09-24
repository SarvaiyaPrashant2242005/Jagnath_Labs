/**
 * @file department.service.js
 * @description Business logic for Department operations.
 */
const Department = require("./department.model");
const Company = require("../CompanyMasters/company.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");
const { normalizeString } = require("../../../utils/normalizers");

const createLogPath = path.join(__dirname, "../../../../logs/Department/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Department/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Department/Delete.txt");

const fieldLabels = {
    name: "Department Name",
    description: "Description",
    status: "Status"
};

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

const formatDepartment = (dept) => {
    if (!dept) return null;
    const deptObj = dept.toJSON ? dept.toJSON() : { ...dept };
    if (deptObj.company) {
        deptObj.companyName = deptObj.company.companyName || deptObj.company.company_name;
    } else {
        deptObj.companyName = null;
    }
    delete deptObj.company;
    return deptObj;
};

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

const getPerformedBy = async (userId) => {
    try {
        const user = await Users.findByPk(userId);
        return user ? (user.name || user.email) : "Unknown";
    } catch {
        return "Unknown";
    }
};

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
 * Creates a new department.
 */
const createDepartment = async (deptData, userId) => {
    const transaction = await sequelize.transaction();
    try {
        if (deptData.name && deptData.companyId) {
            const existingDept = await Department.findOne({
                where: {
                    companyId: deptData.companyId,
                    name: { [Op.iLike]: deptData.name.trim() }
                },
                transaction
            });
            if (existingDept) {
                throw new Error(`Department "${deptData.name}" already exists for this company.`);
            }
        }

        const newDept = await Department.create(deptData, { transaction });

        // Fetch company name for logging
        const company = await Company.findByPk(newDept.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Department

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${companyName}

Department Name: ${newDept.name}

Department ID : ${newDept.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);

        return await getDepartmentById(newDept.id, newDept.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing department.
 */
const updateDepartment = async (deptId, deptData, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const whereClause = { id: deptId };
        if (companyId) {
            whereClause.companyId = companyId;
        }
        let dept = await Department.findOne({
            where: whereClause,
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!dept) {
            throw new Error("Department not found or access denied.");
        }

        if (deptData.name && deptData.name.trim() !== dept.name) {
            const duplicateDept = await Department.findOne({
                where: {
                    id: { [Op.ne]: deptId },
                    companyId: dept.companyId,
                    name: { [Op.iLike]: deptData.name.trim() }
                },
                transaction
            });
            if (duplicateDept) {
                throw new Error(`Department "${deptData.name}" already exists for this company.`);
            }
        }

        const oldValues = getLoggableValues(dept);

        const updatedDept = await dept.update(deptData, { transaction });
        const newValues = getLoggableValues(updatedDept);

        // If department is marked Inactive, mark all mapped categories (Discipline Groups) as Inactive automatically
        if (deptData.status === 'Inactive' || deptData.status === false) {
            const Category = require("../CategoryMasters/category.model");
            await Category.update({ status: 'Inactive' }, { where: { departmentId: dept.id }, transaction });
        }

        const companyName = dept.company ? (dept.company.companyName || dept.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Department

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${companyName}

Department Name: ${updatedDept.name}

Department ID : ${deptId}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);

        return await getDepartmentById(deptId, updatedDept.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Deletes/Soft-deletes a department.
 */
const deleteDepartment = async (deptId, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const dept = await Department.findOne({
            where: { id: deptId, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!dept) {
            throw new Error("Department not found or access denied.");
        }

        // Verify if department is used in any Discipline Group (Category)
        const Category = require("../CategoryMasters/category.model");
        const categoryCount = await Category.count({ where: { departmentId: deptId }, transaction });
        if (categoryCount > 0) {
            throw new Error("Cannot delete this department because it is being used by one or more Discipline Groups.");
        }

        const companyName = dept.company ? (dept.company.companyName || dept.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await dept.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Department

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${companyName}

Department Name: ${dept.name}

Department ID : ${deptId}

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
 * Get department by ID.
 */
const getDepartmentById = async (deptId, companyId) => {
    try {
        const dept = await Department.findOne({
            where: { id: deptId, companyId },
            include: [{
                model: Company,
                as: "company",
                attributes: ["company_name"]
            }],
            attributes: { exclude: ["deleted_at"] }
        });
        return formatDepartment(dept);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all departments under a company.
 */
const getDepartmentsByCompany = async (companyId, options = {}) => {
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

        if (options.sortBy) {
            const allowedSortFields = ["name", "status", "created_at", "createdAt"];
            if (allowedSortFields.includes(options.sortBy)) {
                const orderDirection = options.sortOrder === "desc" || options.sortOrder === "DESC" ? "DESC" : "ASC";
                queryOptions.order = [[options.sortBy, orderDirection]];
            }
        } else {
            queryOptions.order = [['created_at', 'DESC']];
        }

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

            const result = await Department.findAndCountAll(queryOptions);
            return {
                ...result,
                rows: result.rows.map(d => formatDepartment(d))
            };
        }

        if (options.status && options.status !== 'ALL') {
            queryOptions.where.status = options.status;
        }

        const depts = await Department.findAll(queryOptions);
        return depts.map(d => formatDepartment(d));
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById,
    getDepartmentsByCompany
};
