/**
 * @file categoryParameter.model.js
 * @description Sequelize model for Category-Parameter mappings.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const CategoryParameter = sequelize.define("CategoryParameter", {
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
    parameterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "parameters",
            key: "id",
        }
    },
    status: {
        type: DataTypes.ENUM("Active", "Inactive"),
        defaultValue: "Active",
        allowNull: false,
    }
}, {
    tableName: "category_parameter_mapping",
    paranoid: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
});

module.exports = CategoryParameter;
