/**
 * @file subCategory.model.js
 * @description Sequelize model for SubCategories (linked to Category / Discipline Group).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const SubCategory = sequelize.define("SubCategory", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "companies",
            key: "id",
        }
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "categories",
            key: "id",
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "sub_categories",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = SubCategory;
