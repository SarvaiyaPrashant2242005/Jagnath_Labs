/**
 * @file parameter.service.js
 * @description Business logic for Parameter operations.
 */
const Parameter = require("./parameter.model");
const Company = require("../CompanyMasters/company.model");
const Category = require("../CategoryMasters/category.model");
const SubCategory = require("../SubCategoryMasters/subCategory.model");
const CategoryParameter = require("../CategoryParameterMasters/categoryParameter.model");
const Department = require("../DepartmentMasters/department.model");
const Users = require("../../Auth/Users/users.model");
const LocationSample = require("../LocationSampleMasters/locationSample.model");
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

    // Resolve category & department details from mapping or subcategory
    let categoryId = null;
    let categoryName = null;
    let departmentId = null;
    let departmentName = null;

    if (paramObj.categoryParameters && paramObj.categoryParameters.length > 0) {
        const mapping = paramObj.categoryParameters[0];
        categoryId = mapping.categoryId;
        if (mapping.category) {
            categoryName = mapping.category.name;
            departmentId = mapping.category.departmentId || mapping.category.department_id || null;
            departmentName = mapping.category.department ? mapping.category.department.name : null;
        }
    }

    if (!categoryId && paramObj.subCategory && paramObj.subCategory.category) {
        categoryId = paramObj.subCategory.category.id || paramObj.subCategory.category.categoryId;
        categoryName = paramObj.subCategory.category.name;
        departmentId = paramObj.subCategory.category.departmentId || paramObj.subCategory.category.department_id || null;
        departmentName = paramObj.subCategory.category.department ? paramObj.subCategory.category.department.name : null;
    }

    if (!departmentId && paramObj.subCategory && paramObj.subCategory.category) {
        departmentId = paramObj.subCategory.category.departmentId || paramObj.subCategory.category.department_id || null;
        departmentName = paramObj.subCategory.category.department ? paramObj.subCategory.category.department.name : null;
    }

    paramObj.categoryId = categoryId;
    paramObj.categoryName = categoryName;
    paramObj.departmentId = departmentId;
    paramObj.departmentName = departmentName;

    paramObj.category = categoryId ? {
        id: categoryId,
        name: categoryName,
        departmentId: departmentId,
        departmentName: departmentName
    } : null;

    delete paramObj.categoryParameters;

    if (paramObj.subCategory) {
        paramObj.subCategoryId = paramObj.subCategory.id;
        paramObj.subCategoryName = paramObj.subCategory.name;
    } else {
        paramObj.subCategoryName = null;
    }
    delete paramObj.subCategory;

    if (paramObj.locationSample) {
        paramObj.locationSampleName = paramObj.locationSample.name;
    } else {
        paramObj.locationSampleName = null;
    }
    delete paramObj.locationSample;

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

        const paramSubCatId = paramFields.subCategoryId || null;
        const paramLocSampleId = paramFields.locationSampleId || null;
        const findWhere = {
            companyId: paramFields.companyId,
            parameterName: { [Op.iLike]: paramFields.parameterName.trim() },
            subCategoryId: paramSubCatId,
            locationSampleId: paramLocSampleId
        };

        let newParameter = await Parameter.findOne({
            where: findWhere,
            transaction
        });

        if (!newParameter) {
            newParameter = await Parameter.create(paramFields, { transaction });
        } else {
            // Update fields of the existing parameter
            await newParameter.update({
                description: paramFields.description || newParameter.description,
                testMethod: paramFields.testMethod || newParameter.testMethod,
                unit: paramFields.unit !== undefined ? paramFields.unit : newParameter.unit,
                isPermissibleLimitApplicable: paramFields.isPermissibleLimitApplicable !== undefined ? paramFields.isPermissibleLimitApplicable : newParameter.isPermissibleLimitApplicable,
                permissibleLimit: paramFields.permissibleLimit !== undefined ? paramFields.permissibleLimit : newParameter.permissibleLimit,
                status: paramFields.status || newParameter.status
            }, { transaction });
        }

        if (categoryId) {
            const existingMapping = await CategoryParameter.findOne({
                where: {
                    companyId: newParameter.companyId,
                    categoryId,
                    parameterId: newParameter.id
                },
                transaction
            });

            if (!existingMapping) {
                await CategoryParameter.create({
                    companyId: newParameter.companyId,
                    categoryId,
                    parameterId: newParameter.id,
                    status: "Active"
                }, { transaction });
            } else if (existingMapping.status !== 'Active') {
                await existingMapping.update({ status: 'Active' }, { transaction });
            }
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
                    model: SubCategory,
                    as: "subCategory",
                    attributes: ["id", "name", "categoryId"],
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["id", "name", "departmentId"],
                        include: [{
                            model: Department,
                            as: "department",
                            attributes: ["id", "name"]
                        }]
                    }]
                },
                {
                    model: LocationSample,
                    as: "locationSample",
                    attributes: ["id", "name"]
                },
                {
                    model: CategoryParameter,
                    as: "categoryParameters",
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["id", "name", "departmentId"],
                        include: [{
                            model: Department,
                            as: "department",
                            attributes: ["id", "name"]
                        }]
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
        let whereClause = {};
        if (options.all === 'true' || options.all === true) {
            whereClause = {};
        } else if (companyId) {
            whereClause = {
                [Op.or]: [
                    { companyId },
                    { companyId: null }
                ]
            };
        }

        let queryOptions = {
            where: whereClause,
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["company_name"],
                    required: false
                },
                {
                    model: SubCategory,
                    as: "subCategory",
                    attributes: ["id", "name", "categoryId"],
                    required: false,
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["id", "name", "departmentId"],
                        required: false,
                        include: [{
                            model: Department,
                            as: "department",
                            attributes: ["id", "name"],
                            required: false
                        }]
                    }]
                },
                {
                    model: LocationSample,
                    as: "locationSample",
                    attributes: ["id", "name"],
                    required: false
                },
                {
                    model: CategoryParameter,
                    as: "categoryParameters",
                    required: false,
                    include: [{
                        model: Category,
                        as: "category",
                        attributes: ["id", "name", "departmentId"],
                        required: false,
                        include: [{
                            model: Department,
                            as: "department",
                            attributes: ["id", "name"],
                            required: false
                        }]
                    }]
                }
            ],
            attributes: { exclude: ["deleted_at"] },
            distinct: true
        };

        if (options.sortBy) {
            const allowedSortFields = ["parameterName", "testMethod", "unit", "permissibleLimit", "status", "created_at", "createdAt"];
            if (allowedSortFields.includes(options.sortBy)) {
                const orderDirection = options.sortOrder === "desc" || options.sortOrder === "DESC" ? "DESC" : "ASC";
                queryOptions.order = [[options.sortBy, orderDirection]];
            }
        } else {
            queryOptions.order = [['created_at', 'DESC']];
        }

        if (options.search) {
            queryOptions.where.parameterName = { [Op.iLike]: `%${options.search}%` };
        }

        if (options.status && options.status !== 'ALL') {
            queryOptions.where.status = options.status;
        }

        if (options.subCategoryId) {
            queryOptions.where.subCategoryId = options.subCategoryId;
        }

        if (options.categoryId) {
            queryOptions.where[Op.and] = queryOptions.where[Op.and] || [];
            queryOptions.where[Op.and].push({
                [Op.or]: [
                    { '$categoryParameters.categoryId$': options.categoryId },
                    { '$subCategory.category.id$': options.categoryId }
                ]
            });
            queryOptions.subQuery = false;
        }

        if (options.departmentId) {
            queryOptions.where[Op.and] = queryOptions.where[Op.and] || [];
            queryOptions.where[Op.and].push({
                [Op.or]: [
                    { '$categoryParameters.category.departmentId$': options.departmentId },
                    { '$subCategory.category.departmentId$': options.departmentId }
                ]
            });
            queryOptions.subQuery = false;
        }

        if (options.limit && options.page && options.all !== 'true' && options.all !== true) {
            queryOptions.limit = parseInt(options.limit);
            queryOptions.offset = (parseInt(options.page) - 1) * queryOptions.limit;

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
    getParametersByCompany,
    bulkImportParameters: async (records, companyId, userId, reqInfo) => {
        const transaction = await sequelize.transaction();
        try {
            let createdCount = 0;
            let updatedCount = 0;

            for (const item of records) {
                const data = item.data;
                const paramName = data.parameterName || data.name;
                if (!paramName) continue;

                // Resolve category mapping if categoryName is provided
                let categoryId = null;
                const rawCatName = (data.categoryName || data.disciplineGroup || "").trim();
                if (rawCatName) {
                    let cat = await Category.findOne({ where: { name: { [Op.iLike]: rawCatName }, companyId }, transaction });
                    if (!cat) {
                        throw new Error(`Discipline Group '${rawCatName}' does not exist.`);
                    }
                    categoryId = cat.id;
                } else {
                    throw new Error("Discipline Group is required.");
                }

                // Resolve sub category mapping if subCategoryName is provided
                let subCategoryId = null;
                const rawSubCatName = (data.subCategoryName || data.subCategory || "").trim();
                if (rawSubCatName && categoryId) {
                    let subCat = await SubCategory.findOne({
                        where: { name: { [Op.iLike]: rawSubCatName }, companyId },
                        transaction
                    });
                    if (!subCat) {
                        throw new Error(`Sub Category '${rawSubCatName}' does not exist.`);
                    }
                    if (subCat.categoryId !== categoryId) {
                        throw new Error(`Sub Category '${rawSubCatName}' does not belong to selected Discipline Group '${rawCatName}'.`);
                    }
                    subCategoryId = subCat.id;
                }

                // Resolve location of sample mapping if locationOfSample is provided
                let locationSampleId = null;
                const rawLocName = (data.locationOfSample || data.locationSampleName || data.locationOfSampleName || data.locationSample || "").trim();
                if (rawLocName) {
                    let loc = await LocationSample.findOne({
                        where: { name: { [Op.iLike]: rawLocName }, companyId },
                        transaction
                    });
                    if (!loc) {
                        loc = await LocationSample.create({ name: rawLocName, companyId, status: "Active" }, { transaction });
                    }
                    locationSampleId = loc.id;
                }

                // Parse isPermissibleLimitApplicable
                let isPermissibleLimitApplicable = false;
                const rawLimitApp = data.isPermissibleLimitApplicable || data.permissibleLimitApplicable || data.is_permissible_limit_applicable;
                if (rawLimitApp !== undefined && rawLimitApp !== null) {
                    const strVal = String(rawLimitApp).trim().toLowerCase();
                    if (strVal === 'yes' || strVal === 'true' || strVal === '1' || rawLimitApp === true) {
                        isPermissibleLimitApplicable = true;
                    }
                }

                const paramPayload = {
                    companyId,
                    parameterName: paramName,
                    subCategoryId: subCategoryId || data.subCategoryId || null,
                    locationSampleId: locationSampleId || data.locationSampleId || null,
                    description: data.description || null,
                    testMethod: data.testMethod || data.testing_method || data.referenceMethod || null,
                    unit: data.unit || null,
                    isPermissibleLimitApplicable,
                    permissibleLimit: data.permissibleLimit || data.permissible_limit || data.limit || null,
                    status: (data.status && ['Active', 'Inactive'].includes(String(data.status).trim())) ? String(data.status).trim() : 'Active'
                };

                let existing = null;
                if (item._dbId) {
                    existing = await Parameter.findOne({ where: { id: item._dbId, companyId }, transaction });
                } else {
                    const findWhere = {
                        companyId,
                        parameterName: { [Op.iLike]: paramName.trim() },
                        subCategoryId: paramPayload.subCategoryId || null,
                        locationSampleId: paramPayload.locationSampleId || null
                    };
                    existing = await Parameter.findOne({ where: findWhere, transaction });
                }

                if (existing) {
                    await existing.update(paramPayload, { transaction });
                    updatedCount++;

                    if (categoryId) {
                        const rel = await CategoryParameter.findOne({ where: { parameterId: existing.id, companyId }, transaction });
                        if (rel) {
                            await rel.update({ categoryId }, { transaction });
                        } else {
                            await CategoryParameter.create({ companyId, categoryId, parameterId: existing.id, status: "Active" }, { transaction });
                        }
                    }
                } else {
                    const newParam = await Parameter.create(paramPayload, { transaction });
                    createdCount++;

                    if (categoryId) {
                        await CategoryParameter.create({ companyId, categoryId, parameterId: newParam.id, status: "Active" }, { transaction });
                    }
                }
            }

            await transaction.commit();
            return { createdCount, updatedCount, totalProcessed: records.length };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};