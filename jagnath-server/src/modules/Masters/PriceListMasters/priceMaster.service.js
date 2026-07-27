/**
 * @file priceMaster.service.js
 * @description Business logic layer for simple Price Master.
 */

const { Op } = require("sequelize");
const db = require("../../../database");
const PriceMaster = db.PriceMaster;
const Category = db.Category;
const Parameter = db.Parameter;

/**
 * Create a new Price record.
 */
const createPrice = async (data, userId) => {
    // Check if category exists
    const category = await Category.findByPk(data.categoryId);
    if (!category) {
        throw new Error("CATEGORY_NOT_FOUND: Selected Category does not exist.");
    }

    // Check if parameter exists
    const parameter = await Parameter.findByPk(data.parameterId);
    if (!parameter) {
        throw new Error("PARAMETER_NOT_FOUND: Selected Parameter does not exist.");
    }

    // Check if price already exists for this parameter in company
    const existing = await PriceMaster.findOne({
        where: {
            companyId: data.companyId,
            categoryId: data.categoryId,
            parameterId: data.parameterId
        }
    });

    if (existing) {
        throw new Error("DUPLICATE_PRICE: A price for this parameter already exists in this company.");
    }

    const newRecord = await PriceMaster.create({
        companyId: data.companyId,
        categoryId: data.categoryId,
        parameterId: data.parameterId,
        price: data.price,
        status: data.status || "Active",
        createdBy: userId,
        updatedBy: userId
    });

    return await PriceMaster.findByPk(newRecord.id, {
        include: [
            { model: Category, as: "category", attributes: ["id", "name"] },
            { model: Parameter, as: "parameter", attributes: ["id", "name", "testingStandard", "unit"] }
        ]
    });
};

/**
 * Get all prices for a company.
 */
const getPricesByCompany = async (companyId, options = {}) => {
    const { page, limit, search, status, categoryId } = options;
    const where = { companyId };

    if (status && status !== "ALL") {
        where.status = status;
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    const include = [
        {
            model: Category,
            as: "category",
            attributes: ["id", "name"]
        },
        {
            model: Parameter,
            as: "parameter",
            attributes: ["id", "name", "testingStandard", "unit"]
        }
    ];

    let paramWhere = undefined;
    if (search) {
        include[1].where = {
            name: { [Op.iLike]: `%${search}%` }
        };
    }

    if (limit) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await PriceMaster.findAndCountAll({
            where,
            include,
            distinct: true,
            order: [["created_at", "DESC"]],
            limit: limitNum,
            offset
        });

        return { count, rows };
    }

    const prices = await PriceMaster.findAll({
        where,
        include,
        order: [["created_at", "DESC"]]
    });

    return prices;
};

/**
 * Get Price by ID.
 */
const getPriceById = async (id, companyId) => {
    const price = await PriceMaster.findOne({
        where: { id, companyId },
        include: [
            { model: Category, as: "category", attributes: ["id", "name"] },
            { model: Parameter, as: "parameter", attributes: ["id", "name", "testingStandard", "unit"] }
        ]
    });

    return price;
};

/**
 * Update Price record.
 */
const updatePrice = async (id, data, userId, companyId) => {
    const price = await PriceMaster.findOne({ where: { id, companyId } });
    if (!price) {
        throw new Error("NOT_FOUND: Price record not found.");
    }

    await price.update({
        price: data.price !== undefined ? data.price : price.price,
        status: data.status !== undefined ? data.status : price.status,
        updatedBy: userId
    });

    return await getPriceById(id, companyId);
};

/**
 * Delete Price record.
 */
const deletePrice = async (id, companyId) => {
    const price = await PriceMaster.findOne({ where: { id, companyId } });
    if (!price) {
        throw new Error("NOT_FOUND: Price record not found.");
    }

    await price.destroy();
    return true;
};

module.exports = {
    createPrice,
    getPricesByCompany,
    getPriceById,
    updatePrice,
    deletePrice
};
