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
            { 
                model: Parameter, 
                as: "parameter", 
                attributes: ["id", "parameterName", "testMethod", "subCategoryId"],
                include: [{ model: db.SubCategory, as: "subCategory", attributes: ["id", "name"] }]
            }
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
            attributes: ["id", "parameterName", "testMethod", "subCategoryId"],
            include: [{ model: db.SubCategory, as: "subCategory", attributes: ["id", "name"] }]
        }
    ];

    let paramWhere = undefined;
    if (search) {
        include[1].where = {
            parameterName: { [Op.iLike]: `%${search}%` }
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
            { 
                model: Parameter, 
                as: "parameter", 
                attributes: ["id", "parameterName", "testMethod", "subCategoryId"],
                include: [{ model: db.SubCategory, as: "subCategory", attributes: ["id", "name"] }]
            }
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
        categoryId: data.categoryId || price.categoryId,
        parameterId: data.parameterId || price.parameterId,
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
    deletePrice,
    bulkImportPrices: async (records, companyId, userId) => {
        const transaction = await db.sequelize.transaction();
        try {
            let createdCount = 0;
            let updatedCount = 0;

            for (const item of records) {
                const data = item.data;

                // Resolve Category ID
                let catId = data.categoryId;
                if (!catId && data.categoryName) {
                    let cat = await Category.findOne({ where: { name: data.categoryName, companyId }, transaction });
                    if (!cat) {
                        cat = await Category.create({ name: data.categoryName, companyId, status: "Active" }, { transaction });
                    }
                    catId = cat.id;
                }

                // Resolve Parameter ID
                let paramId = data.parameterId;
                if (!paramId && data.parameterName) {
                    let param = await Parameter.findOne({ where: { parameterName: data.parameterName, companyId }, transaction });
                    if (!param) {
                        param = await Parameter.create({ parameterName: data.parameterName, companyId, status: "Active" }, { transaction });
                    }
                    paramId = param.id;
                }

                if (!catId || !paramId) continue;

                let existing = await PriceMaster.findOne({
                    where: { categoryId: catId, parameterId: paramId, companyId },
                    transaction
                });

                const statusVal = (data.status && ['Active', 'Inactive'].includes(String(data.status).trim())) ? String(data.status).trim() : 'Active';

                if (existing) {
                    await existing.update({
                        price: data.price || 0,
                        status: statusVal,
                        updatedBy: userId
                    }, { transaction });
                    updatedCount++;
                } else {
                    await PriceMaster.create({
                        companyId,
                        categoryId: catId,
                        parameterId: paramId,
                        price: data.price || 0,
                        status: statusVal,
                        createdBy: userId
                    }, { transaction });
                    createdCount++;
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

