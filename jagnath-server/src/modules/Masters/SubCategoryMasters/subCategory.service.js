/**
 * @file subCategory.service.js
 * @description Business logic layer for SubCategories CRUD & Bulk Import.
 */

const db = require("../../../database");
const { Op } = require("sequelize");

/**
 * Create a new SubCategory.
 */
const createSubCategory = async (data, companyId) => {
    const finalCompanyId = data.companyId || companyId;
    if (!finalCompanyId) {
        throw new Error("Company ID is required to create a Sub Category.");
    }

    // Verify parent Category exists
    const category = await db.Category.findOne({
        where: { id: data.categoryId, companyId: finalCompanyId }
    });
    if (!category) {
        throw new Error("Specified Discipline Group (Category) does not exist for this company.");
    }

    // Check duplicate
    const existing = await db.SubCategory.findOne({
        where: {
            companyId: finalCompanyId,
            categoryId: data.categoryId,
            name: { [Op.iLike]: data.name.trim() }
        }
    });

    if (existing) {
        throw new Error(`Sub Category "${data.name}" already exists under this Discipline Group.`);
    }

    return await db.SubCategory.create({
        companyId: finalCompanyId,
        categoryId: data.categoryId,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        status: data.status || "Active"
    });
};

/**
 * Get all SubCategories with pagination, filtering & search.
 */
const getAllSubCategories = async (query, companyId) => {
    const isAll = query.all === "true" || query.all === true || (!query.page && !query.limit);
    const page = parseInt(query.page, 10) || 1;
    const limit = isAll ? null : (parseInt(query.limit, 10) || 10);
    const offset = isAll ? null : (page - 1) * limit;

    const whereClause = {};

    const targetCompanyId = query.companyId || companyId;
    if (targetCompanyId) {
        whereClause.companyId = targetCompanyId;
    }

    if (query.categoryId) {
        const cat = await db.Category.findOne({ where: { id: query.categoryId } });
        if (cat) {
            const sameNameCats = await db.Category.findAll({
                where: { name: { [Op.iLike]: cat.name.trim() } }
            });
            const catIds = sameNameCats.map(c => c.id);
            whereClause.categoryId = { [Op.in]: catIds };
        } else {
            whereClause.categoryId = query.categoryId;
        }
    }

    if (query.status && query.status !== "ALL") {
        whereClause.status = query.status;
    }

    if (query.search) {
        whereClause.name = { [Op.iLike]: `%${query.search.trim()}%` };
    }

    const queryOptions = {
        where: whereClause,
        include: [
            {
                model: db.Category,
                as: "category",
                attributes: ["id", "name"]
            }
        ],
        order: [["created_at", "DESC"]]
    };

    if (!isAll) {
        queryOptions.limit = limit;
        queryOptions.offset = offset;
    }

    const { count, rows } = await db.SubCategory.findAndCountAll(queryOptions);

    return {
        totalItems: count,
        totalPages: isAll ? 1 : Math.ceil(count / limit),
        currentPage: page,
        subCategories: rows
    };
};

/**
 * Get SubCategory by ID.
 */
const getSubCategoryById = async (id, companyId) => {
    const where = { id };
    if (companyId) where.companyId = companyId;

    const subCategory = await db.SubCategory.findOne({
        where,
        include: [{ model: db.Category, as: "category", attributes: ["id", "name"] }]
    });

    if (!subCategory) {
        throw new Error("Sub Category not found.");
    }
    return subCategory;
};

/**
 * Update SubCategory.
 */
const updateSubCategory = async (id, data, companyId) => {
    const subCategory = await getSubCategoryById(id, companyId);

    if (data.name && data.name.trim() !== subCategory.name) {
        const targetCategoryId = data.categoryId || subCategory.categoryId;
        const duplicate = await db.SubCategory.findOne({
            where: {
                id: { [Op.ne]: id },
                companyId: subCategory.companyId,
                categoryId: targetCategoryId,
                name: { [Op.iLike]: data.name.trim() }
            }
        });
        if (duplicate) {
            throw new Error(`Sub Category "${data.name}" already exists under this Discipline Group.`);
        }
    }

    if (data.categoryId) {
        const cat = await db.Category.findOne({ where: { id: data.categoryId, companyId: subCategory.companyId } });
        if (!cat) throw new Error("Invalid Discipline Group specified.");
    }

    await subCategory.update({
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
        ...(data.status && { status: data.status })
    });

    return subCategory;
};

/**
 * Soft delete SubCategory.
 */
const deleteSubCategory = async (id, companyId) => {
    const subCategory = await getSubCategoryById(id, companyId);
    await subCategory.destroy();
    return true;
};

/**
 * Bulk import SubCategories.
 */
const bulkImportSubCategories = async (rows, companyId) => {
    if (!companyId) throw new Error("Company context required for bulk import.");
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("No rows provided for bulk import.");
    }

    const transaction = await db.sequelize.transaction();
    try {
        // Load existing categories for company to resolve category names
        const categories = await db.Category.findAll({ where: { companyId }, transaction });
        const categoryMap = new Map();
        categories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c.id));

        const processedList = [];
        const errors = [];

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const itemData = row.data ? row.data : row;

            const rawCategoryName = (itemData.categoryName || itemData.disciplineGroup || itemData.category || "").trim();
            const rawSubCategoryName = (itemData.name || itemData.subCategoryName || itemData.subCategory || "").trim();

            if (!rawCategoryName || !rawSubCategoryName) {
                errors.push(`Row ${index + 1}: Missing Discipline Group or Sub Category name.`);
                continue;
            }

            let catId = categoryMap.get(rawCategoryName.toLowerCase());
            
            // If parent discipline does not exist, show a clear row-level validation error
            if (!catId) {
                errors.push(`Row ${index + 1}: Discipline Group '${rawCategoryName}' does not exist.`);
                continue;
            }

            // Upsert sub category
            const existing = await db.SubCategory.findOne({
                where: {
                    companyId,
                    categoryId: catId,
                    name: { [Op.iLike]: rawSubCategoryName }
                },
                transaction
            });

            const statusVal = (itemData.status && String(itemData.status).trim().toLowerCase() === 'inactive') ? 'Inactive' : 'Active';

            if (existing) {
                await existing.update({
                    description: itemData.description ? itemData.description.trim() : existing.description,
                    status: statusVal
                }, { transaction });
                processedList.push(existing);
            } else {
                const created = await db.SubCategory.create({
                    companyId,
                    categoryId: catId,
                    name: rawSubCategoryName,
                    description: itemData.description ? itemData.description.trim() : null,
                    status: statusVal
                }, { transaction });
                processedList.push(created);
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join(" | "));
        }

        await transaction.commit();

        return {
            importedCount: processedList.length,
            errorCount: errors.length,
            errors
        };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    createSubCategory,
    getAllSubCategories,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    bulkImportSubCategories
};
