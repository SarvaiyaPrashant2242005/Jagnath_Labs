/**
 * @file caution.service.js
 * @description Business logic for Caution Master operations.
 */

const Caution = require("./caution.model");
const Users = require("../../Auth/Users/users.model");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");
const path = require("path");
const { writeLogToFile } = require("../../../services/loggerService");

const createLogPath = path.join(__dirname, "../../../../logs/Caution/Create.txt");
const updateLogPath = path.join(__dirname, "../../../../logs/Caution/Update.txt");
const deleteLogPath = path.join(__dirname, "../../../../logs/Caution/Delete.txt");

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
        if (!userId) return "System";
        const user = await Users.findByPk(userId);
        return user ? (user.name || user.email) : "Unknown";
    } catch {
        return "Unknown";
    }
};

/**
 * Creates a new Caution entry.
 */
const createCaution = async (cautionData, userId) => {
    const transaction = await sequelize.transaction();
    try {
        const payload = {
            ...cautionData,
            createdBy: userId,
            updatedBy: userId
        };
        const caution = await Caution.create(payload, { transaction });
        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}
Module      : Caution Master
Operation   : CREATE
Performed By: ${performedBy}
Caution ID  : ${caution.id}
Title       : ${caution.title}
Status      : SUCCESS
==================================================`;
        writeLogToFile(logMessage, createLogPath);

        return caution;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Updates an existing Caution entry.
 */
const updateCaution = async (cautionId, updateData, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const whereClause = { id: cautionId };
        if (companyId) {
            whereClause[Op.or] = [{ companyId }, { companyId: null }];
        }

        const caution = await Caution.findOne({ where: whereClause, transaction });
        if (!caution) {
            throw new Error("Caution record not found or access denied.");
        }

        const updatedCaution = await caution.update({
            ...updateData,
            updatedBy: userId
        }, { transaction });

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}
Module      : Caution Master
Operation   : UPDATE
Performed By: ${performedBy}
Caution ID  : ${cautionId}
Title       : ${updatedCaution.title}
Status      : SUCCESS
==================================================`;
        writeLogToFile(logMessage, updateLogPath);

        return updatedCaution;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft-deletes a Caution entry.
 */
const deleteCaution = async (cautionId, userId, companyId) => {
    const transaction = await sequelize.transaction();
    try {
        const whereClause = { id: cautionId };
        if (companyId) {
            whereClause[Op.or] = [{ companyId }, { companyId: null }];
        }

        const caution = await Caution.findOne({ where: whereClause, transaction });
        if (!caution) {
            throw new Error("Caution record not found or access denied.");
        }

        const performedBy = await getPerformedBy(userId);
        const formattedDate = formatDateTime();

        await caution.destroy({ transaction });
        await transaction.commit();

        const logMessage = `==================================================
Date & Time : ${formattedDate}
Module      : Caution Master
Operation   : DELETE
Performed By: ${performedBy}
Caution ID  : ${cautionId}
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
 * Retrieves a single Caution by ID.
 */
const getCautionById = async (cautionId, companyId) => {
    const whereClause = { id: cautionId };
    if (companyId) {
        whereClause[Op.or] = [{ companyId }, { companyId: null }];
    }
    const caution = await Caution.findOne({ where: whereClause });
    if (!caution) {
        throw new Error("Caution record not found.");
    }
    return caution;
};

/**
 * Retrieves list of Cautions with optional filters (status, companyId, reportType, search, limit, page).
 */
const getCautions = async (options = {}) => {
    const whereClause = {};

    if (options.companyId && options.companyId !== 'ALL') {
        whereClause.companyId = options.companyId;
    }

    if (options.status !== undefined && options.status !== 'ALL' && options.status !== '') {
        if (typeof options.status === 'boolean') {
            whereClause.status = options.status;
        } else if (typeof options.status === 'string') {
            if (options.status.toLowerCase() === 'active' || options.status === 'true') {
                whereClause.status = true;
            } else if (options.status.toLowerCase() === 'inactive' || options.status === 'false') {
                whereClause.status = false;
            }
        }
    }

    if (options.reportType) {
        whereClause[Op.or] = [
            { reportType: options.reportType },
            { reportType: "BOTH" }
        ];
    }

    if (options.search) {
        whereClause[Op.or] = [
            { title: { [Op.iLike]: `%${options.search}%` } },
            { description: { [Op.iLike]: `%${options.search}%` } }
        ];
    }

    const queryOptions = {
        where: whereClause,
        order: [["sort_order", "ASC"], ["created_at", "DESC"]]
    };

    if (options.limit && options.page) {
        queryOptions.limit = parseInt(options.limit);
        queryOptions.offset = (parseInt(options.page) - 1) * queryOptions.limit;
        const result = await Caution.findAndCountAll(queryOptions);
        return result;
    }

    const cautions = await Caution.findAll(queryOptions);
    return cautions;
};

module.exports = {
    createCaution,
    updateCaution,
    deleteCaution,
    getCautionById,
    getCautions
};
