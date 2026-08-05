/**
 * @file locationSample.service.js
 * @description Business logic for Location of Sample Master.
 */

const LocationSample = require("./locationSample.model");
const Company = require("../CompanyMasters/company.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/LocationSample/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/LocationSample/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/LocationSample/Delete.txt");

const fieldLabels = {
    name: "Location Name",
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

const formatLocationSample = (loc) => {
    if (!loc) return null;
    const locObj = loc.toJSON ? loc.toJSON() : { ...loc };
    if (locObj.company) {
        locObj.companyName = locObj.company.companyName || locObj.company.company_name;
    } else {
        locObj.companyName = null;
    }
    delete locObj.company;
    return locObj;
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
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'companyId', 'company'].includes(key)) {
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
 * Create a new location of sample.
 */
const createLocationSample = async (locData, userId) => {
    const transaction = await sequelize.transaction();
    try {
        const newLoc = await LocationSample.create(locData, { transaction });
        const company = await Company.findByPk(newLoc.companyId, { transaction });
        const companyName = company ? (company.companyName || company.company_name) : "Unknown";

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Location of Sample

Operation   : CREATE

Performed By: ${performedBy}

Company     : ${companyName}

Location Name: ${newLoc.name}

Location ID : ${newLoc.id}

Status      : SUCCESS
==================================================`;

        writeLogToFile(logMessage, createLogPath);
        return await getLocationSampleById(newLoc.id, newLoc.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Update location.
 */
const updateLocationSample = async (id, locData, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const whereClause = { id };
        if (companyId) {
            whereClause.companyId = companyId;
        }
        let loc = await LocationSample.findOne({
            where: whereClause,
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!loc) {
            throw new Error("Location of Sample not found or access denied.");
        }

        const oldValues = getLoggableValues(loc);
        const updated = await loc.update(locData, { transaction });
        const newValues = getLoggableValues(updated);

        const companyName = loc.company ? (loc.company.companyName || loc.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();
        const changesBlock = getChangesBlock(oldValues, newValues);

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Location of Sample

Operation   : UPDATE

Performed By: ${performedBy}

Company     : ${companyName}

Location Name: ${updated.name}

Location ID : ${id}
${changesBlock}
==================================================`;

        writeLogToFile(logMessage, updateLogPath);
        return await getLocationSampleById(id, updated.companyId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Delete location.
 */
const deleteLocationSample = async (id, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const loc = await LocationSample.findOne({
            where: { id, companyId },
            include: [{ model: Company, as: "company" }],
            transaction
        });
        if (!loc) {
            throw new Error("Location of Sample not found or access denied.");
        }

        const companyName = loc.company ? (loc.company.companyName || loc.company.company_name) : "Unknown";
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await loc.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}

Module      : Location of Sample

Operation   : DELETE

Performed By: ${performedBy}

Company     : ${companyName}

Location Name: ${loc.name}

Location ID : ${id}

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
 * Get by ID.
 */
const getLocationSampleById = async (id, companyId) => {
    const loc = await LocationSample.findOne({
        where: { id, companyId },
        include: [{
            model: Company,
            as: "company",
            attributes: ["company_name"]
        }],
        attributes: { exclude: ["deleted_at"] }
    });
    return formatLocationSample(loc);
};

/**
 * Get all by company.
 */
const getLocationSamplesByCompany = async (companyId, options = {}) => {
    const queryOptions = {
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
            queryOptions.where.name = { [Op.iLike]: `%${options.search}%` };
        }

        if (options.status && options.status !== 'ALL') {
            queryOptions.where.status = options.status;
        }

        const { count, rows } = await LocationSample.findAndCountAll(queryOptions);
        return {
            count,
            rows: rows.map(formatLocationSample)
        };
    }

    if (options.status && options.status !== 'ALL') {
        queryOptions.where.status = options.status;
    }

    const locs = await LocationSample.findAll(queryOptions);
    return locs.map(formatLocationSample);
};

module.exports = {
    createLocationSample,
    updateLocationSample,
    deleteLocationSample,
    getLocationSampleById,
    getLocationSamplesByCompany
};
